-- Chance number — raise cap from 999 to 10000 (participant + team registrations)

ALTER TABLE participant_registrations
  DROP CONSTRAINT IF EXISTS participant_registrations_chance_no_range;

ALTER TABLE participant_registrations
  ADD CONSTRAINT participant_registrations_chance_no_range
    CHECK (chance_no IS NULL OR (chance_no >= 1 AND chance_no <= 10000));

ALTER TABLE team_registrations
  DROP CONSTRAINT IF EXISTS team_registrations_chance_no_range;

ALTER TABLE team_registrations
  ADD CONSTRAINT team_registrations_chance_no_range
    CHECK (chance_no IS NULL OR (chance_no >= 1 AND chance_no <= 10000));
