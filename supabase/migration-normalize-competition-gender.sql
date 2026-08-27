-- ============================================================
-- Normalize competitions.gender to singular ('boy' | 'girl' | 'common').
--
-- arts_fest_2026's competitions were seeded with plural values
-- ('boys'/'girls'), while literature_2026 and participants.gender
-- everywhere else use singular ('boy'/'girl') — the same class of bug
-- migration-fix-folkdance-subjunior-gender.sql patched once before.
-- Left uncorrected, any code that compares competitions.gender by exact
-- string match (rather than going through normGender()) silently drops
-- every gender-specific competition for whichever feast uses the "wrong"
-- form — see the admin/participants registration-panel fix in this
-- session for a concrete case of that happening.
--
-- Idempotent (UPDATE ... WHERE only matches the plural rows, so a second
-- run touches nothing) plus a CHECK constraint so the plural form can't
-- silently reappear in future data entry. Run in the Supabase SQL editor.
-- ============================================================

UPDATE competitions SET gender = 'boy'  WHERE gender = 'boys';
UPDATE competitions SET gender = 'girl' WHERE gender = 'girls';

ALTER TABLE competitions
  DROP CONSTRAINT IF EXISTS competitions_gender_check;

ALTER TABLE competitions
  ADD CONSTRAINT competitions_gender_check
    CHECK (gender IS NULL OR gender IN ('boy', 'girl', 'common'));
