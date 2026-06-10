"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ContentItem } from "@/types";

export type MediaFilter = "all" | "reel" | "video" | "voice-note" | "audio";

export interface MediaGalleryItem {
  id: string;
  title: string;
  summary: string;
  type: MediaFilter;
  thumbnailUrl: string | null;
  publishedAt: string;
  date: string;
  month: string;
  duration?: string;
}

function formatDate(dateStr: string): { date: string; month: string } {
  const d = new Date(dateStr);
  return {
    date: d.getDate().toString(),
    month: d.toLocaleDateString("en-US", { month: "short" }),
  };
}

function contentToGalleryItem(item: ContentItem): MediaGalleryItem {
  const { date, month } = formatDate(item.published_at);
  return {
    id: item.id,
    title: item.title,
    summary: item.summary ?? "",
    type: item.content_type as MediaFilter,
    thumbnailUrl: item.thumbnail_url,
    publishedAt: item.published_at,
    date,
    month,
  };
}

export function useMediaItems(filter: MediaFilter = "all") {
  const [items, setItems] = useState<MediaGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchMedia() {
      let query = supabase
        .from("content_items")
        .select("*")
        .in("content_type", ["reel", "video", "voice-note", "audio"])
        .order("published_at", { ascending: false })
        .limit(30);

      if (filter !== "all") {
        query = query.eq("content_type", filter);
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        console.error("[useMediaItems] Supabase error:", error.message);
      }

      if (data) {
        console.log("[useMediaItems] Fetched", data.length, "items");
        setItems(data.map(contentToGalleryItem));
      }
      setLoading(false);
    }

    fetchMedia().catch((err) => {
      console.error("[useMediaItems] Fetch failed:", err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  return { items, loading };
}
