"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Notice } from "@/types";
import type { NoticeItem, NoticeTintKey } from "@/lib/notice-data";

/* ── Map DB category → visual tint + icon ── */
const CAT_CONFIG: Record<
  string,
  { tint: NoticeTintKey; icon: string; group: NoticeItem["group"] }
> = {
  Meeting: { tint: "purple", icon: "Megaphone", group: "priority" },
  Priority: { tint: "purple", icon: "Megaphone", group: "priority" },
  Event: { tint: "coral", icon: "Sparkles", group: "events" },
  Feast: { tint: "coral", icon: "Sparkles", group: "events" },
  Finance: { tint: "gold", icon: "Award", group: "general" },
  Resource: { tint: "sky", icon: "Volume2", group: "general" },
  Membership: { tint: "mint", icon: "User", group: "general" },
  Music: { tint: "sky", icon: "Volume2", group: "general" },
  Admin: { tint: "gold", icon: "Award", group: "priority" },
  General: { tint: "mint", icon: "Megaphone", group: "general" },
};

const DEFAULT_CONFIG = { tint: "purple" as NoticeTintKey, icon: "Megaphone", group: "general" as const };

function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function noticeToItem(n: Notice): NoticeItem {
  const cfg = CAT_CONFIG[n.category] ?? DEFAULT_CONFIG;
  const isUrgent = n.priority === "urgent" || n.priority === "high";

  return {
    id: n.id,
    group: cfg.group,
    tint: cfg.tint,
    icon: cfg.icon,
    cat: n.category,
    pinned: n.priority === "urgent",
    priority: isUrgent ? (n.priority === "urgent" ? "Urgent" : "High") : undefined,
    title: n.title,
    date: formatDate(n.published_at),
    day: formatDay(n.published_at),
    month: formatMonth(n.published_at),
    time: formatTime(n.published_at),
    publishedAt: n.published_at,
    summary: n.summary ?? "",
    author: {
      initials: "CML",
      name: "CML Admin",
      role: "Admin",
      tint: cfg.tint,
    },
    body: n.body ? n.body.split("\n").filter((p) => p.trim().length > 0) : [],
    seen: 0,
  };
}

export function useNotices(limit: number = 100) {
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchNotices() {
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, category, summary, body, priority, published_at")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (cancelled) return;

      if (error) {
        console.error("[useNotices] Supabase error:", error.message);
      }

      if (data) {
        console.log("[useNotices] Fetched", data.length, "notices");
        setItems((data as unknown as Notice[]).map(noticeToItem));
      }
      setLoading(false);
    }

    fetchNotices().catch((err) => {
      console.error("[useNotices] Fetch failed:", err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { items, loading };
}
