"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  FEASTS, SHAKHAS, SHAKHA_COLOR_MAP,
  resultsFor, buildParticipants,
  type Feast, type FeastCompetition as StaticComp,
} from "@/lib/feast-data";

// ── Static visual config fallback ─────────────────────────────
const FEAST_CONFIG: Record<string, {
  icon: string; tint: [string, string]; accent: string; blurb: string;
}> = {
  "literature-feast-2026": {
    icon: "PenTool",
    tint: ["#6B46FF", "#A855F7"],
    accent: "#A855F7",
    blurb: "A celebration of words — writing, speech and the joy of language across every unit of the Meghala.",
  },
  "arts-feast-2026": {
    icon: "Palette",
    tint: ["#A855F7", "#EC4899"],
    accent: "#EC4899",
    blurb: "Colour, rhythm and stage — visual art, music and live performance for every shakha.",
  },
};

// Fallback config by feast type (used when slug has no match)
const FEAST_TYPE_CONFIG: Record<string, {
  icon: string; tint: [string, string]; accent: string;
}> = {
  literature: { icon: "PenTool",  tint: ["#6B46FF", "#A855F7"], accent: "#A855F7" },
  arts:        { icon: "Palette",  tint: ["#A855F7", "#EC4899"], accent: "#EC4899" },
  sports:      { icon: "Zap",      tint: ["#16A34A", "#22D3EE"], accent: "#22D3EE" },
  general:     { icon: "Sparkles", tint: ["#F59E0B", "#EC4899"], accent: "#F59E0B" },
};

function feastVisual(slug: string, type: string, description: string | null) {
  if (FEAST_CONFIG[slug]) return { ...FEAST_CONFIG[slug] };
  const tc = FEAST_TYPE_CONFIG[type] ?? FEAST_TYPE_CONFIG.general;
  return { ...tc, blurb: description ?? "" };
}

const COMP_ICON_MAP: Record<string, string> = {
  writing: "PenTool", speech: "Mic", quiz: "Sparkles",
  art: "Image", music: "Mic", dance: "Sparkles", drama: "Film",
};

function compIcon(category: string | null): string {
  return COMP_ICON_MAP[category ?? ""] ?? "⭐";
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (e && e.getTime() !== s.getTime()) {
    return `${s.toLocaleDateString("en-US", opts)}–${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  }
  return s.toLocaleDateString("en-US", { ...opts, year: "numeric" });
}

function daysLeft(end: string | null): number {
  if (!end) return 0;
  const ms = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function statusLabel(status: string): string {
  switch (status) {
    case "registration_open": return "Registration Open";
    case "ongoing": return "Ongoing";
    case "completed": return "Completed";
    default: return "Upcoming";
  }
}

// ── Exported UI types ──────────────────────────────────────────
export type FeastUI = Feast;

export interface ShakhaOption {
  id: string;
  name: string;
  color: string;
}

export interface ParticipantUI {
  id: string;
  regNo: string;
  name: string;
  houseName: string;
  shakha: string;
  shakhaColor: string;
  dob: string;
  gender: string;
  category: string;
  comps: string[];
}

export interface ShakhaRankingUI {
  id: string;
  name: string;
  color: string;
  points: number;       // grand_total
  rank: number;
  subJunior: number;
  junior: number;
  senior: number;
  superSenior: number;
  elder: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  aGrade: number;
  bGrade: number;
  cGrade: number;
}

export interface ResultUI {
  registrationId: string;
  position: number | null;
  name: string;
  shakha: string;
  grade: "A" | "B" | "C" | null;
  gradePoints: number;
  positionPoints: number;
  totalPoints: number;
  score: number;
}

// ── useFeasts ─────────────────────────────────────────────────
export function useFeasts() {
  const [feasts, setFeasts] = useState<FeastUI[]>(isSupabaseConfigured ? [] : Object.values(FEASTS));
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("feasts")
        .select("*")
        .neq("status", "draft")
        .order("start_date");

      if (error) console.error("[useFeasts]", error.message);
      if (cancelled || !data?.length) { setLoading(false); return; }

      const feastIds = data.map((r) => r.id);

      // Single grouped-aggregate RPC replaces two full-row-fetch-then-
      // count-in-JS queries (previously: fetch every feast_competitions
      // row + every participants row across ALL feasts just to count them).
      const { data: countRows, error: countErr } = await supabase
        .rpc("get_feast_counts", { p_feast_ids: feastIds });
      if (countErr) console.error("[useFeasts] counts", countErr.message);

      const eventCountMap: Record<string, number> = {};
      const regCountMap: Record<string, number> = {};
      for (const r of countRows ?? []) {
        eventCountMap[r.feast_id as string] = Number(r.event_count) || 0;
        regCountMap[r.feast_id as string] = Number(r.registration_count) || 0;
      }

      const feastsWithComps = new Set(Object.keys(eventCountMap));

      const mapped: FeastUI[] = data
        .filter((row) => feastsWithComps.has(row.id))
        .map((row) => {
          const cfg = feastVisual(row.slug, row.type, row.description);
          return {
            slug: row.slug,
            name: row.name,
            year: row.year,
            icon: cfg.icon,
            tint: cfg.tint,
            accent: cfg.accent,
            status: statusLabel(row.status),
            date: formatDateRange(row.start_date, row.end_date),
            venue: row.venue ?? "",
            blurb: cfg.blurb || (row.description ?? ""),
            registrations: regCountMap[row.id as string] ?? 0,
            eventCount: eventCountMap[row.id as string] ?? 0,
            daysLeft: daysLeft(row.end_date),
            competitions: [],
          };
        });

      if (!cancelled) setFeasts(mapped);
      setLoading(false);
    })().catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, []);

  return { feasts, loading };
}

// ── useFeast (single feast with competitions) ─────────────────
export function useFeast(slug: string) {
  const [feast, setFeast] = useState<FeastUI | null>(FEASTS[slug] ?? null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      const { data: feastRow, error: feastErr } = await supabase
        .from("feasts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (feastErr) console.error("[useFeast]", feastErr.message);
      if (cancelled || !feastRow) { setLoading(false); return; }

      const [{ data: fcs }, { count: regsCount }, { data: catRows }] = await Promise.all([
        supabase
          .from("feast_competitions")
          .select(`
            id, time_slot, venue, max_slots, stage, scheduled_time,
            comp_status, progress_pct, info,
            competition:competitions(name, type, category, gender, competition_category_id, icon, max_per_shakha)
          `)
          .eq("feast_id", feastRow.id)
          .order("display_order"),
        supabase
          .from("participants")
          .select("id", { count: "exact", head: true })
          .eq("feast_id", feastRow.id),
        supabase
          .from("competition_categories")
          .select("id, slug"),
      ]);

      // Build UUID → slug map for competition categories (avoids nested FK join)
      const catSlugMap: Record<string, string> = {};
      for (const cat of catRows ?? []) catSlugMap[cat.id] = cat.slug;


      // Get filled count per competition
      let filledMap: Record<string, number> = {};
      if (fcs?.length) {
        const { data: regRows } = await supabase
          .from("participant_registrations")
          .select("feast_competition_id")
          .in("feast_competition_id", fcs.map((f) => f.id));
        if (regRows) {
          for (const r of regRows) {
            filledMap[r.feast_competition_id] = (filledMap[r.feast_competition_id] ?? 0) + 1;
          }
        }
      }

      const cfg = feastVisual(slug, feastRow.type, feastRow.description);

      const staticFeast = FEASTS[slug];
      const comps: StaticComp[] = (fcs ?? []).map((fc) => {
        const c = fc.competition as unknown as {
          name: string; type: string; category: string | null;
          gender: string | null;
          competition_category_id: string | null;
          icon: string | null;
          max_per_shakha: number | null;
        } | null;
        const staticComp = staticFeast?.competitions.find(
          (sc) => sc.name.toLowerCase() === (c?.name ?? "").toLowerCase()
        );
        return {
          id: fc.id,
          name: c?.name ?? "Competition",
          cat: c?.type === "group" ? "Team" : "Individual",
          time: fc.time_slot ?? "",
          venue: fc.venue ?? "",
          filled: filledMap[fc.id] ?? 0,
          cap: fc.max_slots ?? 0,
          icon: c?.icon || staticComp?.icon || compIcon(c?.category ?? null),
          gender: c?.gender ?? null,
          competitionCategorySlug: c?.competition_category_id ? (catSlugMap[c.competition_category_id] ?? null) : null,
          stage: (fc as Record<string, unknown>).stage as string | null ?? null,
          scheduledTime: (fc as Record<string, unknown>).scheduled_time as string | null ?? null,
          compStatus: ((fc as Record<string, unknown>).comp_status as string | null ?? "upcoming") as "upcoming" | "progressing" | "completed" | "published",
          progressPct: (fc as Record<string, unknown>).progress_pct as number | null ?? null,
          info: (fc as Record<string, unknown>).info as string | null ?? null,
          maxPerShakha: c?.max_per_shakha ?? 2,
        };
      });

      if (!cancelled) {
        setFeast({
          slug: feastRow.slug,
          name: feastRow.name,
          year: feastRow.year,
          icon: cfg.icon,
          tint: cfg.tint,
          accent: cfg.accent,
          status: statusLabel(feastRow.status),
          date: formatDateRange(feastRow.start_date, feastRow.end_date),
          venue: feastRow.venue ?? "",
          blurb: cfg.blurb || (feastRow.description ?? ""),
          registrations: regsCount ?? 0,
          daysLeft: daysLeft(feastRow.end_date),
          competitions: comps.length > 0 ? comps : (staticFeast?.competitions ?? []),
        });
      }
      setLoading(false);
    })().catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, [slug]);

  return { feast, loading };
}

// ── useShakhas ─────────────────────────────────────────────────
export function useShakhas() {
  const [shakhas, setShakhas] = useState<ShakhaOption[]>(
    SHAKHAS.map((s, i) => ({ id: String(i + 1), name: s.name, color: s.color }))
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase.from("shakhas").select("*").order("name");
      if (!cancelled && data?.length) {
        setShakhas(data.map((s) => ({
          id: s.id,
          name: s.name,
          color: SHAKHA_COLOR_MAP[s.name] ?? "#A78BFA",
        })));
      }
    })().catch(() => {});

    return () => { cancelled = true; };
  }, []);

  return { shakhas };
}

// ── useFeastId: get feast UUID from slug ──────────────────────
export function useFeastId(slug: string) {
  const [feastId, setFeastId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from("feasts").select("id").eq("slug", slug).single()
      .then(({ data }) => { if (data) setFeastId(data.id); });
  }, [slug]);

  return feastId;
}

// ── useParticipants ────────────────────────────────────────────
export function useParticipants(slug: string) {
  const fallback = buildParticipants(slug);
  const [participants, setParticipants] = useState<ParticipantUI[]>(
    fallback.map((p) => ({
      id: p.regNo,
      regNo: p.regNo,
      name: p.name,
      houseName: "",
      shakha: p.shakha,
      shakhaColor: SHAKHA_COLOR_MAP[p.shakha] ?? "#A78BFA",
      dob: "",
      gender: "",
      category: "",
      comps: p.comps,
    }))
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      const { data: feastRow } = await supabase
        .from("feasts").select("id").eq("slug", slug).single();
      if (!feastRow) { setLoading(false); return; }

      const { data } = await supabase
        .from("participants")
        .select(`
          id, name, house_name, registration_number, date_of_birth, gender,
          competition_category:competition_categories(slug, name),
          shakha:shakhas(name),
          registrations:participant_registrations(
            feast_competition:feast_competitions(competition:competitions(name))
          )
        `)
        .eq("feast_id", feastRow.id)
        .order("created_at", { ascending: false });

      if (!cancelled && data?.length) {
        setParticipants(data.map((p) => {
          const shakhaName = (p.shakha as unknown as { name: string } | null)?.name ?? "—";
          const cat = p.competition_category as unknown as { slug: string; name: string } | null;
          const comps = (p.registrations as unknown as { feast_competition: { competition: { name: string } | null } | null }[])
            ?.map((r) => r.feast_competition?.competition?.name ?? "")
            .filter(Boolean) ?? [];
          return {
            id: p.id,
            regNo: p.registration_number ?? p.id.slice(0, 8).toUpperCase(),
            name: p.name,
            houseName: (p as unknown as { house_name: string | null }).house_name ?? "",
            shakha: shakhaName,
            shakhaColor: SHAKHA_COLOR_MAP[shakhaName] ?? "#A78BFA",
            dob: (p as unknown as { date_of_birth: string | null }).date_of_birth ?? "",
            gender: (p as unknown as { gender: string | null }).gender ?? "",
            category: cat?.slug ?? "",
            comps,
          };
        }));
      }
      if (!cancelled) setLoading(false);
    })().catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, [slug]);

  return { participants, loading };
}

// ── useShakhaColors — just the color map for all shakhas ─────────────────
// useLeaderboard removed — FeastLeaderboard calls getLeaderboard() directly.

// ── useCompResults — reads from competition_results (new system) ─
export function useCompResults(feastCompetitionId: string | null, _staticSlug: string, _staticCompId: string) {
  const [results, setResults] = useState<ResultUI[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured && !!feastCompetitionId);

  useEffect(() => {
    if (!isSupabaseConfigured || !feastCompetitionId) { setLoading(false); return; }
    let cancelled = false;

    (async () => {
      // Only fetch if competition is published
      const { data: fc } = await supabase
        .from("feast_competitions")
        .select("result_status")
        .eq("id", feastCompetitionId)
        .single();

      if (!fc || fc.result_status !== "published") {
        if (!cancelled) { setResults([]); setLoading(false); }
        return;
      }

      const { data } = await supabase
        .from("competition_results")
        .select(`
          participant_registration_id, score, grade, grade_points,
          position, position_points, total_points,
          registration:participant_registrations(
            participant:participants(name, shakha:shakhas(name))
          )
        `)
        .eq("feast_competition_id", feastCompetitionId)
        .not("published_at", "is", null)
        .order("position", { nullsFirst: false });

      if (!cancelled && data?.length) {
        setResults(data.map((row) => {
          const reg = (Array.isArray(row.registration) ? row.registration[0] : row.registration) as Record<string, unknown> | null;
          const participant = reg ? (Array.isArray(reg.participant) ? (reg.participant as unknown[])[0] : reg.participant) as Record<string, unknown> | null : null;
          const shakha = participant ? (Array.isArray(participant.shakha) ? (participant.shakha as unknown[])[0] : participant.shakha) as Record<string, unknown> | null : null;
          return {
            registrationId: row.participant_registration_id as string,
            position: (row.position as number | null) ?? null,
            name: (participant?.name as string) ?? "—",
            shakha: (shakha?.name as string) ?? "—",
            grade: (row.grade as "A" | "B" | "C" | null) ?? null,
            gradePoints: (row.grade_points as number) ?? 0,
            positionPoints: (row.position_points as number) ?? 0,
            totalPoints: (row.total_points as number) ?? 0,
            score: Number(row.score),
          };
        }));
      }
      if (!cancelled) setLoading(false);
    })().catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, [feastCompetitionId]);

  return { results, loading };
}
