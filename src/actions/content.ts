"use server";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ContentItem, Notice, Activity } from "@/types";

export async function getContentItems(options?: {
  type?: string;
  featured?: boolean;
  limit?: number;
}) {
  if (!isSupabaseConfigured) return [] as ContentItem[];
  let query = supabase
    .from("content_items")
    .select("id, title, slug, content_type, summary, content, thumbnail_url, media_url, featured, published_at")
    .order("published_at", { ascending: false });

  if (options?.type) {
    query = query.eq("content_type", options.type);
  }
  if (options?.featured) {
    query = query.eq("featured", true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ContentItem[];
}

export async function getContentBySlug(slug: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as ContentItem;
}

export async function createContentItem(
  item: Omit<ContentItem, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("content_items")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data as ContentItem;
}

export async function updateContentItem(
  id: string,
  updates: Partial<Omit<ContentItem, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("content_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ContentItem;
}

export async function deleteContentItem(id: string) {
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) throw error;
}

export async function getNotices(options?: { limit?: number }) {
  let query = supabase
    .from("notices")
    .select("id, title, category, summary, body, priority, published_at")
    .order("published_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Notice[];
}

export async function createNotice(
  notice: Omit<Notice, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("notices")
    .insert(notice)
    .select()
    .single();

  if (error) throw error;
  return data as Notice;
}

export async function updateNotice(
  id: string,
  updates: Partial<Omit<Notice, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("notices")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Notice;
}

export async function deleteNotice(id: string) {
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw error;
}

export async function getActivities(options?: {
  upcoming?: boolean;
  featured?: boolean;
  limit?: number;
}) {
  let query = supabase.from("activities").select("id, title, category, all_day, location, start_date, end_date, featured");

  if (options?.upcoming) {
    query = query
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });
  } else {
    query = query.order("start_date", { ascending: false });
  }

  if (options?.featured) {
    query = query.eq("featured", true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Activity[];
}

export async function createActivity(
  activity: Omit<Activity, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("activities")
    .insert(activity)
    .select()
    .single();

  if (error) throw error;
  return data as Activity;
}

export async function updateActivity(
  id: string,
  updates: Partial<Omit<Activity, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("activities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Activity;
}

export async function deleteActivity(id: string) {
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw error;
}
