export function normalizeEmail(email: string | null | undefined) {
  const value = email?.trim().toLowerCase();
  return value || null;
}

export function normalizePhone(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits || null;
}
