-- ============================================================
-- Result Management & Shakha Point Aggregation System
-- ============================================================

-- 1. Add max_score and result_status to feast_competitions
ALTER TABLE feast_competitions
  ADD COLUMN IF NOT EXISTS max_score      INTEGER NULL,
  ADD COLUMN IF NOT EXISTS result_status  TEXT    NOT NULL DEFAULT 'draft'
    CHECK (result_status IN ('draft', 'published'));

-- 2. competition_results — one row per participant registration
CREATE TABLE IF NOT EXISTS competition_results (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_competition_id        UUID        NOT NULL REFERENCES feast_competitions(id) ON DELETE CASCADE,
  participant_registration_id UUID        NOT NULL REFERENCES participant_registrations(id) ON DELETE CASCADE,
  score                       NUMERIC     NOT NULL DEFAULT 0,
  grade                       TEXT        NULL CHECK (grade IN ('A', 'B', 'C')),
  grade_points                INTEGER     NOT NULL DEFAULT 0,
  position                    INTEGER     NULL,
  position_points             INTEGER     NOT NULL DEFAULT 0,
  total_points                INTEGER     NOT NULL DEFAULT 0,
  published_at                TIMESTAMPTZ NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_registration_id)
);

-- 3. shakha_point_ledger — audit trail, rebuilt on every publish
CREATE TABLE IF NOT EXISTS shakha_point_ledger (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_id                    UUID        NOT NULL REFERENCES feasts(id) ON DELETE CASCADE,
  feast_competition_id        UUID        NOT NULL REFERENCES feast_competitions(id) ON DELETE CASCADE,
  participant_registration_id UUID        NOT NULL REFERENCES participant_registrations(id) ON DELETE CASCADE,
  participant_id              UUID        NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  shakha_id                   UUID        NOT NULL REFERENCES shakhas(id) ON DELETE CASCADE,
  category_slug               TEXT        NOT NULL,
  score                       NUMERIC     NOT NULL DEFAULT 0,
  grade                       TEXT        NULL,
  position                    INTEGER     NULL,
  grade_points                INTEGER     NOT NULL DEFAULT 0,
  position_points             INTEGER     NOT NULL DEFAULT 0,
  total_points                INTEGER     NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. shakha_feast_standings — always rebuilt from ledger
CREATE TABLE IF NOT EXISTS shakha_feast_standings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_id            UUID        NOT NULL REFERENCES feasts(id) ON DELETE CASCADE,
  shakha_id           UUID        NOT NULL REFERENCES shakhas(id) ON DELETE CASCADE,
  sub_junior_points   INTEGER     NOT NULL DEFAULT 0,
  junior_points       INTEGER     NOT NULL DEFAULT 0,
  senior_points       INTEGER     NOT NULL DEFAULT 0,
  super_senior_points INTEGER     NOT NULL DEFAULT 0,
  elder_points        INTEGER     NOT NULL DEFAULT 0,
  grand_total         INTEGER     NOT NULL DEFAULT 0,
  first_place_count   INTEGER     NOT NULL DEFAULT 0,
  second_place_count  INTEGER     NOT NULL DEFAULT 0,
  third_place_count   INTEGER     NOT NULL DEFAULT 0,
  a_grade_count       INTEGER     NOT NULL DEFAULT 0,
  b_grade_count       INTEGER     NOT NULL DEFAULT 0,
  c_grade_count       INTEGER     NOT NULL DEFAULT 0,
  rank                INTEGER     NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feast_id, shakha_id)
);
