import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../src/db/client";
import {
  bookingRules,
  businessSettings,
  communicationSettings,
  documentNumberSequences,
  faqs,
  mediaAssets,
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
      shortDescription: "Full\u2011body scan using gentle electromagnetic signals to detect imbalances such as toxins, deficiencies or inflammation",
      fullDescription:
        "A full\u2011body scan using Diacom technology to gently read electromagnetic frequencies from your organs and tissues. By comparing these frequencies to a healthy baseline we can identify imbalances such as bacteria, viruses, parasites or toxins, nutritional deficiencies, inflammation or organ stress, and even emotional or energetic disturbances.",
      priceCents: 65000,
      durationMinutes: 30,
      benefits: ["Uncover hidden root causes", "Understand your body\u2019s needs", "Make informed lifestyle choices"],
      whatToExpect: "You sit comfortably while the device performs a painless scan \u2013 no blood tests or needles. Afterwards we analyse your results to create a personalised report and recommendations.",
      preparation: "The scan itself takes about 30 minutes. We\u2019ll explain the findings in a follow\u2011up feedback session and discuss next steps such as supportive treatments or frequency therapy.",
      safetyInformation: "Clients undergoing chemotherapy, taking strong medications (e.g., antibiotics) or with pacemakers should postpone scanning because these factors can affect accuracy.",
      featured: true,
      sortOrder: 0,
    },
    {
      name: "Frequency Therapy",
      slug: "frequency-therapy",
      shortDescription: "Targeted frequencies to restore balance and support immune function after a scan reveals imbalances",
      fullDescription: "After a scan reveals where imbalances exist, we deliver gentle, corrective frequencies to those areas to restore balance and support healing.",
      priceCents: 50000,
      durationMinutes: 30,
      benefits: ["Strengthen immune response", "Reduce pain and inflammation", "Support detoxification", "Boost energy and mental clarity", "Encourage emotional balance"],
      whatToExpect: "During the session you\u2019re comfortably seated while the Diacom device delivers targeted frequencies to support your immune system and address problem areas such as inflammation, fatigue, stress or infections.",
      preparation: "Sessions are painless and relaxing \u2013 many people feel refreshed or even fall asleep. We customise frequencies based on your scan results.",
      safetyInformation: "Frequency therapy is a complementary wellness approach and not a medical treatment.",
      featured: true,
      sortOrder: 1,
    },
    {
      name: "Meridians",
      slug: "meridians",
      shortDescription: "Scan and stimulate meridian and lymph pathways to improve energy flow and detoxification",
      fullDescription:
        "A service focusing on your body\u2019s meridian and lymph pathways, the channels through which energy (Qi) flows. Blockages from stress, toxins or illness can cause fatigue, tension, weak immunity and other issues.",
      priceCents: 20000,
      durationMinutes: 20,
      benefits: ["Detoxify the lymph system", "Enhance energy and circulation", "Reduce swelling and fatigue", "Improve nutrient absorption", "Encourage emotional calm"],
      whatToExpect: "Using Diacom technology we scan for frequency imbalances in your meridians and lymphatic system. Then we apply targeted frequencies to stimulate circulation, encourage lymph drainage and restore energy flow.",
      preparation: "Quick, painless scan followed by a discussion of results and a targeted frequency treatment during the same visit.",
      safetyInformation: "This is a complementary wellness service and not a medical procedure.",
      featured: false,
      sortOrder: 2,
    },
    {
      name: "Food Tolerance and Nutrition Testing",
      slug: "food-tolerance-and-nutrition-testing",
      shortDescription: "Identify how your body reacts to foods and allergens and receive tailored dietary guidance",
      fullDescription:
        "A comprehensive package using Diacom technology to understand how your body responds to different foods and allergens. It includes three scans: a Food Tolerance Test, Allergen Test and Diet Test.",
      priceCents: 30000,
      durationMinutes: 20,
      benefits: ["Supports weight management", "Supports energy levels and digestion", "Helps reduce bloating, fatigue and food\u2011related discomfort"],
      whatToExpect: "The Food Tolerance Test detects foods that stress your system even if you don\u2019t feel obvious symptoms. The Allergen Test pinpoints food\u2011related or environmental allergens that could be causing skin issues, bloating, fatigue or sinus problems. The Diet Test provides personalised dietary recommendations based on your current health state.",
      preparation: "Non\u2011invasive, quick tests that give fast results. We\u2019ll share insights and recommend foods that best support your body\u2019s nutritional and metabolic needs.",
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

  // ── Editable Service Images ───────────────────────────────────
  const serviceImages = [
    {
      slug: "basic-health-scan",
      storageKey: "seed/services/basic-health-scan.png",
      publicUrl: "/images/services/basic-health-scan.png",
      altText: "Calm wellness assessment room with scanner equipment",
      mimeType: "image/png",
      byteSize: 1769234,
      width: 1672,
      height: 941,
    },
    {
      slug: "frequency-therapy",
      storageKey: "seed/services/frequency-therapy.png",
      publicUrl: "/images/services/frequency-therapy.png",
      altText: "Frequency therapy room with comfortable treatment chair",
      mimeType: "image/png",
      byteSize: 1902127,
      width: 1672,
      height: 941,
    },
    {
      slug: "meridians",
      storageKey: "seed/services/meridians.png",
      publicUrl: "/images/services/meridians.png",
      altText: "Meridian wellness support room with botanical details",
      mimeType: "image/png",
      byteSize: 2021816,
      width: 1672,
      height: 941,
    },
    {
      slug: "food-tolerance-and-nutrition-testing",
      storageKey: "seed/services/food-tolerance-and-nutrition-testing.png",
      publicUrl: "/images/services/food-tolerance-and-nutrition-testing.png",
      altText: "Nutrition testing consultation table with fresh whole foods",
      mimeType: "image/png",
      byteSize: 2083707,
      width: 1672,
      height: 941,
    },
  ];

  const existingMedia = await db.select({ id: mediaAssets.id, storageKey: mediaAssets.storageKey }).from(mediaAssets);
  const mediaByKey = new Map(existingMedia.map((asset) => [asset.storageKey, asset.id]));

  for (const image of serviceImages) {
    let mediaId = mediaByKey.get(image.storageKey);
    if (!mediaId) {
      const [asset] = await db
        .insert(mediaAssets)
        .values({
          storageKey: image.storageKey,
          publicUrl: image.publicUrl,
          altText: image.altText,
          mimeType: image.mimeType,
          byteSize: image.byteSize,
          width: image.width,
          height: image.height,
        })
        .returning({ id: mediaAssets.id });
      mediaId = asset.id;
      console.log(`Seeded media asset "${image.storageKey}"`);
    }

    await db
      .update(services)
      .set({ featuredImageId: mediaId, updatedAt: new Date() })
      .where(and(eq(services.slug, image.slug), isNull(services.featuredImageId)));
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
    {
      question: "Who should not be scanned?",
      answer: "Clients undergoing chemotherapy, taking strong medications (e.g., antibiotics) or with pacemakers should postpone scanning because these factors can affect accuracy. Please contact us if you are unsure.",
      sortOrder: 5,
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
