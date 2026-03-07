-- Story 3.1 — Hiérarchie ThemeGroup > Theme > ThemeSequence
-- ============================================================

-- Groupes de thèmes (catégories de haut niveau)
CREATE TABLE theme_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  sort_order INTEGER,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tg_tenant_idx ON theme_groups (tenant_id) WHERE deleted_at IS NULL;

-- Thèmes pédagogiques versionnés
CREATE TABLE themes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  group_id        UUID REFERENCES theme_groups(id),
  theme_key       TEXT NOT NULL,   -- slug invariant ex: 'sortie-au-sol'
  name            TEXT NOT NULL,
  description     TEXT,
  level           TEXT CHECK (level IN ('debutant','intermediaire','avance')),
  age_group       TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  target_audience JSONB NOT NULL DEFAULT '{}',
  version         INTEGER NOT NULL DEFAULT 1,
  is_current      BOOLEAN NOT NULL DEFAULT true,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, theme_key, version)
);

-- Unicité : une seule version courante par thème et tenant
CREATE UNIQUE INDEX one_current_theme_version
  ON themes (tenant_id, theme_key)
  WHERE is_current = true;

-- Index pour les lookups courants par groupe
CREATE INDEX themes_tenant_current_idx
  ON themes (tenant_id, group_id)
  WHERE is_current = true AND deleted_at IS NULL;

-- Séquences pédagogiques d'un thème
-- Pas de soft-delete : séquences liées à une version immuable de thème
CREATE TABLE theme_sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id    UUID NOT NULL REFERENCES themes(id),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ts_theme_idx ON theme_sequences (theme_id, sort_order);
CREATE INDEX ts_tenant_idx ON theme_sequences (tenant_id);

-- Activer RLS
ALTER TABLE theme_groups    ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_sequences ENABLE ROW LEVEL SECURITY;

-- Fonction RPC pour versioning atomique (évite race condition sur l'index partiel)
CREATE OR REPLACE FUNCTION create_theme_version(
  p_theme_key       TEXT,
  p_current_id      UUID,
  p_name            TEXT,
  p_description     TEXT,
  p_level           TEXT,
  p_age_group       TEXT,
  p_target_audience JSONB,
  p_tenant_id       UUID
) RETURNS themes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_new_version INTEGER;
  v_result      themes;
BEGIN
  -- Calculer le numéro de prochaine version
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_new_version
  FROM themes
  WHERE theme_key = p_theme_key AND tenant_id = p_tenant_id;

  -- Désactiver la version courante
  UPDATE themes SET is_current = false WHERE id = p_current_id;

  -- Créer la nouvelle version (hérite group_id de la version précédente)
  INSERT INTO themes (
    tenant_id, group_id, theme_key, name, description,
    level, age_group, target_audience, version, is_current
  )
  SELECT
    t.tenant_id, t.group_id, p_theme_key, p_name, p_description,
    p_level, p_age_group, p_target_audience, v_new_version, true
  FROM themes t WHERE t.id = p_current_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION create_theme_version FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_theme_version TO authenticated;
