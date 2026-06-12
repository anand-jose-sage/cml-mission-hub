-- Add info (rich text) column to feast_competitions
ALTER TABLE feast_competitions
  ADD COLUMN IF NOT EXISTS info TEXT NULL;
