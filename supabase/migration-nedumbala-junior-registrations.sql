-- ============================================================
-- One-time data migration: register 13 Nedumbala Junior participants
-- for കലാ മത്സരം / arts_fest_2026, from an admin-supplied list.
--
-- Feast:  8a448b87-d310-413a-8861-e5399e9992de (arts_fest_2026)
-- Shakha: 29cc97b7-c21e-42f5-aeef-29b7a334c9db (Nedumbala)
-- Category: Junior (all 13, per DOB range 2011-01-01..2013-12-31)
--
-- Registration numbers are allocated through the same next_reg_number()
-- counter + "AF26" prefix the app itself uses (see migration-reg-numbers.sql,
-- src/lib/feast-data.ts getRegPrefix), so numbering stays contiguous with
-- everything else registered through the UI.
--
-- NOT idempotent — this INSERTs new rows every time it's run. Run ONCE in
-- the Supabase SQL editor.
-- ============================================================

WITH new_participants AS (
  INSERT INTO participants (
    feast_id, shakha_id, name, house_name, date_of_birth, gender,
    competition_category_id, registration_number
  )
  VALUES
    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ഹെബിൻ പറയര്', 'മലയിൽ', '2013-05-25', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ക്രിസ്റ്റി', 'തച്ചിൽ', '2011-02-24', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ദിയ മരിയ', 'മറ്റത്തിൽ', '2011-03-28', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ഗ്രേസ് മരിയ', 'മണലോത്ത്', '2011-09-09', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ഡിലൻ', 'കണ്ണമ്പള്ളി', '2012-03-08', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ആൽബിൻ', 'ഒറ്റതെങ്ങിൽ', '2011-11-05', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ആനി റോസ്', 'കാവുംപുറം', '2013-11-09', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'അലോണ', 'പള്ളക്കൽ', '2011-01-21', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ഗോഡ്വവിൻ', 'കാഞ്ഞിരത്തിങ്കൽ', '2012-03-30', 'boy',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'അൽഹ', 'പള്ളക്കൽ', '2012-07-27', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'ജിയ', 'തൊട്ടിയിൽ', '2013-01-19', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'അന്ന', 'വെട്ടിക്കോട്ടിൽ', '2012-09-05', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de')),

    ('8a448b87-d310-413a-8861-e5399e9992de', '29cc97b7-c21e-42f5-aeef-29b7a334c9db',
     'റിത', 'കാരക്കാട്ട്', '2013-06-06', 'girl',
     (SELECT id FROM competition_categories WHERE slug = 'junior'),
     'AF26-' || next_reg_number('8a448b87-d310-413a-8861-e5399e9992de'))

  RETURNING id, name, house_name
)
INSERT INTO participant_registrations (participant_id, feast_competition_id)
SELECT np.id, m.fc_id
FROM new_participants np
JOIN (VALUES
  -- മിഷൻ ക്വിസ് (boys)
  ('ഹെബിൻ പറയര്', 'മലയിൽ', 'd0fe6d4c-96f9-4347-ba6f-47a28e95b1d7'::uuid),
  ('ക്രിസ്റ്റി', 'തച്ചിൽ', 'd0fe6d4c-96f9-4347-ba6f-47a28e95b1d7'::uuid),
  -- മിഷൻ ക്വിസ് (girls)
  ('ദിയ മരിയ', 'മറ്റത്തിൽ', '7c90315a-a57b-4a0e-836b-422617796e50'::uuid),
  ('ഗ്രേസ് മരിയ', 'മണലോത്ത്', '7c90315a-a57b-4a0e-836b-422617796e50'::uuid),
  -- സംഗീതം (boys)
  ('ഡിലൻ', 'കണ്ണമ്പള്ളി', 'e15ccdb6-33d1-4bed-b4a6-91ec9ae8f61b'::uuid),
  ('ആൽബിൻ', 'ഒറ്റതെങ്ങിൽ', 'e15ccdb6-33d1-4bed-b4a6-91ec9ae8f61b'::uuid),
  -- സംഗീതം (girls)
  ('ആനി റോസ്', 'കാവുംപുറം', '80b57e39-a17b-44c6-9aaa-c059ba4ef4a5'::uuid),
  ('അലോണ', 'പള്ളക്കൽ', '80b57e39-a17b-44c6-9aaa-c059ba4ef4a5'::uuid),
  -- പ്രസംഗം (boys)
  ('ക്രിസ്റ്റി', 'തച്ചിൽ', 'd7d20cc6-736f-4971-a2af-56d94736859f'::uuid),
  ('ഗോഡ്വവിൻ', 'കാഞ്ഞിരത്തിങ്കൽ', 'd7d20cc6-736f-4971-a2af-56d94736859f'::uuid),
  -- പ്രസംഗം (girls)
  ('അൽഹ', 'പള്ളക്കൽ', '85fa7891-c212-4e73-806d-374285b636c4'::uuid),
  ('ജിയ', 'തൊട്ടിയിൽ', '85fa7891-c212-4e73-806d-374285b636c4'::uuid),
  -- നാടോടി നൃത്തം (girls)
  ('അന്ന', 'വെട്ടിക്കോട്ടിൽ', '70c0da6b-089c-4a31-9f88-09afaddd22e5'::uuid),
  ('റിത', 'കാരക്കാട്ട്', '70c0da6b-089c-4a31-9f88-09afaddd22e5'::uuid),
  -- കഥാപ്രസംഗം (common)
  ('അൽഹ', 'പള്ളക്കൽ', 'ad1471bb-b759-4b38-b4aa-6c2f80c3338a'::uuid)
) AS m(name, house_name, fc_id)
  ON m.name = np.name AND m.house_name = np.house_name;
