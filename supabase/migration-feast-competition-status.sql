-- ============================================================
-- Add stage / schedule / status fields to feast_competitions
-- ============================================================

ALTER TABLE feast_competitions
  ADD COLUMN IF NOT EXISTS stage          TEXT          NULL,
  ADD COLUMN IF NOT EXISTS scheduled_time TEXT          NULL,
  ADD COLUMN IF NOT EXISTS comp_status    TEXT          NOT NULL DEFAULT 'upcoming'
    CHECK (comp_status IN ('upcoming','progressing','completed','published')),
  ADD COLUMN IF NOT EXISTS progress_pct   INTEGER       NULL
    CHECK (progress_pct >= 0 AND progress_pct <= 100);
