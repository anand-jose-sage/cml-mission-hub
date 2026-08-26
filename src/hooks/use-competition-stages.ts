"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/competition-categories";

export type RunState = "upcoming" | "running" | "completed";

export interface StageCompetition {
  id: string;
  label: string;
  compName: string;
  gender: string | null;
  categorySlug: string | null;
  categoryColor: string;
  status: RunState;
  scheduledTime: string | null;
  order: number;
  // Attendance completion WITHIN this one competition (participants marked
  // present / participants with a chance number) — not the stage's own
  // "X of Y competitions done" progress, which is a separate count computed
  // in deriveStage below. Only meaningful while status === "running".
  itemProgressPct: number | null;
}

export interface CompetitionStage {
  key: string;
  stageNumber: number;
  title: string;
  raw: string;
  scheduledTime: string | null;
  competitions: StageCompetition[];
  completedCount: number;
  totalCount: number;
  progressPct: number;
  status: RunState;
  // True when status is "upcoming" but at least one competition already
  // finished (a low-registration item can jump straight to completed
  // without passing through "running") — lets the UI say "In Progress"
  // instead of a flatly wrong "Upcoming" for that stage, without claiming
  // it's live.
  hasPartialProgress: boolean;
  runningCompetition: StageCompetition | null;
  nextCompetition: StageCompetition | null;
}

export interface RunningItem {
  stage: CompetitionStage;
  competition: StageCompetition;
}

// Polling, not Supabase Realtime — the app has no realtime subscriptions
// anywhere else, so this matches the existing fetch-in-useEffect convention
// instead of introducing a new architecture for one screen.
const POLL_MS = 5 * 60 * 1000;

function mapRunState(s: string | null | undefined): RunState {
  if (s === "progressing") return "running";
  if (s === "completed" || s === "published") return "completed";
  return "upcoming";
}

function genderWord(g: string | null): string {
  if (!g) return "";
  const l = g.toLowerCase();
  if (l.startsWith("boy")) return "Boys";
  if (l.startsWith("girl")) return "Girls";
  return "";
}

// "STAGE 3 — SPEECH B" -> { number: 3, title: "SPEECH B" }. Falls back to a
// high sort number so any un-numbered stage text still renders, just last.
function parseStageHeader(raw: string): { number: number; title: string } {
  const m = raw.match(/stage\s*(\d+)\s*[—–-]?\s*(.*)/i);
  if (m && m[1]) return { number: Number(m[1]), title: (m[2] || raw).trim() };
  return { number: 999, title: raw };
}

// Always "Category [Gender] Competition Name" (e.g. "Sub Junior Boys
// പ്രസംഗം") so the label never depends on what else happens to share its
// stage — a Speech item and a Bible Reading item read unambiguously side by
// side without needing to know the rest of the group.
function buildLabel(compName: string, gender: string | null, categorySlug: string | null): string {
  const cat = categorySlug ? CATEGORY_LABELS[categorySlug] ?? categorySlug : "";
  const gWord = genderWord(gender);
  if (cat && gWord) return `${cat} ${gWord} ${compName}`;
  if (cat) return `${cat} ${compName}`;
  return compName;
}

function deriveStage(key: string, items: StageCompetition[]): CompetitionStage {
  const { number, title } = parseStageHeader(key);
  for (const item of items) {
    item.label = buildLabel(item.compName, item.gender, item.categorySlug);
  }
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const completedCount = sorted.filter((c) => c.status === "completed").length;
  const totalCount = sorted.length;
  const runningCompetition = sorted.find((c) => c.status === "running") ?? null;
  const nextCompetition = sorted.find((c) => c.status === "upcoming") ?? null;

  // Matches section 20's reference formula exactly: a stage is only ever
  // "running" while one of its competitions actually has RUNNING status.
  // A low-registration competition can jump straight from upcoming to
  // completed without ever passing through "progressing", so a stage can
  // have partial completedCount with nothing currently active — labeling
  // that "Live" would contradict the Live Now hero (which is built from
  // this same runningCompetition check) showing nothing running. Getting
  // that consistency right matters more than "Upcoming" looking odd next
  // to a nonzero progress bar; see hasPartialProgress below for the UI's
  // softer "In Progress" label for exactly that case.
  const status: RunState =
    completedCount === totalCount && totalCount > 0
      ? "completed"
      : runningCompetition
        ? "running"
        : "upcoming";
  const hasPartialProgress = status === "upcoming" && completedCount > 0;

  const scheduledTime = sorted.find((c) => c.scheduledTime)?.scheduledTime ?? null;

  return {
    key,
    stageNumber: number,
    title,
    raw: key,
    scheduledTime,
    competitions: sorted,
    completedCount,
    totalCount,
    progressPct: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    status,
    hasPartialProgress,
    runningCompetition,
    nextCompetition,
  };
}

export function useCompetitionStages(slug: string) {
  const [stages, setStages] = useState<CompetitionStage[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const feastIdRef = useRef<string | null>(null);

  const load = useCallback(async (silent: boolean) => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      let feastId = feastIdRef.current;
      if (!feastId) {
        const { data: feastRow } = await supabase
          .from("feasts").select("id").eq("slug", slug).maybeSingle();
        if (!feastRow) { setStages([]); setLoading(false); return; }
        feastId = feastRow.id;
        feastIdRef.current = feastId;
      }

      const [{ data: fcs, error: fcErr }, { data: catRows }] = await Promise.all([
        supabase
          .from("feast_competitions")
          .select(`
            id, stage, scheduled_time, comp_status, progress_pct, display_order,
            competition:competitions(name, gender, competition_category_id)
          `)
          .eq("feast_id", feastId)
          .not("stage", "is", null)
          .order("display_order"),
        supabase.from("competition_categories").select("id, slug"),
      ]);
      if (fcErr) { console.error("[useCompetitionStages]", fcErr.message); setLoading(false); return; }

      const catSlugMap: Record<string, string> = {};
      for (const c of catRows ?? []) catSlugMap[c.id] = c.slug;

      const groups = new Map<string, StageCompetition[]>();
      for (const fc of fcs ?? []) {
        const stageKey = fc.stage as string | null;
        if (!stageKey) continue;
        const comp = (Array.isArray(fc.competition) ? fc.competition[0] : fc.competition) as
          { name: string; gender: string | null; competition_category_id: string | null } | null;
        const categorySlug = comp?.competition_category_id
          ? catSlugMap[comp.competition_category_id] ?? null
          : null;

        const compName = comp?.name ?? "Competition";
        const item: StageCompetition = {
          id: fc.id as string,
          label: compName, // finalized per-stage in deriveStage, once the full group is known
          compName,
          gender: comp?.gender ?? null,
          categorySlug,
          categoryColor: categorySlug ? CATEGORY_COLORS[categorySlug] ?? "#A78BFA" : "#A78BFA",
          status: mapRunState(fc.comp_status as string | null),
          scheduledTime: (fc.scheduled_time as string | null) ?? null,
          order: (fc.display_order as number) ?? 0,
          itemProgressPct: (fc.progress_pct as number | null) ?? null,
        };

        if (!groups.has(stageKey)) groups.set(stageKey, []);
        groups.get(stageKey)!.push(item);
      }

      const built = [...groups.entries()]
        .map(([key, items]) => deriveStage(key, items))
        .sort((a, b) => a.stageNumber - b.stageNumber);

      setStages(built);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    feastIdRef.current = null;
    load(false);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) load(true);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const totalCount = stages.reduce((sum, s) => sum + s.totalCount, 0);
  const completedCount = stages.reduce((sum, s) => sum + s.completedCount, 0);
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const runningItems: RunningItem[] = [];
  for (const stage of stages) {
    if (stage.runningCompetition) runningItems.push({ stage, competition: stage.runningCompetition });
  }

  let upNext: RunningItem | null = null;
  if (runningItems.length === 0) {
    for (const stage of stages) {
      if (stage.status !== "completed" && stage.nextCompetition) {
        upNext = { stage, competition: stage.nextCompetition };
        break;
      }
    }
  }

  return { stages, loading, totalCount, completedCount, overallPct, runningItems, upNext };
}
