-- Migration 00090 : Contrainte UNIQUE sur club_match_reviews.club_directory_id
-- Story 28-3 — Fix : l'upsert onConflict:'club_directory_id' requiert une contrainte UNIQUE
-- Sans cette contrainte, chaque sync crée un doublon de review au lieu d'upsert.

-- Supprimer d'abord les éventuels doublons (keep la ligne avec le plus grand updated_at)
DELETE FROM club_match_reviews a
USING club_match_reviews b
WHERE a.club_directory_id = b.club_directory_id
  AND a.created_at < b.created_at;

-- Ajouter la contrainte UNIQUE
ALTER TABLE club_match_reviews
  ADD CONSTRAINT club_match_reviews_club_uniq UNIQUE (club_directory_id);
