"use client";

import { useState } from "react";
import { EditCategoryForm } from "./category-form";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

interface Props {
  category: Category;
  updateAction: (id: string, data: FormData) => Promise<{ ok: boolean; error?: string }>;
  toggleAction: (id: string) => Promise<void>;
  archiveAction: (id: string) => Promise<void>;
}

export function ClientCategoryRow({ category, updateAction, toggleAction, archiveAction }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="hover:bg-surface-muted/30 transition-colors">
        <td colSpan={6} className="p-4">
          <div className="rounded-xl border border-primary/20 bg-surface-muted/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                Editing: <span className="text-foreground">{category.name}</span>
              </p>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
            </div>
            <EditCategoryForm category={category} updateAction={updateAction} />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-surface-muted/30 transition-colors">
      <td className="py-3.5 px-4 font-medium">{category.name}</td>
      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{category.slug}</td>
      <td className="py-3.5 px-4 text-muted-foreground max-w-[200px] truncate">
        {category.description || "\u2014"}
      </td>
      <td className="py-3.5 px-4 text-center text-muted-foreground font-mono text-xs">
        {category.sortOrder}
      </td>
      <td className="py-3.5 px-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          category.active
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-700"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${category.active ? "bg-green-600" : "bg-red-600"}`} />
          {category.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
          >
            Edit
          </button>
          <form action={toggleAction.bind(null, category.id)}>
            <button
              type="submit"
              className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
            >
              {category.active ? "Deactivate" : "Activate"}
            </button>
          </form>
          <form action={archiveAction.bind(null, category.id)}>
            <button
              type="submit"
              className="flex h-8 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Archive
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
