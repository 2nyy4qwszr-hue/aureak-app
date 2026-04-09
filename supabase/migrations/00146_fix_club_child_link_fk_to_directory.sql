-- =============================================================================
-- Migration 00146 — BUG — Correction FK club_directory_child_links.child_id
-- Problème : child_id référençait profiles(user_id) au lieu de child_directory(id)
-- → PostgREST ne reconnaissait pas le join embedded child_directory(...) → 400
-- Solution : drop la FK profiles + add FK child_directory
-- =============================================================================

-- Supprime l'ancienne contrainte FK vers profiles (auto-nommée par PostgreSQL)
ALTER TABLE club_directory_child_links
  DROP CONSTRAINT IF EXISTS club_directory_child_links_child_id_fkey;

-- Ajoute la FK correcte vers child_directory(id)
-- ON DELETE CASCADE : si l'entrée annuaire est supprimée, le lien disparaît aussi
ALTER TABLE club_directory_child_links
  ADD CONSTRAINT club_directory_child_links_child_id_fkey
  FOREIGN KEY (child_id) REFERENCES child_directory(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT club_directory_child_links_child_id_fkey
  ON club_directory_child_links IS
  'Migration 00146 — Correction FK : child_id pointe désormais sur child_directory(id) '
  '(annuaire Notion) et non plus profiles(user_id) (auth). '
  'Permet le join PostgREST embedded child_directory(...) dans listChildrenOfClub.';
