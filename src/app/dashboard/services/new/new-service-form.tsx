"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Plus, X, Upload, Loader2 } from "lucide-react";
import { ServiceForm } from "../service-form";
import { createService } from "@/services/actions";

interface Category {
  id: string;
  name: string;
}

interface GalleryPreview {
  id: string;
  url: string;
  file: File;
}

export function NewServiceForm({ categories }: { categories: Category[] }) {
  // Pending FAQs
  const [pendingFaqs, setPendingFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Gallery image uploads
  const [galleryPreviews, setGalleryPreviews] = useState<GalleryPreview[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Custom action that augments FormData with pending FAQs and gallery files
  const augmentedAction = async (formData: FormData) => {
    for (const faq of pendingFaqs) {
      formData.append("faqQuestion", faq.question);
      formData.append("faqAnswer", faq.answer);
    }
    for (const preview of galleryPreviews) {
      formData.append("galleryFile", preview.file);
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

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: GalleryPreview[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 8MB limit`);
        continue;
      }
      newPreviews.push({
        id: `gallery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        url: URL.createObjectURL(file),
        file,
      });
    }
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGalleryImage = (id: string) => {
    const preview = galleryPreviews.find((p) => p.id === id);
    if (preview) URL.revokeObjectURL(preview.url);
    setGalleryPreviews((prev) => prev.filter((p) => p.id !== id));
  };

  const moveGalleryImage = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= galleryPreviews.length) return;
    const updated = [...galleryPreviews];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setGalleryPreviews(updated);
  };

  return (
    <ServiceForm categories={categories} action={augmentedAction}>
      {/* Gallery Images Upload — Upload before saving */}
      <section className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold">Gallery Images</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload images now, or add them after saving. The first image becomes the main service image.
        </p>

        {/* Upload area */}
        <div
          onClick={() => galleryInputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/50 p-6 transition-colors hover:border-primary/50"
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="mt-2 text-sm font-semibold">Upload gallery images</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP (max 8MB each)</span>
        </div>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          onChange={handleGalleryUpload}
          className="sr-only"
        />

        {/* Gallery preview grid */}
        {galleryPreviews.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {galleryPreviews.map((preview, index) => (
              <div key={preview.id} className={`group relative overflow-hidden rounded-2xl border ${index === 0 ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
                <div className="aspect-square overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
                  <img
                    src={preview.url}
                    alt={`Gallery ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {index === 0 && (
                  <div className="flex items-center justify-center bg-primary/10 px-2 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Main Image</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border p-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveGalleryImage(index, "up")}
                      disabled={index === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <Plus className="h-3 w-3 rotate-90" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryImage(index, "down")}
                      disabled={index === galleryPreviews.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <Plus className="h-3 w-3 -rotate-90" aria-hidden="true" />
                    </button>
                    <span className="ml-1 text-[10px] text-muted-foreground">{index + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(preview.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
