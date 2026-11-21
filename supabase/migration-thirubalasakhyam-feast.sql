-- ============================================================
-- തിരുബാലസഖ്യം (Thirubalasakhyam) feast — categories + competition lineup
-- Idempotent — safe to re-run. Run AFTER migration-categories.sql,
-- migration-shakha-registration-caps.sql, migration-team-max-size.sql.
--
-- Caps: individual items 2 per shakha per gender (boys 2, girls 2);
--       group item 1 team per shakha, max 7 members.
-- ============================================================

-- 1. New age categories
--   poombatta_1 : born 2019-01-01 to 2021-12-31
--   poombatta_2 : born 2016-01-01 to 2018-12-31
INSERT INTO competition_categories (slug, name, min_dob, max_dob, sort_order) VALUES
  ('poombatta_1', 'പൂമ്പാറ്റ 1', '2019-01-01', '2021-12-31', 6),
  ('poombatta_2', 'പൂമ്പാറ്റ 2', '2016-01-01', '2018-12-31', 7)
ON CONFLICT (slug) DO NOTHING;

-- 2. The feast
INSERT INTO feasts (name, slug, type, year, status, description)
VALUES ('തിരുബാലസഖ്യം', 'thirubalasakhyam-2026', 'arts', '2026', 'draft',
        'തിരുബാലസഖ്യം മത്സരങ്ങൾ — പൂമ്പാറ്റ 1, പൂമ്പാറ്റ 2')
ON CONFLICT (slug) DO NOTHING;

-- 3. Individual items — boys & girls, cap 2 per shakha
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon, max_per_shakha)
SELECT v.name, 'individual', v.category, v.description, g.gender, cat.id, v.icon, 2
FROM (VALUES
  ('poombatta_1', 'ബൈബിൾ കഥപറച്ചിൽ', 'speech', 'ബൈബിൾ കഥപറച്ചിൽ — 5 മിനിറ്റ്', '📖'),
  ('poombatta_1', 'സംഗീതം',           'music',  'സംഗീതം — 5 മിനിറ്റ്',          '🎵'),
  ('poombatta_1', 'പ്രസംഗം',          'speech', 'മലയാളം പ്രസംഗം — 3 മിനിറ്റ് · ദേവാലയം എന്റെ രണ്ടാമത്തെ വീട്', '🎤'),
  ('poombatta_1', 'English Speech',   'speech', 'English Speech — 3 min · My Church, My Second Home', '🎤'),
  ('poombatta_2', 'സംഗീതം',           'music',  'സംഗീതം — 5 മിനിറ്റ്',          '🎵'),
  ('poombatta_2', 'മോണോ ആക്റ്റ്',     'drama',  'മോണോ ആക്റ്റ് — 5 മിനിറ്റ്',     '🎭'),
  ('poombatta_2', 'സങ്കീർത്തനാലാപനം', 'music',  'സങ്കീർത്തനാലാപനം — 7 മിനിറ്റ്', '📖'),
  ('poombatta_2', 'പ്രസംഗം',          'speech', 'മലയാളം പ്രസംഗം — 3 മിനിറ്റ് · വിശുദ്ധ കുർബാന ദൈവത്തിന്റെ വലിയ സമ്മാനം', '🎤'),
  ('poombatta_2', 'English Speech',   'speech', 'English Speech — 3 min · The Holy Eucharist: God''s Greatest Gift', '🎤')
) AS v(cat_slug, name, category, description, icon)
JOIN competition_categories cat ON cat.slug = v.cat_slug
CROSS JOIN (VALUES ('boys'), ('girls')) AS g(gender)
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = v.name AND c.gender = g.gender AND c.competition_category_id = cat.id
);

-- 4. Group item — ആക്ഷൻ സോങ് · poombatta_2 · common · 1 team/shakha, 5–7 members
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon, max_per_shakha, max_team_size)
SELECT 'ആക്ഷൻ സോങ്', 'group', 'music', 'ആക്ഷൻ സോങ് — 5 മിനിറ്റ് · 5 മുതൽ 7 പേർ', 'common', cat.id, '🎶', 1, 7
FROM competition_categories cat
WHERE cat.slug = 'poombatta_2'
  AND NOT EXISTS (
    SELECT 1 FROM competitions c
    WHERE c.name = 'ആക്ഷൻ സോങ്' AND c.gender = 'common' AND c.competition_category_id = cat.id
  );

-- 5. Attach every poombatta competition to the feast
INSERT INTO feast_competitions (feast_id, competition_id, display_order)
SELECT
  f.id,
  c.id,
  ROW_NUMBER() OVER (ORDER BY cat.sort_order, c.type DESC, c.name, c.gender) - 1
FROM competitions c
JOIN competition_categories cat ON cat.id = c.competition_category_id
CROSS JOIN feasts f
WHERE f.slug = 'thirubalasakhyam-2026'
  AND cat.slug IN ('poombatta_1', 'poombatta_2')
  AND NOT EXISTS (
    SELECT 1 FROM feast_competitions fc
    WHERE fc.feast_id = f.id AND fc.competition_id = c.id
  );
