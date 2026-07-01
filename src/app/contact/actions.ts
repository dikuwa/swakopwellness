"use server";

import { sendNotificationEmail } from "@/email/send";
import { getCommunicationSettings } from "@/public/data";

export type ContactFormState = {
  ok: boolean;
  message: string;
};

export async function submitContactMessage(_state: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!fullName || !email || !subject || !message) {
    return { ok: false, message: "Please complete all contact form fields." };
  }

  const communication = await getCommunicationSettings();
  const to = communication.bookingNotificationEmail || communication.businessEmail;
  const html = `
<h1 style="margin:0 0 16px;font-size:22px">Website contact message</h1>
<p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
<p style="white-space:pre-wrap">${escapeHtml(message)}</p>
`.trim();

  const result = await sendNotificationEmail(to, `Website contact: ${subject}`, html);
  if (!result.ok) {
    return { ok: false, message: result.error ?? "Message could not be sent. Please try again or call the centre." };
  }

  return { ok: true, message: "Message sent. We will get back to you soon." };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
