-- Story 11.2 — Permissions de contenu par grade

-- Colonnes grade minimum sur thèmes et situations
ALTER TABLE themes
  ADD COLUMN IF NOT EXISTS required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze';
ALTER TABLE situations
  ADD COLUMN IF NOT EXISTS required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze';

-- Fonction de comparaison de grades (IMMUTABLE pour RLS performant)
CREATE OR REPLACE FUNCTION grade_rank(g coach_grade_level)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE g
    WHEN 'bronze'   THEN 1
    WHEN 'silver'   THEN 2
    WHEN 'gold'     THEN 3
    WHEN 'platinum' THEN 4
  END;
$$;

-- Policy RLS thèmes : filtre par grade si Coach
CREATE POLICY "grade_access_themes" ON themes
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() = 'admin'
      OR current_user_role() != 'coach'
      OR (
        current_user_role() = 'coach'
        AND grade_rank(required_grade_level) <= grade_rank(COALESCE(current_user_grade(), 'bronze'))
      )
    )
  );

-- Policy RLS situations : filtre par grade si Coach
CREATE POLICY "grade_access_situations" ON situations
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND (
      current_user_role() = 'admin'
      OR current_user_role() != 'coach'
      OR (
        current_user_role() = 'coach'
        AND grade_rank(required_grade_level) <= grade_rank(COALESCE(current_user_grade(), 'bronze'))
      )
    )
  );
