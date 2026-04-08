-- =============================================================================
-- Migration 00143 — BUG Story 77.5
-- Restaure la vue session_evaluations_merged dans les migrations actives.
-- Source originale : aureak/supabase/_archive/migrations/00023_evaluations.sql
-- Cette vue était absente de supabase/migrations/ → requêtes retournaient 406.
-- =============================================================================

-- Idempotente : CREATE OR REPLACE VIEW (pas de DROP)
CREATE OR REPLACE VIEW session_evaluations_merged AS
SELECT
  session_id,
  child_id,
  tenant_id,
  CASE
    WHEN bool_or(receptivite = 'attention') THEN 'attention'
    WHEN bool_or(receptivite = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS receptivite,
  CASE
    WHEN bool_or(gout_effort = 'attention') THEN 'attention'
    WHEN bool_or(gout_effort = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS gout_effort,
  CASE
    WHEN bool_or(attitude = 'attention') THEN 'attention'
    WHEN bool_or(attitude = 'positive')  THEN 'positive'
    ELSE 'none'
  END::evaluation_signal AS attitude,
  CASE
    WHEN bool_or(top_seance = 'star') THEN 'star'
    ELSE 'none'
  END AS top_seance
FROM evaluations
GROUP BY session_id, child_id, tenant_id;

COMMENT ON VIEW session_evaluations_merged IS
  'Story 77.5 — Vue de fusion des évaluations multi-coach par enfant × séance. '
  'Agrège les signaux (attention > positive > none) et top_seance (star > none). '
  'La RLS de la table evaluations sous-jacente s''applique implicitement.';
