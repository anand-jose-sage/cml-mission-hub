// "Ember Vigil" palette for St. Michael's Lent — near-black with ember
// orange/gold, per the approved design handoff. Intentionally separate from
// theme.ts's purple glass system and from plan-theme.ts's warm earthy
// palette — this app's convention is a hardcoded accent carve-out per module
// (see buildFeastTheme, PLAN).

// Key prefix for lent_content rows (kept here, not in the "use server" action
// file — server-action modules may only export async functions).
export const LENT_KEY = "st-michaels-lent-2026";

export const LENT = {
  page: "#060405",
  bg: "#0B0708",
  bg2: "#16100E",
  surf: "rgba(255,236,220,.05)",
  surf2: "rgba(255,236,220,.08)",
  line: "rgba(255,180,120,.16)",
  accent: "#FF7A2F",
  accent2: "#FFC46B",
  text: "#F6EDE4",
  muted: "rgba(246,237,228,.54)",
  glow: "rgba(255,122,47,.32)",
} as const;

export function lentTint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
