-- ============================================================
-- TEAM MAX SIZE — per-competition roster cap
-- competitions.max_team_size lets a team (group) competition override the
-- app-wide default of 7 members (src/actions/team.ts DEFAULT_MAX_TEAM_MEMBERS).
-- Mirrors the existing max_per_shakha pattern. Idempotent.
-- Run AFTER migration-team-competitions.sql.
-- ============================================================

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS max_team_size INTEGER NULL;

-- പരിചമുട്ടുകളി (Parichamuttukali) — allow 8 members instead of the default 7
UPDATE competitions
  SET max_team_size = 8
  WHERE id = '9fc72f3c-ab0b-4f7e-8501-df1681d52a44';

-- ബൈബിൾ ദൃശ്യാവതരണം (Bible Tableau) — cap at 5 members
UPDATE competitions
  SET max_team_size = 5
  WHERE id = 'ea36de4d-0fb0-4b33-a93e-a181ee849797';
