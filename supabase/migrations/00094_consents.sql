-- =============================================================================
-- Migration 00094 : Consentements parentaux (Story 10.2)
-- - enum consent_type
-- - table consents avec UNIQUE (tenant, parent, child, consent_type)
-- - RPCs : grant_consent, revoke_consent (SECURITY DEFINER)
-- =============================================================================

-- ── 1. Enum consent_type ─────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE consent_type AS ENUM (
    'photos_videos',
    'data_processing',
    'marketing',
    'sharing_clubs'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Table consents ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  parent_id    UUID NOT NULL REFERENCES profiles(user_id),
  child_id     UUID NOT NULL REFERENCES profiles(user_id),
  consent_type consent_type NOT NULL,
  version      INTEGER NOT NULL DEFAULT 1,
  granted      BOOLEAN NOT NULL DEFAULT false,
  granted_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, parent_id, child_id, consent_type)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS consents_parent_idx ON consents (parent_id);
CREATE INDEX IF NOT EXISTS consents_child_idx  ON consents (child_id);
CREATE INDEX IF NOT EXISTS consents_tenant_idx ON consents (tenant_id);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consents_tenant_isolation" ON consents;
DROP POLICY IF EXISTS "consents_parent_own"        ON consents;

CREATE POLICY "consents_tenant_isolation" ON consents
  FOR ALL USING (tenant_id = current_tenant_id());

-- Parent voit et gère ses propres consentements ; admin voit tout
CREATE POLICY "consents_parent_own" ON consents
  FOR ALL USING (
    parent_id = auth.uid()
    OR current_user_role() = 'admin'
  );

-- ── 3. RPC revoke_consent ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION revoke_consent(p_child_id UUID, p_consent_type consent_type)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Seul le parent de l'enfant peut révoquer
  IF NOT EXISTS (
    SELECT 1 FROM parent_child_links
    WHERE parent_id = auth.uid() AND child_id = p_child_id
  ) THEN
    RAISE EXCEPTION 'Accès refusé — vous n''êtes pas le parent de cet enfant';
  END IF;

  UPDATE consents SET
    granted    = false,
    revoked_at = now()
  WHERE parent_id    = auth.uid()
    AND child_id     = p_child_id
    AND consent_type = p_consent_type
    AND tenant_id    = current_tenant_id();

  -- Journaliser dans user_lifecycle_events
  INSERT INTO user_lifecycle_events (tenant_id, user_id, event_type, actor_id, metadata)
    VALUES (current_tenant_id(), p_child_id, 'consent_revoked', auth.uid(),
      jsonb_build_object('consent_type', p_consent_type));

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (current_tenant_id(), auth.uid(), 'consent_revoked', 'child', p_child_id,
      jsonb_build_object('consent_type', p_consent_type));

  -- TODO Epic 13 : si consent_type = 'photos_videos' → archiver médias liés
END;
$$;

-- ── 4. RPC grant_consent ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION grant_consent(
  p_child_id     UUID,
  p_consent_type consent_type,
  p_version      INTEGER DEFAULT 1
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID := current_tenant_id();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM parent_child_links
    WHERE parent_id = auth.uid() AND child_id = p_child_id
  ) THEN
    RAISE EXCEPTION 'Accès refusé — vous n''êtes pas le parent de cet enfant';
  END IF;

  INSERT INTO consents (tenant_id, parent_id, child_id, consent_type, version, granted, granted_at)
    VALUES (v_tenant_id, auth.uid(), p_child_id, p_consent_type, p_version, true, now())
  ON CONFLICT (tenant_id, parent_id, child_id, consent_type)
  DO UPDATE SET
    granted    = true,
    granted_at = now(),
    revoked_at = NULL,
    version    = p_version;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (v_tenant_id, auth.uid(), 'consent_granted', 'child', p_child_id,
      jsonb_build_object('consent_type', p_consent_type, 'version', p_version));
END;
$$;

REVOKE ALL ON FUNCTION revoke_consent FROM PUBLIC;
REVOKE ALL ON FUNCTION grant_consent  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION revoke_consent TO authenticated;
GRANT EXECUTE ON FUNCTION grant_consent  TO authenticated;
