-- ============================================================
-- Add recently created competitions to feast lineup
-- feast_id : 593d1df6-5202-4dc5-b0f5-fc9483421825
-- display_order starts after 3 (4, 5, 6 …)
-- ============================================================

-- Preview first — run this SELECT to confirm the right competitions are picked:
-- SELECT id, name, gender, competition_category_id, created_at
-- FROM competitions
-- WHERE created_at >= NOW() - INTERVAL '5 minutes'
-- ORDER BY created_at;

INSERT INTO feast_competitions (feast_id, competition_id, display_order)
SELECT
  '593d1df6-5202-4dc5-b0f5-fc9483421825'::uuid,
  c.id,
  ROW_NUMBER() OVER (ORDER BY c.created_at, c.name) + 0
FROM competitions c
WHERE c.created_at >= NOW() - INTERVAL '45 minutes'
ORDER BY c.created_at, c.name;
