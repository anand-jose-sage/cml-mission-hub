"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { type MissionItem } from "@/lib/sample-data";
import type { ContentItem } from "@/types";
import type { TintColor } from "@/lib/theme";

const TYPE_TO_TINT: Record<string, TintColor> = {
  reel: "pink",
  video: "pink",
  "voice-note": "purple",
  audio: "sky",
  message: "sky",
  reflection: "purple",
  "saint-reflection": "gold",
  notice: "mint",
  activity: "mint",
};

const TYPE_TO_ICON: Record<string, string> = {
  reel: "Play",
  video: "Play",
  "voice-note": "Mic",
  audio: "Mic",
  message: "BookOpen",
  reflection: "BookOpen",
  "saint-reflection": "Sparkles",
  notice: "Megaphone",
  activity: "Megaphone",
};

const TYPE_TO_LABEL: Record<string, string> = {
  reel: "Today's Reel",
  video: "Video",
  "voice-note": "Voice Reflection",
  audio: "Audio",
  message: "Daily Message",
  reflection: "Reflection",
  "saint-reflection": "Saint Reflection",
  notice: "Announcement",
  activity: "Activity",
};

const TYPE_TO_MEDIA: Record<string, MissionItem["media"]> = {
  reel: "reel",
  video: "reel",
  "voice-note": "audio",
  audio: "audio",
  message: "text",
  reflection: "text",
  "saint-reflection": "text",
  notice: "text",
  activity: "text",
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short" });
}

function contentToMissionItem(item: ContentItem): MissionItem {
  return {
    icon: TYPE_TO_ICON[item.content_type] ?? "BookOpen",
    tint: TYPE_TO_TINT[item.content_type] ?? "purple",
    type: TYPE_TO_LABEL[item.content_type] ?? item.content_type,
    title: item.title,
    time: formatTime(item.published_at),
    day: formatDay(item.published_at),
    month: formatMonth(item.published_at),
    excerpt: item.summary ?? "",
    media: TYPE_TO_MEDIA[item.content_type] ?? "text",
    mediaUrl: item.media_url,
    thumbnailUrl: item.thumbnail_url,
  };
}

export function useMissionItems() {
  const [items, setItems] = useState<MissionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchItems() {
      const { data, error } = await supabase
        .from("content_items")
        .select("content_type, title, published_at, summary, media_url, thumbnail_url")
        .order("published_at", { ascending: false })
        .limit(4);

      if (cancelled) return;

      if (error) {
        console.error("[useMissionItems] Supabase error:", error.message);
      }

      if (data) {
        console.log("[useMissionItems] Fetched", data.length, "items");
        setItems((data as unknown as ContentItem[]).map(contentToMissionItem));
      }
      setLoading(false);
    }

    fetchItems().catch((err) => {
      console.error("[useMissionItems] Fetch failed:", err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}
