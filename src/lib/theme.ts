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
      pageBg:
        "linear-gradient(165deg, #E7DBFF 0%, #F1D7F4 45%, #FFE2D2 100%)",
      card: {
        background: "rgba(255,255,255,0.5)",
        border: "1px solid rgba(255,255,255,0.9)",
        backdropFilter: "blur(16px) saturate(180%)",
      },
      softShadow: "0 14px 38px rgba(107,70,255,0.16)",
      chip: "rgba(255,255,255,0.6)",
      navBg: "rgba(255,255,255,0.5)",
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
