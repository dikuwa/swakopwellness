import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { businessSettings, communicationSettings, faqs, policies, services } from "@/db/schema";
import { formatMoney } from "@/public/data";

const DISCLAIMER = "Swakop Wellness Centre provides complementary wellness services and does not replace conventional medical diagnosis or treatment.";
const UNCERTAIN_REPLY = "I’m not fully sure about that. I can connect you with our team for the correct answer.";

type ChatContext = {
  services: {
    name: string;
    price: string;
    duration: string;
    shortDescription: string;
    safetyInformation: string | null;
  }[];
  faqs: { question: string; answer: string }[];
  policies: { title: string; body: string }[];
  business: {
    name: string;
    address: string;
    telephone: string;
    email: string;
    operatingHours: string;
    appointmentModel: string;
    disclaimer: string;
  } | null;
  communication: {
    phone: string;
    email: string;
    whatsapp: string | null;
  } | null;
};

function cleanText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[`#>{}[\]]/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1200);
}

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function maybeAddDisclaimer(answer: string, question: string) {
  if (!includesAny(question, ["medical", "diagnos", "treat", "condition", "safe", "pain", "symptom", "therapy", "scan"])) return answer;
  return answer.includes(DISCLAIMER) ? answer : `${answer}\n\n${DISCLAIMER}`;
}

export async function getChatAnswerContext(): Promise<ChatContext> {
  const db = getDb();
  const [[business], [communication], serviceRows, faqRows, policyRows] = await Promise.all([
    db.select().from(businessSettings).limit(1),
    db.select().from(communicationSettings).limit(1),
    db
      .select({
        name: services.name,
        priceCents: services.priceCents,
        durationMinutes: services.durationMinutes,
        shortDescription: services.shortDescription,
        safetyInformation: services.safetyInformation,
      })
      .from(services)
      .where(and(eq(services.active, true), eq(services.publicVisible, true)))
      .orderBy(asc(services.sortOrder), asc(services.name)),
    db.select({ question: faqs.question, answer: faqs.answer }).from(faqs).where(eq(faqs.publicVisible, true)).orderBy(asc(faqs.sortOrder)),
    db.select({ title: policies.title, body: policies.body }).from(policies).where(eq(policies.publicVisible, true)).orderBy(asc(policies.title)),
  ]);

  const currencySymbol = business?.currencySymbol ?? "N$";
  return {
    services: serviceRows.map((service) => ({
      name: service.name,
      price: formatMoney(service.priceCents, currencySymbol),
      duration: `${service.durationMinutes ?? 30} minutes`,
      shortDescription: service.shortDescription,
      safetyInformation: service.safetyInformation,
    })),
    faqs: faqRows,
    policies: policyRows,
    business: business
      ? {
          name: business.businessName,
          address: business.address,
          telephone: business.telephone,
          email: business.email,
          operatingHours: business.operatingHours,
          appointmentModel: business.appointmentModel,
          disclaimer: business.medicalDisclaimer || DISCLAIMER,
        }
      : null,
    communication: communication
      ? {
          phone: communication.mainPhone,
          email: communication.businessEmail,
          whatsapp: communication.enableWhatsapp ? communication.whatsappNumber : null,
        }
      : null,
  };
}

function localAnswer(question: string, context: ChatContext) {
  const q = question.toLowerCase();
  const serviceMatch = context.services.find((service) => {
    const name = service.name.toLowerCase();
    return q.includes(name) || name.split(/\s+/).filter((part) => part.length > 3).some((part) => q.includes(part));
  });

  if (serviceMatch) {
    return maybeAddDisclaimer(
      `${serviceMatch.name} is currently listed at ${serviceMatch.price} for ${serviceMatch.duration}. ${serviceMatch.shortDescription}`,
      question,
    );
  }

  if (includesAny(q, ["service", "offer", "price", "cost", "duration"])) {
    const services = context.services.slice(0, 8).map((service) => `${service.name} (${service.price}, ${service.duration})`).join(", ");
    return maybeAddDisclaimer(`Current bookable services include ${services || "the services shown on the website"}.`, question);
  }

  const faqMatch = context.faqs.find((faq) => {
    const fq = faq.question.toLowerCase();
    return q.includes(fq) || fq.split(/\s+/).filter((part) => part.length > 4).some((part) => q.includes(part));
  });
  if (faqMatch) return maybeAddDisclaimer(cleanText(faqMatch.answer), question);

  if (includesAny(q, ["where", "location", "address"])) {
    return context.business?.address ? `We are located at ${context.business.address}.` : UNCERTAIN_REPLY;
  }
  if (includesAny(q, ["hour", "open", "close"])) {
    return context.business?.operatingHours ? `Our current opening hours are: ${context.business.operatingHours}` : UNCERTAIN_REPLY;
  }
  if (includesAny(q, ["contact", "phone", "call", "email", "whatsapp", "staff", "human", "person"])) {
    const phone = context.communication?.phone ?? context.business?.telephone;
    const email = context.communication?.email ?? context.business?.email;
    const whatsapp = context.communication?.whatsapp;
    return [`You can speak with our team directly.`, phone ? `Call: ${phone}` : "", whatsapp ? `WhatsApp: ${whatsapp}` : "", email ? `Email: ${email}` : ""].filter(Boolean).join("\n");
  }
  if (includesAny(q, ["medical", "diagnos", "treat", "doctor", "cure"])) {
    return DISCLAIMER;
  }

  const policyMatch = context.policies.find((policy) => {
    const title = policy.title.toLowerCase();
    return q.includes(title) || title.split(/\s+/).filter((part) => part.length > 4).some((part) => q.includes(part));
  });
  if (policyMatch) return maybeAddDisclaimer(cleanText(policyMatch.body), question);

  return UNCERTAIN_REPLY;
}

function buildContextText(context: ChatContext) {
  return [
    context.business
      ? `Business: ${context.business.name}\nAddress: ${context.business.address}\nPhone: ${context.business.telephone}\nEmail: ${context.business.email}\nHours: ${context.business.operatingHours}\nBooking process: ${context.business.appointmentModel}\nDisclaimer: ${context.business.disclaimer}`
      : "",
    `Services:\n${context.services.map((service) => `- ${service.name}: ${service.price}, ${service.duration}. ${service.shortDescription}${service.safetyInformation ? ` Safety: ${service.safetyInformation}` : ""}`).join("\n")}`,
    `FAQs:\n${context.faqs.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n")}`,
    `Policies:\n${context.policies.map((policy) => `${policy.title}: ${policy.body}`).join("\n\n")}`,
  ].filter(Boolean).join("\n\n").slice(0, 12000);
}

async function callChatProvider(question: string, context: ChatContext) {
  const messages = [
    {
      role: "system",
      content:
        "You are the controlled Swakop Wellness Centre booking assistant. Answer only from the supplied website context. Do not invent medical claims. Keep replies warm, concise, and human-readable. You may use simple **bold** emphasis for service names, prices, and key labels, plus short '- ' bullet lists when useful. Do not use code blocks, JSON, prompts, stack traces, or technical implementation text. If the answer is not in context, say you are not fully sure and offer to connect the visitor with the team. Include the complementary wellness disclaimer whenever medical, diagnosis, treatment, suitability, safety, symptom, scan, or therapy topics are relevant.",
    },
    { role: "user", content: `Website context:\n${buildContextText(context)}\n\nVisitor question: ${question}` },
  ];

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const model = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || "openai/gpt-oss-20b:free";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://swakopwellness.com",
        "X-OpenRouter-Title": "Swakop Wellness Centre",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 500,
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter request failed with status ${response.status}.`);
    const data = await response.json();
    return cleanText(String(data?.choices?.[0]?.message?.content ?? ""));
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages,
        temperature: 0.3,
        max_completion_tokens: 500,
      }),
    });
    if (!response.ok) throw new Error("Groq request failed.");
    const data = await response.json();
    return cleanText(String(data?.choices?.[0]?.message?.content ?? ""));
  }

  return "";
}

export async function answerChatQuestion(question: string) {
  const cleanQuestion = cleanText(question);
  if (!cleanQuestion || cleanQuestion.length > 800) {
    return { answer: "Please send a shorter question so I can help properly.", provider: "fallback" as const };
  }

  const context = await getChatAnswerContext();
  try {
    const providerAnswer = await callChatProvider(cleanQuestion, context);
    if (providerAnswer) return { answer: maybeAddDisclaimer(providerAnswer, cleanQuestion), provider: process.env.OPENROUTER_API_KEY ? "openrouter" as const : "groq" as const };
  } catch (error) {
    console.error("Chat AI provider failed:", error);
  }

  return { answer: localAnswer(cleanQuestion, context), provider: "fallback" as const };
}
