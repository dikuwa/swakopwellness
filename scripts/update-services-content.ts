import { getDb } from "../src/db/client";
import { services } from "../src/db/schema";
import { eq } from "drizzle-orm";

const updatedServices = [
  {
    slug: "basic-health-scan",
    shortDescription:
      "Full‑body scan using gentle electromagnetic signals to detect imbalances such as toxins, deficiencies or inflammation",
    fullDescription:
      "A full‑body scan using Diacom technology to gently read electromagnetic frequencies from your organs and tissues. By comparing these frequencies to a healthy baseline we can identify imbalances such as bacteria, viruses, parasites or toxins, nutritional deficiencies, inflammation or organ stress, and even emotional or energetic disturbances.",
    benefits: [
      "Uncover hidden root causes",
      "Understand your body\u2019s needs",
      "Make informed lifestyle choices",
    ],
    whatToExpect:
      "You sit comfortably while the device performs a painless scan \u2013 no blood tests or needles. Afterwards we analyse your results to create a personalised report and recommendations.",
    preparation:
      "The scan itself takes about 30 minutes. We\u2019ll explain the findings in a follow\u2011up feedback session and discuss next steps such as supportive treatments or frequency therapy.",
    safetyInformation:
      "Clients undergoing chemotherapy, taking strong medications (e.g., antibiotics) or with pacemakers should postpone scanning because these factors can affect accuracy.",
  },
  {
    slug: "frequency-therapy",
    shortDescription:
      "Targeted frequencies to restore balance and support immune function after a scan reveals imbalances",
    fullDescription:
      "After a scan reveals where imbalances exist, we deliver gentle, corrective frequencies to those areas to restore balance and support healing.",
    benefits: [
      "Strengthen immune response",
      "Reduce pain and inflammation",
      "Support detoxification",
      "Boost energy and mental clarity",
      "Encourage emotional balance",
    ],
    whatToExpect:
      "During the session you\u2019re comfortably seated while the Diacom device delivers targeted frequencies to support your immune system and address problem areas such as inflammation, fatigue, stress or infections.",
    preparation:
      "Sessions are painless and relaxing \u2013 many people feel refreshed or even fall asleep. We customise frequencies based on your scan results.",
  },
  {
    slug: "meridians",
    shortDescription:
      "Scan and stimulate meridian and lymph pathways to improve energy flow and detoxification",
    fullDescription:
      "A service focusing on your body\u2019s meridian and lymph pathways, the channels through which energy (Qi) flows. Blockages from stress, toxins or illness can cause fatigue, tension, weak immunity and other issues.",
    benefits: [
      "Detoxify the lymph system",
      "Enhance energy and circulation",
      "Reduce swelling and fatigue",
      "Improve nutrient absorption",
      "Encourage emotional calm",
    ],
    whatToExpect:
      "Using Diacom technology we scan for frequency imbalances in your meridians and lymphatic system. Then we apply targeted frequencies to stimulate circulation, encourage lymph drainage and restore energy flow.",
    preparation:
      "Quick, painless scan followed by a discussion of results and a targeted frequency treatment during the same visit.",
  },
  {
    slug: "food-tolerance-and-nutrition-testing",
    shortDescription:
      "Identify how your body reacts to foods and allergens and receive tailored dietary guidance",
    fullDescription:
      "A comprehensive package using Diacom technology to understand how your body responds to different foods and allergens. It includes three scans: a Food Tolerance Test, Allergen Test and Diet Test.",
    benefits: [
      "Supports weight management",
      "Supports energy levels and digestion",
      "Helps reduce bloating, fatigue and food\u2011related discomfort",
    ],
    whatToExpect:
      "The Food Tolerance Test detects foods that stress your system even if you don\u2019t feel obvious symptoms. The Allergen Test pinpoints food\u2011related or environmental allergens that could be causing skin issues, bloating, fatigue or sinus problems. The Diet Test provides personalised dietary recommendations based on your current health state.",
    preparation:
      "Non\u2011invasive, quick tests that give fast results. We\u2019ll share insights and recommend foods that best support your body\u2019s nutritional and metabolic needs.",
  },
];

async function main() {
  const db = getDb();

  for (const svc of updatedServices) {
    const { slug, ...data } = svc;
    await db.update(services).set(data).where(eq(services.slug, slug));
    console.log(`Updated service "${slug}"`);
  }

  console.log("\nUpdate complete.");
}

main().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
