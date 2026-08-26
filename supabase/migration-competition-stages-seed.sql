-- ============================================================
-- Seed the 8-stage Competition Stages schedule for arts_fest_2026
-- (CML Kalpetta Meghala). Assigns `stage`, `scheduled_time` and a
-- stage-relative `display_order` to all 40 feast_competitions rows
-- so the public "Competition Stages" screen can group/order them.
-- Live status itself is NOT touched here — comp_status stays
-- whatever it already is; that field remains the sole source of
-- truth for what's actually running, updated via the existing
-- Admin > Fest Util > Competitions screen or attendance marking.
-- feast_id: 8a448b87-d310-413a-8861-e5399e9992de (arts_fest_2026)
-- Idempotent — safe to re-run.
-- ============================================================

-- STAGE 1 — QUIZ (8:30 AM) — മിഷൻ ക്വിസ്, junior..elder, boys & girls
UPDATE feast_competitions fc
SET stage = 'STAGE 1 — QUIZ', scheduled_time = '8:30 AM', display_order = v.ord
FROM (VALUES
  ('junior',       'boys',  0),
  ('junior',       'girls', 1),
  ('senior',       'boys',  2),
  ('senior',       'girls', 3),
  ('super_senior', 'boys',  4),
  ('super_senior', 'girls', 5),
  ('elder',        'boys',  6),
  ('elder',        'girls', 7)
) AS v(cat_slug, gender, ord)
JOIN competition_categories cc ON cc.slug = v.cat_slug
JOIN competitions c ON c.name = 'മിഷൻ ക്വിസ്' AND c.gender = v.gender AND c.competition_category_id = cc.id
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id;

-- STAGE 2 — SPEECH A (9:00 AM) — പ്രസംഗം: SJ Boys, SJ Girls, Junior Boys, Junior Girls, Senior Boys
UPDATE feast_competitions fc
SET stage = 'STAGE 2 — SPEECH A', scheduled_time = '9:00 AM', display_order = v.ord
FROM (VALUES
  ('sub_junior', 'boys',  8),
  ('sub_junior', 'girls', 9),
  ('junior',     'boys',  10),
  ('junior',     'girls', 11),
  ('senior',     'boys',  12)
) AS v(cat_slug, gender, ord)
JOIN competition_categories cc ON cc.slug = v.cat_slug
JOIN competitions c ON c.name = 'പ്രസംഗം' AND c.gender = v.gender AND c.competition_category_id = cc.id
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id;

-- STAGE 3 — SPEECH B (9:00 AM) — പ്രസംഗം: Elder Girls, Elder Boys, Senior Girls, Super Senior Boys, Super Senior Girls
UPDATE feast_competitions fc
SET stage = 'STAGE 3 — SPEECH B', scheduled_time = '9:00 AM', display_order = v.ord
FROM (VALUES
  ('elder',        'girls', 13),
  ('elder',        'boys',  14),
  ('senior',       'girls', 15),
  ('super_senior', 'boys',  16),
  ('super_senior', 'girls', 17)
) AS v(cat_slug, gender, ord)
JOIN competition_categories cc ON cc.slug = v.cat_slug
JOIN competitions c ON c.name = 'പ്രസംഗം' AND c.gender = v.gender AND c.competition_category_id = cc.id
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id;

-- STAGE 4 — MUSIC A (9:00 AM) — സംഗീതം: SJ Girls, SJ Boys, Junior Boys, Junior Girls, Senior Boys
UPDATE feast_competitions fc
SET stage = 'STAGE 4 — MUSIC A', scheduled_time = '9:00 AM', display_order = v.ord
FROM (VALUES
  ('sub_junior', 'girls', 18),
  ('sub_junior', 'boys',  19),
  ('junior',     'boys',  20),
  ('junior',     'girls', 22),
  ('senior',     'boys',  23)
) AS v(cat_slug, gender, ord)
JOIN competition_categories cc ON cc.slug = v.cat_slug
JOIN competitions c ON c.name = 'സംഗീതം' AND c.gender = v.gender AND c.competition_category_id = cc.id
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id;

-- STAGE 4 — MUSIC A — group item: മിഷൻ ആന്തം (Mission Anthem), sits between Junior Boys and Junior Girls
UPDATE feast_competitions fc
SET stage = 'STAGE 4 — MUSIC A', scheduled_time = '9:00 AM', display_order = 21
FROM competitions c
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id
  AND c.name = 'മിഷൻ ആന്തം' AND c.gender = 'common';

-- STAGE 5 — MUSIC B (9:00 AM) — സംഗീതം: Elder Girls, Elder Boys, Senior Girls, Super Senior Boys, Super Senior Girls
UPDATE feast_competitions fc
SET stage = 'STAGE 5 — MUSIC B', scheduled_time = '9:00 AM', display_order = v.ord
FROM (VALUES
  ('elder',        'girls', 24),
  ('elder',        'boys',  25),
  ('senior',       'girls', 26),
  ('super_senior', 'boys',  28),
  ('super_senior', 'girls', 29)
) AS v(cat_slug, gender, ord)
JOIN competition_categories cc ON cc.slug = v.cat_slug
JOIN competitions c ON c.name = 'സംഗീതം' AND c.gender = v.gender AND c.competition_category_id = cc.id
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id;

-- STAGE 5 — MUSIC B — group item: സമൂഹ ഗാനം (Community Song), sits between Senior Girls and Super Senior Boys
UPDATE feast_competitions fc
SET stage = 'STAGE 5 — MUSIC B', scheduled_time = '9:00 AM', display_order = 27
FROM competitions c
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id
  AND c.name = 'സമൂഹ ഗാനം' AND c.gender = 'common';

-- STAGE 6 — FOLK DANCE (9:30 AM) — നാടോടി നൃത്തം: SJ Girls, Junior Girls
-- NOTE: participants may clash with the Mission Quiz (Stage 1), so this
-- stage's actual start can slip past 9:30 AM — comp_status (not the clock)
-- is what decides whether it shows as running. See AGENTS.md convention.
UPDATE feast_competitions fc
SET stage = 'STAGE 6 — FOLK DANCE', scheduled_time = '9:30 AM', display_order = v.ord
FROM (VALUES
  ('sub_junior', 'girls', 30),
  ('junior',     'girls', 31)
) AS v(cat_slug, gender, ord)
JOIN competition_categories cc ON cc.slug = v.cat_slug
JOIN competitions c ON c.name = 'നാടോടി നൃത്തം' AND c.gender = v.gender AND c.competition_category_id = cc.id
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id;

-- STAGE 7 — STORY + BIBLE READING (9:00 AM):
-- SJ Kadhaprasangam, SJ Boys Bible Reading, SJ Girls Bible Reading, Junior Kadhaprasangam, Senior Kadhaprasangam
UPDATE feast_competitions fc
SET stage = 'STAGE 7 — STORY + BIBLE READING', scheduled_time = '9:00 AM', display_order = v.ord
FROM (VALUES
  ('കഥാപ്രസംഗം', 'common', 'sub_junior', 32),
  ('ബൈബിൾ വായന',  'boys',   'sub_junior', 33),
  ('ബൈബിൾ വായന',  'girls',  'sub_junior', 34),
  ('കഥാപ്രസംഗം', 'common', 'junior',     35),
  ('കഥാപ്രസംഗം', 'common', 'senior',     36)
) AS v(name, gender, cat_slug, ord)
JOIN competition_categories cc ON cc.slug = v.cat_slug
JOIN competitions c ON c.name = v.name AND c.gender = v.gender AND c.competition_category_id = cc.id
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id;

-- STAGE 8 — GROUP EVENTS (9:30 AM): മാർഗ്ഗംകളി, പരിചമുട്ടുകളി, Bible ദൃശ്യാവതരണം
-- NOTE: also liable to slip past 9:30 AM for the same Mission Quiz
-- scheduling-conflict reason as Stage 6 — comp_status remains authoritative.
UPDATE feast_competitions fc
SET stage = 'STAGE 8 — GROUP EVENTS', scheduled_time = '9:30 AM', display_order = v.ord
FROM (VALUES
  ('മാർഗ്ഗംകളി',        37),
  ('പരിചമുട്ടുകളി',      38),
  ('ബൈബിൾ ദൃശ്യാവതരണം', 39)
) AS v(name, ord)
JOIN competitions c ON c.name = v.name AND c.gender = 'common'
WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de' AND fc.competition_id = c.id;
