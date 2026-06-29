const refusedTopics = ["diagnose", "diagnosis", "cure", "treatment", "prescription", "stop medication", "medical advice"];

export function getChatbotSafetyReply(message: string) {
  const normalized = message.toLowerCase();
  const unsafe = refusedTopics.some((topic) => normalized.includes(topic));

  if (!unsafe) return null;

  return "I can help with services, prices and booking requests, but I cannot diagnose, give medical advice, recommend stopping medication or promise treatment outcomes. Please contact a qualified medical professional for medical concerns.";
}

export function approvedBookingSummary(reference: string, status: string) {
  const review = status === "requires_review" ? " It has been marked for staff review before follow-up." : " Staff will contact you to confirm availability.";
  return `Your booking request was received. Reference: ${reference}.${review}`;
}
