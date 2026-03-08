-- =============================================================================
-- Migration 00042 : child_directory_history — Parcours football par saison
-- Lié à child_directory (pas auth.users) — données import Notion, sans compte app
-- Distinct de child_club_history (migration 00010) qui cible les comptes auth
-- =============================================================================

CREATE TABLE IF NOT EXISTS child_directory_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_id          UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,

  -- Saison (ex: '2024-2025')
  saison            TEXT        NOT NULL,

  -- Club cette saison (FK optionnelle vers annuaire + nom dénormalisé)
  club_directory_id UUID        REFERENCES club_directory(id),
  club_nom          TEXT        NOT NULL,   -- toujours renseigné même si pas de FK

  -- Classification football
  categorie         TEXT,                  -- U6..U21 | Senior
  niveau            TEXT,                  -- Provinciaux | Interprovinciaux | Régionaux | Nationaux | International | Elite 1 | Elite 2 | Semi-Provinciaux | Inter | InterElite 2

  -- Affiliation officielle ACFF/VV
  affilie           BOOLEAN     NOT NULL DEFAULT false,

  -- Notes libres
  notes             TEXT,

  -- Notion sync (future)
  notion_page_id    TEXT        UNIQUE,
  notion_synced_at  TIMESTAMPTZ,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Une seule entrée par enfant par saison
  CONSTRAINT child_dir_history_unique_season UNIQUE (tenant_id, child_id, saison)
);

-- RLS
DO $rls$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'child_directory_history'
      AND policyname = 'tenant_isolation'
  ) THEN
    ALTER TABLE child_directory_history ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON child_directory_history
      FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_child_directory_history_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $trg$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'child_directory_history_updated_at'
  ) THEN
    CREATE TRIGGER child_directory_history_updated_at
      BEFORE UPDATE ON child_directory_history
      FOR EACH ROW EXECUTE FUNCTION set_child_directory_history_updated_at();
  END IF;
END $trg$;

-- Index
CREATE INDEX IF NOT EXISTS idx_child_dir_history_child
  ON child_directory_history (child_id, saison DESC);

CREATE INDEX IF NOT EXISTS idx_child_dir_history_club
  ON child_directory_history (club_directory_id)
  WHERE club_directory_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_child_dir_history_tenant
  ON child_directory_history (tenant_id);
