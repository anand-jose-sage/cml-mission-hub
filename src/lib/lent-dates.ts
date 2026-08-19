// Calendar math for "St. Michael's Lent" — a 40-day devotional programme
// (excluding Sundays), 2026. This is NOT the universal Ash-Wednesday-to-
// Easter Lent, and is no longer anchored to the Assumption/Archangels feast
// dates. Day 1 has been re-anchored twice now, each time to keep it in the
// future relative to the actual deploy: originally Aug 15, then Aug 18, and
// now Aug 19 — content ships the night before (Aug 18) so nobody visits
// before Day 1 exists and no backfill for skipped days is ever needed.
// Day-to-date mapping is a hardcoded lookup table (Day 1 + 39 more
// non-Sunday days) rather than a formula, matching this file's original
// convention — see git history for the previous tables.

export const LENT_YEAR = 2026;
export const LENT_TOTAL_DAYS = 40;

// [month, date] pairs, month 0-indexed (7 = August, 8 = September, 9 =
// October) matching Date's own convention. Index 0 = Day 1 = Aug 19, 2026.
const LENT_DAY_DATES: readonly [month: number, date: number][] = [
  [7, 19], [7, 20], [7, 21], [7, 22], [7, 24], [7, 25], [7, 26], [7, 27], [7, 28], [7, 29],
  [7, 31], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [8, 9], [8, 10],
  [8, 11], [8, 12], [8, 14], [8, 15], [8, 16], [8, 17], [8, 18], [8, 19], [8, 21], [8, 22],
  [8, 23], [8, 24], [8, 25], [8, 26], [8, 28], [8, 29], [8, 30], [9, 1], [9, 2], [9, 3],
];

const [LENT_START_MONTH, LENT_START_DATE] = LENT_DAY_DATES[0];
const [LENT_END_MONTH, LENT_END_DATE] = LENT_DAY_DATES[LENT_DAY_DATES.length - 1];
const LENT_START = new Date(LENT_YEAR, LENT_START_MONTH, LENT_START_DATE);
const LENT_END = new Date(LENT_YEAR, LENT_END_MONTH, LENT_END_DATE);

// Phase boundaries are fixed structure (not admin-editable — only each
// phase's labelEn/labelMl, stored in LentMeta.phases, are).
const LENT_PHASE_BOUNDS: { index: number; dayStart: number; dayEnd: number }[] = [
  { index: 1, dayStart: 1, dayEnd: 10 },
  { index: 2, dayStart: 11, dayEnd: 20 },
  { index: 3, dayStart: 21, dayEnd: 30 },
  { index: 4, dayStart: 31, dayEnd: 39 },
  { index: 5, dayStart: 40, dayEnd: 40 },
];

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// Returns the calendar date for a Lent day number (1-40). Throws outside range.
export function getDateForLentDay(day: number): Date {
  if (!Number.isInteger(day) || day < 1 || day > LENT_TOTAL_DAYS) {
    throw new RangeError(`Lent day must be an integer 1-${LENT_TOTAL_DAYS}, got ${day}`);
  }
  const [month, date] = LENT_DAY_DATES[day - 1];
  return new Date(LENT_YEAR, month, date);
}

// Returns the Lent day number (1-40) for a date, or null if the date falls
// outside Aug 19..Oct 3 2026, or is one of the days skipped in the source list.
export function getLentDayForDate(date: Date): number | null {
  const d = atMidnight(date);
  if (d.getFullYear() !== LENT_YEAR) return null;
  for (let i = 0; i < LENT_DAY_DATES.length; i++) {
    const [month, dt] = LENT_DAY_DATES[i];
    if (d.getMonth() === month && d.getDate() === dt) return i + 1;
  }
  return null;
}

// Which phase (1-5) a day number belongs to — range lookup against the
// fixed (unevenly-sized) phase bounds above.
export function getLentPhaseIndexForDay(day: number): number {
  const phase = LENT_PHASE_BOUNDS.find((p) => day >= p.dayStart && day <= p.dayEnd);
  return phase?.index ?? LENT_PHASE_BOUNDS[LENT_PHASE_BOUNDS.length - 1].index;
}

export type LentStatus =
  | { phase: "before"; daysUntilStart: number }
  | { phase: "day"; day: number }
  | { phase: "sunday"; mostRecentDay: number }
  | { phase: "after" };

// Single entry point the UI uses to decide what "today" looks like.
export function getLentStatus(date: Date): LentStatus {
  const day = getLentDayForDate(date);
  if (day !== null) return { phase: "day", day };
  const d = atMidnight(date);
  if (d < LENT_START) return { phase: "before", daysUntilStart: daysBetween(d, LENT_START) };
  if (d > LENT_END) return { phase: "after" };
  const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  return { phase: "sunday", mostRecentDay: getLentDayForDate(prev) ?? 0 };
}

// Sensible default day to show when entering the day screen without an
// explicit day already chosen.
export function defaultLentDay(status: LentStatus): number {
  switch (status.phase) {
    case "day": return status.day;
    case "sunday": return status.mostRecentDay || 1;
    case "before": return 1;
    case "after": return LENT_TOTAL_DAYS;
  }
}
