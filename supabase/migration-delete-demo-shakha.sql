-- ============================================================
-- Delete the "Demo Shakha" (slug = demo_shakha) and its 2 demo
-- participants.
--
-- participants.shakha_id has no ON DELETE cascade, so the shakha row
-- can't be removed while participants still reference it. Both
-- participants below are test/demo data (Demo Shakha / Demo admin
-- naming), so they're deleted along with the shakha:
--
--   REG-88743  Ann Maria
--   REG-46054  joyel maria
--
-- Deleting each participant cascades to their participant_registrations
-- (and any competition_results on those), per existing FK ON DELETE
-- CASCADE. Deleting the shakha afterwards cascades to its
-- shakha_feast_standings / shakha_point_ledger rows, and sets
-- profiles.shakha_id to NULL for any profile pointing at it (the
-- "Demo admin" account itself is NOT deleted, only unlinked).
--
-- Idempotent — safe to re-run. Run in the Supabase SQL editor.
-- ============================================================

delete from participants
where shakha_id = (select id from shakhas where slug = 'demo_shakha');

delete from shakhas
where slug = 'demo_shakha';
