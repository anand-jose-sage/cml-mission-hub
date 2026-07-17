// Score-sheet column headings, per competition (and, for competitions whose
// judging criteria vary by age group, per competition_category slug).
//
// Edit `scoresheet-headings.json` to change the wording — no code changes
// needed. Each competition maps to either a flat 4-heading array, or an
// object keyed by category slug with a required "default" fallback for any
// category not explicitly listed.
import scoreHeadings from "./scoresheet-headings.json";
import type { CategorySlug } from "./competition-categories";

type HeadingSet = string[];
type CompetitionHeadings = HeadingSet | (Partial<Record<CategorySlug, HeadingSet>> & { default: HeadingSet });

const HEADINGS = scoreHeadings as Record<string, CompetitionHeadings>;

const EMPTY: HeadingSet = ["", "", "", ""];

/** Look up the 4 score-sheet column headings for a competition + category. */
export function getScoreHeadings(compName: string, catSlug: string | null): HeadingSet {
  const entry = HEADINGS[compName];
  if (!entry) return EMPTY;
  if (Array.isArray(entry)) return entry;
  const bySlug = catSlug ? entry[catSlug as CategorySlug] : undefined;
  return bySlug ?? entry.default ?? EMPTY;
}
