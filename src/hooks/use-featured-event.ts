"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Activity } from "@/types";

export interface FeaturedEvent {
  title: string;
  date: string;
  time: string;
  location: string;
  targetMs: number;
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
}

function formatEventTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function activityToFeatured(a: Activity): FeaturedEvent {
  return {
    title: a.title,
    date: formatEventDate(a.start_date),
    time: formatEventTime(a.start_date),
    location: a.location ?? "",
    targetMs: new Date(a.start_date).getTime(),
  };
}

// Inclusive end-of-day for a date or timestamp string, in local time — so an
// event whose end date is *today* is still considered current until midnight.
function endOfDayMs(dateStr: string): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return NaN;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

// An event is still worth featuring until its end date has passed. Multi-day
// events use end_date; single-point events fall back to start_date. Once that
// day is over the event is hidden so the hero never lingers on a finished event.
function notEnded(a: Activity, now: number): boolean {
  const endMs = endOfDayMs(a.end_date ?? a.start_date);
  return Number.isFinite(endMs) && endMs >= now;
}

export function useFeaturedEvent() {
  const [event, setEvent] = useState<FeaturedEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchFeatured() {
      const now = Date.now();

      // Try featured events first — earliest one that hasn't ended yet.
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("featured", true)
        .order("start_date", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("[useFeaturedEvent] Supabase error:", error.message);
      }

      const featured = (data ?? []).find((a) => notEnded(a, now));

      if (featured) {
        setEvent(activityToFeatured(featured));
      } else {
        // Fallback: earliest non-ended activity of any kind.
        const { data: anyData, error: anyError } = await supabase
          .from("activities")
          .select("*")
          .order("start_date", { ascending: true });

        if (cancelled) return;

        if (anyError) {
          console.error("[useFeaturedEvent] Fallback error:", anyError.message);
        }

        const upcoming = (anyData ?? []).find((a) => notEnded(a, now));
        setEvent(upcoming ? activityToFeatured(upcoming) : null);
      }

      setLoading(false);
    }

    fetchFeatured().catch((err) => {
      console.error("[useFeaturedEvent] Fetch failed:", err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { event, loading };
}
