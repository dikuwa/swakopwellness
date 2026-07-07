"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { ServiceForm } from "../service-form";
import { createService } from "@/services/actions";

interface Category {
  id: string;
  name: string;
}

export function NewServiceForm({ categories }: { categories: Category[] }) {
  // Pending FAQs
  const [pendingFaqs, setPendingFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Custom action that augments FormData with pending FAQs
  const augmentedAction = async (formData: FormData) => {
    for (const faq of pendingFaqs) {
      formData.append("faqQuestion", faq.question);
      formData.append("faqAnswer", faq.answer);
    }
    return createService(formData);
  };

  const addFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast.error("Both question and answer are required.");
      return;
    }
    setPendingFaqs((prev) => [...prev, { question: faqQuestion.trim(), answer: faqAnswer.trim() }]);
    setFaqQuestion("");
    setFaqAnswer("");
  };

  const removeFaq = (index: number) => {
    setPendingFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ServiceForm categories={categories} action={augmentedAction}>
      {/* Service FAQs */}
      <section className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold">Service FAQs</h2>
        <p className="mt-2 text-sm text-muted-foreground">These appear on this service detail page.</p>

        <div className="mt-5 space-y-4 rounded-2xl bg-surface-muted p-5">
          <div>
            <label htmlFor="faq-q" className="mb-1.5 block text-sm font-semibold">
              Question
            </label>
            <textarea
              id="faq-q"
              rows={2}
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              placeholder="e.g. What should I prepare before my appointment?"
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label htmlFor="faq-a" className="mb-1.5 block text-sm font-semibold">
              Answer
            </label>
            <textarea
              id="faq-a"
              rows={3}
              value={faqAnswer}
              onChange={(e) => setFaqAnswer(e.target.value)}
              placeholder="e.g. Wear comfortable clothing and arrive 10 minutes early..."
              className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            onClick={addFaq}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>

        {pendingFaqs.length > 0 && (
          <div className="mt-4 space-y-3">
            {pendingFaqs.map((faq, index) => (
              <div key={index} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{faq.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove FAQ"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ServiceForm>
  );
}
