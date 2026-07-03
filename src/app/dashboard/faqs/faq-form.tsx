"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { DashboardLayoutWithSignOut } from "@/dashboard/components";
import { logoutAction } from "../actions";

interface FaqFormData {
  question: string;
  answer: string;
  sortOrder: number;
  publicVisible: boolean;
}

interface Props {
  action: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
  initialData?: FaqFormData;
}

export function FaqForm({ action, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => action(formData),
    null as { ok: boolean; error?: string } | null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "FAQ updated" : "FAQ created");
      router.push("/dashboard/faqs");
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router, isEdit]);

  return (
    <DashboardLayoutWithSignOut signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <h1 className="text-3xl font-semibold tracking-[-0.035em]">
          {isEdit ? "Edit FAQ" : "New FAQ"}
        </h1>

        {state?.ok === false && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-8 space-y-6">
          <div className="space-y-6 rounded-xl border border-border bg-background p-6">
            <div>
              <label
                htmlFor="question"
                className="mb-1.5 block text-sm font-semibold"
              >
                Question *
              </label>
              <textarea
                id="question"
                name="question"
                rows={2}
                required
                defaultValue={initialData?.question ?? ""}
                className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label
                htmlFor="answer"
                className="mb-1.5 block text-sm font-semibold"
              >
                Answer *
              </label>
              <textarea
                id="answer"
                name="answer"
                rows={4}
                required
                defaultValue={initialData?.answer ?? ""}
                className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label
                htmlFor="sortOrder"
                className="mb-1.5 block text-sm font-semibold"
              >
                Sort Order
              </label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={initialData?.sortOrder ?? 0}
                className="h-11 w-full max-w-[200px] rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                name="publicVisible"
                defaultChecked={initialData?.publicVisible ?? true}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Publicly visible
            </label>
          </div>

          <div className="flex items-center gap-4 border-t border-border pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Saving..." : isEdit ? "Update FAQ" : "Create FAQ"}
            </button>
            <Link
              href="/dashboard/faqs"
              className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
    </DashboardLayoutWithSignOut>
  );
}
