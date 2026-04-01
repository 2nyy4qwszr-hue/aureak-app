-- =============================================================================
-- Migration 00098 : Enrichissement infrastructure notifications (Story 7.1)
-- - notification_send_logs : urgency + provider_response + unique_send_once
-- - push_tokens : RLS complète
-- - notification_preferences : RLS complète
-- =============================================================================

-- ── 1. Enrichissement notification_send_logs ─────────────────────────────────

ALTER TABLE notification_send_logs
  ADD COLUMN IF NOT EXISTS urgency           TEXT NOT NULL DEFAULT 'routine'
    CHECK (urgency IN ('routine','urgent')),
  ADD COLUMN IF NOT EXISTS provider_response JSONB;

-- Contrainte idempotency (unique_send_once)
DO $$ BEGIN
  ALTER TABLE notification_send_logs
    ADD CONSTRAINT unique_send_once
      UNIQUE (tenant_id, recipient_id, reference_id, event_type, channel);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN unique_violation  THEN NULL;
         WHEN others            THEN NULL;
END $$;

-- ── 2. RLS push_tokens ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "pt_user_own"     ON push_tokens;
DROP POLICY IF EXISTS "pt_service_read" ON push_tokens;

-- Utilisateur gère ses propres tokens
CREATE POLICY "pt_user_own" ON push_tokens
  FOR ALL USING (user_id = auth.uid());

-- ── 3. RLS notification_preferences ─────────────────────────────────────────

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "np_user_own"   ON notification_preferences;
DROP POLICY IF EXISTS "np_admin_read" ON notification_preferences;

CREATE POLICY "np_user_own" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "np_admin_read" ON notification_preferences
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  );
