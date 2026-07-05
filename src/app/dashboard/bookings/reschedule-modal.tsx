"use client";

import { useState, useTransition } from "react";
import { rescheduleBooking } from "@/booking/actions";
import { Modal } from "@/ui/modal";
import { Button, Label, Textarea, DatePicker, TimePicker } from "@/ui/components";
import toast from "react-hot-toast";
import type { getDashboardBookings } from "@/dashboard/data";
import { Loader2 } from "lucide-react";

type Booking = Awaited<ReturnType<typeof getDashboardBookings>>["rows"][0];

interface RescheduleBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RescheduleBookingModal({ booking, isOpen, onClose }: RescheduleBookingModalProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState<string | undefined>(booking?.preferredAt.toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(booking?.preferredAt.toTimeString().substring(0, 5) ?? "09:00");
  const [reason, setReason] = useState("");

  const handleSubmit = (formData: FormData) => {
    if (!booking) return;
    formData.append("bookingId", booking.id);
    
    startTransition(async () => {
      const result = await rescheduleBooking(formData);
      if (result.ok) {
        toast.success("Booking rescheduled successfully");
        onClose();
      } else {
        toast.error(result.error);
      }
    });
  };
  
  if (!booking) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reschedule Booking: ${booking.reference}`}>
      <form action={handleSubmit} className="space-y-6">
        <div>
          <p className="font-medium">{booking.clientName}</p>
          <p className="text-sm text-muted-foreground">{booking.serviceName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Current: {booking.preferredAt.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="newDate">New Date</Label>
            <DatePicker
              id="newDate"
              name="newDate"
              value={date}
              onChange={setDate}
              required
            />
          </div>
          <div>
            <Label htmlFor="newTime">New Time</Label>
            <TimePicker
              id="newTime"
              name="newTime"
              value={time}
              onChange={setTime}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reason">Reason for rescheduling (optional)</Label>
          <Textarea
            id="reason"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Client request, therapist unavailable..."
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Reschedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
