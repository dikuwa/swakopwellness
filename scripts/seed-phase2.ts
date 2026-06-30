import { getDb } from "../src/db/client";
import {
  bookingRules,
  businessSettings,
  communicationSettings,
  documentNumberSequences,
  faqs,
  policies,
  serviceCategories,
  serviceQuestions,
  services,
} from "../src/db/schema";

async function main() {
  const db = getDb();

  // ── Business Settings ──────────────────────────────────────────
  const [existingBusiness] = await db.select().from(businessSettings).limit(1);
  if (!existingBusiness) {
    await db.insert(businessSettings).values({
      businessName: "Swakop Wellness Centre",
      address: "Shop 11, Wasserfall Street, Swakopmund, Namibia",
      telephone: "+264 64 463 200",
      email: "swakopwellnesscentre@gmail.com",
      operatingHours: "08:00–17:00",
      appointmentModel: "By appointment only",
      currencyCode: "NAD",
      currencySymbol: "N$",
      medicalDisclaimer:
        "These are complementary wellness services and are not a replacement for conventional medical diagnosis or treatment. Always consult a qualified medical professional for health concerns.",
      documentDetails: {},
    });
    console.log("Seeded business settings");
  } else {
    console.log("Business settings already exist, skipping");
  }

  // ── Communication Settings ─────────────────────────────────────
  const [existingComm] = await db.select().from(communicationSettings).limit(1);
  if (!existingComm) {
    await db.insert(communicationSettings).values({
      enableCalls: true,
      mainPhone: "+264 64 463 200",
      enableEmailContact: true,
      businessEmail: "swakopwellnesscentre@gmail.com",
      bookingNotificationEmail: "swakopwellnesscentre@gmail.com",
      acknowledgementEmail: "swakopwellnesscentre@gmail.com",
      replyToEmail: "swakopwellnesscentre@gmail.com",
      enableWhatsapp: false,
    });
    console.log("Seeded communication settings");
  } else {
    console.log("Communication settings already exist, skipping");
  }

  // ── Booking Rules ──────────────────────────────────────────────
  const [existingRules] = await db.select().from(bookingRules).limit(1);
  if (!existingRules) {
    await db.insert(bookingRules).values({
      openingTime: "08:00",
      closingTime: "17:00",
      timezone: "Africa/Windhoek",
      requestMode: "manual_confirmation",
      duplicateWindowMinutes: 30,
    });
    console.log("Seeded booking rules");
  } else {
    console.log("Booking rules already exist, skipping");
  }

  // ── Service Categories ─────────────────────────────────────────
  const [existingCat] = await db.select().from(serviceCategories).limit(1);
  let categoryId: string | undefined;
  if (!existingCat) {
    const [cat] = await db
      .insert(serviceCategories)
      .values({ name: "Wellness Assessments", slug: "wellness-assessments", description: "Holistic wellness evaluation and support services", sortOrder: 0 })
      .returning({ id: serviceCategories.id });
    categoryId = cat.id;
    console.log("Seeded service category");
  } else {
    categoryId = existingCat.id;
    console.log("Service category already exists, skipping");
  }

  // ── Services ───────────────────────────────────────────────────
  const defaultServices = [
    {
      name: "Basic Health Scan",
      slug: "basic-health-scan",
      shortDescription: "Non-invasive full-body wellness assessment",
      fullDescription:
        "A comprehensive, non-invasive full-body wellness assessment using advanced Diacom technology. May include scan, analysis, wellness report, and follow-up discussion.",
      priceCents: 65000,
      durationMinutes: 30,
      benefits: ["Full-body wellness assessment", "Detailed wellness report", "Follow-up discussion"],
      whatToExpect: "A painless, non-invasive scan followed by a review of your wellness report.",
      preparation: "Stay hydrated and avoid heavy meals 2 hours before your appointment.",
      safetyInformation: "This is a non-invasive wellness assessment. It is not a diagnostic medical device.",
      featured: true,
      sortOrder: 0,
    },
    {
      name: "Frequency Therapy",
      slug: "frequency-therapy",
      shortDescription: "Frequency-based wellness support tailored to assessment results",
      fullDescription: "Personalised frequency-based wellness support sessions tailored to your individual assessment results.",
      priceCents: 50000,
      durationMinutes: 30,
      benefits: ["Personalised frequency support", "Targeted wellness approach"],
      whatToExpect: "A relaxing session where frequencies are applied based on your wellness needs.",
      safetyInformation: "Frequency therapy is a complementary wellness approach and not a medical treatment.",
      featured: true,
      sortOrder: 1,
    },
    {
      name: "Meridians",
      slug: "meridians",
      shortDescription: "Wellness service focused on meridian pathways and lymphatic support",
      fullDescription: "A wellness service focused on supporting your body\u2019s meridian pathways and lymphatic system.",
      priceCents: 20000,
      durationMinutes: 20,
      benefits: ["Meridian pathway support", "Lymphatic system support"],
      whatToExpect: "Gentle non-invasive support for your body\u2019s energy pathways.",
      safetyInformation: "This is a complementary wellness service and not a medical procedure.",
      featured: false,
      sortOrder: 2,
    },
    {
      name: "Food Tolerance and Nutrition Testing",
      slug: "food-tolerance-and-nutrition-testing",
      shortDescription: "Identify food sensitivities and receive diet-related wellness recommendations",
      fullDescription:
        "Food tolerance testing, allergen-related wellness testing, and personalised diet-related wellness recommendations.",
      priceCents: 30000,
      durationMinutes: 20,
      benefits: ["Food tolerance insights", "Allergen-related wellness testing", "Dietary recommendations"],
      whatToExpect: "A non-invasive assessment of your body\u2019s responses to various foods.",
      preparation: "No special preparation needed. Continue your normal diet.",
      safetyInformation: "Results are for wellness guidance purposes and not a medical diagnosis.",
      featured: false,
      sortOrder: 3,
    },
  ];

  const existingServices = await db.select({ slug: services.slug }).from(services);
  const existingSlugs = new Set(existingServices.map((s) => s.slug));

  for (const svc of defaultServices) {
    if (existingSlugs.has(svc.slug)) {
      console.log(`Service "${svc.name}" already exists, skipping`);
      continue;
    }
    await db.insert(services).values({ ...svc, categoryId: categoryId ?? null } as typeof svc & { categoryId: string | null });
    console.log(`Seeded service "${svc.name}"`);
  }

  // ── Suitability Questions ──────────────────────────────────────
  const defaultQuestions = [
    { question: "Are you currently undergoing chemotherapy?", flaggedAnswer: "yes", sortOrder: 0 },
    { question: "Are you currently taking strong medication such as antibiotics?", flaggedAnswer: "yes", sortOrder: 1 },
    { question: "Do you have a pacemaker or another implanted electronic medical device?", flaggedAnswer: "yes", sortOrder: 2 },
  ];

  const existingQuestions = await db.select({ question: serviceQuestions.question }).from(serviceQuestions);
  const existingQSet = new Set(existingQuestions.map((q) => q.question));

  for (const q of defaultQuestions) {
    if (existingQSet.has(q.question)) {
      console.log(`Question "${q.question}" already exists, skipping`);
      continue;
    }
    await db.insert(serviceQuestions).values(q);
    console.log(`Seeded question "${q.question}"`);
  }

  // ── FAQs ───────────────────────────────────────────────────────
  const defaultFaqs = [
    {
      question: "What should I expect during my first visit?",
      answer:
        "You will be welcomed at our centre and asked to complete a brief intake form. Your practitioner will then explain the assessment process before beginning the non-invasive scan.",
      sortOrder: 0,
    },
    {
      question: "Are your services covered by medical aid?",
      answer:
        "Swakop Wellness Centre operates on a direct fee basis. We recommend checking with your medical aid provider regarding wellness benefit coverage.",
      sortOrder: 1,
    },
    {
      question: "How long does a typical appointment take?",
      answer: "Appointments typically range from 20 to 30 minutes, depending on the service selected.",
      sortOrder: 2,
    },
    {
      question: "Do I need a referral?",
      answer: "No referral is needed. You are welcome to book directly.",
      sortOrder: 3,
    },
    {
      question: "Is the assessment painful?",
      answer: "The assessment is completely non-invasive and painless.",
      sortOrder: 4,
    },
  ];

  const existingFaqs = await db.select({ question: faqs.question }).from(faqs);
  const existingFaqSet = new Set(existingFaqs.map((f) => f.question));

  for (const f of defaultFaqs) {
    if (existingFaqSet.has(f.question)) {
      console.log(`FAQ "${f.question}" already exists, skipping`);
      continue;
    }
    await db.insert(faqs).values(f);
    console.log(`Seeded FAQ "${f.question}"`);
  }

  // ── Policies ───────────────────────────────────────────────────
  const defaultPolicies = [
    {
      title: "Privacy Policy",
      slug: "privacy-policy",
      body: "Your privacy is important to us. We collect and use personal information solely for the purpose of providing our wellness services. We do not share your information with third parties without your explicit consent, except where required by law. You have the right to request access to, correction of, or deletion of your personal data held by us.",
    },
    {
      title: "Cancellation Policy",
      slug: "cancellation-policy",
      body: "We kindly request at least 24 hours notice for cancellations or rescheduling. Late cancellations may result in a cancellation fee. Please contact us directly to cancel or reschedule your appointment.",
    },
    {
      title: "Terms of Service",
      slug: "terms-of-service",
      body: "Our wellness services are complementary and non-diagnostic. They are not a replacement for conventional medical care. By booking an appointment, you acknowledge that you understand the nature of our services and agree to our terms.",
    },
  ];

  const existingPolicies = await db.select({ slug: policies.slug }).from(policies);
  const existingPolicySlugs = new Set(existingPolicies.map((p) => p.slug));

  for (const p of defaultPolicies) {
    if (existingPolicySlugs.has(p.slug)) {
      console.log(`Policy "${p.title}" already exists, skipping`);
      continue;
    }
    await db.insert(policies).values(p);
    console.log(`Seeded policy "${p.title}"`);
  }

  // ── Document Number Sequences ──────────────────────────────────
  const docSequences = [
    { documentType: "invoice" as const, prefix: "SWC-INV-", nextNumber: 1, padding: 5 },
    { documentType: "receipt" as const, prefix: "SWC-REC-", nextNumber: 1, padding: 5 },
    { documentType: "quotation" as const, prefix: "SWC-QUO-", nextNumber: 1, padding: 5 },
  ];

  const existingDocs = await db.select({ type: documentNumberSequences.documentType }).from(documentNumberSequences);
  const existingDocTypes = new Set(existingDocs.map((d) => d.type));

  for (const seq of docSequences) {
    if (existingDocTypes.has(seq.documentType)) {
      console.log(`Document sequence "${seq.documentType}" already exists, skipping`);
      continue;
    }
    await db.insert(documentNumberSequences).values(seq);
    console.log(`Seeded document sequence "${seq.documentType}"`);
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
