-- Fix infinite recursion in profiles RLS
-- The original "Admin manage profiles" FOR ALL policy self-referenced profiles
-- in its USING clause, causing infinite recursion on every SELECT.
-- SELECT access is already granted by "Users can read all profiles" (using true).

DROP POLICY IF EXISTS "Admin manage profiles" ON profiles;

CREATE POLICY "Admin insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('sa_admin', 'me_admin')
    )
  );

CREATE POLICY "Admin update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('sa_admin', 'me_admin')
    )
  );

CREATE POLICY "Admin delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('sa_admin', 'me_admin')
    )
  );
