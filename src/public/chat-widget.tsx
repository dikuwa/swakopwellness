"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";

const FAQ_ANSWERS: Record<string, string> = {
  "what services do you offer?":
    "We offer live bookable wellness services shown in this chat. Prices and durations are pulled from the website settings so they stay current.",
  "how do i book an appointment?":
    "Choose **Book an appointment**, select a service, share your preferred time and contact details, then staff will contact you to finalise availability.",
  "how long does an assessment take?":
    "Most appointments take about 20 to 30 minutes, depending on the service. Staff will confirm the exact time with you.",
  "where are you located?":
    "Swakop Wellness Centre is in Swakopmund, Namibia. You can also use the Contact page for current location and contact details.",
  "is this medical treatment?":
    "No. Swakop Wellness services are complementary wellness support and do not replace conventional medical diagnosis, treatment, or professional medical advice.",
  "can i speak to a staff member?":
    "Yes. Share your contact details through the booking or contact form, and a team member will follow up directly.",
};

const FALLBACK_SERVICES: ChatService[] = [
  { name: "Meridians", slug: "meridians", price: "N$250", duration: "30 minutes", shortDescription: "A focused meridian wellness scan." },
  { name: "Basic Health Scan", slug: "basic-health-scan", price: "N$650", duration: "30 minutes", shortDescription: "A general complementary wellness scan." },
  { name: "3D Scan", slug: "3d-scan", price: "N$350", duration: "30 minutes", shortDescription: "A quick 3D wellness scan option." },
  { name: "Food Tolerance & Nutrition Testing", slug: "food-tolerance-and-nutrition-testing", price: "N$550", duration: "45 minutes", shortDescription: "Food tolerance and nutrition-focused wellness testing." },
  { name: "Frequency Therapy", slug: "frequency-therapy", price: "N$500", duration: "45 minutes", shortDescription: "A complementary frequency therapy session." },
];

type FlowStep = "menu" | "question" | "service" | "datetime" | "contact" | "safety" | "notes" | "summary" | "done" | "stopped";

type Message = {
  role: "assistant" | "user";
  content: string;
};

type ChatService = {
  name: string;
  slug: string;
  price: string;
  duration: string;
  shortDescription: string;
};

type BookingDraft = {
  serviceName: string;
  serviceSlug: string;
  preferredDate: string;
  preferredTime: string;
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

const emptyDraft: BookingDraft = {
  serviceName: "",
  serviceSlug: "",
  preferredDate: "",
  preferredTime: "",
  fullName: "",
  email: "",
  phone: "",
  note: "",
};

function emailLooksValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function phoneLooksValid(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return /^[+\d\s().-]+$/.test(trimmed) && digits.length >= 7 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function parsePreferredDateTime(date: string, time: string) {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function renderMessage(content: string) {
  return content.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<FlowStep>("menu");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi there 👋 Welcome to Swakop Wellness Centre. I can help you book an appointment or answer a quick question." },
  ]);
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft);
  const [question, setQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState<ChatService[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [conversationStatus, setConversationStatus] = useState("");
  const [teamMessage, setTeamMessage] = useState("");
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || services.length > 0 || servicesLoading || servicesError) return;
    async function loadServices() {
      setServicesLoading(true);
      setServicesError("");
      try {
        const response = await fetch("/api/chat-widget");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error("Could not load current services.");
        setServices(Array.isArray(data.services) && data.services.length > 0 ? data.services : FALLBACK_SERVICES);
      } catch {
        setServices(FALLBACK_SERVICES);
        setServicesError("Current services could not be loaded, so fallback services are shown.");
      } finally {
        setServicesLoading(false);
      }
    }
    void loadServices();
  }, [open, services.length, servicesLoading, servicesError]);

  useEffect(() => {
    if (!open || !conversationId) return;

    let cancelled = false;
    async function loadConversation() {
      try {
        const response = await fetch(`/api/chat-widget?conversationId=${encodeURIComponent(conversationId)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;
        const nextMessages = Array.isArray(data.messages)
          ? data.messages
              .filter((message: { role?: string; content?: string }) => (message.role === "assistant" || message.role === "user") && message.content)
              .map((message: { role: "assistant" | "user"; content: string }) => ({ role: message.role, content: message.content }))
          : [];
        if (nextMessages.length > 0) setMessages(nextMessages);
        setConversationStatus(String(data.conversation?.status ?? ""));
        if (data.conversation?.status === "human_active") setStep("question");
      } catch {
        // Keep the local chat usable if polling fails.
      }
    }

    void loadConversation();
    const interval = window.setInterval(loadConversation, 4500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [conversationId, open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleTab(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    panel.addEventListener("keydown", handleTab);
    first?.focus();
    return () => panel.removeEventListener("keydown", handleTab);
  }, [open, step]);

  const addUser = (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
  };

  const addAssistant = (content: string, nextStep?: FlowStep) => {
    setIsTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      if (nextStep) setStep(nextStep);
      setIsTyping(false);
    }, 450);
  };

  const resetChat = () => {
    setStep("menu");
    setDraft(emptyDraft);
    setQuestion("");
    setError("");
    setConversationId("");
    setConversationStatus("");
    setTeamMessage("");
    setMessages([{ role: "assistant", content: "Hi there 👋 Welcome to Swakop Wellness Centre. I can help you book an appointment or answer a quick question." }]);
  };

  const beginBooking = () => {
    setDraft(emptyDraft);
    setError("");
    addUser("Book an appointment");
    addAssistant("Please choose a **service**. Prices and durations are loaded from the current website data. These appointments are requests until our staff confirm availability.", "service");
  };

  const beginQuestion = () => {
    addUser("Ask a question");
    addAssistant("Sure. Ask me a question about our services, bookings, safety, or location.", "question");
  };

  const selectService = (service: ChatService) => {
    setError("");
    setDraft((prev) => ({ ...prev, serviceName: service.name, serviceSlug: service.slug }));
    addUser(`**${service.name}** (**${service.price}**, **${service.duration}**)`);
    addAssistant("Great choice. Please choose your **preferred date** and **time**. Staff will confirm final availability.", "datetime");
  };

  const saveDateTime = () => {
    if (!draft.preferredDate && !draft.preferredTime) {
      setError("Please choose a preferred date and time.");
      return;
    }
    if (!draft.preferredDate) {
      setError("Please choose a preferred date.");
      return;
    }
    if (!draft.preferredTime) {
      setError("Please choose a preferred time.");
      return;
    }
    const preferredAt = parsePreferredDateTime(draft.preferredDate, draft.preferredTime);
    if (!preferredAt) {
      setError("That date or time does not look valid. Please choose it again.");
      return;
    }
    if (preferredAt.getTime() <= Date.now()) {
      setError("Please choose a future date and time.");
      return;
    }

    setError("");
    addUser(`**${draft.preferredDate}** at **${draft.preferredTime}**`);
    addAssistant("Thank you. Please share your **full name**, **email address**, and **phone number**. You can use formats like **081...**, **+264...**, **264...**, or a landline number.", "contact");
  };

  const saveContact = () => {
    if (!draft.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!emailLooksValid(draft.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!phoneLooksValid(draft.phone)) {
      setError("Please enter a valid phone number. You can use 081..., +264..., 264..., or a landline number.");
      return;
    }
    setError("");
    addUser(`**${draft.fullName}** · **${draft.email}** · **${draft.phone}**`);
    addAssistant("Before we continue, please answer these suitability questions.", "safety");
  };

  const answerSafety = (answers: { chemotherapy: string; medication: string; device: string }) => {
    const hasConcern = Object.values(answers).some((answer) => answer === "yes");
    addUser(`Suitability answers: ${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join(", ")}`);
    if (hasConcern) {
      addAssistant(
        "Thank you for letting us know. For your safety and scan accuracy, please postpone this scan and speak with our team before booking. Our services are complementary and do not replace medical advice.",
        "stopped",
      );
      return;
    }
    addAssistant("Thanks. You can add any preferences or notes, or skip this step.", "notes");
  };

  const showSummary = () => {
    addUser(draft.note.trim() ? `Notes: ${draft.note.trim()}` : "No additional notes");
    addAssistant(
      `Please confirm your booking request:\n**Service:** **${draft.serviceName}**\n**Preferred date:** **${draft.preferredDate}**\n**Preferred time:** **${draft.preferredTime}**\n**Name:** **${draft.fullName}**\n**Email:** **${draft.email}**\n**Phone:** **${draft.phone}**\n**Notes:** **${draft.note.trim() || "None"}**`,
      "summary",
    );
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    setError("");
    addUser("Confirm booking request");
    try {
      const res = await fetch("/api/chat-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "booking",
          ...draft,
          transcript: messages,
          message: messages.map((message) => `${message.role}: ${message.content}`).join("\n"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save booking request.");
      if (data.conversationId) setConversationId(String(data.conversationId));
      const statusMessage = data.status === "requires_review" ? "Your request is **under review** so staff can confirm suitability or scheduling." : "Your request has been saved.";
      addAssistant(
        `Thank you. Your appointment request has been submitted. Our team will review availability and contact you to confirm.\n${statusMessage}\n**Reference:** **${data.reference}**\n**Service:** **${draft.serviceName}**\n**Date:** **${draft.preferredDate}**\n**Time:** **${draft.preferredTime}**\n**Email:** **${draft.email}**\n**Phone:** **${draft.phone}**`,
        "done",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      if (message.toLowerCase().includes("date") || message.toLowerCase().includes("time")) {
        setStep("datetime");
        setError(`${message} Please edit the date or time below.`);
        addAssistant("I could not save that request because the **date or time** needs attention. Please edit it below and continue.", "datetime");
      } else if (message.toLowerCase().includes("email") || message.toLowerCase().includes("phone") || message.toLowerCase().includes("name")) {
        setStep("contact");
        setError(`${message} Please edit your contact details below.`);
        addAssistant("I could not save that request because the **contact details** need attention. Please edit them below and continue.", "contact");
      } else if (message.toLowerCase().includes("service")) {
        setStep("service");
        setError(`${message} Please choose a service again.`);
        addAssistant("I could not save that request because the **service** needs attention. Please choose it again.", "service");
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const askQuestion = async (value: string) => {
    const text = value.trim();
    if (!text) return;
    setQuestion("");
    addUser(text);
    if (conversationId && conversationStatus === "human_active") {
      setTeamMessage("");
      try {
        const response = await fetch("/api/chat-widget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "client_message", conversationId, content: text }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Could not send your message.");
        setTeamMessage("Team is typing...");
      } catch {
        setError("Could not send your message to the team. Please try again.");
      }
      return;
    }

    setIsTyping(true);
    try {
      const response = await fetch("/api/chat-widget/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await response.json().catch(() => ({}));
      const answer = response.ok && typeof data.answer === "string" ? data.answer : fallbackQuestionAnswer(text);
      window.setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
        setStep("question");
        setIsTyping(false);
      }, 450);
    } catch {
      window.setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: fallbackQuestionAnswer(text) }]);
        setStep("question");
        setIsTyping(false);
      }, 450);
    }
  };

  const fallbackQuestionAnswer = (text: string) => {
    const key = text.toLowerCase();
    const servicesAnswer = services.length
      ? `Current bookable services are ${services.map((service) => `**${service.name}** (**${service.price}**, **${service.duration}**)`).join(", ")}. Swakop Wellness Centre provides complementary wellness services and does not replace conventional medical diagnosis or treatment.`
      : FAQ_ANSWERS["what services do you offer?"];
    return key === "what services do you offer?"
      ? servicesAnswer
      : FAQ_ANSWERS[key] ??
          (key.includes("diagnos") || key.includes("medical")
            ? FAQ_ANSWERS["is this medical treatment?"]
            : key.includes("book")
              ? FAQ_ANSWERS["how do i book an appointment?"]
              : key.includes("staff") || key.includes("human") || key.includes("person")
                ? FAQ_ANSWERS["can i speak to a staff member?"]
                : "I’m not fully sure about that. I can connect you with our team for the correct answer.");
  };

  const requestHuman = async () => {
    const requestMessage = "I would like to speak to a team member";
    const transcript = [...messages, { role: "user" as const, content: requestMessage }];
    addUser(requestMessage);
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/chat-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "staff_request",
          transcript,
          message: transcript.map((message) => `${message.role}: ${message.content}`).join("\n"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not request staff help.");
      if (data.conversationId) setConversationId(String(data.conversationId));
      addAssistant("Thanks. Our team has received your request. If someone takes over this chat, you will see their replies here.", "question");
    } catch {
      addAssistant("Sorry, I had trouble connecting that request. You can still book here or call the centre.", "question");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_oklch(0.355_0.074_159_/_0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_6px_28px_oklch(0.355_0.074_159_/_0.45)] md:bottom-6 md:right-6"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/20 md:pointer-events-none md:bg-transparent" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85vh] w-full max-w-md flex-col rounded-t-3xl border border-border bg-surface shadow-[0_-20px_80px_oklch(0.235_0.025_158_/_0.12)] md:bottom-6 md:right-6 md:inset-x-auto md:h-[640px] md:max-h-[82vh] md:w-[400px] md:rounded-3xl md:shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.15)]"
            role="dialog"
            aria-label="Swakop Wellness booking assistant"
            aria-modal="true"
          >
            <div className="flex items-center justify-between rounded-t-3xl bg-primary px-5 py-4 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Swakop Wellness</p>
                  <p className="text-[11px] opacity-75">Booking assistant</p>
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

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" role="log" aria-label="Chat messages" aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                      message.role === "assistant" ? "rounded-bl-sm bg-surface-muted text-foreground" : "rounded-br-sm bg-primary/10 text-foreground"
                    }`}
                  >
                    {renderMessage(message.content)}
                  </div>
                </div>
              ))}
              {isTyping || submitting ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-2.5 text-sm text-muted-foreground">
                    <span className="sr-only">typing...</span>
                    <span className="flex items-center gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border px-5 py-4">
              {error ? <p className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}

              {step !== "menu" && step !== "service" && step !== "summary" ? (
                <button type="button" onClick={beginBooking} className="mb-3 h-10 w-full rounded-xl border border-primary/30 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10">
                  Book appointment
                </button>
              ) : null}

              {step === "menu" ? (
                <div className="grid gap-2">
                  <button type="button" onClick={beginBooking} className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    Book appointment
                  </button>
                  <button type="button" onClick={beginQuestion} className="h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-muted">
                    Ask a question
                  </button>
                  <button type="button" onClick={requestHuman} className="h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-muted">
                    Talk to staff
                  </button>
                </div>
              ) : null}

              {step === "service" ? (
                <div className="space-y-2">
                  {servicesLoading ? <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-muted-foreground">Loading current services...</p> : null}
                  {servicesError ? <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{servicesError}</p> : null}
                  {!servicesLoading && !servicesError && services.length === 0 ? (
                    <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-muted-foreground">No online services are available right now. Please ask our team for help.</p>
                  ) : null}
                  {services.map((service) => (
                    <button
                      key={service.slug}
                      type="button"
                      onClick={() => selectService(service)}
                      className="grid w-full grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-xl border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-surface-muted"
                    >
                      <span className="font-semibold">{service.name}</span>
                      <span className="text-right text-xs text-muted-foreground">{service.price} · {service.duration}</span>
                      <span className="col-span-2 text-xs text-muted-foreground">{service.shortDescription}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {step === "datetime" ? (
                <div className="grid gap-3">
                  <input type="date" min={today()} value={draft.preferredDate} onChange={(event) => setDraft((prev) => ({ ...prev, preferredDate: event.target.value }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
                  <input type="time" value={draft.preferredTime} onChange={(event) => setDraft((prev) => ({ ...prev, preferredTime: event.target.value }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
                  <button type="button" onClick={saveDateTime} className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Continue</button>
                </div>
              ) : null}

              {step === "contact" ? (
                <div className="grid gap-3">
                  <input placeholder="Full name" value={draft.fullName} onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
                  <input placeholder="Email address" type="email" value={draft.email} onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
                  <input placeholder="Phone number, e.g. 081..., +264..., or landline" type="tel" value={draft.phone} onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.target.value }))} className="h-11 rounded-xl border border-border bg-background px-3 text-sm" />
                  <button type="button" onClick={saveContact} className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Continue</button>
                </div>
              ) : null}

              {step === "safety" ? <SafetyQuestions onSubmit={answerSafety} /> : null}

              {step === "notes" ? (
                <div className="grid gap-3">
                  <textarea placeholder="Additional preferences or notes (optional)" value={draft.note} onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))} rows={3} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                  <button type="button" onClick={showSummary} className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Review request</button>
                </div>
              ) : null}

              {step === "summary" ? (
                <div className="grid gap-2">
                  <button type="button" onClick={confirmBooking} disabled={submitting} className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {submitting ? "Saving..." : "Confirm booking request"}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setError(""); setStep("service"); }} className="h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface-muted">Edit service</button>
                    <button type="button" onClick={() => { setError(""); setStep("datetime"); }} className="h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface-muted">Edit date/time</button>
                    <button type="button" onClick={() => { setError(""); setStep("contact"); }} className="h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface-muted">Edit contact</button>
                    <button type="button" onClick={() => { setError(""); setStep("notes"); }} className="h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface-muted">Edit notes</button>
                  </div>
                </div>
              ) : null}

              {step === "question" ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(FAQ_ANSWERS).slice(0, 5).map((item) => (
                      <button key={item} type="button" onClick={() => void askQuestion(item)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">
                        {item.replace(/^\w/, (char) => char.toUpperCase())}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void askQuestion(question); }} placeholder={conversationStatus === "human_active" ? "Message the team" : "Type your question"} className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm" />
                    <button type="button" onClick={() => void askQuestion(question)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-label="Send question">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  {teamMessage ? <p className="text-xs text-muted-foreground">{teamMessage}</p> : null}
                  <button type="button" onClick={() => void requestHuman()} className="h-10 w-full rounded-xl border border-border text-sm font-semibold hover:bg-surface-muted">Connect me to the team</button>
                </div>
              ) : null}

              {step === "done" || step === "stopped" ? (
                <button type="button" onClick={resetChat} className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Start again
                </button>
              ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function SafetyQuestions({ onSubmit }: { onSubmit: (answers: { chemotherapy: string; medication: string; device: string }) => void }) {
  const [answers, setAnswers] = useState({ chemotherapy: "no", medication: "no", device: "no" });
  const questions = [
    ["chemotherapy", "Are you currently undergoing chemotherapy?"],
    ["medication", "Are you taking strong medications like antibiotics?"],
    ["device", "Do you have a pacemaker or implanted medical device?"],
  ] as const;

  return (
    <div className="space-y-3">
      {questions.map(([key, label]) => (
        <fieldset key={key} className="rounded-xl bg-surface-muted p-3">
          <legend className="text-xs font-semibold">{label}</legend>
          <div className="mt-2 flex gap-2">
            {["no", "yes"].map((value) => (
              <label key={value} className="flex items-center gap-1.5 text-xs font-medium">
                <input
                  type="radio"
                  name={key}
                  value={value}
                  checked={answers[key] === value}
                  onChange={() => setAnswers((prev) => ({ ...prev, [key]: value }))}
                  className="accent-primary"
                />
                {value === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="button" onClick={() => onSubmit(answers)} className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Continue
      </button>
    </div>
  );
}
