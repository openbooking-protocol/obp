"use client";

import { useEffect, useState } from "react";
import { obpApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingPage } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/utils/format";
import type { Booking } from "@/lib/api/types";

function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("obp_api_key") ?? "";
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  confirmed: "success",
  cancelled: "destructive",
  completed: "secondary",
  no_show: "destructive",
};

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    const apiKey = getApiKey();
    if (!apiKey) { window.location.href = "/dashboard/login"; return; }
    try {
      const res = await obpApi.bookings.list(
        { status: statusFilter || undefined, limit: 50 },
        apiKey
      );
      setBookings(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (action: "confirm" | "complete" | "no-show" | "cancel", bookingId: string) => {
    const apiKey = getApiKey();
    if (!apiKey) return;
    setActionLoading(`${action}-${bookingId}`);
    try {
      if (action === "confirm") await obpApi.bookings.confirm(bookingId, apiKey);
      else if (action === "complete") await obpApi.bookings.complete(bookingId, apiKey);
      else if (action === "no-show") await obpApi.bookings.noShow(bookingId, apiKey);
      else if (action === "cancel") await obpApi.bookings.cancel(bookingId, undefined, apiKey);
      setSelected(null);
      fetchBookings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              statusFilter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No bookings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{booking.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{booking.customer.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(booking.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[booking.status] ?? "secondary"}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {booking.source}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(booking)}
                          className="text-xs text-primary hover:underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Booking by ${selected.customer.name}` : ""}
      >
        {selected && (
          <div>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono">{selected.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{selected.customer.email}</span>
              </div>
              {selected.customer.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{selected.customer.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={STATUS_BADGE[selected.status] ?? "secondary"}>
                  {selected.status}
                </Badge>
              </div>
              {selected.notes && (
                <div>
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-1">{selected.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.status === "pending" && (
                <Button
                  size="sm"
                  onClick={() => handleAction("confirm", selected.id)}
                  isLoading={actionLoading === `confirm-${selected.id}`}
                >
                  Confirm
                </Button>
              )}
              {(selected.status === "pending" || selected.status === "confirmed") && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction("complete", selected.id)}
                    isLoading={actionLoading === `complete-${selected.id}`}
                  >
                    Mark complete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction("no-show", selected.id)}
                    isLoading={actionLoading === `no-show-${selected.id}`}
                  >
                    No show
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction("cancel", selected.id)}
                    isLoading={actionLoading === `cancel-${selected.id}`}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
