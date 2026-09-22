// "Rose Garden" palette for the St. Thérèse Novena — a soft pink/rose
// carve-out, following this app's convention of a hardcoded accent per
// devotional module (see LENT in lent-theme.ts, buildFeastTheme in
// feast-shared.tsx).

export const NOVENA_KEY = "novena-st-theresa";

export const NOVENA = {
  page: "#FFF0F6",
  bg: "#FFE4F0",
  bg2: "#FFD3E7",
  card: "rgba(255,255,255,0.76)",
  cardLine: "rgba(219,39,119,0.14)",
  line: "rgba(219,39,119,0.2)",
  accent: "#DB2777",
  accent2: "#F472B6",
  headingDark: "#7A0E3D",
  gold: "#F5C542",
  text: "#2E0616",
  sub: "rgba(46,6,22,0.78)",
  faint: "rgba(46,6,22,0.56)",
  glow: "rgba(219,39,119,0.3)",
} as const;
