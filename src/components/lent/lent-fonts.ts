import { Outfit, Noto_Sans_Malayalam, Cormorant_Garamond } from "next/font/google";

// Ember Vigil redesign fonts, per the design handoff: Outfit for Latin UI
// (eyebrows, labels, day pill), Noto Sans Malayalam for Malayalam UI/body
// (line-height >= 1.6), Cormorant Garamond italic for English scripture
// sub-lines. Declared as their own next/font calls (not imported from the
// poster module) to keep this module self-contained, matching this
// codebase's per-module-duplication convention.
export const lentOutfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-lent-outfit",
  display: "swap",
});

export const lentMalayalam = Noto_Sans_Malayalam({
  subsets: ["latin", "malayalam"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lent-malayalam",
  display: "swap",
});

export const lentScripture = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-lent-scripture",
  display: "swap",
});

export const LENT_FONT_CLASS = `${lentOutfit.variable} ${lentMalayalam.variable} ${lentScripture.variable}`;
