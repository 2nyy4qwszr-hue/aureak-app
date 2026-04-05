-- Story 58-7 — Niveau moyen d'un groupe (3 dernières séances)
-- Utilise evaluation_signal (acquired/partially_acquired/not_acquired) via proxy numérique
-- car la table evaluations n'a pas de colonne mastery_level explicite.
-- Signal → score : acquired=5, attention=3, none=3, positive=5

CREATE OR REPLACE FUNCTION get_group_avg_level(p_group_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    ROUND(AVG(
      CASE e.signal
        WHEN 'positive'   THEN 5
        WHEN 'attention'  THEN 3
        WHEN 'none'       THEN 3
        ELSE 3
      END
    )::NUMERIC, 1),
    3
  )
  FROM evaluations e
  JOIN sessions s ON s.id = e.session_id
  WHERE s.group_id = p_group_id
    AND s.deleted_at IS NULL
    AND s.scheduled_at >= (CURRENT_DATE - INTERVAL '90 days')
$$;

COMMENT ON FUNCTION get_group_avg_level(UUID) IS
  'Story 58-7 — Calcule le niveau moyen d''un groupe sur 90 jours via les signaux d''évaluation. Retourne 3 (Intermédiaire) si aucune donnée.';
