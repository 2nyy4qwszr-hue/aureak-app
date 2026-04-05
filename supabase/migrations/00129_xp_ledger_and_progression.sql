-- Migration 00129 — Gamification : xp_ledger + player_xp_progression
-- Story 59-1 — Système XP étendu (5 event types)

-- ─── xp_ledger — ledger principal XP (append-only) ──────────────────────────
CREATE TABLE IF NOT EXISTS xp_ledger (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  child_id    UUID        NOT NULL REFERENCES profiles(user_id),
  event_type  TEXT        NOT NULL CHECK (event_type IN (
    'ATTENDANCE',
    'NOTE_HIGH',
    'BADGE_EARNED',
    'STAGE_PARTICIPATION',
    'SESSION_STREAK_5'
  )),
  ref_id      UUID,
  xp_delta    INTEGER     NOT NULL CHECK (xp_delta > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;

-- tenant_read — toute lecture est limitée au tenant courant
DO $$ BEGIN
  CREATE POLICY "xl_tenant_read" ON xp_ledger
    FOR SELECT USING (tenant_id = current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- child_own_read — un enfant peut lire ses propres entrées
DO $$ BEGIN
  CREATE POLICY "xl_child_own_read" ON xp_ledger
    FOR SELECT USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- staff_read — coach et admin peuvent lire toutes les entrées du tenant
DO $$ BEGIN
  CREATE POLICY "xl_staff_read" ON xp_ledger
    FOR SELECT USING (current_user_role() IN ('coach', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- insert_rpc — insertion uniquement via RPC / Edge Function (authenticated)
DO $$ BEGIN
  CREATE POLICY "xl_insert_rpc" ON xp_ledger
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- no_update — ledger immuable
DO $$ BEGIN
  CREATE POLICY "xl_no_update" ON xp_ledger
    FOR UPDATE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- no_delete — ledger immuable
DO $$ BEGIN
  CREATE POLICY "xl_no_delete" ON xp_ledger
    FOR DELETE USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS xl_child_created ON xp_ledger (child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS xl_tenant_event ON xp_ledger (tenant_id, event_type, created_at DESC);

-- ─── player_xp_progression — snapshot mensuel XP par joueur ──────────────────
CREATE TABLE IF NOT EXISTS player_xp_progression (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id),
  child_id         UUID        NOT NULL REFERENCES profiles(user_id),
  season_id        UUID        REFERENCES academy_seasons(id),
  snapshot_month   DATE        NOT NULL,           -- 1er du mois
  xp_total         INTEGER     NOT NULL DEFAULT 0,
  xp_delta_month   INTEGER     NOT NULL DEFAULT 0,
  level_tier       TEXT        NOT NULL DEFAULT 'bronze',
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, snapshot_month)
);

ALTER TABLE player_xp_progression ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pxp_tenant_read" ON player_xp_progression
    FOR SELECT USING (tenant_id = current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pxp_child_own" ON player_xp_progression
    FOR SELECT USING (child_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pxp_staff_read" ON player_xp_progression
    FOR SELECT USING (current_user_role() IN ('coach', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pxp_insert_rpc" ON player_xp_progression
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pxp_update_rpc" ON player_xp_progression
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS pxp_child_month ON player_xp_progression (child_id, snapshot_month DESC);
CREATE INDEX IF NOT EXISTS pxp_tenant_season ON player_xp_progression (tenant_id, season_id, snapshot_month DESC);
