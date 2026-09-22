import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site-config";
import { StTheresaNovena } from "@/components/novena/st-theresa-novena";

const TITLE = "St. Little Thérèse Novena";
const DESCRIPTION =
  "Novena prayer to St. Thérèse of Lisieux (the Little Flower) — opening hymn, Psalm 27, litany, and closing prayers, for her feast day on October 1.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/novena/st-theresa" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/novena/st-theresa`,
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
};

export default function NovenaStTheresaPage() {
  return <StTheresaNovena />;
}
