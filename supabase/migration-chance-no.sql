-- ============================================================
-- Chance number
-- A per-competition draw/lot number (1-100) assigned to a
-- registration from the admin Attendance page — used to order
-- participants for judging. Nullable until assigned.
-- Run this in the Supabase SQL editor.
-- ============================================================

ALTER TABLE participant_registrations
  ADD COLUMN IF NOT EXISTS chance_no smallint;

ALTER TABLE participant_registrations
  DROP CONSTRAINT IF EXISTS participant_registrations_chance_no_range;

ALTER TABLE participant_registrations
  ADD CONSTRAINT participant_registrations_chance_no_range
    CHECK (chance_no IS NULL OR (chance_no >= 1 AND chance_no <= 100));

CREATE INDEX IF NOT EXISTS participant_registrations_chance_no_idx
  ON participant_registrations (feast_competition_id, chance_no);
