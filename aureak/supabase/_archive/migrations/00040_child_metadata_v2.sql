-- Migration 00040 — child_metadata v2
-- 1. Remplace la contrainte age_category (U5/U8/U11 → formats football réels)
-- 2. Ajoute un second contact parent (parent2 = maman ou second tuteur)

-- ── Mise à jour contrainte age_category ───────────────────────────────────────
-- Supprime l'ancienne contrainte CHECK et la remplace par les valeurs métier
ALTER TABLE child_metadata
  DROP CONSTRAINT IF EXISTS child_metadata_age_category_check;

ALTER TABLE child_metadata
  ADD CONSTRAINT child_metadata_age_category_check
    CHECK (age_category IN ('Foot à 5', 'Foot à 8', 'Foot à 11', 'Senior'));

-- ── Second contact parent ──────────────────────────────────────────────────────
-- parent_* = papa (premier contact), parent2_* = maman (second contact)
-- Dénormalisé pour accès rapide — cohérent avec la structure existante
ALTER TABLE child_metadata
  ADD COLUMN IF NOT EXISTS parent2_first_name TEXT,
  ADD COLUMN IF NOT EXISTS parent2_last_name  TEXT,
  ADD COLUMN IF NOT EXISTS parent2_email      TEXT,
  ADD COLUMN IF NOT EXISTS parent2_phone      TEXT;
