-- Migration 00101 — Gestion annulations + tampons de séances (Story 32.1)
-- Ajoute : cancellation_type sur sessions, session_buffers, season_debt

-- ── 1. cancellation_type sur sessions ─────────────────────────────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS cancellation_type TEXT
  CHECK (cancellation_type IN ('reporter', 'decaler'));

-- ── 2. Table session_buffers ──────────────────────────────────────────────────
-- Tampons de rattrapage : max 3 par groupe/saison, activés manuellement par l'admin
CREATE TABLE IF NOT EXISTS session_buffers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL,
  group_id      UUID        NOT NULL,
  season_id     UUID        REFERENCES academy_seasons(id) ON DELETE SET NULL,
  buffer_date   DATE        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'activated', 'expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at  TIMESTAMPTZ,
  session_id    UUID        REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_session_buffers_group_status
  ON session_buffers(group_id, status);
CREATE INDEX IF NOT EXISTS idx_session_buffers_tenant
  ON session_buffers(tenant_id);

-- ── 3. Table season_debt ──────────────────────────────────────────────────────
-- Comptabilise les dettes (annulations Reporter) et leur résorption (tampons)
CREATE TABLE IF NOT EXISTS season_debt (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL,
  group_id        UUID        NOT NULL,
  season_id       UUID        REFERENCES academy_seasons(id) ON DELETE SET NULL,
  debt_count      INT         NOT NULL DEFAULT 0 CHECK (debt_count >= 0),
  suspended_count INT         NOT NULL DEFAULT 0 CHECK (suspended_count >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, COALESCE(season_id, '00000000-0000-0000-0000-000000000000'::UUID))
);

CREATE INDEX IF NOT EXISTS idx_season_debt_group
  ON season_debt(group_id, season_id);

-- ── 4. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE session_buffers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_session_buffers" ON session_buffers
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  );

CREATE POLICY "coach_read_session_buffers" ON session_buffers
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  );

ALTER TABLE season_debt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_season_debt" ON season_debt
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  );

CREATE POLICY "coach_read_season_debt" ON season_debt
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  );
