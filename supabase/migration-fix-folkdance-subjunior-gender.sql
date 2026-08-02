-- ============================================================
-- Fix: നാടോടി നൃത്തം (Folk Dance) — Sub Junior variant should be
-- gender='girls' (individual), not 'common'. Idempotent.
-- ============================================================

UPDATE competitions
SET gender = 'girls'
WHERE name = 'നാടോടി നൃത്തം'
  AND gender = 'common'
  AND type = 'individual'
  AND competition_category_id = (
    SELECT id FROM competition_categories WHERE slug = 'sub_junior'
  );
