// ============================================================
// ROLES & AUTH
// ============================================================
export type UserRole = "admin" | "me_admin" | "sa_admin";

export interface Shakha {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  shakha_id: string | null;
  created_at: string;
  updated_at: string;
  // joined from shakhas table
  shakha?: Shakha | null;
}

// ============================================================
// CONTENT
// ============================================================
export type ContentType =
  | "reflection"
  | "message"
  | "reel"
  | "voice-note"
  | "activity"
  | "notice"
  | "video"
  | "audio"
  | "saint-reflection";

export type Priority = "low" | "normal" | "high" | "urgent";

export type MediaType = "image" | "video" | "audio" | "document";

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content_type: ContentType;
  summary: string | null;
  content: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  featured: boolean;
  published_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  body: string | null;
  priority: Priority;
  published_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityCategory =
  | "feast"
  | "solemnity"
  | "memorial"
  | "meeting"
  | "gathering"
  | "outreach"
  | "formation"
  | "camp"
  | "music"
  | "fundraiser"
  | "season"
  | "celebration"
  | "activity";

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category: ActivityCategory | null;
  all_day: boolean;
  location: string | null;
  start_date: string;
  end_date: string | null;
  cover_image: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  saint_name: string | null;
  featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface MediaFile {
  id: string;
  type: MediaType;
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  created_at: string;
}

// ============================================================
// FEAST PORTAL
// ============================================================
export type FeastStatus = "draft" | "registration_open" | "ongoing" | "completed";
export type CompetitionType = "individual" | "group";
export type MedalType = "gold" | "silver" | "bronze";

export interface FeastDB {
  id: string;
  name: string;
  slug: string;
  type: string;
  year: string;
  status: FeastStatus;
  description: string | null;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  category: string | null;          // art | music | writing | dance | drama | speech | quiz
  gender: string | null;            // boys | girls | open
  competition_category_id: string | null;
  description: string | null;
  created_at: string;
  competition_category?: CompetitionCategory;
}

export interface FeastCompetition {
  id: string;
  feast_id: string;
  competition_id: string;
  display_order: number;
  time_slot: string | null;
  venue: string | null;
  max_slots: number | null;
  created_at: string;
  competition?: Competition;
}

export interface CompetitionCategory {
  id: string;
  slug: string;
  name: string;
  min_dob: string | null;
  max_dob: string | null;
  sort_order: number;
  created_at: string;
}

export interface Participant {
  id: string;
  feast_id: string;
  shakha_id: string | null;
  name: string;
  house_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  category: string | null;
  competition_category_id: string | null;
  phone: string | null;
  registration_number: string | null;
  created_at: string;
  updated_at: string;
  shakha?: Shakha;
  competition_category?: CompetitionCategory;
}

export interface ParticipantRegistration {
  id: string;
  participant_id: string;
  feast_competition_id: string;
  created_at: string;
  feast_competition?: FeastCompetition;
}

export interface Score {
  id: string;
  participant_registration_id: string;
  score: number;
  remarks: string | null;
  entered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Result {
  id: string;
  participant_registration_id: string;
  position: number;
  medal_type: MedalType | null;
  total_score: number | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupTeam {
  id: string;
  feast_id: string;
  shakha_id: string | null;
  feast_competition_id: string;
  team_name: string;
  created_at: string;
}

// ============================================================
// ANNUAL PLAN (Pravarthana Margarekha) — key-value JSONB content
// ============================================================
export interface PlanProject { title: string; desc: string; }
export interface PlanPillar { label: string; title: string; desc: string; }
export interface PlanChurchPartRef { monthKey: string; ml: string; en: string; index: number; }

export interface PlanMeta {
  org: string;
  title: string;
  yearLabel: string;
  yearTheme: string;
  subTheme: string;
  subThemeLine: string;
  objectives: string[];
  projects: PlanProject[];
  buildChurch: {
    intro: string;
    quote: string;
    quoteRef: string;
    littleWay: string;
    pillars: PlanPillar[];
    parts: PlanChurchPartRef[];
  };
  virtues: string[];
  awards: string[];
}

export interface PlanFeastDay { date: string; day: string; name: string; type: string; }
export interface PlanProgram { title: string; desc: string; }

export interface PlanMonth {
  index: number;
  monthKey: string;          // e.g. "2026-07"
  monthEn: string;           // e.g. "JULY 2026"
  monthMl: string;           // e.g. "ജൂലൈ"
  accent: string;            // hex
  actionTheme: string;
  churchLine: string;
  churchPart: { ml: string; en: string; index: number; total: number };
  tagline: string;
  description: string;
  virtue: string;
  stones: string[];
  feastDays: PlanFeastDay[];
  programs: PlanProgram[];
}

export interface PlanContent { meta: PlanMeta | null; months: PlanMonth[]; }

export interface Database {
  public: {
    Tables: {
      content_items: {
        Row: ContentItem;
        Insert: Omit<ContentItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ContentItem, "id" | "created_at" | "updated_at">>;
      };
      notices: {
        Row: Notice;
        Insert: Omit<Notice, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Notice, "id" | "created_at" | "updated_at">>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Activity, "id" | "created_at" | "updated_at">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      media_files: {
        Row: MediaFile;
        Insert: Omit<MediaFile, "id" | "created_at">;
        Update: Partial<Omit<MediaFile, "id" | "created_at">>;
      };
    };
  };
}
