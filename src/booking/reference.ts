const referencePrefix = "SWC-BKG";

export function createBookingReference(date = new Date(), randomValue = Math.random()) {
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.floor(randomValue * 36 ** 4).toString(36).padStart(4, "0").toUpperCase();
  return `${referencePrefix}-${day}-${suffix}`;
}
