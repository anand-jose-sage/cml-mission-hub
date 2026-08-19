import { Cormorant_Garamond, Noto_Sans_Malayalam, Oswald } from "next/font/google";

// Reuses the same font families as the feast poster (Noto Sans Malayalam,
// Oswald), but skips Great_Vibes (a flowing cursive script that reads
// tonally wrong for a solemn Lenten declaration) — Cormorant Garamond is
// used as the display face instead. Declared as its own next/font calls
// (rather than importing the feast module's instances) to keep this module
// self-contained, matching this app's per-module-duplication convention.

export const lentPosterDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lent-poster-display",
  display: "swap",
});

export const lentPosterMalayalam = Noto_Sans_Malayalam({
  subsets: ["latin", "malayalam"],
  weight: ["500", "700", "800"],
  variable: "--font-lent-poster-malayalam",
  display: "swap",
});

export const lentPosterLabel = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-lent-poster-oswald",
  display: "swap",
});

export const LENT_POSTER_FONT_CLASS = `${lentPosterDisplay.variable} ${lentPosterMalayalam.variable} ${lentPosterLabel.variable}`;
