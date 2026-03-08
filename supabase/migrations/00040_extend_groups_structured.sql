-- =============================================================================
-- Migration 00040 : Groupes — champs structurés (jour / heure / durée / méthode)
-- Remplace le titre libre par des données structurées dont le nom est généré.
-- Idempotent : ADD COLUMN IF NOT EXISTS
-- =============================================================================

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS day_of_week       TEXT,           -- Lundi … Dimanche
  ADD COLUMN IF NOT EXISTS start_hour        SMALLINT,       -- 0-23
  ADD COLUMN IF NOT EXISTS start_minute      SMALLINT DEFAULT 0, -- 0, 15, 30, 45
  ADD COLUMN IF NOT EXISTS duration_minutes  SMALLINT,       -- ex : 60, 75, 90
  ADD COLUMN IF NOT EXISTS method            TEXT;           -- Golden Player | Technique | Situationnel | Décisionnel

COMMENT ON COLUMN groups.day_of_week      IS 'Jour de la semaine : Lundi | Mardi | … | Dimanche';
COMMENT ON COLUMN groups.start_hour       IS 'Heure de début (0-23)';
COMMENT ON COLUMN groups.start_minute     IS 'Minute de début (0, 15, 30, 45)';
COMMENT ON COLUMN groups.duration_minutes IS 'Durée en minutes (ex : 60, 75, 90)';
COMMENT ON COLUMN groups.method           IS 'Méthode pédagogique : Golden Player | Technique | Situationnel | Décisionnel';
