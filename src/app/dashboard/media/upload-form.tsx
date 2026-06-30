"use client";

import { useActionState, useRef } from "react";
import { uploadMediaAction } from "@/media/actions";

export function UploadForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (_prev: unknown, formData: FormData) => {
    const result = await uploadMediaAction(formData);
    if (result && "error" in result) return result;
    ref.current?.reset();
    return { success: true };
  }, null);

  return (
    <form action={action} ref={ref} className="mt-6 rounded-2xl border border-border bg-surface-muted p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="file" className="text-sm font-medium">Choose image</label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            required
            className="mt-2 block w-full text-sm file:mr-3 file:h-9 file:cursor-pointer file:rounded-xl file:border file:border-border file:bg-surface file:px-3 file:text-sm file:font-semibold file:text-foreground hover:file:bg-surface-muted"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="altText" className="text-sm font-medium">Alt text</label>
          <input id="altText" name="altText" type="text" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Uploading\u2026" : "Upload"}
        </button>
      </div>
      {state && "error" in state ? (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      ) : state && "success" in state ? (
        <p className="mt-3 text-sm text-[oklch(0.49_0.16_158)]">Uploaded successfully.</p>
      ) : null}
    </form>
  );
}
