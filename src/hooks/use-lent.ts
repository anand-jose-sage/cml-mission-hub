"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { LentContent, LentMeta, LentDay } from "@/types";
import { LENT_KEY } from "@/lib/lent-theme";

// Client-side read of St. Michael's Lent content (public RLS) for the public module.
export function useLentContent() {
  const [data, setData] = useState<LentContent>({ meta: null, days: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let cancelled = false;

    supabase
      .from("lent_content")
      .select("key, value, sort_order")
      .like("key", `${LENT_KEY}:%`)
      .order("sort_order", { ascending: true })
      .then(({ data: rows }) => {
        if (cancelled) return;
        let meta: LentMeta | null = null;
        const days: LentDay[] = [];
        for (const r of rows ?? []) {
          if ((r.key as string).endsWith(":meta")) meta = r.value as LentMeta;
          else days.push(r.value as LentDay);
        }
        days.sort((a, b) => a.day - b.day);
        setData({ meta, days });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { ...data, loading };
}
