import type { CategorySlug } from "@/lib/competition-categories";

export interface DemoCompetition {
  id: string;
  name: string;
  cat: "Individual" | "Team";
  time: string;
  icon: string;
  gender: "boys" | "girls" | null;
  categorySlug: CategorySlug | null;
}

export const DEMO_PARTICIPANT = {
  name: "Ann Maria Joy",
  houseName: "Thekkedath House",
  dob: "2008-04-15",
  gender: "girl" as const,
  phone: "9876543210",
  category: "senior" as CategorySlug,
  shakha: { name: "Kalpetta", color: "#1D4ED8" },
};

export const DEMO_FEAST = {
  slug: "literature-feast-2026",
  name: "Literature Feast",
  year: "2026",
  accent: "#A855F7",
};

export const DEMO_COMPETITIONS: DemoCompetition[] = [
  { id: "essay",      name: "Essay Writing",         cat: "Individual", time: "9:30 AM",  icon: "FileText", gender: null,    categorySlug: "senior" },
  { id: "poetry",     name: "Poetry Writing",        cat: "Individual", time: "10:30 AM", icon: "PenTool",  gender: null,    categorySlug: "senior" },
  { id: "story",      name: "Story Writing",         cat: "Individual", time: "11:30 AM", icon: "BookOpen", gender: null,    categorySlug: "senior" },
];

export const DEMO_SELECTED_IDS = ["essay", "story"];

export const DEMO_REG_NO = "LF26-0148";
