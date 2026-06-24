"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PLAN_KEY } from "@/lib/plan-theme";
import type { PlanContent, PlanMeta, PlanMonth } from "@/types";

// Read the whole plan (meta + 11 months) in one query. Server-side via the
// admin client so the /plan route and the admin editor share one path.
export async function getPlanContent(): Promise<PlanContent> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("plan_content")
    .select("key, value, sort_order")
    .like("key", `${PLAN_KEY}:%`)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getPlanContent]", error.message);
    return { meta: null, months: [] };
  }

  let meta: PlanMeta | null = null;
  const months: PlanMonth[] = [];
  for (const r of data ?? []) {
    if ((r.key as string).endsWith(":meta")) meta = r.value as PlanMeta;
    else months.push(r.value as PlanMonth);
  }
  months.sort((a, b) => a.index - b.index);
  return { meta, months };
}

// Upsert one plan row (admin editor save). Service-role write.
export async function savePlanEntry(
  key: string,
  value: unknown,
  sortOrder: number
): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin
      .from("plan_content")
      .upsert(
        { key, value, sort_order: sortOrder, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[savePlanEntry] unexpected:", e);
    return { error: "Something went wrong." };
  }
}
