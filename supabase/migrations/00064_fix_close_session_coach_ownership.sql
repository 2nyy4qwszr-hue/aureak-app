-- Migration 00064 — Ajout vérification ownership dans close_session_coach
-- Corrige HIGH-2 (code review story 13.3) : le RPC SECURITY DEFINER ne vérifiait pas
-- que l'appelant est bien coach de la séance → n'importe quel utilisateur authentifié
-- pouvait clôturer n'importe quelle séance.

CREATE OR REPLACE FUNCTION close_session_coach(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur courant est bien assigné à cette séance
  IF NOT EXISTS (
    SELECT 1 FROM session_coaches
    WHERE session_id = p_session_id
      AND coach_id   = auth.uid()
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only assigned coaches can close this session';
  END IF;

  -- Guard présences : tous les joueurs du roster doivent avoir un statut
  IF EXISTS (
    SELECT 1 FROM session_attendees sa
    LEFT JOIN attendances a
      ON a.session_id = sa.session_id AND a.child_id = sa.child_id
    WHERE sa.session_id = p_session_id
      AND a.child_id IS NULL
  ) THEN
    RAISE EXCEPTION 'PRESENCES_INCOMPLETE: All attendees must have a status before closing';
  END IF;

  -- Clôture idempotente : pas d'erreur si déjà réalisée
  UPDATE sessions
  SET status    = 'réalisée',
      closed_at = now()
  WHERE id        = p_session_id
    AND status   != 'réalisée'
    AND tenant_id = current_tenant_id();
END;
$$;
