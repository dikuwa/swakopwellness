import { requireAuth } from "@/auth/session";
import { createFaq } from "@/faqs/actions";
import { FaqForm } from "../faq-form";

export const dynamic = "force-dynamic";

export default async function NewFaqPage() {
  await requireAuth();
  return <FaqForm action={createFaq} />;
}
