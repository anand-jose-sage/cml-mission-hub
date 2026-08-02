-- ============================================================
-- Per-competition Shakha registration caps
-- Idempotent — safe to re-run.
-- ============================================================

-- 1. New column, defaulting to today's implicit global cap of 2
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS max_per_shakha INTEGER NOT NULL DEFAULT 2;

-- 2. നാടോടി നൃത്തം (Folk Dance) — individual · Junior · Girls · cap 2/shakha
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon, max_per_shakha)
SELECT 'നാടോടി നൃത്തം', 'individual', 'dance', 'നാടോടി നൃത്തം', 'girls', cat.id, '💃', 2
FROM (SELECT id FROM competition_categories WHERE slug = 'junior') AS cat
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'നാടോടി നൃത്തം' AND c.gender = 'girls' AND c.competition_category_id = cat.id
);

-- 3. കഥാപ്രസംഗം (Kathaprasangam) — individual · common · Sub Junior/Junior/Senior · cap 1/shakha
INSERT INTO competitions (name, type, category, description, gender, competition_category_id, icon, max_per_shakha)
SELECT 'കഥാപ്രസംഗം', 'individual', 'drama', 'കഥാപ്രസംഗം', 'common', cat.id, '🎭', 1
FROM (SELECT id FROM competition_categories WHERE slug IN ('sub_junior', 'junior', 'senior')) AS cat
WHERE NOT EXISTS (
  SELECT 1 FROM competitions c
  WHERE c.name = 'കഥാപ്രസംഗം' AND c.gender = 'common' AND c.competition_category_id = cat.id
);

-- 4. Attach both to the second feast, continuing its display_order sequence.
INSERT INTO feast_competitions (feast_id, competition_id, display_order)
SELECT
  '8a448b87-d310-413a-8861-e5399e9992de'::uuid,
  c.id,
  base.max_order + ROW_NUMBER() OVER (ORDER BY c.name, cat.sort_order)
FROM competitions c
LEFT JOIN competition_categories cat ON cat.id = c.competition_category_id
CROSS JOIN (
  SELECT COALESCE(MAX(display_order), -1) AS max_order
  FROM feast_competitions
  WHERE feast_id = '8a448b87-d310-413a-8861-e5399e9992de'
) base
WHERE c.name IN ('നാടോടി നൃത്തം', 'കഥാപ്രസംഗം')
  AND c.max_per_shakha IN (1, 2)
  AND NOT EXISTS (
    SELECT 1 FROM feast_competitions fc
    WHERE fc.feast_id = '8a448b87-d310-413a-8861-e5399e9992de'
      AND fc.competition_id = c.id
  );
