-- ============================================================
-- Rollback: remove 2 of the 3 registrations inserted by
-- migration-register-missing-participations.sql.
--
--   REG-1208  Siona nobi  -> ചിത്രരചന · Junior · Common
--   REG-1466  sheena      -> ചിത്രരചന · Super Senior · Common
--
-- REG-1487 (Angel Rose · ചെറു കഥ · Senior · Girls) is NOT touched
-- and stays registered.
--
-- No competition_results rows exist for either registration (verified
-- before writing this), so there is nothing else to cascade-clean.
--
-- Idempotent — safe to re-run. Run in the Supabase SQL editor.
-- ============================================================

delete from participant_registrations pr
using participants p
where pr.participant_id = p.id
  and (
    (p.registration_number = 'REG-1208' and pr.feast_competition_id = '33d54c52-0a10-4eab-ae99-64bb834d3b51')
    or
    (p.registration_number = 'REG-1466' and pr.feast_competition_id = '395784b6-9968-4d32-8eff-c5b0bbdc6eba')
  );
