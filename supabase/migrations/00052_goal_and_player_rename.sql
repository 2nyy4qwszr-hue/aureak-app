-- =============================================================================
-- Migration 00052 : Goal and Player (rename) + Enrichissement séances pédagogiques
--
-- 1. Renomme 'Golden Player' → 'Goal and Player' dans toutes les données existantes
-- 2. Ajoute `bloc TEXT` à methodology_themes   — hiérarchie bloc → thème
-- 3. Ajoute `module_name TEXT` à methodology_sessions  — hiérarchie module → séance
-- 4. Ajoute `training_ref TEXT` à methodology_sessions — référence / numéro séance
-- 5. Ajoute `video_url TEXT` à methodology_sessions
-- 6. Ajoute `audio_url TEXT` à methodology_sessions
-- 7. Ajoute `sort_order SMALLINT` aux tables de liaison (ordre des thèmes/situations)
-- =============================================================================

-- ── 1. Mise à jour des données existantes ────────────────────────────────────

UPDATE methodology_themes     SET method = 'Goal and Player' WHERE method = 'Golden Player';
UPDATE methodology_situations SET method = 'Goal and Player' WHERE method = 'Golden Player';
UPDATE methodology_sessions   SET method = 'Goal and Player' WHERE method = 'Golden Player';
UPDATE groups                 SET method = 'Goal and Player' WHERE method = 'Golden Player';
UPDATE stage_blocks           SET method = 'Goal and Player' WHERE method = 'Golden Player';

-- ── 2. Mise à jour du CHECK constraint de stage_blocks ───────────────────────
-- (les autres tables ont des TEXT sans CHECK)

ALTER TABLE stage_blocks
  DROP CONSTRAINT IF EXISTS stage_blocks_method_check;

ALTER TABLE stage_blocks
  ADD CONSTRAINT stage_blocks_method_check
    CHECK (method IN ('Goal and Player','Technique','Situationnel','Décisionnel'));

-- ── 3. Colonne bloc sur methodology_themes ───────────────────────────────────
-- Représente le bloc pédagogique auquel appartient un thème
-- Ex : 'Tir au but', '1vs1', 'Relance', 'Profondeur'

ALTER TABLE methodology_themes
  ADD COLUMN IF NOT EXISTS bloc TEXT;

CREATE INDEX IF NOT EXISTS idx_methodology_themes_bloc
  ON methodology_themes(bloc)
  WHERE bloc IS NOT NULL;

-- ── 4. Colonnes enrichies sur methodology_sessions ───────────────────────────

ALTER TABLE methodology_sessions
  ADD COLUMN IF NOT EXISTS module_name  TEXT,
  ADD COLUMN IF NOT EXISTS training_ref TEXT,
  ADD COLUMN IF NOT EXISTS video_url    TEXT,
  ADD COLUMN IF NOT EXISTS audio_url    TEXT;

-- ── 5. sort_order sur les tables de liaison ───────────────────────────────────
-- Permet d'ordonner les thèmes/situations d'une séance (thème 1 = principal, etc.)

ALTER TABLE methodology_session_themes
  ADD COLUMN IF NOT EXISTS sort_order SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE methodology_session_situations
  ADD COLUMN IF NOT EXISTS sort_order SMALLINT NOT NULL DEFAULT 0;

-- Index pour requêtes ordonnées
CREATE INDEX IF NOT EXISTS idx_mst_session_order
  ON methodology_session_themes(session_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_mss_session_order
  ON methodology_session_situations(session_id, sort_order);
