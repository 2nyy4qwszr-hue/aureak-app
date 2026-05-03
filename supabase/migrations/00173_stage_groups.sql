-- =============================================================================
-- Migration 00173 : Stage groups — répartition gardiens en sous-groupes
-- Story 105.3
--
-- Crée la table stage_groups + colonne stage_group_id sur child_stage_participations
-- + trigger auto-création "Groupe 1" à chaque INSERT stages + backfill stages existants.
-- =============================================================================

-- ── 1. Table stage_groups ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stage_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stage_id    UUID NOT NULL REFERENCES stages(id)  ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 50),
  position    INT  NOT NULL DEFAULT 0,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stage_groups_stage
  ON stage_groups(stage_id, tenant_id, position)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stage_groups_default
  ON stage_groups(stage_id)
  WHERE is_default = true AND deleted_at IS NULL;

COMMENT ON TABLE stage_groups IS
  'Sous-groupes de gardiens dans un stage. 1 stage = 1+ groupes (au moins le groupe par défaut).';

-- ── 2. RLS stage_groups ─────────────────────────────────────────────────────

ALTER TABLE stage_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stage_groups_tenant_read" ON stage_groups
  FOR SELECT
  USING (tenant_id = current_tenant_id() AND is_active_user());

CREATE POLICY "stage_groups_admin_write" ON stage_groups
  FOR ALL
  USING      (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user())
  WITH CHECK (current_user_role() = 'admin' AND tenant_id = current_tenant_id() AND is_active_user());

-- ── 3. FK stage_group_id sur child_stage_participations ─────────────────────

ALTER TABLE child_stage_participations
  ADD COLUMN IF NOT EXISTS stage_group_id UUID REFERENCES stage_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_csp_group
  ON child_stage_participations(stage_group_id)
  WHERE stage_group_id IS NOT NULL;

COMMENT ON COLUMN child_stage_participations.stage_group_id IS
  'Sous-groupe du gardien dans le stage. NULL = traité comme groupe par défaut côté UI.';

-- ── 4. Trigger auto-création Groupe 1 ───────────────────────────────────────

CREATE OR REPLACE FUNCTION create_default_stage_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO stage_groups (tenant_id, stage_id, name, position, is_default)
  VALUES (NEW.tenant_id, NEW.id, 'Groupe 1', 0, true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_default_stage_group ON stages;

CREATE TRIGGER trg_create_default_stage_group
  AFTER INSERT ON stages
  FOR EACH ROW
  EXECUTE FUNCTION create_default_stage_group();

-- ── 5. Backfill stages existants ────────────────────────────────────────────

INSERT INTO stage_groups (tenant_id, stage_id, name, position, is_default)
SELECT s.tenant_id, s.id, 'Groupe 1', 0, true
FROM stages s
WHERE NOT EXISTS (
  SELECT 1 FROM stage_groups g
  WHERE g.stage_id = s.id AND g.is_default = true AND g.deleted_at IS NULL
);
