-- Migration 00078 : Remplace club_partenaire (boolean) par club_relation_type (enum 3 valeurs)
-- Story 23.3

-- Étape 1 : créer l'enum
CREATE TYPE club_relation_type AS ENUM ('partenaire', 'associe', 'normal');

-- Étape 2 : ajouter la colonne avec valeur par défaut
ALTER TABLE club_directory
  ADD COLUMN club_relation_type club_relation_type NOT NULL DEFAULT 'normal';

-- Étape 3 : migrer les données existantes
UPDATE club_directory
  SET club_relation_type = 'partenaire'
  WHERE club_partenaire = true;

-- Étape 4 : supprimer l'ancienne colonne
ALTER TABLE club_directory DROP COLUMN club_partenaire;

-- Étape 5 : documenter la colonne
COMMENT ON COLUMN club_directory.club_relation_type
  IS 'Niveau de relation du club avec l''académie : partenaire (officiel), associe (informel), normal (sans relation particulière)';
