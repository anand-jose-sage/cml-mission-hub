-- CML Mission Hub — Supabase Schema
-- Run this in the Supabase SQL editor to create all tables and storage buckets.

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Seed default categories
insert into categories (name, slug) values
  ('Reflection', 'reflection'),
  ('Message', 'message'),
  ('Reel', 'reel'),
  ('Voice Note', 'voice-note'),
  ('Activity', 'activity'),
  ('Notice', 'notice'),
  ('Video', 'video'),
  ('Audio', 'audio'),
  ('Saint Reflection', 'saint-reflection')
on conflict (slug) do nothing;

-- ============================================================
-- CONTENT ITEMS
-- ============================================================
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content_type text not null check (content_type in (
    'reflection', 'message', 'reel', 'voice-note', 'activity',
    'notice', 'video', 'audio', 'saint-reflection'
  )),
  summary text,
  content text,
  thumbnail_url text,
  media_url text,
  featured boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_content_items_published on content_items (published_at desc);
create index idx_content_items_type on content_items (content_type);
create index idx_content_items_featured on content_items (featured) where featured = true;

-- ============================================================
-- NOTICES
-- ============================================================
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  summary text,
  body text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notices_published on notices (published_at desc);

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_date timestamptz not null,
  end_date timestamptz,
  cover_image text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_activities_start on activities (start_date asc);
create index idx_activities_featured on activities (featured) where featured = true;

-- ============================================================
-- MEDIA FILES
-- ============================================================
create table if not exists media_files (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'video', 'audio', 'document')),
  url text not null,
  thumbnail_url text,
  title text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_content_items
  before update on content_items
  for each row execute function update_updated_at();

create trigger set_updated_at_notices
  before update on notices
  for each row execute function update_updated_at();

create trigger set_updated_at_activities
  before update on activities
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (public read, authenticated write)
-- ============================================================
alter table content_items enable row level security;
alter table notices enable row level security;
alter table activities enable row level security;
alter table categories enable row level security;
alter table media_files enable row level security;

-- Public read for all tables
create policy "Public read" on content_items for select using (true);
create policy "Public read" on notices for select using (true);
create policy "Public read" on activities for select using (true);
create policy "Public read" on categories for select using (true);
create policy "Public read" on media_files for select using (true);

-- Authenticated write (for future admin auth)
create policy "Auth write" on content_items for all using (auth.role() = 'authenticated');
create policy "Auth write" on notices for all using (auth.role() = 'authenticated');
create policy "Auth write" on activities for all using (auth.role() = 'authenticated');
create policy "Auth write" on media_files for all using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('cml-images', 'cml-images', true),
  ('cml-videos', 'cml-videos', true),
  ('cml-audio', 'cml-audio', true),
  ('cml-documents', 'cml-documents', true)
on conflict (id) do nothing;

-- Public read access for all storage buckets
create policy "Public read images" on storage.objects for select using (bucket_id = 'cml-images');
create policy "Public read videos" on storage.objects for select using (bucket_id = 'cml-videos');
create policy "Public read audio" on storage.objects for select using (bucket_id = 'cml-audio');
create policy "Public read documents" on storage.objects for select using (bucket_id = 'cml-documents');
