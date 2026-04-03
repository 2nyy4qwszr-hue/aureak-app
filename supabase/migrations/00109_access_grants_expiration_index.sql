-- Migration 00109 — Index sur expires_at pour coach_access_grants
-- Story tbd-access-grants-expiration
-- Optimise les requêtes de filtrage par date d'expiration

CREATE INDEX IF NOT EXISTS idx_coach_access_grants_expires_at
  ON coach_access_grants (expires_at)
  WHERE revoked_at IS NULL;

-- Commentaire: cet index accélère listActiveGrants() et les requêtes d'expiration imminente
COMMENT ON INDEX idx_coach_access_grants_expires_at IS
  'Story tbd-access-grants-expiration — filtrage rapide par date expiration';
