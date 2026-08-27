-- ============================================================
-- Chance number — raise cap from 100 to 999
-- Run this in the Supabase SQL editor.
-- ============================================================

ALTER TABLE participant_registrations
  DROP CONSTRAINT IF EXISTS participant_registrations_chance_no_range;

ALTER TABLE participant_registrations
  ADD CONSTRAINT participant_registrations_chance_no_range
    CHECK (chance_no IS NULL OR (chance_no >= 1 AND chance_no <= 999));
