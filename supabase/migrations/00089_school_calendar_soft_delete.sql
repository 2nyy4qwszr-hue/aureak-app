-- Migration 00089 : Soft-delete pour school_calendar_exceptions (ARCH-4)
-- W-07 : removeSchoolCalendarException faisait un DELETE physique — ajout de deleted_at

ALTER TABLE school_calendar_exceptions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Filtrer les lignes supprimées dans les requêtes de liste
-- Les policies RLS existantes continuent de fonctionner (admin_all_school_calendar + all_select)
-- Les requêtes API doivent filtrer WHERE deleted_at IS NULL (voir sessions.ts)
