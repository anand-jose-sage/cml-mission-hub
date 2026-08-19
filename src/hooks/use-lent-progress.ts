"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// Per-visitor progress for St. Michael's Lent — localStorage only, no
// accounts exist for the public app and this is meant to be "local-first"
// per the design brief. First use of client-side persistence anywhere in
// this codebase (everything else reads live from Supabase).

const STORAGE_KEY = "cml-lent-2026-progress";

export type LentStage = "read" | "pray" | "act" | "reflect" | "michael" | "done";
export type LentTrailStage = "read" | "pray" | "act" | "reflect" | "michael";

export interface DayProgress {
  reading: boolean;
  prayer: boolean;
  activity: boolean;
  reflectionDone: boolean;
  reflection: string;
  michael: boolean; // Prayer to St. Michael, the closing step of each day
}

type ProgressMap = Record<number, DayProgress>;

function emptyDayProgress(): DayProgress {
  return { reading: false, prayer: false, activity: false, reflectionDone: false, reflection: "", michael: false };
}

function readStorage(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function writeStorage(map: ProgressMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage unavailable (private mode, quota) — in-memory state still works for this session
  }
}

// Stage order is read -> reflect -> pray -> act -> michael -> done:
// reflection sits right after the day's Bible reading (matching the
// authored content's own reading -> reflection -> prayer -> activity
// structure), with the private journal box folded into that same reflect
// step rather than tacked on at the end. The Prayer to St. Michael closes
// out every day as its own step, after that day's own activity.
export function getStageForDay(progress: DayProgress | undefined): LentStage {
  const p = progress ?? emptyDayProgress();
  if (!p.reading) return "read";
  if (!p.reflectionDone) return "reflect";
  if (!p.prayer) return "pray";
  if (!p.activity) return "act";
  if (!p.michael) return "michael";
  return "done";
}

export function useLentProgress() {
  const [map, setMap] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMap(readStorage());
    setLoaded(true);
  }, []);

  const dayProgress = useCallback((day: number) => map[day] ?? emptyDayProgress(), [map]);
  const getStage = useCallback((day: number) => getStageForDay(map[day]), [map]);

  const markDone = useCallback((day: number, stage: "read" | "pray" | "act" | "michael") => {
    const field = stage === "read" ? "reading" : stage === "pray" ? "prayer" : stage === "act" ? "activity" : "michael";
    setMap((prev) => {
      const cur = prev[day] ?? emptyDayProgress();
      const next = { ...prev, [day]: { ...cur, [field]: true } };
      writeStorage(next);
      return next;
    });
  }, []);

  const saveReflection = useCallback((day: number, text: string) => {
    setMap((prev) => {
      const cur = prev[day] ?? emptyDayProgress();
      const next = { ...prev, [day]: { ...cur, reflection: text, reflectionDone: true } };
      writeStorage(next);
      return next;
    });
  }, []);

  // Clears a single day's progress (all 4 steps + the private journal text
  // for that day) so the visitor can walk through it again from "read".
  const resetDay = useCallback((day: number) => {
    setMap((prev) => {
      const next = { ...prev };
      delete next[day];
      writeStorage(next);
      return next;
    });
  }, []);

  const completedDaysCount = useMemo(
    () => Object.values(map).filter((p) => p.reading && p.prayer && p.activity && p.reflectionDone && p.michael).length,
    [map]
  );

  return { loaded, dayProgress, getStage, markDone, saveReflection, resetDay, completedDaysCount };
}
