-- =============================================================================
-- Migration 00058 — Sessions v2 : session_type, content_ref, is_guest
-- Story 13.1 — Modèle de données Séances v2
-- Dépend de : 00001 (tenants), sessions table (dans migrations non-archivées)
-- =============================================================================

-- =============================================================================
-- Type ENUM : session_type_v2
-- Note : nom 'session_type_v2' pour éviter conflit avec tout type existant
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type_v2') THEN
    CREATE TYPE session_type_v2 AS ENUM (
      'goal_and_player',
      'technique',
      'situationnel',
      'decisionnel',
      'perfectionnement',
      'integration',
      'equipe'
    );
  END IF;
END $$;

-- =============================================================================
-- Table sessions — ajout colonnes v2
-- =============================================================================

-- session_type : nullable pour permettre backfill des séances existantes
-- Une migration de suivi pourra le rendre NOT NULL après validation
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS session_type       session_type_v2 NULL,
  ADD COLUMN IF NOT EXISTS content_ref        JSONB NOT NULL DEFAULT '{}';

-- cancellation_reason est déjà présent dans sessions (créé avant migration 00033)
-- Ajout conditionnel pour idempotence
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;

-- Index pour recherche/filtrage par type (utile pour la vue calendrier story 13-2)
CREATE INDEX IF NOT EXISTS sessions_session_type_idx
  ON sessions (tenant_id, session_type)
  WHERE session_type IS NOT NULL;

-- =============================================================================
-- Table session_attendees — ajout is_guest
-- =============================================================================

-- is_guest = true : joueur non-membre du groupe, ajouté ponctuellement
-- (ex: gardien en essai, invité spécial)
-- La suppression du joueur du groupe ne doit PAS cascader sur ces lignes
ALTER TABLE session_attendees
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;

-- Index pour filtrer les invités facilement
CREATE INDEX IF NOT EXISTS session_attendees_is_guest_idx
  ON session_attendees (session_id, is_guest)
  WHERE is_guest = true;

-- =============================================================================
-- RLS — aucune policy à modifier
-- Les nouvelles colonnes héritent des policies FOR ALL existantes sur chaque table
-- Vérification : sessions et session_attendees ont déjà tenant_isolation policy
-- =============================================================================

-- Commentaire de documentation inline pour les nouvelles colonnes
COMMENT ON COLUMN sessions.session_type IS
  'Type pédagogique de la séance : goal_and_player, technique, situationnel, decisionnel, perfectionnement, integration, equipe';

COMMENT ON COLUMN sessions.content_ref IS
  'Référence de contenu pédagogique au format JSONB, structure variable selon session_type. '
  'GP: {module,sequence,globalNumber,half,repeat} | '
  'Technique: {context,module,sequence,globalNumber} | '
  'Stage: {context,concept,sequence} | '
  'Situ: {bloc_code,sequence,label,subtitle} | '
  'Déci: {blocks:[{title}]} | '
  'Autres: {}';

COMMENT ON COLUMN session_attendees.is_guest IS
  'true si le joueur a été ajouté ponctuellement à cette séance (essai, invitation)'
  ' sans être membre régulier du groupe. Statut trial dans attendance.';
