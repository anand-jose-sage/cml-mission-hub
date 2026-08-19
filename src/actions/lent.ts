"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { LENT_KEY } from "@/lib/lent-theme";
import type { LentContent, LentMeta, LentDay } from "@/types";

// Read the whole Lent programme (meta + up to 40 days) in one query.
// Server-side via the admin client so the public module and the admin
// editor share one path.
export async function getLentContent(): Promise<LentContent> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("lent_content")
    .select("key, value, sort_order")
    .like("key", `${LENT_KEY}:%`)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getLentContent]", error.message);
    return { meta: null, days: [] };
  }

  let meta: LentMeta | null = null;
  const days: LentDay[] = [];
  for (const r of data ?? []) {
    if ((r.key as string).endsWith(":meta")) meta = r.value as LentMeta;
    else days.push(r.value as LentDay);
  }
  days.sort((a, b) => a.day - b.day);
  return { meta, days };
}

// Upsert one lent_content row (admin editor save). Service-role write.
export async function saveLentEntry(
  key: string,
  value: unknown,
  sortOrder: number
): Promise<{ error?: string }> {
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin
      .from("lent_content")
      .upsert(
        { key, value, sort_order: sortOrder, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("[saveLentEntry] unexpected:", e);
    return { error: "Something went wrong." };
  }
}
