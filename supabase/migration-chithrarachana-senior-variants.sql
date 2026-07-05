-- ============================================================
-- Add Senior / Super Senior / Elder variants of ചിത്രരചന (Drawing)
-- and attach them to the Literature Feast (സാഹിത്യ മത്സരം).
--
-- Context: this competition currently only has Sub Junior and Junior
-- variants (competitions.id 3656d3e5.../32fcaeec... categories). This
-- migration adds the 3 missing older-age variants and registers them
-- against the feast, matching the existing sibling rows' gender/type/
-- category/icon.
--
-- feast_id       = 593d1df6-5202-4dc5-b0f5-fc9483421825 (സാഹിത്യ മത്സരം)
-- reference competition_id = 58841210-cedc-47b0-9219-483992078237
--   (ചിത്രരചന · Sub Junior — used here only as the template for
--   name/gender/type/category/icon, not modified)
--
-- Run in the Supabase SQL editor. Idempotent — safe to re-run.
-- ============================================================

-- 1. Create the 3 missing competition variants (skip any that already exist).
insert into competitions (name, type, category, description, gender, competition_category_id, icon)
select v.name, v.type, v.category, v.description, v.gender, v.competition_category_id, v.icon
from (
  values
    ('ചിത്രരചന', 'individual', 'literature', 'ചിത്രരചന', 'common',
      (select id from competition_categories where slug = 'senior'), '🎨'),
    ('ചിത്രരചന', 'individual', 'literature', 'ചിത്രരചന', 'common',
      (select id from competition_categories where slug = 'super_senior'), '🎨'),
    ('ചിത്രരചന', 'individual', 'literature', 'ചിത്രരചന', 'common',
      (select id from competition_categories where slug = 'elder'), '🎨')
) as v(name, type, category, description, gender, competition_category_id, icon)
where not exists (
  select 1 from competitions c
  where c.name = v.name
    and c.gender = v.gender
    and c.competition_category_id = v.competition_category_id
);

-- 2. Attach all three (whether just inserted above or already present) to
--    the feast, continuing the existing display_order sequence.
insert into feast_competitions (feast_id, competition_id, display_order)
select
  '593d1df6-5202-4dc5-b0f5-fc9483421825',
  c.id,
  base.max_order + row_number() over (order by cat.sort_order)
from competitions c
join competition_categories cat on cat.id = c.competition_category_id
cross join (
  select coalesce(max(display_order), -1) as max_order
  from feast_competitions
  where feast_id = '593d1df6-5202-4dc5-b0f5-fc9483421825'
) base
where c.name = 'ചിത്രരചന'
  and c.gender = 'common'
  and cat.slug in ('senior', 'super_senior', 'elder')
  and not exists (
    select 1 from feast_competitions fc
    where fc.feast_id = '593d1df6-5202-4dc5-b0f5-fc9483421825'
      and fc.competition_id = c.id
  );
