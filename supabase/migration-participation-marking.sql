-- ============================================================
-- Participation marking
-- Tracks whether a registered participant actually took part
-- in a given competition. Toggled from the admin Participation
-- page; used to drive the printable judging score sheet.
-- Run this in the Supabase SQL editor.
-- ============================================================

ALTER TABLE participant_registrations
  ADD COLUMN IF NOT EXISTS participated boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS participant_registrations_participated_idx
  ON participant_registrations (feast_competition_id, participated);
