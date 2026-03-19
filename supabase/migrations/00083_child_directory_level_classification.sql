-- Migration 00083 — Story 25.0 : Classification du niveau d'équipe et système d'étoiles
-- Ajoute age_category, youth_level, senior_division sur child_directory.
-- player_type et team_level_stars sont des colonnes générées (GENERATED ALWAYS AS … STORED).
-- Crée l'enum football_age_category si absent (guard DO block — safe si déjà présent).

-- ── Enum football_age_category (créé ici si absent de la DB) ─────────────────

DO $$ BEGIN
  CREATE TYPE football_age_category AS ENUM (
    'U6',  'U7',  'U8',  'U9',  'U10',
    'U11', 'U12', 'U13', 'U14', 'U15',
    'U16', 'U17', 'U18', 'U19', 'U20', 'U21',
    'Senior'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Nouveaux champs ────────────────────────────────────────────────────────────

ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS age_category    football_age_category,
  ADD COLUMN IF NOT EXISTS youth_level     TEXT,
  ADD COLUMN IF NOT EXISTS senior_division TEXT;

-- CHECK : valeurs autorisées pour youth_level
ALTER TABLE child_directory
  ADD CONSTRAINT chk_youth_level CHECK (
    youth_level IS NULL OR youth_level IN (
      'Régional', 'Provincial', 'Inter', 'Élite 2', 'Élite 1'
    )
  );

-- CHECK : valeurs autorisées pour senior_division
ALTER TABLE child_directory
  ADD CONSTRAINT chk_senior_division CHECK (
    senior_division IS NULL OR senior_division IN (
      'P4', 'P3', 'P2', 'P1',
      'D3 amateurs', 'D2 amateurs', 'D1 amateurs',
      'D1B', 'D1A'
    )
  );

-- CHECK : un seul type de niveau à la fois (pas les deux simultanément)
ALTER TABLE child_directory
  ADD CONSTRAINT chk_level_coherence CHECK (
    NOT (youth_level IS NOT NULL AND senior_division IS NOT NULL)
  );

-- CHECK : youth_level uniquement pour les joueurs jeunes (pas Senior)
ALTER TABLE child_directory
  ADD CONSTRAINT chk_youth_level_requires_youth CHECK (
    youth_level IS NULL OR (age_category IS NOT NULL AND age_category::text != 'Senior')
  );

-- CHECK : senior_division uniquement pour les joueurs Senior
ALTER TABLE child_directory
  ADD CONSTRAINT chk_senior_div_requires_senior CHECK (
    senior_division IS NULL OR age_category::text = 'Senior'
  );

-- ── Colonnes générées ─────────────────────────────────────────────────────────

-- player_type : dérivé automatiquement de age_category
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS player_type TEXT GENERATED ALWAYS AS (
    CASE
      WHEN age_category = 'Senior' THEN 'senior'
      WHEN age_category IS NOT NULL THEN 'youth'
      ELSE NULL
    END
  ) STORED;

-- team_level_stars : calculé selon player_type + niveau
-- Retourne 1-5 ou NULL si données manquantes
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS team_level_stars SMALLINT GENERATED ALWAYS AS (
    CASE
      WHEN age_category = 'Senior' THEN
        CASE senior_division
          WHEN 'P4'          THEN 1
          WHEN 'P3'          THEN 1
          WHEN 'P2'          THEN 2
          WHEN 'P1'          THEN 2
          WHEN 'D3 amateurs' THEN 3
          WHEN 'D2 amateurs' THEN 3
          WHEN 'D1 amateurs' THEN 3
          WHEN 'D1B'         THEN 4
          WHEN 'D1A'         THEN 5
          ELSE NULL
        END
      WHEN age_category IS NOT NULL THEN
        CASE youth_level
          WHEN 'Régional'   THEN 1
          WHEN 'Provincial' THEN 2
          WHEN 'Inter'      THEN 3
          WHEN 'Élite 2'    THEN 4
          WHEN 'Élite 1'    THEN 5
          ELSE NULL
        END
      ELSE NULL
    END
  ) STORED;

-- ── Index ──────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_child_directory_age_category
  ON child_directory (age_category);

CREATE INDEX IF NOT EXISTS idx_child_directory_team_level_stars
  ON child_directory (team_level_stars);
