-- =============================================================================
-- Migration 00049 : group_members — Relier child_id à child_directory
-- Les joueurs importés (child_directory) n'ont pas de compte auth.users.
-- On remplace le FK profiles(user_id) par child_directory(id).
-- =============================================================================

-- 1. Supprimer les membres existants qui pointent vers profiles
--    (il ne devrait pas y en avoir en prod, la feature était cassée)
TRUNCATE group_members;

-- 2. Supprimer l'ancien FK vers profiles(user_id)
ALTER TABLE group_members
  DROP CONSTRAINT IF EXISTS group_members_child_id_fkey;

-- 3. Ajouter le nouveau FK vers child_directory(id)
ALTER TABLE group_members
  ADD CONSTRAINT group_members_child_id_fkey
  FOREIGN KEY (child_id) REFERENCES child_directory(id) ON DELETE CASCADE;
