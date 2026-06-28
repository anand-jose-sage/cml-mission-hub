-- ============================================================
-- Sequential registration numbers, per feast, starting at 1111.
-- Idempotent. Run in the Supabase SQL editor.
--
-- Replaces the previous Date.now-based suffix logic in
-- src/actions/feast.ts with an atomic Postgres counter so two
-- concurrent registrations can never collide and numbers stay
-- contiguous (no random gaps).
-- ============================================================

-- 1. Per-feast counter table
CREATE TABLE IF NOT EXISTS feast_reg_counters (
  feast_id    uuid PRIMARY KEY REFERENCES feasts(id) ON DELETE CASCADE,
  next_number int  NOT NULL DEFAULT 1111,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feast_reg_counters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feast_reg_counters' AND policyname='feast_reg_counters_auth_all') THEN
    CREATE POLICY "feast_reg_counters_auth_all"
      ON feast_reg_counters
      FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 2. Atomic next-number function. SECURITY DEFINER so the public
--    registration flow (anon role) can call it without granting
--    direct write access to the table.
CREATE OR REPLACE FUNCTION next_reg_number(p_feast_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result int;
BEGIN
  -- Make sure the counter row exists for this feast (default 1111).
  INSERT INTO feast_reg_counters (feast_id, next_number)
  VALUES (p_feast_id, 1111)
  ON CONFLICT (feast_id) DO NOTHING;

  -- Atomically reserve the current value and bump.
  UPDATE feast_reg_counters
  SET next_number = next_number + 1,
      updated_at  = now()
  WHERE feast_id = p_feast_id
  RETURNING next_number - 1 INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION next_reg_number(uuid) TO anon, authenticated;
