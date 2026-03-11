-- Migration 00062 — Story 13.3 : Session Coach UX
-- Nouvelles colonnes pour le mode séance coach mobile & gestion des remplacements

-- ── session_attendees ──────────────────────────────────────────────────────────
ALTER TABLE session_attendees
  ADD COLUMN IF NOT EXISTS coach_notes      TEXT NULL,
  ADD COLUMN IF NOT EXISTS contact_declined BOOLEAN NOT NULL DEFAULT false;

-- ── sessions ──────────────────────────────────────────────────────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ NULL;

-- ── child_directory ───────────────────────────────────────────────────────────
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS contact_declined BOOLEAN NOT NULL DEFAULT false;

-- ── methodology_sessions ──────────────────────────────────────────────────────
-- plateau_url : lien vers le PDF/image de mise en place (Supabase Storage)
ALTER TABLE methodology_sessions
  ADD COLUMN IF NOT EXISTS plateau_url TEXT NULL;

-- ── Index pour le cron session-close-reminder ─────────────────────────────────
CREATE INDEX IF NOT EXISTS sessions_close_reminder_idx
  ON sessions (tenant_id, scheduled_at)
  WHERE status = 'planifiée' AND closed_at IS NULL;

-- ── RPC close_session_coach ───────────────────────────────────────────────────
-- Clôture atomique : UPDATE sessions + guard idempotent
-- Les evaluations sont INSERT côté client avant l'appel (via applyEvaluationEvent)
CREATE OR REPLACE FUNCTION close_session_coach(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que tous les joueurs du roster ont au moins un enregistrement de présence
  -- (session_attendees = roster, attendances = présences réelles via event sourcing)
  IF EXISTS (
    SELECT 1 FROM session_attendees sa
    LEFT JOIN attendances a
      ON a.session_id = sa.session_id AND a.child_id = sa.child_id
    WHERE sa.session_id = p_session_id
      AND a.child_id IS NULL   -- aucune présence enregistrée pour ce joueur
  ) THEN
    RAISE EXCEPTION 'PRESENCES_INCOMPLETE: All attendees must have a status before closing';
  END IF;

  -- Marquer la séance comme réalisée (idempotent : pas d'erreur si déjà clôturée)
  UPDATE sessions
  SET status = 'réalisée', closed_at = now()
  WHERE id = p_session_id
    AND status != 'réalisée'
    AND tenant_id = current_tenant_id();
END;
$$;

-- Note : les politiques RLS existantes sur session_attendees, sessions et
-- child_directory couvrent déjà les nouvelles colonnes (row-level security).
