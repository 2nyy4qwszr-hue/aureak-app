-- =============================================================================
-- Migration 00091 : Permissions de contenu par grade (Story 11.2)
-- =============================================================================
-- Dépend de : Story 11.1 (coach_grade_level + coach_grades + current_user_grade)
-- Idempotent : CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS + DROP POLICY IF EXISTS
-- Note : coach_grade_level + coach_grades + current_user_grade recréés ici en IF NOT EXISTS
-- car la migration Story 11.1 (00028) n'est pas dans le repo (créée directement en DB).
-- =============================================================================

-- 1. Enum coach_grade_level (idempotent)
DO $$ BEGIN
  CREATE TYPE coach_grade_level AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Table coach_grades (append-only, immuable par design)
CREATE TABLE IF NOT EXISTS coach_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  coach_id    UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  grade_level coach_grade_level NOT NULL,
  awarded_by  UUID NOT NULL REFERENCES profiles(user_id),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cg_tenant_idx ON coach_grades (tenant_id);
CREATE INDEX IF NOT EXISTS cg_coach_idx  ON coach_grades (coach_id);
ALTER TABLE coach_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cg_tenant_read" ON coach_grades;
DROP POLICY IF EXISTS "cg_admin_write" ON coach_grades;
DROP POLICY IF EXISTS "cg_coach_read"  ON coach_grades;

CREATE POLICY "cg_tenant_read" ON coach_grades
  FOR SELECT USING (tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "cg_admin_write" ON coach_grades
  FOR ALL USING (
    current_user_role() = 'admin'
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );

CREATE POLICY "cg_coach_read" ON coach_grades
  FOR SELECT USING (coach_id = auth.uid() AND is_active_user());

-- 3. Vue coach_current_grade — grade le plus récent par coach (DISTINCT ON)
-- DROP avant CREATE OR REPLACE car PostgreSQL ne peut pas changer les types/noms de colonnes d'une vue existante
DROP VIEW IF EXISTS coach_current_grade;
CREATE VIEW coach_current_grade AS
  SELECT DISTINCT ON (coach_id)
    id, tenant_id, coach_id, grade_level, awarded_by, awarded_at, notes, created_at
  FROM coach_grades
  ORDER BY coach_id, awarded_at DESC;

-- 4. Fonction current_user_grade() — grade du coach connecté (NULL si aucun grade)
CREATE OR REPLACE FUNCTION current_user_grade()
  RETURNS coach_grade_level
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT grade_level
  FROM coach_current_grade
  WHERE coach_id = auth.uid()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION current_user_grade() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_grade() TO authenticated;

-- 5. Colonnes required_grade_level sur les tables du référentiel pédagogique
ALTER TABLE themes
  ADD COLUMN IF NOT EXISTS required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze';

ALTER TABLE situations
  ADD COLUMN IF NOT EXISTS required_grade_level coach_grade_level NOT NULL DEFAULT 'bronze';

-- 6. Fonction grade_rank() IMMUTABLE — comparaison numérique des grades
--    IMMUTABLE : peut être utilisée dans les index et optimisée par le planner
CREATE OR REPLACE FUNCTION grade_rank(g coach_grade_level)
  RETURNS INT
  LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE g
    WHEN 'bronze'   THEN 1
    WHEN 'silver'   THEN 2
    WHEN 'gold'     THEN 3
    WHEN 'platinum' THEN 4
  END;
$$;

-- 7. Policy RLS sur themes : coach voit uniquement le contenu accessible à son grade
--    Admin et autres rôles voient tout (pas de restriction grade).
--    Coach sans grade → COALESCE → 'bronze' → contenu bronze visible.
DROP POLICY IF EXISTS "grade_access_themes" ON themes;
CREATE POLICY "grade_access_themes" ON themes
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND (
      current_user_role() = 'admin'
      OR current_user_role() != 'coach'
      OR grade_rank(required_grade_level) <= grade_rank(COALESCE(current_user_grade(), 'bronze'))
    )
  );

-- 8. Policy RLS sur situations : même logique que themes
DROP POLICY IF EXISTS "grade_access_situations" ON situations;
CREATE POLICY "grade_access_situations" ON situations
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND (
      current_user_role() = 'admin'
      OR current_user_role() != 'coach'
      OR grade_rank(required_grade_level) <= grade_rank(COALESCE(current_user_grade(), 'bronze'))
    )
  );
