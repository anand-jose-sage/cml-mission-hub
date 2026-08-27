-- ============================================================
-- One-time data migration: register 11 Nedumbala Sub Junior participants
-- for കലാ മത്സരം / arts_fest_2026, from an admin-supplied list.
--
-- Feast:  8a448b87-d310-413a-8861-e5399e9992de (arts_fest_2026)
-- Shakha: 29cc97b7-c21e-42f5-aeef-29b7a334c9db (Nedumbala)
-- Category: Sub Junior (all 11, per DOB range 2014-01-01..2016-12-31)
--
-- Companion to migration-nedumbala-junior-registrations.sql — same
-- conventions (next_reg_number() + "AF26" prefix, one-time, NOT idempotent).
-- Run ONCE in the Supabase SQL editor.
-- ============================================================

WITH new_participants AS (
  INSERT INTO participants (
    feast_id, shakha_id, name, house_name, date_of_birth, gender,
    competition_category_id, registration_number
  )
  VALUES
    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ജവിൻ', 'പുത്തൻകുടി', '2016-06-12', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ഡോൺ', 'കാരക്കാട്ട്', '2016-07-06', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ദിൽഹ', 'പള്ളക്കൽ', '2014-03-07', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'മീവൽ റോസ്', 'പെരിങ്ങാറപ്പള്ളി', '2016-05-02', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'അനേയ', 'കാവുംപുറം', '2016-12-31', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'അലൻ', 'കണ്ണമ്പള്ളി', '2016-12-14', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ഐറിക്ക്', 'ഒറ്റതെങ്ങിൽ', '2014-08-15', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ആരോണിയ', 'പെരിങ്ങാറപ്പള്ളി', '2014-11-14', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ആൻമരിയ', 'കണ്ണമ്പള്ളി', '2014-10-20', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'റയാൻ', 'മണലോത്ത്', '2014-09-11', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ജുവൽ', 'കൂനംപറമ്പിൽ', '2015-04-13', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'sub_junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de'))

  RETURNING id, name, house_name
)
INSERT INTO participant_registrations (participant_id, feast_competition_id)
SELECT np.id, m.fc_id
FROM new_participants np
JOIN (VALUES
  -- പ്രസംഗം (boys)
  ('ജവിൻ', 'പുത്തൻകുടി', '29aa43cf-02ce-4008-a818-39bf32bf23a3'::uuid),
  ('ഡോൺ', 'കാരക്കാട്ട്', '29aa43cf-02ce-4008-a818-39bf32bf23a3'::uuid),
  -- പ്രസംഗം (girls)
  ('ദിൽഹ', 'പള്ളക്കൽ', '3dfebbae-ce66-45c9-acba-dd670f818b33'::uuid),
  ('മീവൽ റോസ്', 'പെരിങ്ങാറപ്പള്ളി', '3dfebbae-ce66-45c9-acba-dd670f818b33'::uuid),
  -- സംഗീതം (girls)
  ('ദിൽഹ', 'പള്ളക്കൽ', 'f5c49a3b-4b27-42fa-bf83-dbe7515a3c2c'::uuid),
  ('അനേയ', 'കാവുംപുറം', 'f5c49a3b-4b27-42fa-bf83-dbe7515a3c2c'::uuid),
  -- സംഗീതം (boys)
  ('അലൻ', 'കണ്ണമ്പള്ളി', '0800eb99-bdab-4adf-ad7d-3a05b63fe230'::uuid),
  ('ഐറിക്ക്', 'ഒറ്റതെങ്ങിൽ', '0800eb99-bdab-4adf-ad7d-3a05b63fe230'::uuid),
  -- ബൈബിൾ വായന (boys)
  ('ഐറിക്ക്', 'ഒറ്റതെങ്ങിൽ', '54d9dbda-c892-41af-9b8b-2408ccda6b35'::uuid),
  ('റയാൻ', 'മണലോത്ത്', '54d9dbda-c892-41af-9b8b-2408ccda6b35'::uuid),
  -- ബൈബിൾ വായന (girls)
  ('ആരോണിയ', 'പെരിങ്ങാറപ്പള്ളി', 'e2a934ea-f112-42eb-a952-bfbef41a412b'::uuid),
  ('ആൻമരിയ', 'കണ്ണമ്പള്ളി', 'e2a934ea-f112-42eb-a952-bfbef41a412b'::uuid),
  -- നാടോടി നൃത്തം (girls)
  ('ആരോണിയ', 'പെരിങ്ങാറപ്പള്ളി', 'b9b28550-0ad8-457c-b138-4171adbc3003'::uuid),
  ('ജുവൽ', 'കൂനംപറമ്പിൽ', 'b9b28550-0ad8-457c-b138-4171adbc3003'::uuid),
  -- കഥാപ്രസംഗം (common)
  ('മീവൽ റോസ്', 'പെരിങ്ങാറപ്പള്ളി', '20a02734-c128-481a-b8a7-cca093fd4f8c'::uuid)
) AS m(name, house_name, fc_id)
  ON m.name = np.name AND m.house_name = np.house_name;
