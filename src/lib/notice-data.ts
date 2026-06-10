// Notice Board — tint system, types, filters
// All notice data comes from Supabase via useNotices() hook.

export interface NoticeTint {
  grad: string;
  ink: string;
  dot: string;
  soft: string;
}

export const NOTICE_TINTS: Record<string, NoticeTint> = {
  purple: {
    grad: "linear-gradient(150deg, #EDE4FF 0%, #DAC8FF 100%)",
    ink: "#5B3FCC",
    dot: "#7C5CFF",
    soft: "rgba(91,63,204,0.12)",
  },
  gold: {
    grad: "linear-gradient(150deg, #FFF1CB 0%, #FFE08C 100%)",
    ink: "#9A6A00",
    dot: "#E2A312",
    soft: "rgba(154,106,0,0.14)",
  },
  coral: {
    grad: "linear-gradient(150deg, #FFE2D6 0%, #FFC4B2 100%)",
    ink: "#B5402B",
    dot: "#F4663F",
    soft: "rgba(181,64,43,0.12)",
  },
  mint: {
    grad: "linear-gradient(150deg, #D9F6E6 0%, #B6EDCD 100%)",
    ink: "#15803D",
    dot: "#2FB269",
    soft: "rgba(21,128,61,0.12)",
  },
  sky: {
    grad: "linear-gradient(150deg, #DCEDFF 0%, #BBDBFF 100%)",
    ink: "#0B6BB8",
    dot: "#3DA0F0",
    soft: "rgba(11,107,184,0.12)",
  },
};

export type NoticeTintKey = keyof typeof NOTICE_TINTS;

export interface NoticeAuthor {
  initials: string;
  name: string;
  role: string;
  tint: NoticeTintKey;
}

export interface NoticeEvent {
  date: string;
  time: string;
  venue: string;
}

export interface NoticeAttachment {
  name: string;
  size: string;
}

export interface NoticeItem {
  id: string;
  group: "priority" | "events" | "general";
  tint: NoticeTintKey;
  icon: string;
  cat: string;
  pinned?: boolean;
  priority?: string;
  title: string;
  date: string;
  day: string;
  month: string;
  time: string;
  publishedAt: string; // ISO date string for filtering
  summary: string;
  author: NoticeAuthor;
  event?: NoticeEvent;
  body: string[];
  attach?: NoticeAttachment;
  seen: number;
}

export const NOTICE_FILTERS = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "this-week", label: "This Week" },
  { id: "earlier", label: "Earlier" },
  { id: "priority", label: "Priority" },
  { id: "events", label: "Events" },
  { id: "general", label: "General" },
] as const;
