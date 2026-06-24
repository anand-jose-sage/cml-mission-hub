-- ============================================================
-- Seed annual-plan feast days into the activities table so they show
-- in the Activities calendar/list. Run AFTER migration-plan-content.sql.
-- Idempotent: stable ids, re-runnable.
-- ============================================================

ALTER TABLE activities ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS all_day  boolean NOT NULL DEFAULT false;

INSERT INTO activities (id, title, start_date, all_day, category, featured) VALUES
  ('55f4f7ab-d2f5-561f-83d2-cdeff8d69943', 'വി. തോമാശ്ലീഹായുടെ തിരുനാൾ', '2026-07-03T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('d2707c58-d7a5-5427-875f-bf9affefc075', 'പരിശുദ്ധ കന്യകാമറിയത്തിന്റെ സ്വർഗ്ഗാരോപണം', '2026-08-15T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('03c71a1c-f21c-5f1d-873e-2cafe8328c9c', 'സ്വാതന്ത്ര്യദിനം', '2026-08-15T08:00:00+05:30'::timestamptz, true, 'celebration', false),
  ('5915287f-c079-5cd1-87cf-87185f155f01', 'വി. മദർ തെരേസ', '2026-09-05T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('1942b4b1-6749-5107-8727-e9cb85d58e3f', 'മാതാവിന്റെ ജനന തിരുനാൾ', '2026-09-08T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('3034a4a3-981a-5547-89e2-09ab33f23e6c', 'വി. കൊച്ചുത്രേസ്യ', '2026-10-01T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('028ae729-d526-52f6-87a4-d45ed8d9fa5b', 'വി. ഫ്രാൻസിസ് അസീസി', '2026-10-04T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('6162857a-cc66-5b07-8168-c88ce988b432', 'ലോക മിഷൻ ഞായർ', '2026-10-18T08:00:00+05:30'::timestamptz, true, 'memorial', false),
  ('b61fe2f8-a34b-5a80-8b7e-bd632e5dd27f', 'സകല വിശുദ്ധരുടെയും തിരുനാൾ', '2026-11-01T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('2765a489-9499-56a6-8e29-9ad1bd5ebd1c', 'മരിച്ച വിശ്വാസികളുടെ ദിനം', '2026-11-02T08:00:00+05:30'::timestamptz, true, 'memorial', false),
  ('1f781850-edfb-5839-8d91-5650f21cdd8e', 'വി. ഫ്രാൻസിസ് സേവ്യർ തിരുനാൾ', '2026-12-03T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('2a195ef1-31a5-5ca1-8899-a06a51ed9537', 'അമലോത്ഭവ മാതാവ്', '2026-12-08T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('1d320089-a186-5d71-8b5b-1425091a4a22', 'ക്രിസ്മസ്', '2026-12-25T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('fba58a58-a870-5718-8a35-bf3a37b81107', 'ഫ്രാൻസിസ് ശതാബ്ദി ജൂബിലി സമാപനം', '2026-12-28T08:00:00+05:30'::timestamptz, true, 'celebration', false),
  ('19c7cc31-3d9f-5511-846c-bb077036652f', 'വി. ചാവറ കുര്യാക്കോസ് അച്ചൻ', '2027-01-03T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('ca88f506-b829-59e9-8e39-c764a440fed8', 'വി. ദേവസഹായം പിള്ള', '2027-01-14T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('1181729a-5cb1-5caf-8368-5435de6256c8', 'ഭസ്മ ബുധൻ · നോമ്പാരംഭം', '2027-02-10T08:00:00+05:30'::timestamptz, true, 'season', false),
  ('e8958831-f364-5343-8791-af70dd0aa8b3', 'ഓശാന ഞായർ', '2027-03-21T08:00:00+05:30'::timestamptz, true, 'solemnity', false),
  ('fda3aece-3301-527e-8b1f-2aeb9586bc5f', 'പെസഹ വ്യാഴം', '2027-03-25T08:00:00+05:30'::timestamptz, true, 'solemnity', false),
  ('7af07cb7-7f0f-553c-8caf-a7a25986ccc7', 'ദുഃഖവെള്ളി', '2027-03-26T08:00:00+05:30'::timestamptz, true, 'solemnity', false),
  ('00521dfc-e7f0-5fbf-8857-ffc73ec76f8c', 'ഉയിർപ്പ് തിരുനാൾ (ഈസ്റ്റർ)', '2027-03-28T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('5fc61e6b-f8a2-5338-8316-b33247a09333', 'ദിവ്യകാരുണ്യ ഞായർ', '2027-04-04T08:00:00+05:30'::timestamptz, true, 'feast', false),
  ('677632e7-1ef8-599a-8e08-6bb61dfc5f88', 'വി. യൗസേപ്പ് തൊഴിലാളി', '2027-05-01T08:00:00+05:30'::timestamptz, true, 'feast', false)
ON CONFLICT (id) DO UPDATE SET
  title=EXCLUDED.title, start_date=EXCLUDED.start_date,
  all_day=EXCLUDED.all_day, category=EXCLUDED.category, updated_at=now();
