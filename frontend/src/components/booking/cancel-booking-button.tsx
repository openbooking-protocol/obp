"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { obpApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  bookingId: string;
}

export function CancelBookingButton({ bookingId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    setLoading(true);
    setError("");
    try {
      await obpApi.bookings.cancel(bookingId, reason || undefined);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full text-destructive hover:text-destructive">
        Cancel booking
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Cancel booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
      >
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Textarea
          label="Reason (optional)"
          placeholder="Please let us know why you're cancelling..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mb-4"
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Keep booking
          </Button>
          <Button variant="destructive" onClick={handleCancel} isLoading={loading}>
            Cancel booking
          </Button>
        </div>
      </Modal>
    </>
  );
}
