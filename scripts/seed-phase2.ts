import { eq } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { bookingRules, businessSettings, communicationSettings, faqs, policies, serviceCategories, serviceQuestions, services } from "../src/db/schema";

async function main() {
  const db = getDb();

  await db.transaction(async (tx) => {
    const [existingBusiness] = await tx.select({ id: businessSettings.id }).from(businessSettings).limit(1);
    if (!existingBusiness) {
      await tx.insert(businessSettings).values({
        businessName: "Swakop Wellness Centre",
        address: "Shop 11, Wasserfall Street, Swakopmund, Namibia",
        telephone: "+264 64 463 200",
        email: "swakopwellnesscentre@gmail.com",
        operatingHours: "08:00-17:00",
        appointmentModel: "By appointment only",
        medicalDisclaimer: "Swakop Wellness Centre provides complementary wellness services. These services are not a replacement for conventional medical diagnosis or treatment.",
      });
    }

    const [existingCommunication] = await tx.select({ id: communicationSettings.id }).from(communicationSettings).limit(1);
    if (!existingCommunication) {
      await tx.insert(communicationSettings).values({
        enableCalls: true,
        mainPhone: "+264 64 463 200",
        enableEmailContact: true,
        businessEmail: "swakopwellnesscentre@gmail.com",
        bookingNotificationEmail: "swakopwellnesscentre@gmail.com",
        acknowledgementEmail: "swakopwellnesscentre@gmail.com",
        replyToEmail: "swakopwellnesscentre@gmail.com",
        enableWhatsapp: false,
      });
    }

    const [existingRules] = await tx.select({ id: bookingRules.id }).from(bookingRules).limit(1);
    if (!existingRules) {
      await tx.insert(bookingRules).values({});
    }

    const [wellnessCategory] = await tx
      .insert(serviceCategories)
      .values({ name: "Wellness Assessments", slug: "wellness-assessments", description: "Non-invasive wellness assessment and support services.", sortOrder: 1 })
      .onConflictDoUpdate({ target: serviceCategories.slug, set: { active: true } })
      .returning({ id: serviceCategories.id });

    const seedServices = [
      {
        name: "Basic Health Scan",
        slug: "basic-health-scan",
        shortDescription: "Non-invasive full-body wellness assessment.",
        fullDescription: "A non-invasive wellness assessment that may include scan, analysis, wellness report and follow-up discussion.",
        priceCents: 65000,
        durationMinutes: 30,
        sortOrder: 1,
        featured: true,
      },
      {
        name: "Frequency Therapy",
        slug: "frequency-therapy",
        shortDescription: "Frequency-based wellness support tailored to assessment results.",
        fullDescription: "Complementary frequency-based wellness support tailored to assessment results and client context.",
        priceCents: 50000,
        durationMinutes: null,
        sortOrder: 2,
        featured: true,
      },
      {
        name: "Meridians",
        slug: "meridians",
        shortDescription: "Wellness support focused on meridian pathways and lymphatic support.",
        fullDescription: "A wellness service focused on meridian pathways and lymphatic support.",
        priceCents: 20000,
        durationMinutes: null,
        sortOrder: 3,
        featured: false,
      },
      {
        name: "Food Tolerance and Nutrition Testing",
        slug: "food-tolerance-and-nutrition-testing",
        shortDescription: "Food tolerance and diet-related wellness testing.",
        fullDescription: "May include food tolerance testing, allergen-related wellness testing and diet-related wellness recommendations.",
        priceCents: 30000,
        durationMinutes: null,
        sortOrder: 4,
        featured: false,
      },
    ];

    for (const service of seedServices) {
      await tx
        .insert(services)
        .values({ ...service, categoryId: wellnessCategory.id, benefits: [] })
        .onConflictDoUpdate({ target: services.slug, set: { priceCents: service.priceCents, active: true, publicVisible: true } });
    }

    const safetyQuestions = [
      "Are you currently undergoing chemotherapy?",
      "Are you currently taking strong medication such as antibiotics?",
      "Do you have a pacemaker or another implanted electronic medical device?",
    ];

    for (const [index, question] of safetyQuestions.entries()) {
      const existing = await tx.select({ id: serviceQuestions.id }).from(serviceQuestions).where(eq(serviceQuestions.question, question)).limit(1);
      if (existing.length === 0) {
        await tx.insert(serviceQuestions).values({ question, sortOrder: index + 1 });
      }
    }

    const existingFaq = await tx.select({ id: faqs.id }).from(faqs).limit(1);
    if (existingFaq.length === 0) {
      await tx.insert(faqs).values({
        question: "Are these services a replacement for medical diagnosis?",
        answer: "No. These are complementary wellness services and are not a replacement for conventional medical diagnosis or treatment.",
        sortOrder: 1,
      });
    }

    await tx
      .insert(policies)
      .values({
        title: "Wellness Disclaimer",
        slug: "wellness-disclaimer",
        body: "This wording is seeded for owner review and must be approved before launch.",
      })
      .onConflictDoUpdate({ target: policies.slug, set: { publicVisible: true } });
  });

  console.log("Phase 2 seed data applied.");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
