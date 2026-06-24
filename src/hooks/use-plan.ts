"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { PlanContent, PlanMeta, PlanMonth } from "@/types";

const PLAN_KEY = "pravarthana-2026-27";

// Client-side read of the annual plan (public RLS) for the Activities tab.
export function usePlanContent() {
  const [data, setData] = useState<PlanContent>({ meta: null, months: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let cancelled = false;

    supabase
      .from("plan_content")
      .select("key, value, sort_order")
      .like("key", `${PLAN_KEY}:%`)
      .order("sort_order", { ascending: true })
      .then(({ data: rows }) => {
        if (cancelled) return;
        let meta: PlanMeta | null = null;
        const months: PlanMonth[] = [];
        for (const r of rows ?? []) {
          if ((r.key as string).endsWith(":meta")) meta = r.value as PlanMeta;
          else months.push(r.value as PlanMonth);
        }
        months.sort((a, b) => a.index - b.index);
        setData({ meta, months });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { ...data, loading };
}
