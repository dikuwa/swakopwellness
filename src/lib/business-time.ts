export const BUSINESS_TIME_ZONE = "Africa/Windhoek";

function timeZoneOffsetMs(date: Date, timeZone = BUSINESS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return asUtc - date.getTime();
}

export function parseBusinessDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const localAsUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  let offset = timeZoneOffsetMs(localAsUtc);
  let utc = new Date(localAsUtc.getTime() - offset);
  offset = timeZoneOffsetMs(utc);
  utc = new Date(localAsUtc.getTime() - offset);

  const roundTrip = toBusinessDateValue(utc) === date && toBusinessTimeValue(utc) === time;
  return roundTrip ? utc : null;
}

export function businessStartOfDay(date: string) {
  return parseBusinessDateTime(date, "00:00");
}

export function businessEndOfDay(date: string) {
  const start = businessStartOfDay(date);
  return start ? new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1) : null;
}

export function toBusinessDateValue(date: Date | null | undefined) {
  if (!date) return undefined;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function toBusinessTimeValue(date: Date | null | undefined) {
  if (!date) return undefined;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("hour")}:${value("minute")}`;
}

export function formatBusinessDate(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return date.toLocaleDateString("en-GB", { timeZone: BUSINESS_TIME_ZONE, ...options });
}

export function formatBusinessTime(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return date.toLocaleTimeString("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

export function formatBusinessDateTime(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  const defaults = options.dateStyle || options.timeStyle
    ? {}
    : { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" } satisfies Intl.DateTimeFormatOptions;
  return date.toLocaleString("en-GB", { timeZone: BUSINESS_TIME_ZONE, ...defaults, ...options });
}
