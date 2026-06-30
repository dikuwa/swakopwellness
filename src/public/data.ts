import { and, asc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { bookingRules, businessSettings, communicationSettings, faqs, policies, serviceFaqs, serviceQuestions, services } from "@/db/schema";

export function formatMoney(cents: number, symbol = "N$") {
  return `${symbol}${(cents / 100).toLocaleString("en-NA", { maximumFractionDigits: 0 })}`;
}

export async function getBusinessSettings() {
  const db = getDb();
  const [settings] = await db.select().from(businessSettings).limit(1);
  if (!settings) notFound();
  return settings;
}

export async function getCommunicationSettings() {
  const db = getDb();
  const [settings] = await db.select().from(communicationSettings).limit(1);
  if (!settings) notFound();
  return settings;
}

export async function getPublicServices() {
  const db = getDb();
  return db
    .select()
    .from(services)
    .where(and(eq(services.active, true), eq(services.publicVisible, true)))
    .orderBy(asc(services.sortOrder), asc(services.name));
}

export async function getFeaturedServices() {
  const publicServices = await getPublicServices();
  return publicServices.filter((service) => service.featured).slice(0, 4);
}

export async function getServiceBySlug(slug: string) {
  const db = getDb();
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.slug, slug), eq(services.active, true), eq(services.publicVisible, true)))
    .limit(1);
  if (!service) notFound();
  const serviceSpecificFaqs = await db
    .select()
    .from(serviceFaqs)
    .where(and(eq(serviceFaqs.serviceId, service.id), eq(serviceFaqs.active, true)))
    .orderBy(asc(serviceFaqs.sortOrder));
  return { ...service, faqs: serviceSpecificFaqs };
}

export async function getPublicFaqs() {
  const db = getDb();
  return db.select().from(faqs).where(eq(faqs.publicVisible, true)).orderBy(asc(faqs.sortOrder));
}

export async function getPublicPolicies() {
  const db = getDb();
  return db.select().from(policies).where(eq(policies.publicVisible, true)).orderBy(asc(policies.title));
}

export async function getBookingRules() {
  const db = getDb();
  const [rules] = await db.select().from(bookingRules).limit(1);
  if (!rules) notFound();
  return rules;
}

export async function getActiveSuitabilityQuestions() {
  const db = getDb();
  return db.select().from(serviceQuestions).where(and(eq(serviceQuestions.active, true), isNull(serviceQuestions.serviceId))).orderBy(asc(serviceQuestions.sortOrder));
}

export async function getPolicyBySlug(slug: string) {
  const db = getDb();
  const [policy] = await db.select().from(policies).where(and(eq(policies.slug, slug), eq(policies.publicVisible, true))).limit(1);
  if (!policy) notFound();
  return policy;
}
