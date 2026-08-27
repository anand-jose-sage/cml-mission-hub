import { useEffect, useState } from "react";
import { sectionKey, type DashboardSection } from "./dashboard-types";

const ROTATE_MS = 15_000; // dwell time on a rankings/point-table screen
// Dwell time on each sub-position within a competition screen. Raised from
// 5s to give the Grade Achievers column (which can auto-scroll past 7+
// names — see GradeColumn in page.tsx) enough time to actually be read.
// Exported so the achiever auto-scroll can size its animation to match.
export const SUB_MS = 8_000;
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
export function useDashboardRotation(
  sections: DashboardSection[],
  activeCompetitionCount: number,
  // Freezes the rotation on the current slide — a manual pause, not a data
  // state, so it's a plain param rather than something derived.
  paused = false,
  // Sections the auto-rotation is allowed to land on; a manual click (section
  // pill) can still jump to a skipped one, this only affects the timer's
  // advance. null/empty means "every section" — never lets the operator
  // accidentally freeze the whole rotation by unchecking everything.
  enabledSectionKeys: Set<string> | null = null
) {
  const [sectionIdx, setSectionIdxRaw] = useState(0);
  const [screenIdx, setScreenIdxRaw] = useState(0);
  const [subIdx, setSubIdx] = useState(0);

  // nextRotationSectionIdx reads each section's key, not just the list
  // length — this is the effect's real dependency on `sections`' contents
  // (a stable string beats the array reference, which is rebuilt every poll).
  const sectionsKey = sections.map(sectionKey).join(",");

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

  // Next section the auto-rotation should land on, skipping any not in
  // enabledSectionKeys — wraps around, and scans at most once around the
  // full list so it can never spin forever.
  const nextRotationSectionIdx = (from: number): number => {
    if (!enabledSectionKeys || enabledSectionKeys.size === 0) return (from + 1) % sections.length;
    for (let step = 1; step <= sections.length; step++) {
      const i = (from + step) % sections.length;
      if (enabledSectionKeys.has(sectionKey(sections[i]))) return i;
    }
    return (from + 1) % sections.length; // nothing enabled — fall back rather than freeze
  };

  useEffect(() => {
    if (sections.length === 0 || paused) return;
    const delay = isRankingsScreen ? ROTATE_MS : SUB_MS;
    const id = setTimeout(() => {
      if (isRankingsScreen) {
        if (activeSection.kind === "feast" && activeCompetitionCount > 0) {
          setScreenIdxRaw(1);
          setSubIdx(0);
        } else {
          goToSection(nextRotationSectionIdx(safeSectionIdx));
        }
      } else {
        const nextSub = subIdx + 1;
        if (nextSub < SUB_COUNT) {
          setSubIdx(nextSub);
        } else if (safeScreenIdx < activeCompetitionCount) {
          setScreenIdxRaw(safeScreenIdx + 1);
          setSubIdx(0);
        } else {
          goToSection(nextRotationSectionIdx(safeSectionIdx));
        }
      }
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsKey, safeSectionIdx, safeScreenIdx, subIdx, isRankingsScreen, activeSection.kind, activeCompetitionCount, paused, enabledSectionKeys]);

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
