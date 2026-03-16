"use client";

import { useEffect, useState } from "react";
import { obpApi } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingPage } from "@/components/ui/spinner";
import type { ServerStats } from "@/lib/api/types";

function getApiKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_api_key") ?? "";
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey) { window.location.href = "/dashboard/login"; return; }

    obpApi.admin.stats(apiKey)
      .then(setStats)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Server statistics</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total providers" value={stats.total_providers} />
          <StatCard label="Active providers" value={stats.active_providers} />
          <StatCard label="Total services" value={stats.total_services} />
          <StatCard label="Total bookings" value={stats.total_bookings} />
          <StatCard label="Total slots" value={stats.total_slots} />
          <StatCard label="Federation peers" value={stats.federation_peers} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
