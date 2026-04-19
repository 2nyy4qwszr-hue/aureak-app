-- Epic 89 — Story 89.1 : Recherche + ajout rapide gardien prospect depuis le terrain
-- Ajoute un index informatif pour accélérer la détection de doublons probables
-- (même prénom + nom + année de naissance dans un tenant) côté API client.
--
-- NB : aucune contrainte unique — un commercial doit pouvoir forcer l'insertion
-- si la détection est un faux positif (AC #10, action "Créer quand même").

CREATE INDEX IF NOT EXISTS idx_child_directory_prospect_dup
  ON child_directory (
    tenant_id,
    lower(prenom),
    lower(nom),
    (EXTRACT(YEAR FROM birth_date)::int)
  )
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_child_directory_prospect_dup IS
  'Story 89.1 — accelere la detection de doublons prospects (non unique, informatif)';
