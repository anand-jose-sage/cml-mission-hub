-- ============================================================
-- COMPETITION CATEGORIES
-- Run this in the Supabase SQL editor AFTER migration-feast.sql
-- ============================================================

-- 1. competition_categories lookup table
CREATE TABLE IF NOT EXISTS competition_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,   -- sub_junior | junior | senior | super_senior | elder
  name        text NOT NULL,
  min_dob     date,                   -- lower bound (inclusive), NULL = no limit
  max_dob     date,                   -- upper bound (inclusive), NULL = no limit
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE competition_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competition_categories_public_read"
  ON competition_categories FOR SELECT USING (true);

-- Category boundaries (based on date of birth):
--   sub_junior  : born on/after 2014-01-01
--   junior      : born 2011-01-01 to 2013-12-31
--   senior      : born 2007-01-01 to 2010-12-31
--   super_senior: born 1988-01-01 to 2006-12-31
--   elder       : born before 1988-01-01
INSERT INTO competition_categories (slug, name, min_dob, max_dob, sort_order) VALUES
  ('sub_junior',   'Sub Junior',   '2014-01-01', NULL,         1),
  ('junior',       'Junior',       '2011-01-01', '2013-12-31', 2),
  ('senior',       'Senior',       '2007-01-01', '2010-12-31', 3),
  ('super_senior', 'Super Senior', '1988-01-01', '2006-12-31', 4),
  ('elder',        'Elder',        NULL,         '1987-12-31', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. Add competition_category_id FK to participants
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS competition_category_id uuid REFERENCES competition_categories(id);
