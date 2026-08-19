"use client";

import { useCallback, useRef, useState } from "react";
import { downloadDataUrl, exportPosterNode } from "@/components/feast/poster/export-poster";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "day";
}

function lentPosterFilename(day: number, themeTitle: string): string {
  return `st-michaels-lent-day-${String(day).padStart(2, "0")}-${slugify(themeTitle)}.png`;
}

// No photo upload/crop step exists for this poster (unlike the feast
// generator) — just render-and-download.
export function useLentPosterGenerator(day: number, themeTitle: string) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const download = useCallback(async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    setError(null);
    try {
      const dataUrl = await exportPosterNode(posterRef.current);
      downloadDataUrl(dataUrl, lentPosterFilename(day, themeTitle));
    } catch {
      setError("Couldn't generate the image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [day, themeTitle]);

  return { posterRef, isExporting, error, download };
}
