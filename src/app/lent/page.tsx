import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site-config";
import { LentPageClient } from "./lent-page-client";

const TITLE = "St. Michael's Lent";
const DESCRIPTION =
  "A 40-day journey of prayer, fasting, courage & spiritual warfare with St. Michael the Archangel — daily Scripture, reflection, prayer, and action.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/lent" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/lent`,
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
};

export default function LentPage() {
  return <LentPageClient />;
}
