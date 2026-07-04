-- ============================================================
-- Per-competition emoji icon
-- Run in the Supabase SQL editor
-- ============================================================

-- Stores a literal emoji (e.g. '📝', '🎤', '🎨'). NULL falls back to the
-- existing category → lucide-icon mapping in src/hooks/use-feast.ts.
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS icon text;
