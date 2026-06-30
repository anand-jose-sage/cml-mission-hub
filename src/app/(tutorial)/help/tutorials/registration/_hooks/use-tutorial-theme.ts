"use client";

import { useMemo } from "react";
import { buildTheme } from "@/lib/theme";
import { buildFeastTheme, type FeastTheme } from "@/components/feast/feast-shared";

export function useTutorialTheme(): FeastTheme {
  return useMemo(() => buildFeastTheme(buildTheme("aurora-glass", "dusk", 28)), []);
}
