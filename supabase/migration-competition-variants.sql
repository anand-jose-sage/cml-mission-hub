-- ============================================================
-- Competition gender + category variants
-- Run AFTER migration-categories.sql
-- ============================================================

-- gender: boys | girls | open (NULL = open/any)
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS gender               text,          -- boys | girls | open
  ADD COLUMN IF NOT EXISTS competition_category_id uuid
    REFERENCES competition_categories(id) ON DELETE SET NULL;

-- Optional index for fast filtering
CREATE INDEX IF NOT EXISTS competitions_gender_idx
  ON competitions(gender);
CREATE INDEX IF NOT EXISTS competitions_category_idx
  ON competitions(competition_category_id);
