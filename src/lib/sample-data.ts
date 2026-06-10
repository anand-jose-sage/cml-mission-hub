import type { TintColor } from "./theme";

export interface MissionItem {
  icon: string;
  tint: TintColor;
  type: string;
  title: string;
  time: string;
  day: string;
  month: string;
  excerpt: string;
  media: "reel" | "audio" | "text";
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  done?: boolean;
}

export interface FeedItem {
  cat: string;
  tint: TintColor;
  title: string;
  sum: string;
  time: string;
  h: number;
}

export const DAY_LABELS = [
  "Today",
  "Tomorrow",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export interface DayContentItem {
  id: string;
  type: "reel" | "voice" | "notice";
  title: string;
  summary: string;
  time: string;
  duration?: string;
}

export const NAV_ITEMS = [
  { id: "home", icon: "Home", label: "Home" },
  { id: "activities", icon: "LayoutGrid", label: "Activities" },
  { id: "media", icon: "Film", label: "Media" },
  { id: "notices", icon: "Megaphone", label: "Notices" },
  { id: "about", icon: "Info", label: "About" },
] as const;
