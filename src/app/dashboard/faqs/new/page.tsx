import type { Metadata } from "next";
import { requireAuth } from "@/auth/session";
import { createFaq } from "@/faqs/actions";
import { FaqForm } from "../faq-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New FAQ — Dashboard",
};

export default async function NewFaqPage() {
  await requireAuth();
  return <FaqForm action={createFaq} />;
}
