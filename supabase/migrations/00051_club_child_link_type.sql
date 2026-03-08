-- =============================================================================
-- Migration 00051 : Club-Child Link Type
--
-- Étend club_directory_child_links pour distinguer :
--   'current'    → joueur actuellement actif dans ce club (opérationnel)
--   'affiliated' → joueur officiellement affilié à ce club (fédération)
--
-- Un joueur peut être affiliated à Club A et current à Club B (prêt),
-- OU les deux à la fois au même club (cas standard).
--
-- Extension future : colonne `season TEXT` pour historisation par saison.
-- =============================================================================

-- ── 1. Ajouter la colonne link_type ──────────────────────────────────────────

ALTER TABLE club_directory_child_links
  ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'current'
    CHECK (link_type IN ('current', 'affiliated'));

-- ── 2. Remplacer la clé primaire (club_id, child_id) par (club_id, child_id, link_type) ──

-- Supprimer l'ancienne contrainte de clé primaire
ALTER TABLE club_directory_child_links
  DROP CONSTRAINT IF EXISTS club_directory_child_links_pkey;

-- Nouvelle PK composite incluant link_type
ALTER TABLE club_directory_child_links
  ADD CONSTRAINT club_directory_child_links_pkey
    PRIMARY KEY (club_id, child_id, link_type);

-- ── 3. Index sur link_type pour filtrage rapide ───────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cdcl_club_type
  ON club_directory_child_links(club_id, link_type);

CREATE INDEX IF NOT EXISTS idx_cdcl_child_type
  ON club_directory_child_links(child_id, link_type);

-- Note : les lignes existantes reçoivent link_type = 'current' par défaut
-- (comportement souhaité : migration backward-compatible)
