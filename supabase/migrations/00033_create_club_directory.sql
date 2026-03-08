-- =============================================================================
-- Migration 00033 : Club Directory — Annuaire des clubs belges
-- Séparé de la table `clubs` (comptes portail) — entité organisationnelle pure
-- =============================================================================

-- 10 provinces belges (enum contrôlé)
CREATE TYPE belgian_province AS ENUM (
  'Anvers',
  'Brabant flamand',
  'Brabant wallon',
  'Flandre occidentale',
  'Flandre orientale',
  'Hainaut',
  'Liège',
  'Limbourg',
  'Luxembourg',
  'Namur'
);

-- =============================================================================
-- Table principale : club_directory
-- =============================================================================

CREATE TABLE club_directory (
  id                            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                     UUID        NOT NULL REFERENCES tenants(id),

  -- Identité du club
  nom                           TEXT        NOT NULL,
  matricule                     TEXT,
  label                         TEXT,
  province                      belgian_province,

  -- Adresse
  adresse_rue                   TEXT,
  code_postal                   TEXT,
  ville                         TEXT,

  -- Web
  site_internet                 TEXT,

  -- Contact général
  correspondant                 TEXT,
  email_principal               TEXT,
  telephone_principal           TEXT,

  -- Responsable sportif
  responsable_sportif           TEXT,
  email_responsable_sportif     TEXT,
  telephone_responsable_sportif TEXT,

  -- Statuts
  club_partenaire               BOOLEAN     NOT NULL DEFAULT false,
  actif                         BOOLEAN     NOT NULL DEFAULT true,

  -- Notes internes (admin uniquement)
  notes_internes                TEXT,

  -- Notion sync (futur — champ réservé pour import/sync)
  notion_page_id                TEXT        UNIQUE,
  notion_synced_at              TIMESTAMPTZ,

  -- Soft-delete + timestamps
  deleted_at                    TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_directory ENABLE ROW LEVEL SECURITY;

-- Isolation tenant : admin voit uniquement son tenant
CREATE POLICY "tenant_isolation" ON club_directory
  FOR ALL USING (tenant_id = current_tenant_id());

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION set_club_directory_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER club_directory_updated_at
  BEFORE UPDATE ON club_directory
  FOR EACH ROW EXECUTE FUNCTION set_club_directory_updated_at();

-- =============================================================================
-- Table de liaison : club_directory ↔ enfants
-- =============================================================================

CREATE TABLE club_directory_child_links (
  club_id    UUID        NOT NULL REFERENCES club_directory(id) ON DELETE CASCADE,
  child_id   UUID        NOT NULL REFERENCES profiles(user_id)  ON DELETE CASCADE,
  tenant_id  UUID        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, child_id)
);

ALTER TABLE club_directory_child_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON club_directory_child_links
  FOR ALL USING (tenant_id = current_tenant_id());

-- =============================================================================
-- Table de liaison : club_directory ↔ coachs
-- =============================================================================

CREATE TABLE club_directory_coach_links (
  club_id    UUID        NOT NULL REFERENCES club_directory(id)  ON DELETE CASCADE,
  coach_id   UUID        NOT NULL REFERENCES profiles(user_id)   ON DELETE CASCADE,
  tenant_id  UUID        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, coach_id)
);

ALTER TABLE club_directory_coach_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON club_directory_coach_links
  FOR ALL USING (tenant_id = current_tenant_id());

-- =============================================================================
-- Index
-- =============================================================================

CREATE INDEX idx_club_directory_tenant
  ON club_directory(tenant_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_club_directory_nom
  ON club_directory(tenant_id, nom)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_club_directory_matricule
  ON club_directory(tenant_id, matricule)
  WHERE matricule IS NOT NULL AND deleted_at IS NULL;

-- Index pour future sync Notion (lookup rapide par notion_page_id)
CREATE INDEX idx_club_directory_notion
  ON club_directory(notion_page_id)
  WHERE notion_page_id IS NOT NULL;
