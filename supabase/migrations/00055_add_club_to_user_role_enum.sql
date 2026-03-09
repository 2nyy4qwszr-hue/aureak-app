-- =============================================================================
-- Migration 00055 : Ajout de 'club' à l'enum user_role
-- ARCH-12 — synchronisation enum PostgreSQL ↔ type TypeScript UserRole
-- Note : la table profiles utilise TEXT (pas l'enum) pour le champ role,
--        mais l'enum doit rester en sync avec @aureak/types/src/enums.ts
-- =============================================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'club';
