-- =============================================================================
-- Migration 00010 : Historique football par saison (child_club_history)
-- Dépend de : 00001 (tenants, current_tenant_id, current_user_role)
--             00002 (enums existants)
-- =============================================================================

-- ── Nouveaux enums ─────────────────────────────────────────────────────────────

CREATE TYPE football_age_category AS ENUM (
  'U6',  'U7',  'U8',  'U9',  'U10',
  'U11', 'U12', 'U13', 'U14', 'U15',
  'U16', 'U17', 'U18', 'U19', 'U20', 'U21',
  'Senior'
);

CREATE TYPE football_team_level AS ENUM (
  'Provinciaux',
  'Interprovinciaux',
  'Régionaux',
  'Nationaux',
  'International'
);

-- ── Table child_club_history ───────────────────────────────────────────────────
--
-- Une ligne = un enfant + une saison.
-- Distinction clé :
--   club_child_links  → quel club dans l'app a accès au gardien (opérationnel)
--   child_club_history → historique officiel des affiliations par saison
--
-- club_id est nullable : le club peut ne pas être dans l'app.
-- club_name est toujours renseigné (nom explicite même si club_id est connu).

CREATE TABLE child_club_history (
  id            UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID                   NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_id      UUID                   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season        TEXT                   NOT NULL,  -- ex : '2024-2025'
  club_id       UUID,                             -- FK optionnelle vers clubs.user_id (club dans l'app)
  club_name     TEXT                   NOT NULL,  -- nom explicite du club cette saison
  is_affiliated BOOLEAN                NOT NULL DEFAULT false,
  age_category  football_age_category  NOT NULL,
  team_level    football_team_level,
  notes         TEXT,
  created_at    TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ,

  -- Une seule entrée par enfant par saison
  CONSTRAINT child_club_history_unique_season UNIQUE (tenant_id, child_id, season)
);

ALTER TABLE child_club_history ENABLE ROW LEVEL SECURITY;

-- Index opérationnels
CREATE INDEX child_club_history_child_idx    ON child_club_history (child_id, season DESC);
CREATE INDEX child_club_history_club_idx     ON child_club_history (club_id) WHERE club_id IS NOT NULL;
CREATE INDEX child_club_history_tenant_idx   ON child_club_history (tenant_id);

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- Admin & coach : lecture totale sur leur tenant
CREATE POLICY "admin_coach_select_history" ON child_club_history
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

-- Admin : écriture totale
CREATE POLICY "admin_insert_history" ON child_club_history
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id() AND current_user_role() = 'admin');

CREATE POLICY "admin_update_history" ON child_club_history
  FOR UPDATE
  USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin');

CREATE POLICY "admin_delete_history" ON child_club_history
  FOR DELETE
  USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin');

-- Parent : lecture & écriture pour les enfants qui lui sont liés
-- Pré-requis : table parent_child_links (Story 2.x) doit exister
CREATE POLICY "parent_select_child_history" ON child_club_history
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'parent'
    AND child_id IN (
      SELECT child_id FROM parent_child_links WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "parent_insert_child_history" ON child_club_history
  FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'parent'
    AND child_id IN (
      SELECT child_id FROM parent_child_links WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "parent_update_child_history" ON child_club_history
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'parent'
    AND child_id IN (
      SELECT child_id FROM parent_child_links WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "parent_delete_child_history" ON child_club_history
  FOR DELETE
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'parent'
    AND child_id IN (
      SELECT child_id FROM parent_child_links WHERE parent_id = auth.uid()
    )
  );

-- Club : lecture des enfants liés OU affiliés à ce club cette saison
CREATE POLICY "club_select_history" ON child_club_history
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'club'
    AND (
      -- L'entrée pointe vers ce club dans l'app
      club_id = auth.uid()
      -- Ou l'enfant est lié à ce club (accès opérationnel)
      OR child_id IN (
        SELECT child_id FROM club_child_links WHERE club_id = auth.uid()
      )
    )
  );
