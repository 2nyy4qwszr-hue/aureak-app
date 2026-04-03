-- Migration 00108 — Note de synchronisation baseline
-- Story tbd-db-baseline-recovery
--
-- Cette migration est une migration de synchronisation (no-op).
-- Elle marque le point de baseline DB après les migrations 00001-00107.
--
-- Contexte :
--   Les migrations 00001-00107 constituent le schéma complet de l'application Aureak.
--   Cette entrée garantit la continuité de la numérotation et sert de point de référence
--   pour les futurs rollbacks ou restaurations de snapshot.
--
-- AUCUNE modification de schéma dans cette migration.

DO $$ BEGIN
  RAISE NOTICE 'Migration 00108: baseline sync note — no schema changes';
END $$;
