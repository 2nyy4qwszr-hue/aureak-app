-- Epic 89 — Story 89.6 : Séance gratuite usage unique traçable
--
-- Objectif : chaque prospect n'a droit qu'à UNE seule séance d'essai. Le
-- système trace le moment où elle est consommée (`trial_used`, `trial_date`),
-- son résultat (`trial_outcome`) et fait évoluer `prospect_status` en
-- conséquence (nouveau palier `candidat` = prospect présent à sa séance
-- d'essai, en attente de décision d'inscription).
--
-- AC adressés : #1 (trial_used), #2 (trial_date), #3 (trial_outcome enum
-- + colonne), #6 (statut `candidat`). #4/#5/#7/#8 sont couverts par
-- l'api-client + l'Edge Function `confirm-trial-slot` (mise à jour).

-- 1. Étendre l'enum prospect_status avec 'candidat' (Story 89.4 → 89.6)
--    Ajout idempotent pour permettre le replay de la migration.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'prospect_status' AND e.enumlabel = 'candidat'
  ) THEN
    ALTER TYPE prospect_status ADD VALUE 'candidat';
  END IF;
END $$;

-- 2. Enum trial_outcome — résultat de la séance d'essai consommée
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trial_outcome') THEN
    CREATE TYPE trial_outcome AS ENUM (
      'present',    -- présent à la séance → passe en 'candidat'
      'absent',     -- absent sans excuse → fin de parcours prospect
      'cancelled'   -- annulée côté académie (raison de service, pas un no-show)
    );
  END IF;
END $$;

-- 3. Colonnes sur child_directory
--    - trial_used : boolean défaut false (AC #1)
--    - trial_date : timestamptz nullable (AC #2)
--    - trial_outcome : trial_outcome nullable (AC #3)
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS trial_used    BOOLEAN     NOT NULL DEFAULT false;

ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS trial_date    TIMESTAMPTZ;

ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS trial_outcome trial_outcome;

-- 4. Index utilitaires pour funnel stats + recherches admin
--    On filtre sur deleted_at IS NULL (soft-delete) pour économie partielle.

-- Funnel : tous les gardiens ayant consommé leur essai (présent / absent / cancelled)
CREATE INDEX IF NOT EXISTS idx_child_directory_trial_used
  ON child_directory(tenant_id, trial_outcome)
  WHERE deleted_at IS NULL AND trial_used = true;

-- NOTE : l'index sur prospect_status = 'candidat' a été déplacé dans
-- une migration dédiée (00160) — PostgreSQL interdit l'usage d'une nouvelle
-- valeur d'enum dans la même transaction que son ALTER TYPE ADD VALUE.

-- 5. Commentaires pour documentation DB
COMMENT ON COLUMN child_directory.trial_used    IS 'Story 89.6 — true = le prospect a déjà consommé sa séance d''essai gratuite (droit à 1 seul essai).';
COMMENT ON COLUMN child_directory.trial_date    IS 'Story 89.6 — horodatage de confirmation de la séance d''essai.';
COMMENT ON COLUMN child_directory.trial_outcome IS 'Story 89.6 — résultat de la séance d''essai une fois passée (present/absent/cancelled).';
