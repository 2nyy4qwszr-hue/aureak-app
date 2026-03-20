-- Migration 00085 — Remplissage nom/prénom depuis display_name (toute la base)
-- Pour tous les joueurs ayant un display_name avec au moins 2 mots,
-- on découpe : mot 1 → nom, mots suivants → prenom.
-- Écrase les valeurs existantes de nom/prenom.

UPDATE child_directory
SET
  nom    = split_part(trim(display_name), ' ', 1),
  prenom = trim(regexp_replace(trim(display_name), '^\S+\s+', ''))
WHERE display_name IS NOT NULL
  AND trim(display_name) <> ''
  AND display_name LIKE '% %';
