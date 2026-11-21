export type CategorySlug = "sub_junior" | "junior" | "senior" | "super_senior" | "elder" | "poombatta_1" | "poombatta_2";

export const CATEGORY_LABELS: Record<string, string> = {
  sub_junior: "Sub Junior",
  junior: "Junior",
  senior: "Senior",
  super_senior: "Super Senior",
  elder: "Elder",
  poombatta_1: "പൂമ്പാറ്റ 1",
  poombatta_2: "പൂമ്പാറ്റ 2",
};

export const CATEGORY_COLORS: Record<string, string> = {
  sub_junior: "#34D3EE",
  junior: "#22C55E",
  senior: "#6B46FF",
  super_senior: "#F5A742",
  elder: "#9D99BC",
  poombatta_1: "#EC4899",
  poombatta_2: "#F43F5E",
};

// feastCategorySlugs: category slugs of the feast's competitions. A feast that uses
// the Poombatta categories (Thirubalasakhyam) classifies by those ranges instead.
export function getCategorySlug(dob: string, feastCategorySlugs?: (string | null | undefined)[]): CategorySlug | "" {
  if (!dob) return "";
  const d = new Date(dob + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  if (feastCategorySlugs?.some((s) => s?.startsWith("poombatta"))) {
    if (dob >= "2019-01-01" && dob <= "2021-12-31") return "poombatta_1";
    if (dob >= "2016-01-01" && dob <= "2018-12-31") return "poombatta_2";
    return "";
  }
  if (d >= new Date("2014-01-01T00:00:00")) return "sub_junior";
  if (d >= new Date("2011-01-01T00:00:00")) return "junior";
  if (d >= new Date("2007-01-01T00:00:00")) return "senior";
  if (d >= new Date("1986-01-01T00:00:00")) return "super_senior";
  return "elder";
}
