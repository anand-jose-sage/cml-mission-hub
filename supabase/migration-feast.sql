-- ============================================================
-- FEAST PORTAL TABLES
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. feasts
CREATE TABLE IF NOT EXISTS feasts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  type        text NOT NULL DEFAULT 'literature', -- literature | arts | sports | general
  year        text NOT NULL DEFAULT '2026',
  status      text NOT NULL DEFAULT 'draft',      -- draft | registration_open | ongoing | completed
  description text,
  venue       text,
  start_date  date,
  end_date    date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. competitions (master list)
CREATE TABLE IF NOT EXISTS competitions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL DEFAULT 'individual',  -- individual | group
  category    text,                                 -- writing | speech | art | music | dance | drama
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. feast_competitions (join feast to competitions with order)
CREATE TABLE IF NOT EXISTS feast_competitions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_id      uuid NOT NULL REFERENCES feasts(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  display_order  int NOT NULL DEFAULT 0,
  time_slot     text,
  venue         text,
  max_slots     int,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feast_id, competition_id)
);

-- 4. participants
CREATE TABLE IF NOT EXISTS participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_id      uuid NOT NULL REFERENCES feasts(id) ON DELETE CASCADE,
  shakha_id     uuid REFERENCES shakhas(id),
  name          text NOT NULL,
  date_of_birth date,
  gender        text,                 -- male | female | other
  category      text,                 -- junior | senior | etc.
  phone         text,
  registration_number text UNIQUE,   -- auto-generated e.g. LF26-0123
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 5. participant_registrations (participant → competition mapping)
CREATE TABLE IF NOT EXISTS participant_registrations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id        uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  feast_competition_id  uuid NOT NULL REFERENCES feast_competitions(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_id, feast_competition_id)
);

-- 6. group_teams
CREATE TABLE IF NOT EXISTS group_teams (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_id             uuid NOT NULL REFERENCES feasts(id) ON DELETE CASCADE,
  shakha_id            uuid REFERENCES shakhas(id),
  feast_competition_id uuid NOT NULL REFERENCES feast_competitions(id) ON DELETE CASCADE,
  team_name            text NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- 7. scores
CREATE TABLE IF NOT EXISTS scores (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_registration_id uuid NOT NULL REFERENCES participant_registrations(id) ON DELETE CASCADE,
  score                      numeric(6,2) NOT NULL DEFAULT 0,
  remarks                    text,
  entered_by                 uuid REFERENCES profiles(id),
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_registration_id)
);

-- 8. results (auto-calculated or manually confirmed)
CREATE TABLE IF NOT EXISTS results (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_registration_id uuid NOT NULL REFERENCES participant_registrations(id) ON DELETE CASCADE,
  position                   int NOT NULL,
  medal_type                 text,          -- gold | silver | bronze | NULL
  total_score                numeric(6,2),
  published                  boolean NOT NULL DEFAULT false,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_registration_id)
);

-- ── updated_at triggers ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'feasts_updated_at') THEN
    CREATE TRIGGER feasts_updated_at BEFORE UPDATE ON feasts FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'participants_updated_at') THEN
    CREATE TRIGGER participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'scores_updated_at') THEN
    CREATE TRIGGER scores_updated_at BEFORE UPDATE ON scores FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'results_updated_at') THEN
    CREATE TRIGGER results_updated_at BEFORE UPDATE ON results FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
END $$;

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE feasts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE feast_competitions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE results                 ENABLE ROW LEVEL SECURITY;

-- Public read for feasts, competitions, feast_competitions, results (published)
CREATE POLICY "feasts_public_read"            ON feasts                  FOR SELECT USING (true);
CREATE POLICY "competitions_public_read"      ON competitions            FOR SELECT USING (true);
CREATE POLICY "feast_competitions_public_read" ON feast_competitions     FOR SELECT USING (true);
CREATE POLICY "participants_public_read"      ON participants            FOR SELECT USING (true);
CREATE POLICY "registrations_public_read"     ON participant_registrations FOR SELECT USING (true);
CREATE POLICY "group_teams_public_read"       ON group_teams             FOR SELECT USING (true);
CREATE POLICY "scores_public_read"            ON scores                  FOR SELECT USING (true);
CREATE POLICY "results_public_read"           ON results                 FOR SELECT USING (published = true);

-- Auth users can insert participants and registrations (public registration)
CREATE POLICY "participants_public_insert"    ON participants            FOR INSERT WITH CHECK (true);
CREATE POLICY "registrations_public_insert"   ON participant_registrations FOR INSERT WITH CHECK (true);

-- Authenticated users (admins) can do everything
CREATE POLICY "feasts_auth_all"               ON feasts                  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "competitions_auth_all"         ON competitions            FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "feast_competitions_auth_all"   ON feast_competitions      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "group_teams_auth_all"          ON group_teams             FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "scores_auth_all"               ON scores                  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "results_auth_all"              ON results                 FOR ALL USING (auth.role() = 'authenticated');

-- ── Seed default competitions ─────────────────────────────────
INSERT INTO competitions (name, type, category) VALUES
  ('Essay Writing',          'individual', 'writing'),
  ('Poetry Writing',         'individual', 'writing'),
  ('Story Writing',          'individual', 'writing'),
  ('Elocution',              'individual', 'speech'),
  ('Recitation',             'individual', 'speech'),
  ('Debate',                 'group',      'speech'),
  ('Bible & Literature Quiz','group',      'quiz'),
  ('Pencil Drawing',         'individual', 'art'),
  ('Water Colour Painting',  'individual', 'art'),
  ('Poster Making',          'individual', 'art'),
  ('Solo Song',              'individual', 'music'),
  ('Group Song',             'group',      'music'),
  ('Classical Dance',        'individual', 'dance'),
  ('Folk Dance',             'group',      'dance'),
  ('Skit',                   'group',      'drama'),
  ('Mime',                   'group',      'drama'),
  ('Mono Act',               'individual', 'drama'),
  ('Margamkali',             'group',      'dance'),
  ('Parichamuttukali',       'group',      'dance')
ON CONFLICT DO NOTHING;
