"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CheckBookingForm() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = ref.trim();
    if (!trimmed) {
      setError("Please enter a booking reference.");
      return;
    }
    router.push(`/bookings/${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Booking reference"
        value={ref}
        onChange={(e) => { setRef(e.target.value); setError(""); }}
        placeholder="e.g. bkg_abc123 or a UUID"
        error={error}
        required
      />
      <Button type="submit" className="w-full">
        Check status
      </Button>
    </form>
  );
}
