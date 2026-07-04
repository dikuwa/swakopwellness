"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "What services do you offer?",
  "How do I book an appointment?",
  "How long does an assessment take?",
  "Where are you located?",
  "Can I speak to a staff member?",
];

const FAQ_ANSWERS: Record<string, string> = {
  "What services do you offer?":
    "We offer Basic Health Scan (N$650), Frequency Therapy (N$500), Meridians (N$200), and Food Tolerance and Nutrition Testing (N$300). Visit our Services page for full details.",
  "How do I book an appointment?":
    "You can book online through our booking form, chat to book here, call us, or visit us in person. All appointments are by request — we'll confirm availability with you.",
  "How long does an assessment take?":
    "A Basic Health Scan takes approximately 20–30 minutes. Other services vary — we'll confirm the duration when we contact you.",
  "Where are you located?":
    "We are at Shop 11, Wasserfall Street, Swakopmund, Namibia. We're open Monday to Friday, 08:00–17:00.",
  "Can I speak to a staff member?":
    "Absolutely. You can call us during business hours, send an enquiry through our Contact page, or visit us in person.",
};

type Message = {
  role: "assistant" | "user";
  content: string;
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"chat" | "form" | "done">("chat");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I can help answer questions about our services or collect a booking request. How can I help?" },
  ]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Trap focus within the panel when open
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    panel.addEventListener("keydown", handleTab);
    first?.focus();
    return () => panel.removeEventListener("keydown", handleTab);
  }, [open, step]);

  const askQuestion = (question: string) => {
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    const answer = FAQ_ANSWERS[question];
    if (answer) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      }, 400);
    }
  };

  const startBookingRequest = () => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "I&apos;d like to book an appointment." },
      { role: "assistant", content: "I can help with that! Please share your name and contact details so our team can follow up with you." },
    ]);
    setStep("form");
  };

  const submitContact = async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!contact.trim()) {
      setError("Please provide a phone number or email.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/chat-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact,
          contactType,
          message: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send. Please try again.");
      }

      setStep("done");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Thanks! Your message has been received. Our team will get back to you during business hours. You can also call us directly for faster assistance." },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_oklch(0.355_0.074_159_/_0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_28px_oklch(0.355_0.074_159_/_0.45)] md:bottom-6 md:right-6"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Chat panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-foreground/20 md:bg-transparent md:pointer-events-none"
            onClick={() => setOpen(false)}
          />

          <div
            ref={panelRef}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85vh] w-full max-w-md flex-col rounded-t-3xl border border-border bg-surface shadow-[0_-20px_80px_oklch(0.235_0.025_158_/_0.12)] md:bottom-6 md:right-6 md:inset-x-auto md:h-[600px] md:max-h-[80vh] md:w-[380px] md:rounded-3xl md:shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.15)]"
            role="dialog"
            aria-label="Chat widget"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-3xl bg-primary px-5 py-4 text-primary-foreground md:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Swakop Wellness</p>
                  <p className="text-[11px] opacity-75">Chat with us</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 transition-colors hover:bg-primary-foreground/30"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" role="log" aria-label="Chat messages" aria-live="polite">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                      msg.role === "assistant"
                        ? "bg-surface-muted text-foreground rounded-bl-sm"
                        : "bg-primary/10 text-foreground rounded-br-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {submitting && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-2.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions / Form / Done */}
            <div className="border-t border-border px-5 py-4">
              {step === "chat" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Suggested questions</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => askQuestion(q)}
                        className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={startBookingRequest}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    I&apos;d like to book
                  </button>
                </div>
              )}

              {step === "form" && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="cw-name" className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Your name</label>
                    <input
                      id="cw-name"
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(""); }}
                      placeholder="Full name"
                      className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="cw-contact" className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                      {contactType === "phone" ? "Phone number" : "Email address"}
                    </label>
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setContactType("phone"); setContact(""); }}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                          contactType === "phone"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Phone
                      </button>
                      <button
                        type="button"
                        onClick={() => { setContactType("email"); setContact(""); }}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                          contactType === "email"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Email
                      </button>
                    </div>
                    <input
                      id="cw-contact"
                      type={contactType === "email" ? "email" : "tel"}
                      value={contact}
                      onChange={(e) => { setContact(e.target.value); setError(""); }}
                      placeholder={contactType === "phone" ? "+264 64 463 200" : "you@example.com"}
                      className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-destructive" role="alert">{error}</p>
                  )}

                  <button
                    type="button"
                    onClick={submitContact}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {submitting ? "Sending..." : "Send message"}
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Your details will be shared with our team for follow-up.
                  </p>
                </div>
              )}

              {step === "done" && (
                <button
                  type="button"
                  onClick={() => { setOpen(false); setStep("chat"); setMessages([
                    { role: "assistant", content: "Hello! I can help answer questions about our services or collect a booking request. How can I help?" },
                  ]); setName(""); setContact(""); setError(""); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
