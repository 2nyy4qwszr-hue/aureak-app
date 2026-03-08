-- =============================================================================
-- Migration 00043 : group_staff — Coachs assignés à un groupe (par rôle)
-- Lie un coach (profiles.user_id) à un groupe avec un rôle fixe.
-- Un coach peut avoir UN rôle par groupe (UNIQUE group_id, coach_id).
-- Les sessions héritent le staff du groupe (prefill) mais peuvent surcharger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS group_staff (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id)     ON DELETE CASCADE,
  group_id   UUID        NOT NULL REFERENCES groups(id)      ON DELETE CASCADE,
  coach_id   UUID        NOT NULL REFERENCES auth.users(id),
  role       TEXT        NOT NULL CHECK (role IN ('principal', 'assistant', 'remplacant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Un coach a un seul rôle par groupe
  UNIQUE (group_id, coach_id)
);

-- RLS
DO $rls$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_staff' AND policyname = 'tenant_isolation'
  ) THEN
    ALTER TABLE group_staff ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "tenant_isolation" ON group_staff
      FOR ALL USING (tenant_id = current_tenant_id());
  END IF;
END $rls$;

-- Index
CREATE INDEX IF NOT EXISTS idx_group_staff_group ON group_staff(group_id);
CREATE INDEX IF NOT EXISTS idx_group_staff_coach ON group_staff(coach_id);
