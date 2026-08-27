-- ============================================================
-- Team attendance + chance number
-- Mirrors participant_registrations.participated / chance_no
-- (see migration-participation-marking.sql, migration-chance-no.sql,
-- migration-chance-no-999.sql) but keyed on team_registrations, so
-- group-type competitions can be marked/drawn from the admin
-- Attendance page just like individual competitions.
-- Run this in the Supabase SQL editor.
-- ============================================================

ALTER TABLE team_registrations
  ADD COLUMN IF NOT EXISTS participated boolean NOT NULL DEFAULT false;

ALTER TABLE team_registrations
  ADD COLUMN IF NOT EXISTS chance_no smallint;

ALTER TABLE team_registrations
  DROP CONSTRAINT IF EXISTS team_registrations_chance_no_range;

ALTER TABLE team_registrations
  ADD CONSTRAINT team_registrations_chance_no_range
    CHECK (chance_no IS NULL OR (chance_no >= 1 AND chance_no <= 999));

CREATE INDEX IF NOT EXISTS team_registrations_participated_idx
  ON team_registrations (feast_competition_id, participated);

CREATE INDEX IF NOT EXISTS team_registrations_chance_no_idx
  ON team_registrations (feast_competition_id, chance_no);
