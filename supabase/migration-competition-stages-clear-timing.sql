-- ============================================================
-- Clear the scheduled_time set by migration-competition-stages-seed.sql
-- for arts_fest_2026's feast_competitions. Leaves `stage` and
-- `display_order` untouched — only the timing is removed, so the
-- Competition Stages screen simply stops showing a "Scheduled ..."
-- line (it already renders that conditionally on scheduled_time
-- being present) while grouping/ordering stay exactly as seeded.
-- feast_id: 8a448b87-d310-413a-8861-e5399e9992de (arts_fest_2026)
-- Idempotent — safe to re-run.
-- ============================================================

UPDATE feast_competitions
SET scheduled_time = NULL
WHERE feast_id = '8a448b87-d310-413a-8861-e5399e9992de';
