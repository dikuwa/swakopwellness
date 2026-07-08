"use client";

import { useFormStatus } from "react-dom";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type FaqButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  className: string;
  title?: string;
};

function PendingButton({ children, pendingLabel, className, title }: FaqButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      aria-label={title}
      className={`${className} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          <span className={pendingLabel.length > 0 ? "" : "sr-only"}>{pendingLabel || "Loading"}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FaqVisibilityButton({ visible }: { visible: boolean }) {
  return (
    <PendingButton
      pendingLabel="Saving..."
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        visible ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${visible ? "bg-green-600" : "bg-gray-400"}`} />
      {visible ? "Visible" : "Hidden"}
    </PendingButton>
  );
}

export function FaqDeleteButton() {
  return (
    <PendingButton
      pendingLabel="Deleting..."
      className="flex h-8 min-w-[74px] items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
    >
      Delete
    </PendingButton>
  );
}

export function FaqMoveButton({ direction }: { direction: "up" | "down" }) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  const label = direction === "up" ? "Move up" : "Move down";

  return (
    <PendingButton
      pendingLabel=""
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-xs transition-colors hover:bg-surface-muted"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </PendingButton>
  );
}
