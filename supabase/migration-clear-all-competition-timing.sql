-- ============================================================
-- Unset scheduled_time for every feast_competitions row, across
-- all feasts (not just arts_fest_2026 — see the narrower
-- migration-competition-stages-clear-timing.sql for that one-off).
-- Leaves `stage`, `display_order` and `comp_status` untouched — the
-- Competition Stages screen already renders "Scheduled ..." only
-- when scheduled_time is present, so this simply hides it everywhere.
-- Idempotent — safe to re-run.
-- ============================================================

UPDATE feast_competitions
SET scheduled_time = NULL;
