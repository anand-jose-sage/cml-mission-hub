-- ============================================================
-- Second feast — additional group competitions
-- feast_id : 8a448b87-d310-413a-8861-e5399e9992de
-- Each is a single row: type='group', gender='common', open to all
-- age categories (no competition_category_id restriction).
-- Idempotent — safe to re-run.
-- ============================================================

INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon)
SELECT v.name, 'group', v.category, v.name, 'common', NULL, v.icon
FROM (VALUES
  ('സമൂഹ ഗാനം', 'music', '🎶'),
  ('മാർഗ്ഗംകളി', 'dance', '💃'),
  ('പരിചമുട്ടുകളി', 'dance', '🥁'),
  ('ബൈബിൾ ദൃശ്യാവതരണം', 'drama', '📖')
) AS v(name, category, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = v.name AND c.gender = 'common' AND c.competition_category_id IS NULL
);

-- Attach all of the above to the feast, continuing its display_order sequence.
INSERT INTO feast_competitions (feast_id, competition_id, display_order)
SELECT
  '8a448b87-d310-413a-8861-e5399e9992de'::uuid,
  c.id,
  base.max_order + ROW_NUMBER() OVER (ORDER BY c.name)
FROM competitions c
CROSS JOIN (
  SELECT COALESCE(MAX(display_order), -1) AS max_order
  FROM feast_competitions
  WHERE feast_id = '8a448b87-d310-413a-8861-e5399e9992de'
) base
WHERE c.name IN ('സമൂഹ ഗാനം', 'മാർഗ്ഗംകളി', 'പരിചമുട്ടുകളി', 'ബൈബിൾ ദൃശ്യാവതരണം')
  AND c.gender = 'common'
  AND c.competition_category_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM feast_competitions fc
    WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de'
      AND fc.competition_id = c.id
  );
