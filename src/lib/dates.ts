import { addDays, format, parseISO, startOfDay } from "date-fns";

/** Local calendar date as YYYY-MM-DD */
export function toDateKey(date: Date = new Date()): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

/** Format an instant as a calendar date in an IANA timezone. */
export function toDateKeyInTimezone(date: Date, timezone: string): string {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
  }

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function addDaysToKey(dateKey: string, days: number): string {
  const base = parseISO(`${dateKey}T12:00:00`);
  return toDateKey(addDays(base, days));
}

export function parseDateKey(dateKey: string): Date {
  return parseISO(`${dateKey}T12:00:00`);
}

export function isBeforeDateKey(a: string, b: string): boolean {
  return a < b;
}

export type RevisionPreset =
  | "1h"
  | "3h"
  | "tomorrow"
  | "3d"
  | "7d"
  | "15d"
  | "custom";

const REVISION_OFFSETS: Record<Exclude<RevisionPreset, "custom">, number> = {
  "1h": 0,
  "3h": 0,
  tomorrow: 1,
  "3d": 3,
  "7d": 7,
  "15d": 15,
};

export function resolveRevisionDateKey(
  preset: RevisionPreset,
  fromDateKey: string,
  customDateKey?: string
): string {
  if (preset === "custom") {
    if (!customDateKey) {
      throw new Error("customRevisionDate required for custom preset");
    }
    return customDateKey;
  }
  return addDaysToKey(fromDateKey, REVISION_OFFSETS[preset]);
}
