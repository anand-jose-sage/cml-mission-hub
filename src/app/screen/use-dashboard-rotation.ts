import { useEffect, useState } from "react";
import type { DashboardSection } from "./dashboard-types";

const ROTATE_MS = 15_000; // dwell time on a rankings/point-table screen
const SUB_MS = 5_000;     // dwell time on each sub-position within a competition screen
const SUB_COUNT = 3;      // 1st/2nd/3rd or Grade A/B/C

/**
 * Drives the LED dashboard's slide rotation across a two-level index:
 *   sectionIdx — which DashboardSection (Overall, Feast A, Feast B, ...)
 *   screenIdx  — within a feast section: 0 = point table, 1..N = competition N
 *                (always 0 for the Overall section, which has no competitions)
 *   subIdx     — sub-position cycle (1st/2nd/3rd or Grade A/B/C) within a competition screen
 *
 * Only ever reads `sections.length` and the ACTIVE feast's competition count —
 * never another feast's — so adding a feast requires no change here.
 */
export function useDashboardRotation(sections: DashboardSection[], activeCompetitionCount: number) {
  const [sectionIdx, setSectionIdxRaw] = useState(0);
  const [screenIdx, setScreenIdxRaw] = useState(0);
  const [subIdx, setSubIdx] = useState(0);

  const safeSectionIdx = sections.length ? Math.min(sectionIdx, sections.length - 1) : 0;
  const activeSection: DashboardSection = sections[safeSectionIdx] ?? { kind: "overall" };
  // Resilience: if the active feast's competition list shrinks (one got
  // unpublished mid-display) and we're currently past the end of it, this
  // clamps back to the point table instead of rendering a stale/removed
  // competition — derived every render, so there's nothing to resync via an
  // effect.
  const safeScreenIdx = Math.min(screenIdx, activeCompetitionCount);
  const isRankingsScreen = safeScreenIdx === 0;

  const goToSection = (i: number) => {
    setSectionIdxRaw(i);
    setScreenIdxRaw(0);
    setSubIdx(0);
  };
  const goToScreen = (i: number) => {
    setScreenIdxRaw(i);
    setSubIdx(0);
  };

  useEffect(() => {
    if (sections.length === 0) return;
    const delay = isRankingsScreen ? ROTATE_MS : SUB_MS;
    const id = setTimeout(() => {
      if (isRankingsScreen) {
        if (activeSection.kind === "feast" && activeCompetitionCount > 0) {
          setScreenIdxRaw(1);
          setSubIdx(0);
        } else {
          goToSection((safeSectionIdx + 1) % sections.length);
        }
      } else {
        const nextSub = subIdx + 1;
        if (nextSub < SUB_COUNT) {
          setSubIdx(nextSub);
        } else if (safeScreenIdx < activeCompetitionCount) {
          setScreenIdxRaw(safeScreenIdx + 1);
          setSubIdx(0);
        } else {
          goToSection((safeSectionIdx + 1) % sections.length);
        }
      }
    }, delay);
    return () => clearTimeout(id);
  }, [sections.length, safeSectionIdx, safeScreenIdx, subIdx, isRankingsScreen, activeSection.kind, activeCompetitionCount]);

  return {
    sectionIdx: safeSectionIdx,
    screenIdx: safeScreenIdx,
    subIdx,
    activeSection,
    isRankingsScreen,
    goToSection,
    goToScreen,
  };
}
