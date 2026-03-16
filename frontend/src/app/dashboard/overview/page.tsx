"use client";

import { useEffect, useState } from "react";
import { obpApi } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDateTime, formatDuration } from "@/lib/utils/format";
import type { Booking, ProviderAnalytics, Service } from "@/lib/api/types";
import Link from "next/link";

function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_api_key") ?? "";
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  pending: "warning",
  confirmed: "success",
  cancelled: "destructive",
  completed: "secondary",
  no_show: "destructive",
};

export default function OverviewPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [analytics, setAnalytics] = useState<ProviderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey) {
      window.location.href = "/dashboard/login";
      return;
    }

    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    Promise.all([
      obpApi.bookings.list(
        {
          date_from: today.toISOString().split("T")[0],
          limit: 10,
        },
        apiKey
      ),
      obpApi.services.list({ active: true, limit: 10 }),
      obpApi.providers.list({ limit: 1 }),
    ])
      .then(([bRes, sRes, pRes]) => {
        setBookings(bRes.data);
        setServices(sRes.data);
        const firstProvider = pRes.data[0];
        if (firstProvider) {
          setProviderId(firstProvider.id);
          return obpApi.analytics.provider(
            firstProvider.id,
            {
              from: weekAgo.toISOString().split("T")[0]!,
              to: today.toISOString().split("T")[0]!,
            },
            apiKey
          );
        }
        return null;
      })
      .then((analyticsData) => {
        if (analyticsData) setAnalytics(analyticsData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      {analytics && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today's bookings"
            value={analytics.total_bookings}
            description="This week"
          />
          <StatCard
            label="Confirmed"
            value={analytics.confirmed_bookings}
            description="This week"
          />
          <StatCard
            label="Completed"
            value={analytics.completed_bookings}
            description="This week"
          />
          <StatCard
            label="No-show rate"
            value={`${(analytics.no_show_rate * 100).toFixed(1)}%`}
            description="This week"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent bookings</CardTitle>
            <Link href="/dashboard/bookings" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {bookings.map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{booking.customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(booking.created_at)}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[booking.status] ?? "secondary"}>
                      {booking.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Your services</CardTitle>
            <Link href="/dashboard/services" className="text-xs text-primary hover:underline">
              Manage →
            </Link>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="py-4 text-center">
                <p className="mb-2 text-sm text-muted-foreground">No services yet.</p>
                <Link
                  href="/dashboard/services"
                  className="text-sm text-primary hover:underline"
                >
                  Add your first service →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {services.map((service) => (
                  <li key={service.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(service.duration_minutes)}
                      </p>
                    </div>
                    <Badge variant={service.active ? "success" : "secondary"}>
                      {service.active ? "Active" : "Inactive"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, description }: { label: string; value: number | string; description: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
