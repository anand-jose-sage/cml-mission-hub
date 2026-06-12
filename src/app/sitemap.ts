import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Fetch published content items for dynamic URLs
  try {
    const admin = getSupabaseAdmin();
    const { data: contentItems } = await admin
      .from("content_items")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(200);

    const contentUrls: MetadataRoute.Sitemap = (contentItems ?? [])
      .filter((item) => item.slug)
      .map((item) => ({
        url: `${SITE_URL}/content/${item.slug}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    return [...base, ...contentUrls];
  } catch {
    // Return base sitemap if DB is unreachable
    return base;
  }
}
