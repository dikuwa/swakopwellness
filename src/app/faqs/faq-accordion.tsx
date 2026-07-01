"use client";

import { useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";

type Faq = {
  id: string;
  question: string;
  answer: string;
};

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState(faqs[0]?.id ?? "");

  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <article key={faq.id} className="rounded-2xl border border-border bg-surface">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? "" : faq.id)}
              className="flex min-h-16 w-full items-center gap-4 px-5 py-4 text-left font-semibold"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {open ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              </span>
              <span className="flex-1">{faq.question}</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {open ? <div className="px-16 pb-5 text-sm leading-7 text-muted-foreground">{faq.answer}</div> : null}
          </article>
        );
      })}
    </div>
  );
}
