"use client";

import { useActionState, useRef } from "react";
import toast from "react-hot-toast";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateCategoryForm({ createAction: _createAction }: { createAction: (data: FormData) => Promise<{ ok: boolean; error?: string }> }) {
  const slugManuallyEdited = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await _createAction(formData);
      if (result.ok) {
        toast.success("Category created");
        formRef.current?.reset();
        slugManuallyEdited.current = false;
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    null as { ok: boolean; error?: string } | null,
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!slugManuallyEdited.current) {
      const slugInput = document.getElementById("create-slug") as HTMLInputElement;
      if (slugInput) {
        slugInput.value = generateSlug(e.target.value);
      }
    }
  };

  const handleSlugChange = () => {
    slugManuallyEdited.current = true;
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_80px_auto]"
    >
      <div>
        <label htmlFor="create-name" className="mb-1 block text-sm font-semibold">
          Name *
        </label>
        <input
          id="create-name"
          name="name"
          required
          onChange={handleNameChange}
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label htmlFor="create-slug" className="mb-1 block text-sm font-semibold">
          Slug
        </label>
        <input
          id="create-slug"
          name="slug"
          onChange={handleSlugChange}
          placeholder="Auto-generated"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label htmlFor="create-description" className="mb-1 block text-sm font-semibold">
          Description
        </label>
        <input
          id="create-description"
          name="description"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label htmlFor="create-sortOrder" className="mb-1 block text-sm font-semibold">
          Sort
        </label>
        <input
          id="create-sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={0}
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Category"}
      </button>
    </form>
  );
}

export function EditCategoryForm({
  category,
  updateAction: _updateAction,
}: {
  category: { id: string; name: string; slug: string; description: string | null; sortOrder: number };
  updateAction: (id: string, data: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const slugManuallyEdited = useRef(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!slugManuallyEdited.current) {
      const slugInput = document.getElementById(`edit-slug-${category.id}`) as HTMLInputElement;
      if (slugInput) {
        slugInput.value = generateSlug(e.target.value);
      }
    }
  };

  const handleSlugChange = () => {
    slugManuallyEdited.current = true;
  };

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await _updateAction(category.id, formData);
      if (result.ok) {
        toast.success("Category updated");
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    null as { ok: boolean; error?: string } | null,
  );

  return (
    <form action={formAction} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_80px_auto]">
      <div>
        <label className="mb-1 block text-sm font-semibold">Name</label>
        <input
          name="name"
          defaultValue={category.name}
          required
          onChange={handleNameChange}
          aria-label="Category name"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Slug</label>
        <input
          id={`edit-slug-${category.id}`}
          name="slug"
          defaultValue={category.slug}
          onChange={handleSlugChange}
          aria-label="Category slug"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Description</label>
        <input
          name="description"
          defaultValue={category.description ?? ""}
          aria-label="Category description"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Sort</label>
        <input
          name="sortOrder"
          type="number"
          defaultValue={category.sortOrder}
          aria-label="Category sort order"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Update"}
      </button>
    </form>
  );
}
