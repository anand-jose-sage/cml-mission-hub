-- Add missing columns to activities table
-- Run this in the Supabase SQL editor

alter table activities add column if not exists summary text;
alter table activities add column if not exists thumbnail_url text;
alter table activities add column if not exists media_url text;
alter table activities add column if not exists saint_name text;
