-- Set info text for all Junior category feast competitions
UPDATE feast_competitions fc
SET info = 'പഠന ഭാഗം: വിശുദ്ധ യോഹന്നാൻ എഴുതിയ സുവിശേഷം
അധ്യായം 6'
FROM competitions c
JOIN competition_categories cc ON cc.id = c.competition_category_id
WHERE fc.competition_id = c.id
  AND cc.slug = 'junior';
