function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatServiceTitle(name: string | null | undefined, slug?: string | null) {
  const value = name?.trim() || slug?.trim() || "";
  if (!value) return "Service";

  const looksLikeSlug = /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(value);
  return looksLikeSlug ? titleCase(value) : value;
}
