-- =============================================================================
-- Migration 00101 — Story 32.3 : Signaux techniques + usage entraînements
-- Tables : technical_signals, training_usage_log
-- Colonne : profiles.coach_level
-- =============================================================================

-- =============================================================================
-- 1. Colonne coach_level sur profiles
-- Contrôle si le coach peut choisir ses entraînements Situationnel
-- =============================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coach_level TEXT NOT NULL DEFAULT 'apprentice'
  CHECK (coach_level IN ('apprentice', 'experienced'));

-- =============================================================================
-- 2. Table technical_signals
-- Observation pédagogique structurée par enfant × séance
-- =============================================================================
CREATE TABLE IF NOT EXISTS technical_signals (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  child_id          UUID         NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  coach_id          UUID         NOT NULL REFERENCES profiles(user_id),
  session_id        UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  error_observed    TEXT         NOT NULL,
  success_criterion TEXT         NOT NULL,
  status            TEXT         NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'resolved', 'archived')),
  notify_parent     BOOLEAN      NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS technical_signals_child_idx
  ON technical_signals (child_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS technical_signals_session_idx
  ON technical_signals (session_id, tenant_id);
CREATE INDEX IF NOT EXISTS technical_signals_coach_idx
  ON technical_signals (coach_id, tenant_id);

ALTER TABLE technical_signals ENABLE ROW LEVEL SECURITY;

-- Admin : CRUD complet
CREATE POLICY "technical_signals_admin" ON technical_signals
  FOR ALL TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Coach : CREATE + SELECT sur ses groupes d'enfants
CREATE POLICY "technical_signals_coach_read" ON technical_signals
  FOR SELECT TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    -- Un coach voit les signaux des enfants de ses séances
    AND EXISTS (
      SELECT 1 FROM session_coaches sc
      WHERE sc.session_id = technical_signals.session_id
        AND sc.coach_id   = auth.uid()
    )
  );

CREATE POLICY "technical_signals_coach_write" ON technical_signals
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND coach_id = auth.uid()
  );

CREATE POLICY "technical_signals_coach_update" ON technical_signals
  FOR UPDATE TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND coach_id = auth.uid()
  );

-- =============================================================================
-- 3. Table training_usage_log
-- Trace l'utilisation des entraînements par groupe → calcul cooldown (35 séances)
-- =============================================================================
CREATE TABLE IF NOT EXISTS training_usage_log (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  training_id  UUID         NOT NULL REFERENCES methodology_sessions(id) ON DELETE CASCADE,
  group_id     UUID         NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  session_id   UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  used_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_usage_log_group_idx
  ON training_usage_log (group_id, training_id, used_at DESC);
CREATE INDEX IF NOT EXISTS training_usage_log_session_idx
  ON training_usage_log (session_id, tenant_id);

-- Unicité : un entraînement n'est loggé qu'une fois par séance
CREATE UNIQUE INDEX IF NOT EXISTS training_usage_log_session_training_uniq
  ON training_usage_log (session_id, training_id);

ALTER TABLE training_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_usage_log_tenant" ON training_usage_log
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
