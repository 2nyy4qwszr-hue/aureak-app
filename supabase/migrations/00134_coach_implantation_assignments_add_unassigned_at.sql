-- Migration 00134 : Ajout colonne unassigned_at dans coach_implantation_assignments
-- BUG B-CRAWLER-01 : la colonne était absente → KPI coachs/implantation toujours à 0
-- Utilisée dans dashboard.ts pour filtrer les affectations actives (.is('unassigned_at', null))

ALTER TABLE coach_implantation_assignments
  ADD COLUMN IF NOT EXISTS unassigned_at TIMESTAMPTZ;

COMMENT ON COLUMN coach_implantation_assignments.unassigned_at IS
  'Date/heure de fin d''affectation coach↔implantation. NULL = affectation active (soft-delete pattern).';
