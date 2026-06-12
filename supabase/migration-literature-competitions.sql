-- ============================================================
-- Literature competitions — Malayalam items
-- 4 items × 2 genders (boys / girls) × 3 categories
--   (senior · super_senior · elder)  =  24 rows
-- Run AFTER migration-categories.sql and migration-competition-variants.sql
-- ============================================================

INSERT INTO competitions (name, description, type, category, gender, competition_category_id)
SELECT
  item.name,
  item.name,                        -- description same as name
  'individual',
  'literature',
  'common',
  cat.id
FROM
  (VALUES
    ('ചിത്രരചന')
  ) AS item(name),
  (
    SELECT id, slug FROM competition_categories
    WHERE slug IN ('junior','sub_junior')
  ) AS cat
ORDER BY item.name, cat.slug;


