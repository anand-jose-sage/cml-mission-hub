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
      // Try upcoming featured first
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("featured", true)
        .order("start_date", { ascending: true })
        .limit(1);

      if (cancelled) return;

      if (error) {
        console.error("[useFeaturedEvent] Supabase error:", error.message);
      }

      if (data && data.length > 0) {
        console.log("[useFeaturedEvent] Found featured:", data[0].title);
        setEvent(activityToFeatured(data[0]));
      } else {
        // Fallback: any upcoming activity
        const { data: anyData, error: anyError } = await supabase
          .from("activities")
          .select("*")
          .order("start_date", { ascending: true })
          .limit(1);

        if (cancelled) return;

        if (anyError) {
          console.error("[useFeaturedEvent] Fallback error:", anyError.message);
        }

        if (anyData && anyData.length > 0) {
          console.log("[useFeaturedEvent] Using fallback activity:", anyData[0].title);
          setEvent(activityToFeatured(anyData[0]));
        }
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
