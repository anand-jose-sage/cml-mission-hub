// The "subject" line printed on each competition's judging/score sheet — the
// prompt/topic the participants worked on (e.g. the essay or poem topic).
//
// Edit `competition-subjects.json` to change the wording — no code changes and
// no DB column needed. Each competition maps to either a single string, or an
// object keyed by category slug with a required "default" fallback for any
// category not explicitly listed. Mirrors `scoresheet-headings` in shape.
import subjects from "./competition-subjects.json";
import type { CategorySlug } from "./competition-categories";

type CompetitionSubject = string | (Partial<Record<CategorySlug, string>> & { default: string });

const SUBJECTS = subjects as Record<string, CompetitionSubject>;

/** Look up the printed subject line for a competition + category. "" if none. */
export function getCompetitionSubject(compName: string, catSlug: string | null): string {
  const entry = SUBJECTS[compName];
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  const bySlug = catSlug ? entry[catSlug as CategorySlug] : undefined;
  return bySlug ?? entry.default ?? "";
}
