"use client";

import { useActionState, useEffect } from "react";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import type { ContactFormState } from "./actions";

export function ContactForm({ action }: { action: (state: ContactFormState, formData: FormData) => Promise<ContactFormState> }) {
  const [state, formAction, isPending] = useActionState(action, { ok: false, message: "" });

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-5">
      <label className="text-sm font-medium">
        Full name
        <input name="fullName" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" placeholder="Your full name" />
      </label>
      <label className="text-sm font-medium">
        Email address
        <input name="email" type="email" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" placeholder="you@email.com" />
      </label>
      <label className="text-sm font-medium">
        Subject
        <input name="subject" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm" placeholder="How can we help?" />
      </label>
      <label className="text-sm font-medium">
        Message
        <textarea name="message" rows={7} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" placeholder="Type your message here..." />
      </label>
      <button type="submit" disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        <Send className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Sending..." : "Send message"}
      </button>
      <p aria-live="polite" className={state.message ? "text-sm text-muted-foreground" : "sr-only"}>{state.message || "Contact form status"}</p>
    </form>
  );
}
