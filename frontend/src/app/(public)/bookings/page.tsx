import type { Metadata } from "next";
import { CheckBookingForm } from "@/components/booking/check-booking-form";

export const metadata: Metadata = { title: "Check booking status" };

export default function BookingsPage() {
  return (
    <div className="container max-w-lg px-4 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Check booking status</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your booking reference to check your booking status.
        </p>
      </div>
      <CheckBookingForm />
    </div>
  );
}
