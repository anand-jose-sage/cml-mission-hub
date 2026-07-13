// Deterministic keyword/regex heuristics that turn a user question into a
// metadata pre-filter, per the retrieval strategy: infer filters first, then
// semantic-search within the filtered set (falling back to unfiltered search
// if the filter yields nothing).
//
// TODO: Malayalam keyword variants for organization_level/month/competition/
// document_type are not covered below — English keywords only for v1. A
// native speaker should supply the correct Malayalam term list, since guessing
// transliterations risks silently mismatching real documents.

export interface RagFilter {
  document_type?: string;
  year?: number;
  organization_level?: string;
  competition?: string;
  month?: string;
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const ORG_LEVEL_KEYWORDS: Record<string, string> = {
  state: "State",
  diocese: "Diocese",
  diocesan: "Diocese",
  meghala: "Meghala",
  shakha: "Shakha",
};

// Longer/more specific aliases must be checked before shorter ones they
// contain (e.g. "bible quiz" before bare "quiz").
const COMPETITION_ALIASES: [string, string][] = [
  ["bible quiz", "Bible Quiz"],
  ["margamkali", "Margamkali"],
  ["margam kali", "Margamkali"],
  ["group song", "Group Song"],
  ["pencil drawing", "Pencil Drawing"],
  ["mono act", "Mono Act"],
  ["speech", "Speech"],
  ["essay", "Essay"],
  ["poem", "Poem"],
  ["quiz", "Quiz"],
];

const DOCUMENT_TYPE_KEYWORDS: [string, string][] = [
  ["state circular", "state_circular"],
  ["diocese circular", "diocese_circular"],
  ["diocesan circular", "diocese_circular"],
  ["meghala circular", "meghala_circular"],
  ["circular", "state_circular"],
  ["shakha guideline", "shakha_guideline"],
  ["guideline", "shakha_guideline"],
  ["competition rule", "competition_rules"],
  ["quiz rule", "quiz_rules"],
  ["notification", "notification"],
  ["training manual", "training_manual"],
  ["training", "training_manual"],
  ["formation guide", "formation_guide"],
  ["formation", "formation_guide"],
  ["annual plan", "annual_plan"],
  ["annual calendar", "annual_plan"],
  ["activity calendar", "annual_plan"],
];

export function inferFilters(question: string): RagFilter {
  const q = question.toLowerCase();
  const filter: RagFilter = {};

  const yearMatch = q.match(/\b(20\d{2})\b/);
  if (yearMatch) filter.year = parseInt(yearMatch[1], 10);

  for (const month of MONTHS) {
    if (q.includes(month)) {
      filter.month = month[0].toUpperCase() + month.slice(1);
      break;
    }
  }

  for (const [keyword, level] of Object.entries(ORG_LEVEL_KEYWORDS)) {
    if (q.includes(keyword)) {
      filter.organization_level = level;
      break;
    }
  }

  for (const [alias, competition] of COMPETITION_ALIASES) {
    if (q.includes(alias)) {
      filter.competition = competition;
      break;
    }
  }

  for (const [keyword, documentType] of DOCUMENT_TYPE_KEYWORDS) {
    if (q.includes(keyword)) {
      filter.document_type = documentType;
      break;
    }
  }

  return filter;
}
