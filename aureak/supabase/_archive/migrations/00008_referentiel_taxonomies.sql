-- Story 3.4 — Système de Taxonomies Génériques
-- ============================================================

CREATE TABLE taxonomies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX tax_tenant_idx ON taxonomies (tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE taxonomy_nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_id UUID NOT NULL REFERENCES taxonomies(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  parent_id   UUID REFERENCES taxonomy_nodes(id),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  sort_order  INTEGER,
  UNIQUE (taxonomy_id, slug)
);

CREATE INDEX taxn_taxonomy_idx ON taxonomy_nodes (taxonomy_id, sort_order);
CREATE INDEX taxn_parent_idx   ON taxonomy_nodes (parent_id);
CREATE INDEX taxn_tenant_idx   ON taxonomy_nodes (tenant_id);

CREATE TABLE unit_classifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taxonomy_node_id UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  unit_type        TEXT NOT NULL CHECK (unit_type IN ('theme', 'situation')),
  unit_id          UUID NOT NULL,
  UNIQUE (taxonomy_node_id, unit_type, unit_id)
);

CREATE INDEX uc_node_idx    ON unit_classifications (taxonomy_node_id);
CREATE INDEX uc_unit_idx    ON unit_classifications (unit_type, unit_id);
CREATE INDEX uc_tenant_idx  ON unit_classifications (tenant_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE taxonomies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxonomy_nodes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_classifications ENABLE ROW LEVEL SECURITY;

-- ─── Note sur le seed ─────────────────────────────────────────────────────────
-- Les 3 taxonomies de base (Méthode GK, Situationnel, Golden Player) sont créées
-- par l'Admin via l'UI après création du tenant (Option A MVP).
-- Option B : Edge Function init-tenant (voir Dev Notes story 3.4).
