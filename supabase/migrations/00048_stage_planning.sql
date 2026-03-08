-- =============================================================================
-- Migration 00048 : Stage Planning System
-- Étend la table `stages` (00041) et ajoute les entités de planification :
--   stage_days  → journées d'un stage
--   stage_blocks → blocs d'entraînement dans une journée
--   stage_block_participants → affectation optionnelle par bloc
-- =============================================================================

-- ── 1. Étend la table stages existante ────────────────────────────────────────

ALTER TABLE stages
  ADD COLUMN IF NOT EXISTS implantation_id  UUID        REFERENCES implantations(id),
  ADD COLUMN IF NOT EXISTS status           TEXT        NOT NULL DEFAULT 'planifié'
                                            CHECK (status IN ('planifié','en_cours','terminé','annulé')),
  ADD COLUMN IF NOT EXISTS max_participants INTEGER,
  ADD COLUMN IF NOT EXISTS notes            TEXT;

-- Index sur le statut (filtrage liste)
CREATE INDEX IF NOT EXISTS idx_stages_status
  ON stages(tenant_id, status)
  WHERE status != 'annulé';

-- ── 2. Table stage_days ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stage_days (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id)   ON DELETE CASCADE,
  stage_id   UUID        NOT NULL REFERENCES stages(id)    ON DELETE CASCADE,
  date       DATE        NOT NULL,
  notes      TEXT,
  sort_order SMALLINT    NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Une seule journée par date par stage
  CONSTRAINT stage_days_unique_date UNIQUE (stage_id, date)
);

DO $rls1$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stage_days' AND policyname = 'tenant_isolation') THEN
    ALTER TABLE stage_days ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON stage_days
      FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls1$;

CREATE INDEX IF NOT EXISTS idx_stage_days_stage
  ON stage_days(stage_id, date);

-- ── 3. Table stage_blocks ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stage_blocks (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID        NOT NULL REFERENCES tenants(id)     ON DELETE CASCADE,
  stage_day_id          UUID        NOT NULL REFERENCES stage_days(id)  ON DELETE CASCADE,

  -- Horaire
  start_hour            SMALLINT    NOT NULL CHECK (start_hour   BETWEEN 0 AND 23),
  start_minute          SMALLINT    NOT NULL DEFAULT 0 CHECK (start_minute IN (0, 15, 30, 45)),
  duration_minutes      SMALLINT    NOT NULL DEFAULT 60,

  -- Pédagogie
  method                TEXT        CHECK (method IN ('Golden Player','Technique','Situationnel','Décisionnel')),
  session_type          TEXT        DEFAULT 'entrainement'
                                    CHECK (session_type IN ('entrainement','match','théorie','autre')),
  terrain               TEXT,
  theme                 TEXT,

  -- Staff (références auth.users — coachs authentifiés)
  coach_principal_id    UUID        REFERENCES auth.users(id),
  coach_assistant_id    UUID        REFERENCES auth.users(id),
  coach_replacement_id  UUID        REFERENCES auth.users(id),

  -- Notes & ordre d'affichage
  notes                 TEXT,
  sort_order            SMALLINT    NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $rls2$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stage_blocks' AND policyname = 'tenant_isolation') THEN
    ALTER TABLE stage_blocks ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON stage_blocks
      FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls2$;

CREATE INDEX IF NOT EXISTS idx_stage_blocks_day
  ON stage_blocks(stage_day_id, start_hour, start_minute);

-- ── 4. Table stage_block_participants (affectation optionnelle par bloc) ──────
--
-- Utile quand les joueurs ne font pas tous le même bloc
-- (ex: groupes de niveau tournants dans la journée).
-- Si vide pour un bloc → tous les participants du stage sont concernés.

CREATE TABLE IF NOT EXISTS stage_block_participants (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
  stage_block_id UUID        NOT NULL REFERENCES stage_blocks(id)  ON DELETE CASCADE,
  child_id       UUID        NOT NULL REFERENCES child_directory(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT stage_block_participants_unique UNIQUE (stage_block_id, child_id)
);

DO $rls3$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stage_block_participants' AND policyname = 'tenant_isolation') THEN
    ALTER TABLE stage_block_participants ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "tenant_isolation" ON stage_block_participants
      FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls3$;

CREATE INDEX IF NOT EXISTS idx_sbp_block
  ON stage_block_participants(stage_block_id);

CREATE INDEX IF NOT EXISTS idx_sbp_child
  ON stage_block_participants(child_id);
