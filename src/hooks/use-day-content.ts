"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { type DayContentItem } from "@/lib/sample-data";
import type { ContentItem, Notice } from "@/types";

function getDateForDayIndex(dayIndex: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function contentItemToDayItem(item: ContentItem): DayContentItem {
  let type: DayContentItem["type"] = "notice";
  if (item.content_type === "reel" || item.content_type === "video") type = "reel";
  else if (item.content_type === "voice-note" || item.content_type === "audio") type = "voice";

  return {
    id: item.id,
    type,
    title: item.title,
    summary: item.summary ?? "",
    time: formatTime(item.published_at),
    duration: undefined,
  };
}

function noticeToDayItem(notice: Notice): DayContentItem {
  return {
    id: notice.id,
    type: "notice",
    title: notice.title,
    summary: notice.summary ?? "",
    time: formatTime(notice.published_at),
  };
}

export function useDayContent(dayIndex: number) {
  const [items, setItems] = useState<DayContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchDay() {
      const date = getDateForDayIndex(dayIndex);
      const startOfDay = date.toISOString();
      const endOfDay = new Date(date.getTime() + 86400000).toISOString();

      const [contentRes, noticesRes] = await Promise.all([
        supabase
          .from("content_items")
          .select("*")
          .gte("published_at", startOfDay)
          .lt("published_at", endOfDay)
          .in("content_type", ["reel", "video", "voice-note", "audio"])
          .order("published_at", { ascending: true }),
        supabase
          .from("notices")
          .select("*")
          .gte("published_at", startOfDay)
          .lt("published_at", endOfDay)
          .order("published_at", { ascending: true }),
      ]);

      if (cancelled) return;

      if (contentRes.error) console.error("[useDayContent] content error:", contentRes.error.message);
      if (noticesRes.error) console.error("[useDayContent] notices error:", noticesRes.error.message);

      const contentItems = (contentRes.data ?? []).map(contentItemToDayItem);
      const noticeItems = (noticesRes.data ?? []).map(noticeToDayItem);
      console.log(`[useDayContent] day=${dayIndex}: ${contentItems.length} content, ${noticeItems.length} notices`);
      setItems([...contentItems, ...noticeItems]);
      setLoading(false);
    }

    fetchDay().catch((err) => {
      console.error("[useDayContent] Fetch failed:", err);
      if (!cancelled) {
        setItems([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dayIndex]);

  return { items, loading };
}
