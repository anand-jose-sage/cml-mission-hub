-- ============================================================
-- Register participants into competitions they took part in but
-- are missing a participant_registrations row for.
--
-- Context: these participants already exist in `participants` but
-- had no matching row in `participant_registrations` for the item
-- below, so they wouldn't show up in participation/scoring for it.
-- participated is set straight to true since these are confirmed
-- after-the-fact registrations for items already run.
--
-- feast: സാഹിത്യ മത്സരം / Literature Feast 2026
--   REG-1208  Siona nobi   -> ചിത്രരചന · Junior · Common
--   REG-1466  sheena       -> ചിത്രരചന · Super Senior · Common
--   REG-1487  Angel Rose   -> ചെറു കഥ  · Senior · Girls
--
-- REG-1179 (Elvin. Sijo) intentionally excluded: his stored
-- participants.gender is "boy" but he was requested for the Girls'
-- variant of Senior കവിത — needs manual confirmation before
-- registering, so left out of this migration.
--
-- Idempotent — safe to re-run. Run in the Supabase SQL editor.
-- ============================================================

insert into participant_registrations (participant_id, feast_competition_id, participated)
select p.id, x.feast_competition_id, true
from (
  values
    ('REG-1208', '33d54c52-0a10-4eab-ae99-64bb834d3b51'::uuid), -- ചിത്രരചന · Junior · Common
    ('REG-1466', '395784b6-9968-4d32-8eff-c5b0bbdc6eba'::uuid), -- ചിത്രരചന · Super Senior · Common
    ('REG-1487', 'd6ec1ffe-62e1-4933-b328-b88870eec76e'::uuid)  -- ചെറു കഥ · Senior · Girls
) as x(reg_no, feast_competition_id)
join participants p on p.registration_number = x.reg_no
on conflict (participant_id, feast_competition_id)
do update set participated = true;
