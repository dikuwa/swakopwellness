"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  confirmBooking,
  cancelBooking,
  markCompleted,
  markNoShow,
  rescheduleBooking,
  changeBookingStatus,
} from "@/booking/actions";
import { Button, Label, Textarea, DatePicker, TimePicker } from "@/ui/components";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type StatusAction = "rescheduled" | "completed" | "cancelled" | "no_show" | "confirmed" | "requires_review" | "contacting_client" | "awaiting_client_response" | null;

interface StatusActionsPanelProps {
  bookingId: string;
  currentStatus: string;
  currentDate: Date;
  availableActions: string[];
}

const actionLabels: Record<string, string> = {
  rescheduled: "Reschedule",
  completed: "Complete",
  cancelled: "Cancel",
  no_show: "No-show",
  confirmed: "Confirm",
  contacting_client: "Contacting Client",
  awaiting_client_response: "Awaiting Response",
};

const actionColor: Record<string, "primary" | "danger"> = {
  rescheduled: "primary",
  completed: "primary",
  cancelled: "danger",
  no_show: "danger",
  confirmed: "primary",
  contacting_client: "primary",
  awaiting_client_response: "primary",
};

export function StatusActionsPanel({ bookingId, currentStatus, currentDate, availableActions }: StatusActionsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedAction, setSelectedAction] = useState<StatusAction>(null);
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState<string | undefined>(currentDate.toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState<string>(currentDate.toTimeString().substring(0, 5));
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleActionSelect = (action: StatusAction) => {
    setSelectedAction(action);
    setValidationError(null);
  };

  const handleUpdate = () => {
    if (!selectedAction) return;
    setValidationError(null);

    startTransition(async () => {
      try {
        switch (selectedAction) {
          case "rescheduled": {
            if (!newDate || !newTime) {
              setValidationError("Please select a new date and time.");
              return;
            }
            const formData = new FormData();
            formData.append("bookingId", bookingId);
            formData.append("newDate", newDate);
            formData.append("newTime", newTime);
            if (reason) formData.append("reason", reason);
            await rescheduleBooking(formData);
            break;
          }
          case "completed":
            await markCompleted(bookingId);
            break;
          case "cancelled": {
            const formData = new FormData();
            formData.append("bookingId", bookingId);
            if (reason) formData.append("reason", reason);
            await cancelBooking(formData);
            break;
          }
          case "no_show": {
            const formData = new FormData();
            formData.append("bookingId", bookingId);
            if (reason) formData.append("reason", reason);
            await markNoShow(formData);
            break;
          }
          case "confirmed":
            await confirmBooking(bookingId);
            break;
          default: {
            const formData = new FormData();
            formData.append("bookingId", bookingId);
            formData.append("newStatus", selectedAction);
            if (reason) formData.append("reason", reason);
            await changeBookingStatus(formData);
            break;
          }
        }

        toast.success("Status updated");
        setSelectedAction(null);
        setReason("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update status.");
      }
    });
  };

  if (availableActions.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No further status actions are available.</p>;
  }

  const isReschedule = selectedAction === "rescheduled";
  const showReason = selectedAction && selectedAction !== "completed";
  const updateButtonVariant = actionColor[selectedAction ?? ""] ?? "primary";

  return (
    <div className="space-y-5">
      {/* Status action tabs */}
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action) => {
          const isSelected = selectedAction === action;
          const color = actionColor[action] ?? "primary";

          let selectedClass = "ring-2 ring-primary/40 bg-primary/10 text-primary font-semibold";
          if (color === "danger" && isSelected) {
            selectedClass = "ring-2 ring-destructive/40 bg-destructive/10 text-destructive font-semibold";
          }

          return (
            <button
              key={action}
              type="button"
              onClick={() => handleActionSelect(action as StatusAction)}
              disabled={isPending}
              className={`rounded-xl border border-border px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected ? selectedClass : "text-foreground"
              }`}
              aria-pressed={isSelected}
            >
              {actionLabels[action] ?? action.replaceAll("_", " ")}
            </button>
          );
        })}
      </div>

      {/* Contextual fields based on selected action */}
      {selectedAction && (
        <div className="space-y-4 rounded-xl border border-border bg-surface-muted/30 p-4">
          {/* Date & time picker for reschedule */}
          {isReschedule && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newDate">New date & time *</Label>
                <DatePicker
                  id="newDate"
                  name="newDate"
                  value={newDate}
                  onChange={setNewDate}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newTime" className="sm:invisible sm:hidden lg:visible lg:block">&nbsp;</Label>
                <TimePicker
                  id="newTime"
                  name="newTime"
                  value={newTime}
                  onChange={setNewTime}
                  required
                />
              </div>
            </div>
          )}

          {/* Reason textarea (shown for all except Complete) */}
          {showReason && (
            <div>
              <Label htmlFor="statusReason">
                Reason
                {isReschedule ? " (optional)" : " (optional)"}
              </Label>
              <Textarea
                id="statusReason"
                name="statusReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isReschedule
                    ? "e.g., Client request, therapist unavailable..."
                    : `Provide a reason for this action...`
                }
                rows={3}
              />
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          {/* Update button */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant={updateButtonVariant === "danger" ? "danger" : "primary"}
              onClick={handleUpdate}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Updating status..." : "Update Status"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
