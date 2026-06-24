// Warm, earthy theme for the annual plan ("പ്രവർത്തന മാർഗ്ഗരേഖ"), inspired by
// the source design. Intentionally separate from src/lib/theme.ts (the purple
// glass system used by the rest of the app).

// Key prefix for plan_content rows (kept here, not in the "use server" action
// file — server-action modules may only export async functions).
export const PLAN_KEY = "pravarthana-2026-27";

export const PLAN = {
  pageBg: "#FBF7EF",
  card: "#FFFFFF",
  cardWarm: "#F4EEE4",
  ink: "#2f2a24",
  sub: "#6b6256",
  muted: "#8a8378",
  line: "rgba(47,42,36,0.10)",
  gold: "#B0892F",
} as const;

// Rotating fallback accents (lifted from the source page) if a month lacks one.
export const PLAN_ACCENTS = [
  "#B05A3C", "#3E7C68", "#645399", "#426E96", "#557E3E",
  "#8C5183", "#DE8C6F", "#6FB39E", "#A99AD3", "#C2B95F", "#E2876F",
];

export function monthAccent(index: number, fallback?: string): string {
  return fallback || PLAN_ACCENTS[(index - 1) % PLAN_ACCENTS.length] || PLAN_ACCENTS[0];
}

// Translucent tint of a hex color, e.g. tint("#B05A3C", 0.12).
export function tint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
