export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://cml-hub.vercel.app");

export const SITE_NAME = "Cherupushpa Mission League Kalpetta Meghala | ചെറുപുഷ്പ മിഷൻ ലീഗ് കൽപ്പറ്റ മേഖല";
export const SITE_SHORT_NAME = "CML Kalpetta";
export const SITE_DESCRIPTION =
  "Official website of Cherupushpa Mission League (CML),Kalpetta Meghala under Diocese of Mananthavady. Get the latest notices, activities, feast registrations, results, spiritual messages, downloads, and mission updates.";
export const SITE_KEYWORDS = [
  "CML", "Cherupushpa Mission League", "Kalpetta", "Catholic mission",
  "feast competitions", "literature feast", "arts feast",
  "mission hub", "CML Kalpetta", "Meghala", "Malayalam mission","ചെറുപുഷ്പ മിഷൻ ലീഗ്",
  "കൽപ്പറ്റ മേഖല",
  "സിഎംഎൽ",
  "കത്തോലിക്കാ സഭ",
  "സീറോ മലബാർ",
  "കലാമത്സരം",
  "സാഹിത്യ മത്സരം"
];
export const SITE_LOCALE = "en_IN";
export const SITE_LANG = "en";

export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO_URL = `${SITE_URL}/logo.png`;

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cherupushpa Mission League",
  alternateName: "CML Kalpetta",
  url: SITE_URL,
  logo: LOGO_URL,
  description: SITE_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kalpetta",
    addressRegion: "Kerala",
    addressCountry: "IN",
  },
  sameAs: [],
};

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};
