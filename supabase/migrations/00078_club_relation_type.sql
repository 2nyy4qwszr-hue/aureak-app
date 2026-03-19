-- Migration 00078 : Remplacement de club_partenaire (boolean) par club_relation_type (enum)
-- Story 23.3 — Ajout et gestion du type de relation club

-- ── Étape 1 : Créer l'enum ────────────────────────────────────────────────────
CREATE TYPE club_relation_type AS ENUM ('partenaire', 'associe', 'normal');

-- ── Étape 2 : Ajouter la nouvelle colonne avec valeur par défaut ──────────────
ALTER TABLE club_directory
  ADD COLUMN club_relation_type club_relation_type NOT NULL DEFAULT 'normal';

-- ── Étape 3 : Migrer les données existantes ───────────────────────────────────
-- Les clubs avec club_partenaire = true deviennent 'partenaire'
-- Les clubs avec club_partenaire = false restent 'normal'
UPDATE club_directory
  SET club_relation_type = 'partenaire'
  WHERE club_partenaire = true;

-- ── Étape 4 : Supprimer l'ancienne colonne ────────────────────────────────────
ALTER TABLE club_directory DROP COLUMN club_partenaire;

-- ── Étape 5 : Commentaire de documentation ────────────────────────────────────
COMMENT ON COLUMN club_directory.club_relation_type
  IS 'Niveau de relation du club avec l''académie Aureak : partenaire (relation officielle), associe (relation informelle), normal (pas de relation particulière). Migré depuis club_partenaire (boolean) en migration 00078.';
