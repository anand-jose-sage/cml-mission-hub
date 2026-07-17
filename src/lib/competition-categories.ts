export type CategorySlug = "sub_junior" | "junior" | "senior" | "super_senior" | "elder";

export const CATEGORY_LABELS: Record<string, string> = {
  sub_junior: "Sub Junior",
  junior: "Junior",
  senior: "Senior",
  super_senior: "Super Senior",
  elder: "Elder",
};

export const CATEGORY_COLORS: Record<string, string> = {
  sub_junior: "#34D3EE",
  junior: "#22C55E",
  senior: "#6B46FF",
  super_senior: "#F5A742",
  elder: "#9D99BC",
};

export function getCategorySlug(dob: string): CategorySlug | "" {
  if (!dob) return "";
  const d = new Date(dob + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  if (d >= new Date("2014-01-01T00:00:00")) return "sub_junior";
  if (d >= new Date("2011-01-01T00:00:00")) return "junior";
  if (d >= new Date("2007-01-01T00:00:00")) return "senior";
  if (d >= new Date("1986-01-01T00:00:00")) return "super_senior";
  return "elder";
}
