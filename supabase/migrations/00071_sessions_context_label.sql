-- Story 21.1 — Training Builder : context_type + label sur la table sessions
-- context_type : Académie / Stage (propagé globalement depuis Step 1 du formulaire)
-- label        : titre lisible auto-généré et éditable (ex: "Goal & Player – Module 2 – ENT 7")

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS context_type TEXT
    CHECK (context_type IN ('academie', 'stage'))
    DEFAULT 'academie',
  ADD COLUMN IF NOT EXISTS label TEXT;

-- Index pour filtrer par contexte (analytics, reporting)
CREATE INDEX IF NOT EXISTS idx_sessions_context_type
  ON sessions (tenant_id, context_type)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN sessions.context_type IS 'Contexte pédagogique global de la séance : académie (entraînement hebdo) ou stage (intensif)';
COMMENT ON COLUMN sessions.label IS 'Titre lisible auto-généré et éditable, ex: Goal & Player – Module 2 – ENT 7';
