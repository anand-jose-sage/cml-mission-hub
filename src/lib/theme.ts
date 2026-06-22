import type { CSSProperties } from "react";

export type Treatment = "warm-white" | "lavender-wash" | "aurora-glass";
export type HeroGradient = "royal" | "dusk" | "dawn";

export interface CMLTheme {
  radius: number;
  heroGrad: string;
  pageBg: string;
  card: {
    background: string;
    border: string;
    backdropFilter: string;
  };
  softShadow: string;
  chip: string;
  navBg: string;
  blobs: false | "soft" | "vivid";
}

export const COLORS = {
  purple: "#6B46FF",
  lavender: "#A78BFA",
  gold: "#F5C542",
  bg: "#FAFAFC",
  text: "#1E1B4B",
  sub: "#6B6792",
  faint: "#9D99BC",
  success: "#16A34A",
  alert: "#DC2626",
  line: "rgba(30,27,75,0.07)",
} as const;

const HERO_PALETTES: Record<HeroGradient, [string, string, string]> = {
  royal: ["#6B46FF", "#8B5CF6", "#A78BFA"],
  dusk: ["#6B46FF", "#A855F7", "#EC4899"],
  dawn: ["#7C3AED", "#A78BFA", "#F5C542"],
};

export function buildTheme(
  treatment: Treatment = "aurora-glass",
  heroGrad: HeroGradient = "dusk",
  radius: number = 28
): CMLTheme {
  const pal = HERO_PALETTES[heroGrad];
  const grad = `linear-gradient(150deg, ${pal[0]} 0%, ${pal[1]} 55%, ${pal[2]} 100%)`;
  const base = { radius, heroGrad: grad };

  if (treatment === "lavender-wash") {
    return {
      ...base,
      pageBg:
        "linear-gradient(180deg, #F3EEFF 0%, #FAF0FB 45%, #FEF4EE 100%)",
      card: {
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(255,255,255,0.85)",
        backdropFilter: "blur(10px)",
      },
      softShadow: "0 10px 30px rgba(107,70,255,0.1)",
      chip: "rgba(255,255,255,0.72)",
      navBg: "rgba(255,255,255,0.7)",
      blobs: "soft",
    };
  }

  if (treatment === "aurora-glass") {
    return {
      ...base,
      // Lighter, airier wash — softer entry into the multi-hue pastel system
      pageBg:
        "linear-gradient(165deg, #ECE4FF 0%, #F6E5F6 46%, #FFEADC 100%)",
      card: {
        background: "rgba(255,255,255,0.55)",
        border: "1px solid rgba(255,255,255,0.9)",
        backdropFilter: "blur(16px) saturate(180%)",
      },
      softShadow: "0 14px 32px rgba(120,90,200,0.15)",
      chip: "rgba(255,255,255,0.62)",
      navBg: "rgba(255,255,255,0.55)",
      blobs: "vivid",
    };
  }

  return {
    ...base,
    pageBg: "#FAFAFC",
    card: {
      background: "#ffffff",
      border: "1px solid rgba(30,27,75,0.06)",
      backdropFilter: "none",
    },
    softShadow: "0 8px 26px rgba(107,70,255,0.07)",
    chip: "#F1EEFB",
    navBg: "rgba(255,255,255,0.86)",
    blobs: false,
  };
}

export const TINT_COLORS = {
  pink: { bg: "#FCE7F3", ink: "#BE185D" },
  purple: { bg: "#EDE9FE", ink: "#6B46FF" },
  sky: { bg: "#E0F2FE", ink: "#0369A1" },
  gold: { bg: "#FEF3C7", ink: "#B45309" },
  mint: { bg: "#DCFCE7", ink: "#15803D" },
} as const;

export type TintColor = keyof typeof TINT_COLORS;

// ── Multi-hue pastel accents (soft 3D squircle icons) ─────────────────────
// `from`/`to` drive the icon-tile gradient; `ink` is the on-tile glyph color.
export const ACCENTS = {
  lavender: { from: "#CDBFF8", to: "#A98BF0", ink: "#4A3499" },
  coral:    { from: "#F7C9AE", to: "#F2A988", ink: "#A65428" },
  mint:     { from: "#B6E6D2", to: "#86D2B2", ink: "#1B7C58" },
  pink:     { from: "#F3C2D6", to: "#E89BBC", ink: "#B43A6B" },
  sky:      { from: "#BBD9F4", to: "#8FBCEC", ink: "#2B6299" },
} as const;

export type AccentKey = keyof typeof ACCENTS;

// Soft-extruded pastel tile: gradient face, tinted drop shadow, inner top light.
export function softTile(key: AccentKey, radius = 18): CSSProperties {
  const a = ACCENTS[key];
  return {
    background: `linear-gradient(145deg, ${a.from}, ${a.to})`,
    boxShadow: `0 10px 20px ${a.to}59, inset 0 2px 3px rgba(255,255,255,0.6)`,
    color: a.ink,
    borderRadius: radius,
  };
}
