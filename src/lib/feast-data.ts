export interface FeastCompetition {
  id: string;
  name: string;
  cat: "Individual" | "Team";
  time: string;
  venue: string;
  filled: number;
  cap: number;
  icon: string;
  gender?: string | null;
  competitionCategorySlug?: string | null;
  stage?: string | null;
  scheduledTime?: string | null;
  compStatus?: "upcoming" | "progressing" | "completed" | "published" | null;
  progressPct?: number | null;
  info?: string | null;
  maxPerShakha?: number;
  maxTeamSize?: number;
}

export interface Feast {
  slug: string;
  name: string;
  year: string;
  icon: string;
  tint: [string, string];
  accent: string;
  status: string;
  date: string;
  venue: string;
  registrations: number;  // participant count
  eventCount?: number;    // feast_competition count (loaded separately in useFeasts)
  daysLeft: number;
  blurb: string;
  competitions: FeastCompetition[];
}

export interface House {
  name: string;
  color: string;
  points: number;
}

export const FEASTS: Record<string, Feast> = {
  "literature-feast-2026": {
    slug: "literature-feast-2026",
    name: "Literature Feast",
    year: "2026",
    icon: "PenTool",
    tint: ["#6B46FF", "#A855F7"],
    accent: "#A855F7",
    status: "Registration Open",
    date: "Feb 14–16, 2026",
    venue: "St. Theresa's Campus",
    registrations: 312,
    daysLeft: 9,
    blurb: "A celebration of words — writing, speech and the joy of language across every unit of the Meghala.",
    competitions: [
      { id: "essay", name: "Essay Writing", cat: "Individual", time: "9:30 AM", venue: "Hall A", filled: 48, cap: 60, icon: "FileText" },
      { id: "poetry", name: "Poetry Writing", cat: "Individual", time: "10:30 AM", venue: "Hall A", filled: 31, cap: 40, icon: "PenTool" },
      { id: "story", name: "Story Writing", cat: "Individual", time: "11:30 AM", venue: "Hall B", filled: 22, cap: 40, icon: "BookOpen" },
      { id: "elocution", name: "Elocution", cat: "Individual", time: "1:30 PM", venue: "Auditorium", filled: 19, cap: 30, icon: "Mic" },
      { id: "recitation", name: "Recitation", cat: "Individual", time: "2:30 PM", venue: "Auditorium", filled: 27, cap: 30, icon: "Mic" },
      { id: "debate", name: "Debate", cat: "Team", time: "3:30 PM", venue: "Hall A", filled: 8, cap: 12, icon: "Users" },
      { id: "quiz", name: "Bible & Literature Quiz", cat: "Team", time: "4:30 PM", venue: "Auditorium", filled: 10, cap: 16, icon: "Sparkles" },
    ],
  },
  "arts-feast-2026": {
    slug: "arts-feast-2026",
    name: "Arts Feast",
    year: "2026",
    icon: "Palette",
    tint: ["#A855F7", "#EC4899"],
    accent: "#EC4899",
    status: "Registration Open",
    date: "Mar 7–9, 2026",
    venue: "Parish Community Centre",
    registrations: 268,
    daysLeft: 30,
    blurb: "Colour, rhythm and stage — visual art, music and live performance for every shakha.",
    competitions: [
      { id: "drawing", name: "Pencil Drawing", cat: "Individual", time: "9:30 AM", venue: "Studio 1", filled: 40, cap: 50, icon: "Image" },
      { id: "painting", name: "Water Colour", cat: "Individual", time: "10:30 AM", venue: "Studio 1", filled: 33, cap: 50, icon: "Image" },
      { id: "solosong", name: "Solo Song", cat: "Individual", time: "11:30 AM", venue: "Main Stage", filled: 29, cap: 40, icon: "Mic" },
      { id: "groupsong", name: "Group Song", cat: "Team", time: "1:30 PM", venue: "Main Stage", filled: 9, cap: 14, icon: "Users" },
      { id: "classical", name: "Classical Dance", cat: "Individual", time: "2:30 PM", venue: "Main Stage", filled: 17, cap: 24, icon: "Sparkles" },
      { id: "skit", name: "Skit", cat: "Team", time: "3:30 PM", venue: "Main Stage", filled: 6, cap: 10, icon: "Film" },
      { id: "mime", name: "Mime", cat: "Team", time: "4:30 PM", venue: "Studio 2", filled: 7, cap: 10, icon: "Film" },
    ],
  },
};

// Each shakha is a "house" — a distinct dark shade so its name/dot/pill reads
// strongly on light backgrounds. 14 hand-picked, visually distinct dark hues.
export const SHAKHA_COLOR_MAP: Record<string, string> = {
  Charity:      "#6D28D9", // violet
  Chooralmala:  "#0F766E", // teal
  Edapetti:     "#B45309", // amber
  Kalathuvayal: "#BE185D", // rose
  Kalpetta:     "#1D4ED8", // blue
  Kolavayal:    "#0E7490", // cyan
  Lakkidi:      "#15803D", // green
  Nedumbala:    "#B91C1C", // red
  Olivumala:    "#4D7C0F", // lime
  Puzhamudi:    "#4338CA", // indigo
  Rippon:       "#C2410C", // orange
  Theneri:      "#A21CAF", // fuchsia
  Thrikkaipetta:"#92400E", // brown
  Vazhavatta:   "#475569", // slate
  Vythiri:      "#0369A1", // sky
};

// Real shakha names — replaces the old placeholder houses
export const SHAKHAS: House[] = [
  { name: "Charity",       color: SHAKHA_COLOR_MAP.Charity,      points: 428 },
  { name: "Edapetti",      color: SHAKHA_COLOR_MAP.Edapetti,     points: 391 },
  { name: "Kalathuvayal",  color: SHAKHA_COLOR_MAP.Kalathuvayal, points: 357 },
  { name: "Kolavayal",     color: SHAKHA_COLOR_MAP.Kolavayal,    points: 312 },
];

// Backward-compat alias
export const HOUSES = SHAKHAS;

export const HOUSE_NAMES = SHAKHAS.map((h) => h.name);

const NAMES = [
  "Ann Maria Joy", "Alan Thomas", "Sneha Raju", "Joel Mathew", "Rita Sebastian",
  "Nikhil Varghese", "Diya Antony", "Rohan Pius", "Maria Jose", "Aaron Biju",
  "Catherine Roy", "Ebin Kurian", "Anjana Dev", "Tom Cherian", "Liya Francis", "Jerin Paul",
];

const PREFIX: Record<string, string> = {
  // Real DB slugs (confirmed in production) — keep both these and the
  // originally-guessed hyphenated variants so neither shape breaks.
  "literature_2026": "LF26",
  "literature-feast-2026": "LF26",
  "arts_fest_2026": "AF26",
  "arts-feast-2026": "AF26",
};

// registration_number is UNIQUE across the whole `participants` table (not
// scoped per feast), so every feast needs a prefix that no other feast can
// ever produce. A shared constant fallback ("REG") is what caused two
// feasts' independently-numbered counters (both starting at 1111) to
// collide once their ranges overlapped. For any slug not in the map above,
// derive the prefix from the feast's own UUID — collision-proof by
// construction, no manual map maintenance needed for future feasts.
export function getRegPrefix(slug: string, feastId?: string) {
  if (PREFIX[slug]) return PREFIX[slug];
  if (feastId) return `F${feastId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
  return "REG";
}

export function resultsFor(compId: string) {
  let seed = 0;
  for (const c of compId) seed = (seed * 31 + c.charCodeAt(0)) % 9973;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pool = [...NAMES];
  const rows: { name: string; shakha: string; grade: string; pts: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const name = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    rows.push({
      name,
      shakha: HOUSE_NAMES[Math.floor(rnd() * HOUSE_NAMES.length)],
      grade: i === 0 ? "A+" : i < 3 ? "A" : "B+",
      pts: [10, 8, 6, 4, 3, 2][i],
    });
  }
  return rows;
}

export function buildParticipants(slug: string) {
  let seed = slug.length * 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const feast = FEASTS[slug];
  const pool = [...NAMES];
  const out: { regNo: string; name: string; shakha: string; comps: string[] }[] = [];
  for (let i = 0; i < 8; i++) {
    const name = pool.splice(Math.floor(rnd() * pool.length), 1)[0] || `Member ${i}`;
    const nComp = 1 + Math.floor(rnd() * 3);
    const comps = [...feast.competitions]
      .sort(() => rnd() - 0.5)
      .slice(0, nComp)
      .map((c) => c.name);
    out.push({
      regNo: `${PREFIX[slug]}-0${200 + ((i * 37) % 700)}`,
      name,
      shakha: HOUSE_NAMES[Math.floor(rnd() * HOUSE_NAMES.length)],
      comps,
    });
  }
  return out;
}
