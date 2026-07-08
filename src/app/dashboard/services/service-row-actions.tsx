"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";

function PendingButton({
  children,
  pendingChildren,
  className,
  icon,
}: {
  children: React.ReactNode;
  pendingChildren: React.ReactNode;
  className: string;
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} ${pending ? "cursor-wait opacity-70" : "cursor-pointer"}`}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : icon}
      {pending ? pendingChildren : children}
    </button>
  );
}

export function ServiceActiveForm({
  action,
  active,
}: {
  action: () => Promise<void>;
  active: boolean;
}) {
  return (
    <form action={action}>
      <PendingButton
        pendingChildren={active ? "Deactivating" : "Activating"}
        icon={<span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-600" : "bg-red-600"}`} />}
        className={`inline-flex min-w-[86px] items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}
      >
        {active ? "Active" : "Inactive"}
      </PendingButton>
    </form>
  );
}

export function ServicePublicForm({
  action,
  publicVisible,
}: {
  action: () => Promise<void>;
  publicVisible: boolean;
}) {
  return (
    <form action={action}>
      <PendingButton
        pendingChildren={publicVisible ? "Hiding" : "Showing"}
        icon={publicVisible ? <Eye className="h-3 w-3" aria-hidden="true" /> : <EyeOff className="h-3 w-3" aria-hidden="true" />}
        className={`inline-flex min-w-[86px] items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          publicVisible ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
        }`}
      >
        {publicVisible ? "Visible" : "Hidden"}
      </PendingButton>
    </form>
  );
}

export function ServiceActions({
  serviceId,
  archiveAction,
}: {
  serviceId: string;
  archiveAction: () => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/dashboard/services/${serviceId}/edit`}
        className="flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        Edit
      </Link>
      <form action={archiveAction}>
        <PendingButton
          pendingChildren="Removing"
          icon={<Trash2 className="h-3 w-3" aria-hidden="true" />}
          className="flex h-8 min-w-[78px] items-center justify-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:hover:bg-transparent"
        >
          Delete
        </PendingButton>
      </form>
    </div>
  );
}
