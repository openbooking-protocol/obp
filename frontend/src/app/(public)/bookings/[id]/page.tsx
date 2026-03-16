import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { obpApi, bookingCalendarUrl } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CancelBookingButton } from "@/components/booking/cancel-booking-button";
import { formatDateTime, formatRelative } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Booking status" };

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "info"; emoji: string }> = {
  pending: { label: "Pending confirmation", variant: "warning", emoji: "⏳" },
  confirmed: { label: "Confirmed", variant: "success", emoji: "✅" },
  cancelled: { label: "Cancelled", variant: "destructive", emoji: "❌" },
  completed: { label: "Completed", variant: "secondary", emoji: "🎉" },
  no_show: { label: "No show", variant: "destructive", emoji: "🚫" },
};

export default async function BookingStatusPage({ params }: Props) {
  const { id } = await params;

  let booking;
  try {
    booking = await obpApi.bookings.get(id);
  } catch {
    notFound();
  }

  const statusConfig = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG["pending"]!;
  const canCancel = booking.status === "pending" || booking.status === "confirmed";

  return (
    <div className="container max-w-lg px-4 py-12">
      <div className="mb-6 text-center">
        <span className="text-4xl">{statusConfig.emoji}</span>
        <h1 className="mt-2 text-2xl font-bold">Booking status</h1>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Booking details</CardTitle>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono">{booking.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span>{booking.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{booking.customer.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{formatRelative(booking.created_at)}</span>
          </div>
          {booking.notes && (
            <div>
              <span className="text-muted-foreground">Notes</span>
              <p className="mt-1">{booking.notes}</p>
            </div>
          )}
          {booking.cancelled_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancelled</span>
              <span>{formatDateTime(booking.cancelled_at)}</span>
            </div>
          )}
          {booking.cancellation_reason && (
            <div>
              <span className="text-muted-foreground">Reason</span>
              <p className="mt-1">{booking.cancellation_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <a
          href={bookingCalendarUrl(id)}
          download
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          📅 Download calendar file (.ics)
        </a>

        {canCancel && <CancelBookingButton bookingId={id} />}

        <Link
          href="/search"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Book another service
        </Link>
      </div>
    </div>
  );
}
