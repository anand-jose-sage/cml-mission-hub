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
