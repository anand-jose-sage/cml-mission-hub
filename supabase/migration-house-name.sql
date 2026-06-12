-- Add house_name to participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS house_name text;
