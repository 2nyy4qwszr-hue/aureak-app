-- Story 53-3 — Intensité séance : ajout colonne intensity_level
-- Nullable — une séance sans intensité définie est acceptable

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS intensity_level SMALLINT CHECK (intensity_level BETWEEN 1 AND 5);

COMMENT ON COLUMN sessions.intensity_level IS
  '1=Récupération active, 2=Charge légère, 3=Charge standard, 4=Charge élevée, 5=Haute intensité';
