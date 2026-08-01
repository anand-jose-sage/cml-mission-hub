-- ============================================================
-- Second feast — additional group competition
-- feast_id : 8a448b87-d310-413a-8861-e5399e9992de
-- മിഷൻ ആന്തം (Mission Anthem) — type='group', gender='common', open to
-- all age categories (no competition_category_id restriction).
-- Idempotent — safe to re-run.
-- ============================================================

INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon)
SELECT 'മിഷൻ ആന്തം', 'group', 'music', 'മിഷൻ ആന്തം', 'common', NULL, '🎵'
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'മിഷൻ ആന്തം' AND c.gender = 'common' AND c.competition_category_id IS NULL
);

-- Attach to the feast, continuing its display_order sequence.
INSERT INTO feast_competitions (feast_id, competition_id, display_order)
SELECT
  '8a448b87-d310-413a-8861-e5399e9992de'::uuid,
  c.id,
  base.max_order + 1
FROM competitions c
CROSS JOIN (
  SELECT COALESCE(MAX(display_order), -1) AS max_order
  FROM feast_competitions
  WHERE feast_id = '8a448b87-d310-413a-8861-e5399e9992de'
) base
WHERE c.name = 'മിഷൻ ആന്തം'
  AND c.gender = 'common'
  AND c.competition_category_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM feast_competitions fc
    WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de'
      AND fc.competition_id = c.id
  );
