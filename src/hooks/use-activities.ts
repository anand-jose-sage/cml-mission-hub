"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Activity, ActivityCategory } from "@/types";

export interface ActivityItem {
  id: string;
  d: number;          // day of month
  end?: number;       // last day (multi-day spans)
  month: number;      // 0-indexed month
  year: number;
  tint: "purple" | "coral" | "gold" | "mint" | "sky";
  cat: string;        // category label
  icon: string;       // lucide icon name
  title: string;
  time: string;       // formatted time string
  allDay: boolean;
  venue?: string;
  saint?: boolean;
  special?: boolean;
  featured: boolean;
}

/* ─── category → visual mapping ────────────────────────── */
const CAT_CONFIG: Record<string, {
  label: string;
  icon: string;
  tint: ActivityItem["tint"];
  saint: boolean;
  special: boolean;
}> = {
  feast:       { label: "Feast",       icon: "Sparkles", tint: "coral",  saint: true,  special: true },
  solemnity:   { label: "Solemnity",   icon: "Sparkles", tint: "gold",   saint: true,  special: true },
  memorial:    { label: "Memorial",    icon: "Sparkles", tint: "sky",    saint: true,  special: false },
  season:      { label: "Season",      icon: "Sparkles", tint: "purple", saint: false, special: true },
  celebration: { label: "Celebration", icon: "Sparkles", tint: "coral",  saint: false, special: true },
  meeting:     { label: "Meeting",     icon: "Megaphone",tint: "purple", saint: false, special: false },
  gathering:   { label: "Gathering",   icon: "Megaphone",tint: "purple", saint: false, special: false },
  outreach:    { label: "Outreach",    icon: "Users",    tint: "mint",   saint: false, special: false },
  formation:   { label: "Formation",   icon: "BookOpen", tint: "sky",    saint: false, special: false },
  camp:        { label: "Camp",        icon: "Flame",    tint: "coral",  saint: false, special: false },
  music:       { label: "Music",       icon: "Volume2",  tint: "sky",    saint: false, special: false },
  fundraiser:  { label: "Fundraiser",  icon: "Heart",    tint: "gold",   saint: false, special: false },
  activity:    { label: "Activity",    icon: "Calendar", tint: "mint",   saint: false, special: false },
};

function getConfig(cat: ActivityCategory | null) {
  if (cat && CAT_CONFIG[cat]) return CAT_CONFIG[cat];
  return CAT_CONFIG.activity;
}

function formatTimeRange(start: string, end: string | null, allDay: boolean): string {
  if (allDay) return "All day";

  const s = new Date(start);
  const e = end ? new Date(end) : null;

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (e) {
    // If duration >= 10 hours, treat as all day
    const hours = (e.getTime() - s.getTime()) / 3600000;
    if (hours >= 10) return "All day";
    return `${fmt(s)} – ${fmt(e)}`;
  }
  return fmt(s);
}

function activityToItem(a: Activity): ActivityItem {
  const startDate = new Date(a.start_date);
  const endDate = a.end_date ? new Date(a.end_date) : null;
  const cfg = getConfig(a.category);
  const timeStr = formatTimeRange(a.start_date, a.end_date, a.all_day);

  const d = startDate.getDate();
  const month = startDate.getMonth();
  const year = startDate.getFullYear();

  // Multi-day span
  let endDay: number | undefined;
  if (endDate && endDate.getDate() !== d && endDate.getMonth() === month) {
    endDay = endDate.getDate();
  }

  return {
    id: a.id,
    d,
    end: endDay,
    month,
    year,
    tint: cfg.tint,
    cat: cfg.label,
    icon: cfg.icon,
    title: a.title,
    time: timeStr,
    allDay: a.all_day || timeStr === "All day",
    venue: a.location ?? undefined,
    saint: cfg.saint,
    special: cfg.special,
    featured: a.featured,
  };
}

export function useActivities() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("start_date", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("[useActivities] Error:", error.message);
      }

      if (data) {
        setItems(data.map(activityToItem));
      }
      setLoading(false);
    }

    fetch().catch((err) => {
      console.error("[useActivities] Fetch failed:", err);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}
