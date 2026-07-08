-- ============================================================
-- Query performance: missing indexes + feast-count aggregate RPC
-- Run this in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Addresses:
--   1. Missing indexes on FK columns hit by the Feast Details,
--      Feast Results and Home screens (src/hooks/use-feast.ts,
--      src/actions/results.ts).
--   2. Replaces two full-row-fetch-then-count-in-JS queries in
--      useFeasts() (src/hooks/use-feast.ts) with a single grouped
--      aggregate RPC call.
-- ============================================================

-- ── 1. Indexes ─────────────────────────────────────────────────

-- Highest priority: filtered on every results view/publish/unpublish/
-- score-entry round trip (src/actions/results.ts: getCompetitionScores,
-- getPublishedResults, publishResults, unpublishResults, getScreenData).
-- Only a UNIQUE index on participant_registration_id exists today.
CREATE INDEX IF NOT EXISTS competition_results_feast_competition_id_idx
  ON competition_results (feast_competition_id);

-- Filtered on every Feast Details / Results load (src/hooks/use-feast.ts
-- useFeast, useParticipants) and in searchParticipantResults
-- (src/actions/results.ts). No index exists at all today.
CREATE INDEX IF NOT EXISTS participants_feast_id_idx
  ON participants (feast_id);

-- Rewritten/read on every publish, unpublish and standings rebuild
-- (src/actions/results.ts: publishResults, unpublishResults,
-- rebuildStandings). No index beyond the PK exists today.
CREATE INDEX IF NOT EXISTS shakha_point_ledger_feast_id_idx
  ON shakha_point_ledger (feast_id);

CREATE INDEX IF NOT EXISTS shakha_point_ledger_feast_competition_id_idx
  ON shakha_point_ledger (feast_competition_id);

-- NOTE: participant_registrations.feast_competition_id (filtered via
-- .in() in src/hooks/use-feast.ts) is already the LEADING column of
-- participant_registrations_participated_idx (feast_competition_id,
-- participated) from migration-participation-marking.sql. A B-tree
-- index on (A, B) already satisfies WHERE A = X / WHERE A IN (...) via
-- the leftmost column, so no new index is added here.

-- ── 2. Feast counts RPC ────────────────────────────────────────
-- Replaces two full-row-fetch-then-count-in-JS queries in useFeasts()
-- (src/hooks/use-feast.ts) with one grouped aggregate.

CREATE OR REPLACE FUNCTION get_feast_counts(p_feast_ids uuid[])
RETURNS TABLE (feast_id uuid, event_count bigint, registration_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    fid.feast_id,
    COALESCE(fc.cnt, 0) AS event_count,
    COALESCE(p.cnt, 0)  AS registration_count
  FROM unnest(p_feast_ids) AS fid(feast_id)
  LEFT JOIN (
    SELECT feast_id, COUNT(*) AS cnt
    FROM feast_competitions
    WHERE feast_id = ANY(p_feast_ids)
    GROUP BY feast_id
  ) fc ON fc.feast_id = fid.feast_id
  LEFT JOIN (
    SELECT feast_id, COUNT(*) AS cnt
    FROM participants
    WHERE feast_id = ANY(p_feast_ids)
    GROUP BY feast_id
  ) p ON p.feast_id = fid.feast_id;
$$;

-- feasts / feast_competitions / participants all already carry public
-- "FOR SELECT USING (true)" RLS policies (migration-feast.sql), so this
-- runs fine under the caller's own role — no SECURITY DEFINER needed.
GRANT EXECUTE ON FUNCTION get_feast_counts(uuid[]) TO anon, authenticated;
