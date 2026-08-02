-- ============================================================
-- Second feast — competition lineup
-- feast_id : 8a448b87-d310-413a-8861-e5399e9992de
-- Idempotent — safe to re-run. Run AFTER migration-categories.sql,
-- migration-competition-variants.sql, migration-results-system.sql.
-- ============================================================

-- 1. പ്രസംഗം (Speech) — individual · all 5 categories · boys & girls
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon)
SELECT 'പ്രസംഗം', 'individual', 'speech', 'പ്രസംഗം', g.gender, cat.id, '🎤'
FROM (VALUES ('boys'), ('girls')) AS g(gender)
CROSS JOIN (SELECT id FROM competition_categories WHERE slug IN ('sub_junior','junior','senior','super_senior','elder')) AS cat
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'പ്രസംഗം' AND c.gender = g.gender AND c.competition_category_id = cat.id
);

-- 2. സംഗീതം (Solo Song) — individual · all 5 categories · boys & girls
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon)
SELECT 'സംഗീതം', 'individual', 'music', 'സംഗീതം', g.gender, cat.id, '🎵'
FROM (VALUES ('boys'), ('girls')) AS g(gender)
CROSS JOIN (SELECT id FROM competition_categories WHERE slug IN ('sub_junior','junior','senior','super_senior','elder')) AS cat
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'സംഗീതം' AND c.gender = g.gender AND c.competition_category_id = cat.id
);

-- 3. മിഷൻ ക്വിസ് (Mission Quiz) — group · junior..elder (no sub_junior) · boys & girls
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon)
SELECT 'മിഷൻ ക്വിസ്', 'group', 'quiz', 'മിഷൻ ക്വിസ്', g.gender, cat.id, '❓'
FROM (VALUES ('boys'), ('girls')) AS g(gender)
CROSS JOIN (SELECT id FROM competition_categories WHERE slug IN ('junior','senior','super_senior','elder')) AS cat
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'മിഷൻ ക്വിസ്' AND c.gender = g.gender AND c.competition_category_id = cat.id
);

-- 4. നാടോടി നൃത്തം (Folk Dance) — group · sub_junior only · common (no gender split)
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon)
SELECT 'നാടോടി നൃത്തം', 'group', 'dance', 'നാടോടി നൃത്തം', 'common', cat.id, '💃'
FROM (SELECT id FROM competition_categories WHERE slug = 'sub_junior') AS cat
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'നാടോടി നൃത്തം' AND c.gender = 'common' AND c.competition_category_id = cat.id
);

-- 5. ബൈബിൾ വായന (Bible Reading) — individual · sub_junior only · boys & girls
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon)
SELECT 'ബൈബിൾ വായന', 'individual', 'speech', 'ബൈബിൾ വായന', g.gender, cat.id, '📖'
FROM (VALUES ('boys'), ('girls')) AS g(gender)
CROSS JOIN (SELECT id FROM competition_categories WHERE slug = 'sub_junior') AS cat
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'ബൈബിൾ വായന' AND c.gender = g.gender AND c.competition_category_id = cat.id
);

-- 6. Attach all of the above to the feast, continuing its display_order sequence.
INSERT INTO feast_competitions (feast_id, competition_id, display_order)
SELECT
  '8a448b87-d310-413a-8861-e5399e9992de'::uuid,
  c.id,
  base.max_order + ROW_NUMBER() OVER (ORDER BY c.name, cat.sort_order, c.gender)
FROM competitions c
LEFT JOIN competition_categories cat ON cat.id = c.competition_category_id
CROSS JOIN (
  SELECT COALESCE(MAX(display_order), -1) AS max_order
  FROM feast_competitions
  WHERE feast_id = '8a448b87-d310-413a-8861-e5399e9992de'
) base
WHERE c.name IN ('പ്രസംഗം', 'സംഗീതം', 'മിഷൻ ക്വിസ്', 'നാടോടി നൃത്തം', 'ബൈബിൾ വായന')
  AND NOT EXISTS (
    SELECT 1 FROM feast_competitions fc
    WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de'
      AND fc.competition_id = c.id
  );


  -- 4. നാടോടി നൃത്തം (Folk Dance) — group · sub_junior only · common (no gender split)
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon)
SELECT 'നാടോടി നൃത്തം', 'group', 'dance', 'നാടോടി നൃത്തം', 'common', cat.id, '💃'
FROM (SELECT id FROM competition_categories WHERE slug = 'sub_junior') AS cat
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'നാടോടി നൃത്തം' AND c.gender = 'common' AND c.competition_category_id = cat.id
);
