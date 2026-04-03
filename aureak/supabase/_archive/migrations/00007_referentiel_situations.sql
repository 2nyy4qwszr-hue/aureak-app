-- Story 3.3 — Arborescence Situationnelle : SituationGroup → Situation → SituationCriteria
-- ============================================================

CREATE TABLE situation_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  sort_order INTEGER,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sg_tenant_idx ON situation_groups (tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE situations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  group_id        UUID REFERENCES situation_groups(id),
  situation_key   TEXT NOT NULL,   -- slug invariant ex: 'phase-defensive-4-3-3'
  name            TEXT NOT NULL,
  description     TEXT,
  variables       JSONB,            -- paramètres situationnels libres (nb_joueurs, disposition, etc.)
  target_audience JSONB NOT NULL DEFAULT '{}',
  version         INTEGER NOT NULL DEFAULT 1,
  is_current      BOOLEAN NOT NULL DEFAULT true,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, situation_key, version)
);

-- Unicité : une seule version courante par situation et tenant
CREATE UNIQUE INDEX one_current_situation_version
  ON situations (tenant_id, situation_key)
  WHERE is_current = true;

CREATE INDEX situations_tenant_current_idx
  ON situations (tenant_id, group_id)
  WHERE is_current = true AND deleted_at IS NULL;

-- Critères d'analyse spécifiques à une situation
CREATE TABLE situation_criteria (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  situation_id UUID NOT NULL REFERENCES situations(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  label        TEXT NOT NULL,
  sort_order   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sc_situation_idx ON situation_criteria (situation_id, sort_order);
CREATE INDEX sc_tenant_idx ON situation_criteria (tenant_id);

-- Liens situations ↔ thèmes (N:M optionnels)
CREATE TABLE situation_theme_links (
  situation_id UUID NOT NULL REFERENCES situations(id) ON DELETE CASCADE,
  theme_id     UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  PRIMARY KEY (situation_id, theme_id)
);

CREATE INDEX stl_theme_idx ON situation_theme_links (theme_id);
CREATE INDEX stl_tenant_idx ON situation_theme_links (tenant_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE situation_groups    ENABLE ROW LEVEL SECURITY;
ALTER TABLE situations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_criteria  ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_theme_links ENABLE ROW LEVEL SECURITY;

-- ─── RPC versioning atomique (même pattern que themes) ────────────────────────

CREATE OR REPLACE FUNCTION create_situation_version(
  p_situation_key  TEXT,
  p_current_id     UUID,
  p_name           TEXT,
  p_description    TEXT,
  p_variables      JSONB,
  p_target_audience JSONB,
  p_tenant_id      UUID
) RETURNS situations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_new_version INTEGER;
  v_result      situations;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_new_version
  FROM situations
  WHERE situation_key = p_situation_key AND tenant_id = p_tenant_id;

  UPDATE situations SET is_current = false WHERE id = p_current_id;

  INSERT INTO situations (
    tenant_id, group_id, situation_key, name, description,
    variables, target_audience, version, is_current
  )
  SELECT
    s.tenant_id, s.group_id, p_situation_key, p_name, p_description,
    p_variables, p_target_audience, v_new_version, true
  FROM situations s WHERE s.id = p_current_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION create_situation_version FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_situation_version TO authenticated;
