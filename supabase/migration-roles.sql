-- CML Mission Hub — Role System Migration
-- Run this in the Supabase SQL editor AFTER the initial schema.sql

-- ============================================================
-- SHAKHAS (Branches)
-- ============================================================
create table if not exists shakhas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Seed shakha data
insert into shakhas (name, slug) values
  ('Charity', 'charity'),
  ('Edapetti', 'edapetti'),
  ('Kalathuvayal', 'kalathuvayal'),
  ('Kolavayal', 'kolavayal')
on conflict (slug) do nothing;

-- ============================================================
-- PROFILES (linked to auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'admin' check (role in ('admin', 'me_admin', 'sa_admin')),
  shakha_id uuid references shakhas(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles (role);
create index idx_profiles_shakha on profiles (shakha_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger for profiles
create trigger set_updated_at_profiles
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- ADD created_by TO EXISTING TABLES
-- ============================================================
alter table activities add column if not exists created_by uuid references profiles(id) on delete set null;
alter table notices add column if not exists created_by uuid references profiles(id) on delete set null;
alter table content_items add column if not exists created_by uuid references profiles(id) on delete set null;

-- ============================================================
-- RLS FOR NEW TABLES
-- ============================================================
alter table profiles enable row level security;
alter table shakhas enable row level security;

-- Shakhas: public read
create policy "Public read shakhas" on shakhas for select using (true);

-- Profiles: users can read all profiles, update only their own
create policy "Users can read all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Profiles: sa_admin and me_admin can insert/update/delete any profile
create policy "Admin manage profiles" on profiles for all using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
    and p.role in ('sa_admin', 'me_admin')
  )
);
