"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import { ServiceForm } from "../service-form";
import { createService } from "@/services/actions";

interface Category {
  id: string;
  name: string;
}

export function NewServiceForm({ categories }: { categories: Category[] }) {
  // Pending gallery files (selected but not yet uploaded)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pending FAQs
  const [pendingFaqs, setPendingFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadPreviews.forEach(URL.revokeObjectURL);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Custom action that augments FormData with pending files and FAQs
  const augmentedAction = async (formData: FormData) => {
    for (const file of pendingFiles) {
      formData.append("galleryFile", file);
    }
    for (const faq of pendingFaqs) {
      formData.append("faqQuestion", faq.question);
      formData.append("faqAnswer", faq.answer);
    }
    return createService(formData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setPendingFiles((prev) => [...prev, ...newFiles]);
    for (const file of newFiles) {
      setUploadPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
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
      {/* Gallery Images */}
      <section className="mt-8 rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold">Gallery Images</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Additional images displayed on the service detail page. The first image becomes the main service image.
        </p>

        <div className="mt-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/50 p-6 transition-colors hover:border-primary/50"
          >
            {pendingFiles.length > 0 ? (
              <span className="text-sm font-semibold text-muted-foreground">
                {pendingFiles.length} file{pendingFiles.length !== 1 ? "s" : ""} selected — click to add more
              </span>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="mt-2 text-sm font-semibold">Upload images</span>
                <span className="mt-1 text-xs text-muted-foreground">Click to select multiple files (JPG, PNG, WebP)</span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            onChange={handleFileSelect}
            className="sr-only"
          />
        </div>

        {uploadPreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {uploadPreviews.map((url, index) => (
              <div key={url} className="group relative overflow-hidden rounded-xl border border-border">
                <div className="aspect-square overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {index === 0 ? "Main" : `#${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${pendingFiles[index]?.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Service FAQs */}
      <section className="mt-8 rounded-xl border border-border bg-background p-6">
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
