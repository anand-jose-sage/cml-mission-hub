-- ============================================================
-- One-time data migration: register 9 Nedumbala Senior participants
-- for കലാ മത്സരം / arts_fest_2026, from an admin-supplied list.
--
-- Feast:  8a448b87-d310-413a-8861-e5399e9992de (arts_fest_2026)
-- Shakha: 29cc97b7-c21e-42f5-aeef-29b7a334c9db (Nedumbala)
-- Category: Senior (all 9, per DOB range 2007-01-01..2010-12-31)
--
-- Companion to migration-nedumbala-junior-registrations.sql and
-- migration-nedumbala-subjunior-registrations.sql — same conventions
-- (next_reg_number() + "AF26" prefix, one-time, NOT idempotent).
-- Run ONCE in the Supabase SQL editor.
-- ============================================================

WITH new_participants AS (
  INSERT INTO participants (
    feast_id, shakha_id, name, house_name, date_of_birth, gender,
    competition_category_id, registration_number
  )
  VALUES
    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ആരോൺ', 'വാഴവേലിക്കകത്ത്', '2009-12-28', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ജോൺസ്', 'വട്ടുകുളത്തിൽ', '2010-04-05', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'നാൻസി', 'അമങ്ങാട്ടിൽ', '2010-06-18', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'എയ്ഞ്ചൽ മരിയ', 'മണലോത്ത്', '2009-01-02', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'എറിൻ', 'പെരിങ്ങാറപ്പള്ളി', '2010-08-14', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'റ്റോംസൺ', 'മണലോത്ത്', '2010-05-21', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'അലീന', 'ഒറ്റതെങ്ങിൽ', '2010-10-16', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'എയ്ഞ്ചൽ മരിയ', 'കണ്ണമ്പള്ളി', '2010-02-12', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'അനിറ്റ', 'നായത്തുപറമ്പിൽ', '2009-11-27', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'senior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de'))

  RETURNING id, name, house_name
)
INSERT INTO participant_registrations (participant_id, feast_competition_id)
SELECT np.id, m.fc_id
FROM new_participants np
JOIN (VALUES
  -- മിഷൻ ക്വിസ് (boys)
  ('ആരോൺ', 'വാഴവേലിക്കകത്ത്', '5c9a844b-1598-4943-9fd6-9ef44e9afbf9'::uuid),
  ('ജോൺസ്', 'വട്ടുകുളത്തിൽ', '5c9a844b-1598-4943-9fd6-9ef44e9afbf9'::uuid),
  -- മിഷൻ ക്വിസ് (girls)
  ('നാൻസി', 'അമങ്ങാട്ടിൽ', '7b47c4f6-8540-40f2-9522-93b75d8a6b95'::uuid),
  ('എയ്ഞ്ചൽ മരിയ', 'മണലോത്ത്', '7b47c4f6-8540-40f2-9522-93b75d8a6b95'::uuid),
  -- സംഗീതം (boys)
  ('എറിൻ', 'പെരിങ്ങാറപ്പള്ളി', '3744462b-c09d-40ec-a242-a6a5fc3e4d15'::uuid),
  ('റ്റോംസൺ', 'മണലോത്ത്', '3744462b-c09d-40ec-a242-a6a5fc3e4d15'::uuid),
  -- സംഗീതം (girls)
  ('നാൻസി', 'അമങ്ങാട്ടിൽ', 'c33f49d7-77a5-4c4a-8694-3174ab4455ce'::uuid),
  ('അലീന', 'ഒറ്റതെങ്ങിൽ', 'c33f49d7-77a5-4c4a-8694-3174ab4455ce'::uuid),
  -- പ്രസംഗം (boys)
  ('ജോൺസ്', 'വട്ടുകുളത്തിൽ', 'bc3d197a-4a3f-463f-86d5-e20afcd620b1'::uuid),
  ('എറിൻ', 'പെരിങ്ങാറപ്പള്ളി', 'bc3d197a-4a3f-463f-86d5-e20afcd620b1'::uuid),
  -- പ്രസംഗം (girls)
  ('എയ്ഞ്ചൽ മരിയ', 'കണ്ണമ്പള്ളി', 'f2b59141-4ee4-4330-b582-2c6f7308ad88'::uuid),
  ('അനിറ്റ', 'നായത്തുപറമ്പിൽ', 'f2b59141-4ee4-4330-b582-2c6f7308ad88'::uuid),
  -- കഥാപ്രസംഗം (common)
  ('അനിറ്റ', 'നായത്തുപറമ്പിൽ', '4d8a0edc-b2d6-4a12-8256-aeab89835b2a'::uuid)
) AS m(name, house_name, fc_id)
  ON m.name = np.name AND m.house_name = np.house_name;
