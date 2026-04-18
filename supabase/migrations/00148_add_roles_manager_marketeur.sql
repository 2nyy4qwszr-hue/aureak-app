-- Story 86-1 — Epic 86 Architecture Rôles & Permissions
-- Ajoute les rôles `manager` et `marketeur` à l'enum user_role.
-- Le rôle `commercial` a été ajouté en 00147, `club` en 00055.
-- Scope : enum uniquement. Aucune policy RLS modifiée.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'marketeur';
