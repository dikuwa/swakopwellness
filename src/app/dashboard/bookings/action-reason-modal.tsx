"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/ui/modal";
import { Button, Label, Textarea } from "@/ui/components";
import toast from "react-hot-toast";
import type { getDashboardBookings } from "@/dashboard/data";
import { Loader2 } from "lucide-react";

type Booking = Awaited<ReturnType<typeof getDashboardBookings>>["rows"][0];

interface ActionReasonModalProps {
  booking: Booking | null;
  action: "cancel" | "no_show" | string;
  isOpen: boolean;
  onClose: () => void;
  formAction: (formData: FormData) => Promise<void>;
  onSuccess: () => void;
}

export function ActionReasonModal({ booking, action, isOpen, onClose, formAction, onSuccess }: ActionReasonModalProps) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  const actionLabels: Record<string, string> = {
    cancel: "Cancel Booking",
    no_show: "Mark as No-show",
  };
  
  const buttonLabels: Record<string, string> = {
    cancel: "Confirm Cancellation",
    no_show: "Confirm No-show",
  };

  const title = actionLabels[action] || `Confirm Action`;
  const buttonLabel = buttonLabels[action] || `Confirm`;

  const handleSubmit = (formData: FormData) => {
    if (!booking) return;
    formData.append("bookingId", booking.id);
    
    startTransition(async () => {
      try {
        await formAction(formData);
        toast.success(`Booking ${action === 'cancel' ? 'cancelled' : 'updated'}`);
        onSuccess();
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    });
  };
  
  if (!booking) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${title}: ${booking.reference}`}>
      <form action={handleSubmit} className="space-y-6">
        <div>
          <p className="font-medium">{booking.clientName}</p>
          <p className="text-sm text-muted-foreground">{booking.serviceName}</p>
        </div>

        <div>
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Provide a reason for this action...`}
            required={action === 'cancel'} // Example: make reason required for cancellation
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={action === 'cancel' || action === 'no_show' ? 'danger' : 'primary'} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
