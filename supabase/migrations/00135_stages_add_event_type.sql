-- Migration 00135 — Story 63.2
-- Ajout du type d'évènement sur la table stages
-- Permet d'unifier stages, tournois, fun day, detect day, séminaires dans une vue unique.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type_enum') THEN
    CREATE TYPE event_type_enum AS ENUM (
      'stage',
      'tournoi',
      'fun_day',
      'detect_day',
      'seminaire'
    );
  END IF;
END $$;

ALTER TABLE stages
  ADD COLUMN IF NOT EXISTS event_type event_type_enum NOT NULL DEFAULT 'stage';

-- Index pour le filtre fréquent
CREATE INDEX IF NOT EXISTS idx_stages_event_type ON stages(event_type);
