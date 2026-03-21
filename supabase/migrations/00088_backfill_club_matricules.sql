-- =============================================================================
-- Migration 00088 : Backfill matricules clubs depuis club_match_reviews
-- Story 29-1 — Enrichissement matricules clubs RBFA
-- =============================================================================
-- Remplie club_directory.matricule pour les clubs deja matchés (rbfa_status='matched')
-- dont le matricule est NULL, en lisant le registrationNumber stocké dans le JSONB
-- rbfa_candidate des reviews correspondantes.
-- Idempotente : la condition IS NULL empêche tout écrasement.
-- =============================================================================

DO $$
DECLARE
  v_count INT;
BEGIN
  -- DISTINCT ON garantit le déterminisme : on prend la review la plus récente
  -- par club (club_directory_id), car aucun UNIQUE constraint n'existe sur cette colonne.
  UPDATE club_directory cd
  SET    matricule  = cmr.matricule,
         updated_at = now()
  FROM (
    SELECT DISTINCT ON (club_directory_id)
           club_directory_id,
           rbfa_candidate->>'matricule' AS matricule
    FROM   club_match_reviews
    WHERE  status               IN ('confirmed', 'pending')
      AND  rbfa_candidate->>'matricule' IS NOT NULL
      AND  rbfa_candidate->>'matricule' != ''
    ORDER  BY club_directory_id, created_at DESC
  ) cmr
  WHERE  cd.id          = cmr.club_directory_id
    AND  cd.rbfa_status = 'matched'
    AND  cd.matricule   IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Backfill matricules clubs : % club(s) mis a jour', v_count;
END $$;
