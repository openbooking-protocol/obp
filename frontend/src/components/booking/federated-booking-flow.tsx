"use client";

import { useState, useEffect, useCallback } from "react";
import { federatedClient, bookingCalendarUrl } from "@/lib/api/client";
import type { Provider, Service, Slot, HoldSlotResponse, Booking } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  formatDate,
  formatTime,
  formatDuration,
  formatPrice,
  formatCountdown,
  dateRangeForDays,
} from "@/lib/utils/format";
import { format, addDays, startOfDay } from "date-fns";

interface FederatedBookingFlowProps {
  service: Service;
  provider: Provider;
  federatedServerUrl: string;
}

type Step = "date" | "slot" | "form" | "confirm" | "success";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

export function FederatedBookingFlow({
  service,
  provider,
  federatedServerUrl,
}: FederatedBookingFlowProps) {
  // Derive the API client bound to the external server
  const api = federatedClient(federatedServerUrl);

  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [holdData, setHoldData] = useState<HoldSlotResponse | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Derive hostname for display
  let serverHostname = federatedServerUrl;
  try {
    serverHostname = new URL(federatedServerUrl).hostname;
  } catch {
    // keep as-is
  }

  // Generate the next 14 days for date picker
  const today = startOfDay(new Date());
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  // Load slots when date is selected
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setError("");
    const { from, to } = dateRangeForDays(selectedDate, 1);
    api.slots
      .list({ service_id: service.id, date_from: from, date_to: to, limit: 50 })
      .then((res) => setSlots(res.data.filter((s) => s.status === "available")))
      .catch(() => setError("Failed to load available slots from the external server."))
      .finally(() => setLoadingSlots(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, service.id, federatedServerUrl]);

  // Countdown timer for hold
  useEffect(() => {
    if (!holdData) return;
    const interval = setInterval(() => {
      const cd = formatCountdown(holdData.expires_at);
      setCountdown(cd);
      if (cd === "00:00") {
        setHoldExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdData]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setStep("slot");
  };

  const handleSelectSlot = useCallback(
    async (slot: Slot) => {
      setError("");
      setSelectedSlot(slot);
      try {
        const hold = await api.slots.hold(slot.id);
        setHoldData(hold);
        setHoldExpired(false);
        setStep("form");
      } catch {
        setError(
          "Could not hold this slot on the external server. It may have just been booked. Please try another."
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [federatedServerUrl]
  );

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!customer.name.trim()) errors.name = "Name is required";
    if (!customer.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errors.email = "Please enter a valid email";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!holdData || !selectedSlot) return;
    if (holdExpired) {
      setError("Hold expired. Please select a new slot.");
      setStep("slot");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const newBooking = await api.bookings.create({
        slot_id: selectedSlot.id,
        hold_token: holdData.hold_token,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone || undefined,
        },
        notes: customer.notes || undefined,
      });
      setBooking(newBooking);
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create booking on external server.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (step === "success" && booking) {
    return (
      <FederatedBookingSuccess
        booking={booking}
        service={service}
        provider={provider}
        serverHostname={serverHostname}
        federatedServerUrl={federatedServerUrl}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* External server notice */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
        <span className="shrink-0 text-base">🌐</span>
        <span className="text-blue-800 dark:text-blue-200">
          You&apos;re booking on an external server:{" "}
          <span className="font-semibold">{serverHostname}</span>
        </span>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step: Select date */}
      {(step === "date" || step === "slot") && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Select date</h2>
          <div className="flex flex-wrap gap-2">
            {dates.map((date) => {
              const isSelected =
                selectedDate &&
                format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleSelectDate(date)}
                  className={`flex min-w-[64px] flex-col items-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  <span className="text-xs font-medium">{format(date, "EEE")}</span>
                  <span className="text-lg font-bold">{format(date, "d")}</span>
                  <span className="text-xs">{format(date, "MMM")}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: Select slot */}
      {step === "slot" && selectedDate && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">
            Available times for {formatDate(selectedDate.toISOString(), "EEEE, MMMM d")}
          </h2>
          {loadingSlots ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : slots.length === 0 ? (
            <p className="py-4 text-muted-foreground">
              No available slots on this date. Please select another date.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSelectSlot(slot)}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {formatTime(slot.start_time)}
                </button>
              ))}
            </div>
          )}
          <button
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setStep("date")}
          >
            ← Change date
          </button>
        </div>
      )}

      {/* Step: Customer form */}
      {step === "form" && selectedSlot && holdData && (
        <div>
          {/* Hold countdown */}
          {!holdExpired ? (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <span className="font-mono font-bold text-primary">{countdown}</span>
              <span className="text-muted-foreground">
                Slot held — complete your booking before it expires
              </span>
            </div>
          ) : (
            <Alert variant="warning">
              <AlertDescription>
                Hold expired. Please{" "}
                <button className="underline" onClick={() => setStep("slot")}>
                  select a new slot
                </button>
                .
              </AlertDescription>
            </Alert>
          )}

          {/* Booking summary */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h3 className="mb-2 font-medium">Booking summary</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Service</span>
                  <span className="font-medium text-foreground">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider</span>
                  <span className="font-medium text-foreground">{provider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Server</span>
                  <span className="font-medium text-foreground">{serverHostname}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & time</span>
                  <span className="font-medium text-foreground">
                    {formatDate(selectedSlot.start_time, "MMM d")} at{" "}
                    {formatTime(selectedSlot.start_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="font-medium text-foreground">
                    {formatDuration(service.duration_minutes)}
                  </span>
                </div>
                {service.price && (
                  <div className="flex justify-between border-t border-border pt-1 font-medium text-foreground">
                    <span>Total</span>
                    <span>{formatPrice(service.price.amount, service.price.currency)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer form */}
          <h2 className="mb-4 text-lg font-semibold">Your information</h2>
          <div className="space-y-4">
            <Input
              label="Full name"
              required
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              error={formErrors.name}
              autoComplete="name"
            />
            <Input
              label="Email address"
              type="email"
              required
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              error={formErrors.email}
              autoComplete="email"
            />
            <Input
              label="Phone number"
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              autoComplete="tel"
            />
            <Textarea
              label="Notes (optional)"
              placeholder="Any special requests or notes for the provider..."
              value={customer.notes}
              onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setStep("slot")} disabled={submitting}>
              ← Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              isLoading={submitting}
              disabled={holdExpired}
            >
              Confirm booking
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            By booking, you agree to the provider&apos;s cancellation policy. This booking will be
            processed by <span className="font-medium">{serverHostname}</span>.
          </p>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Array<{ id: Step; label: string }> = [
    { id: "date", label: "Date" },
    { id: "slot", label: "Time" },
    { id: "form", label: "Details" },
    { id: "success", label: "Confirmed" },
  ];

  const currentIndex = steps.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center gap-2" role="list" aria-label="Booking steps">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2" role="listitem">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < currentIndex
                ? "bg-primary text-primary-foreground"
                : i === currentIndex
                  ? "border-2 border-primary text-primary"
                  : "border border-border text-muted-foreground"
            }`}
            aria-current={i === currentIndex ? "step" : undefined}
          >
            {i < currentIndex ? "✓" : i + 1}
          </div>
          <span
            className={`hidden text-sm sm:inline ${
              i === currentIndex ? "font-medium" : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && <div className="mx-1 h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function FederatedBookingSuccess({
  booking,
  service,
  provider,
  serverHostname,
  federatedServerUrl,
}: {
  booking: Booking;
  service: Service;
  provider: Provider;
  serverHostname: string;
  federatedServerUrl: string;
}) {
  const calendarUrl = `${federatedServerUrl}/bookings/${booking.id}/calendar.ics`;

  return (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl dark:bg-green-900">
          ✅
        </div>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-green-700 dark:text-green-400">
        Booking confirmed!
      </h2>
      <p className="mb-2 text-muted-foreground">Your booking has been received.</p>
      <p className="mb-6 text-sm text-muted-foreground">
        Processed by external server:{" "}
        <span className="font-medium text-foreground">{serverHostname}</span>
      </p>

      <Card className="mb-6 text-left">
        <CardContent className="p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono font-medium">{booking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium">{service.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium">{provider.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Server</span>
              <span className="font-medium">{serverHostname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={booking.status === "confirmed" ? "success" : "warning"}>
                {booking.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={calendarUrl}
          download
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          📅 Download .ics
        </a>
        <a
          href={`${federatedServerUrl}/bookings/${booking.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          View on {serverHostname} →
        </a>
      </div>
    </div>
  );
}
