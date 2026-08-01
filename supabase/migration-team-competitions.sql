-- ============================================================
-- TEAM COMPETITIONS
-- Registration-by-Shakha for competitions where competitions.type = 'group'.
-- Mirrors participant_registrations / competition_results / shakha_point_ledger,
-- keyed on team_registrations instead of participant_registrations.
-- Idempotent. Run AFTER migration-feast.sql and migration-results-system.sql.
-- ============================================================

-- 1. team_registrations — one row per Shakha per team competition
CREATE TABLE IF NOT EXISTS team_registrations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_id             UUID        NOT NULL REFERENCES feasts(id) ON DELETE CASCADE,
  feast_competition_id UUID        NOT NULL REFERENCES feast_competitions(id) ON DELETE CASCADE,
  shakha_id            UUID        NOT NULL REFERENCES shakhas(id) ON DELETE CASCADE,
  team_name            TEXT        NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feast_competition_id, shakha_id)   -- one team per Shakha per competition
);
CREATE INDEX IF NOT EXISTS team_registrations_feast_idx ON team_registrations(feast_id);

-- 2. team_registration_members — roster (max 7 enforced app-side, see notes)
CREATE TABLE IF NOT EXISTS team_registration_members (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_registration_id  UUID        NOT NULL REFERENCES team_registrations(id) ON DELETE CASCADE,
  participant_id        UUID        NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  -- denormalized from the parent row so "one team per competition per participant"
  -- can be a plain DB constraint
  feast_competition_id  UUID        NOT NULL REFERENCES feast_competitions(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_registration_id, participant_id),   -- no duplicate member within a team
  UNIQUE (participant_id, feast_competition_id)    -- can't be on 2 teams for the same competition
);
CREATE INDEX IF NOT EXISTS team_registration_members_team_idx ON team_registration_members(team_registration_id);

-- keep the denormalized feast_competition_id honest
CREATE OR REPLACE FUNCTION check_team_member_fc_match()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE parent_fc UUID;
BEGIN
  SELECT feast_competition_id INTO parent_fc FROM team_registrations WHERE id = NEW.team_registration_id;
  IF parent_fc IS DISTINCT FROM NEW.feast_competition_id THEN
    RAISE EXCEPTION 'team_registration_members.feast_competition_id must match parent team_registrations row';
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'team_registration_members_fc_check') THEN
    CREATE TRIGGER team_registration_members_fc_check
      BEFORE INSERT OR UPDATE ON team_registration_members
      FOR EACH ROW EXECUTE PROCEDURE check_team_member_fc_match();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'team_registrations_updated_at') THEN
    CREATE TRIGGER team_registrations_updated_at
      BEFORE UPDATE ON team_registrations FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
END $$;

-- 3. team_results — mirrors competition_results, keyed on team_registration_id
CREATE TABLE IF NOT EXISTS team_results (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_competition_id  UUID        NOT NULL REFERENCES feast_competitions(id) ON DELETE CASCADE,
  team_registration_id  UUID        NOT NULL REFERENCES team_registrations(id) ON DELETE CASCADE,
  score                 NUMERIC     NOT NULL DEFAULT 0,
  grade                 TEXT        NULL CHECK (grade IN ('A', 'B', 'C')),
  grade_points          INTEGER     NOT NULL DEFAULT 0,
  position              INTEGER     NULL,
  position_points       INTEGER     NOT NULL DEFAULT 0,
  total_points          INTEGER     NOT NULL DEFAULT 0,
  published_at          TIMESTAMPTZ NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_registration_id)
);

-- 4. shakha_point_ledger — allow team-sourced rows alongside participant-sourced ones
ALTER TABLE shakha_point_ledger
  ALTER COLUMN participant_registration_id DROP NOT NULL,
  ALTER COLUMN participant_id              DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS team_registration_id UUID NULL REFERENCES team_registrations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS shakha_point_ledger_team_idx ON shakha_point_ledger(team_registration_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shakha_point_ledger_source_check') THEN
    ALTER TABLE shakha_point_ledger
      ADD CONSTRAINT shakha_point_ledger_source_check
      CHECK (
        (participant_registration_id IS NOT NULL AND team_registration_id IS NULL)
        OR
        (participant_registration_id IS NULL AND team_registration_id IS NOT NULL)
      );
  END IF;
END $$;
-- Team ledger rows use category_slug = 'team' (routed to team_points, not an age bucket)

-- 5. shakha_feast_standings — new bucket, included in grand_total automatically
ALTER TABLE shakha_feast_standings
  ADD COLUMN IF NOT EXISTS team_points INTEGER NOT NULL DEFAULT 0;

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE team_registrations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_registration_members ENABLE ROW LEVEL SECURITY;
-- team_results: RLS intentionally NOT enabled — matches the existing convention on
-- competition_results / shakha_point_ledger / shakha_feast_standings (service-role-only
-- by convention, not Postgres-enforced; a pre-existing pattern in this codebase).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_registrations' AND policyname='team_registrations_public_read') THEN
    CREATE POLICY "team_registrations_public_read" ON team_registrations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_registration_members' AND policyname='team_registration_members_public_read') THEN
    CREATE POLICY "team_registration_members_public_read" ON team_registration_members FOR SELECT USING (true);
  END IF;
END $$;
-- No public INSERT/UPDATE/DELETE — team creation needs multi-row transactional
-- validation (Shakha uniqueness, member cap, cross-team dedup) that only the
-- registerTeam() server action performs, via getSupabaseAdmin().
