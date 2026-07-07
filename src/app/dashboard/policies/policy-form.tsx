"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface PolicyFormData {
  title: string;
  slug: string;
  body: string;
  publicVisible: boolean;
}

interface Props {
  action: (data: FormData) => Promise<{ ok: boolean; error?: string }>;
  initialData?: PolicyFormData;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PolicyForm({ action, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;
  const slugManuallyEdited = useRef(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!slugManuallyEdited.current) {
      const slugInput = document.getElementById("slug") as HTMLInputElement;
      if (slugInput) {
        slugInput.value = generateSlug(e.target.value);
      }
    }
  };

  const handleSlugChange = () => {
    slugManuallyEdited.current = true;
  };

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => action(formData),
    null as { ok: boolean; error?: string } | null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Policy updated" : "Policy created");
      router.push("/dashboard/policies");
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router, isEdit]);

  return (
    <>
      <Link
        href="/dashboard/policies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to Policies
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">
        {isEdit ? "Edit Policy" : "New Policy"}
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
              htmlFor="title"
              className="mb-1.5 block text-sm font-semibold"
            >
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={initialData?.title ?? ""}
              onChange={handleTitleChange}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="mb-1.5 block text-sm font-semibold"
            >
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              defaultValue={initialData?.slug ?? ""}
              onChange={handleSlugChange}
              placeholder="Auto-generated from title"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="body"
              className="mb-1.5 block text-sm font-semibold"
            >
              Body *
            </label>
            <textarea
              id="body"
              name="body"
              rows={12}
              required
              defaultValue={initialData?.body ?? ""}
              className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            {isPending
              ? "Saving..."
              : isEdit
                ? "Update Policy"
                : "Create Policy"}
          </button>
          <Link
            href="/dashboard/policies"
            className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
