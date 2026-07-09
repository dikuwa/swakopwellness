"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  children: ReactNode;
  pendingChildren?: ReactNode;
  className: string;
  type?: "submit";
  disabled?: boolean;
  showSpinner?: boolean;
  title?: string;
  "aria-label"?: string;
};

export function PendingSubmitButton({
  children,
  pendingChildren,
  className,
  type = "submit",
  disabled = false,
  showSpinner = true,
  title,
  "aria-label": ariaLabel,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={pending}
      aria-label={ariaLabel}
      title={title}
      className={`inline-flex items-center justify-center gap-2 ${className} ${pending ? "cursor-wait opacity-70" : ""} disabled:opacity-60`}
    >
      {pending && showSpinner ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}
