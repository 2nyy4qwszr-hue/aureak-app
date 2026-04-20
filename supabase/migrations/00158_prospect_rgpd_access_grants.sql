-- Epic 89 — Story 89.3 : Visibilité conditionnelle RGPD des coordonnées parent prospects
-- Crée : tables grants/requests/log + enums + colonne created_by + triggers auto-grant.
--
-- Idempotent : IF NOT EXISTS / DO $$ blocks / DROP POLICY IF EXISTS / DROP TRIGGER IF EXISTS.
-- RLS : tenant-isolated sur les 3 tables ; log insert-only (via RPC SECURITY DEFINER).

-- =============================================================================
-- 1. Colonne created_by sur child_directory (pour auto-grant créateur)
-- =============================================================================
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_child_directory_created_by
  ON child_directory(created_by)
  WHERE created_by IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN child_directory.created_by IS
  'Story 89.3 — auth.uid() au moment de la création. NULL pour lignes Notion historiques.';

-- =============================================================================
-- 2. Enums
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rgpd_grant_reason') THEN
    CREATE TYPE rgpd_grant_reason AS ENUM (
      'creator',           -- a saisi le prospect lui-même
      'invitation',        -- a envoyé une invitation
      'evaluation',        -- a saisi une éval scout
      'explicit_grant',    -- grant manuel (admin)
      'admin',             -- rôle admin (bypass, n'a pas besoin de grant)
      'request_approved'   -- demande d'accès approuvée
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rgpd_request_status') THEN
    CREATE TYPE rgpd_request_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- =============================================================================
-- 3. Table prospect_access_grants
-- =============================================================================
CREATE TABLE IF NOT EXISTS prospect_access_grants (
  id             UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID              NOT NULL REFERENCES tenants(id),
  child_id       UUID              NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  granted_to     UUID              NOT NULL REFERENCES auth.users(id),
  granted_by     UUID              REFERENCES auth.users(id),   -- NULL si trigger système
  reason         rgpd_grant_reason NOT NULL,
  granted_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- Index unique partiel : empêche doublon actif par (child_id, granted_to).
CREATE UNIQUE INDEX IF NOT EXISTS ux_prospect_access_grants_active
  ON prospect_access_grants(child_id, granted_to)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_access_grants_granted_to
  ON prospect_access_grants(granted_to, child_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_access_grants_tenant
  ON prospect_access_grants(tenant_id)
  WHERE deleted_at IS NULL;

-- =============================================================================
-- 4. Table prospect_access_requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS prospect_access_requests (
  id             UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID                NOT NULL REFERENCES tenants(id),
  child_id       UUID                NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  requester_id   UUID                NOT NULL REFERENCES auth.users(id),
  reason         TEXT                NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  status         rgpd_request_status NOT NULL DEFAULT 'pending',
  requested_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ,
  resolved_by    UUID                REFERENCES auth.users(id),
  resolved_note  TEXT,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_access_requests_pending
  ON prospect_access_requests(tenant_id, status, requested_at DESC)
  WHERE status = 'pending' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_access_requests_child
  ON prospect_access_requests(child_id, requester_id)
  WHERE deleted_at IS NULL;

-- =============================================================================
-- 5. Table prospect_rgpd_access_log (insert-only, preuve RGPD)
-- =============================================================================
CREATE TABLE IF NOT EXISTS prospect_rgpd_access_log (
  id             UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID              NOT NULL REFERENCES tenants(id),
  child_id       UUID              NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  accessor_id    UUID              NOT NULL REFERENCES auth.users(id),
  granted_via    rgpd_grant_reason NOT NULL,
  accessed_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_rgpd_access_log_child
  ON prospect_rgpd_access_log(child_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_rgpd_access_log_accessor
  ON prospect_rgpd_access_log(accessor_id, accessed_at DESC);

-- =============================================================================
-- 6. RLS
-- =============================================================================
ALTER TABLE prospect_access_grants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_rgpd_access_log ENABLE ROW LEVEL SECURITY;

-- prospect_access_grants : tenant read ; insert trigger-système OU admin ; update admin.
DROP POLICY IF EXISTS pag_select ON prospect_access_grants;
CREATE POLICY pag_select ON prospect_access_grants FOR SELECT
  USING (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS pag_insert ON prospect_access_grants;
CREATE POLICY pag_insert ON prospect_access_grants FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (current_user_role() = 'admin' OR granted_by IS NULL)  -- NULL = trigger système / SECURITY DEFINER
  );

DROP POLICY IF EXISTS pag_update ON prospect_access_grants;
CREATE POLICY pag_update ON prospect_access_grants FOR UPDATE
  USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id());

-- prospect_access_requests : requester voit les siennes + admin voit tout ; insert tenant ; update admin.
DROP POLICY IF EXISTS par_select ON prospect_access_requests;
CREATE POLICY par_select ON prospect_access_requests FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (requester_id = auth.uid() OR current_user_role() = 'admin')
  );

DROP POLICY IF EXISTS par_insert ON prospect_access_requests;
CREATE POLICY par_insert ON prospect_access_requests FOR INSERT
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND requester_id = auth.uid()
  );

DROP POLICY IF EXISTS par_update ON prospect_access_requests;
CREATE POLICY par_update ON prospect_access_requests FOR UPDATE
  USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin')
  WITH CHECK (tenant_id = current_tenant_id());

-- prospect_rgpd_access_log : admin read ; insert UNIQUEMENT via RPC SECURITY DEFINER (aucune policy INSERT/UPDATE/DELETE).
DROP POLICY IF EXISTS pral_select ON prospect_rgpd_access_log;
CREATE POLICY pral_select ON prospect_rgpd_access_log FOR SELECT
  USING (tenant_id = current_tenant_id() AND current_user_role() = 'admin');

-- =============================================================================
-- 7. Triggers auto-grant (SECURITY DEFINER + ON CONFLICT DO NOTHING)
-- =============================================================================

-- 7.a — Créateur initial lors d'un insert prospect
CREATE OR REPLACE FUNCTION auto_grant_prospect_creator()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.prospect_status IS NOT NULL AND NEW.created_by IS NOT NULL THEN
    INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
    VALUES (NEW.tenant_id, NEW.id, NEW.created_by, NULL, 'creator')
    ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_child_directory_prospect_creator_grant ON child_directory;
CREATE TRIGGER trg_child_directory_prospect_creator_grant
  AFTER INSERT ON child_directory
  FOR EACH ROW EXECUTE FUNCTION auto_grant_prospect_creator();

-- 7.b — Envoyeur d'invitation
CREATE OR REPLACE FUNCTION auto_grant_prospect_inviter()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
  VALUES (NEW.tenant_id, NEW.child_id, NEW.invited_by, NULL, 'invitation')
  ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_prospect_invitation_auto_grant ON prospect_invitations;
CREATE TRIGGER trg_prospect_invitation_auto_grant
  AFTER INSERT ON prospect_invitations
  FOR EACH ROW EXECUTE FUNCTION auto_grant_prospect_inviter();

-- 7.c — Évaluateur scout (prospect_scout_evaluations créée en Story 89.2 / migration 00157)
CREATE OR REPLACE FUNCTION auto_grant_prospect_evaluator()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
  VALUES (NEW.tenant_id, NEW.child_id, NEW.evaluator_id, NULL, 'evaluation')
  ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;
  RETURN NEW;
END; $$;

-- Guard : ne crée le trigger que si la table existe (dépendance souple).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prospect_scout_evaluations') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_prospect_scout_evaluation_auto_grant ON prospect_scout_evaluations';
    EXECUTE 'CREATE TRIGGER trg_prospect_scout_evaluation_auto_grant
             AFTER INSERT ON prospect_scout_evaluations
             FOR EACH ROW EXECUTE FUNCTION auto_grant_prospect_evaluator()';
  END IF;
END $$;

-- =============================================================================
-- 8. Backfill grants pour données historiques (idempotent)
-- =============================================================================
DO $$
BEGIN
  -- Invitations existantes → grant 'invitation'
  INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
  SELECT tenant_id, child_id, invited_by, NULL, 'invitation'
  FROM prospect_invitations
  WHERE deleted_at IS NULL
  ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;

  -- Évaluations scout existantes → grant 'evaluation'
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prospect_scout_evaluations') THEN
    INSERT INTO prospect_access_grants (tenant_id, child_id, granted_to, granted_by, reason)
    SELECT tenant_id, child_id, evaluator_id, NULL, 'evaluation'
    FROM prospect_scout_evaluations
    WHERE deleted_at IS NULL
    ON CONFLICT (child_id, granted_to) WHERE deleted_at IS NULL DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- 9. Trigger updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION set_prospect_rgpd_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_pag_updated_at ON prospect_access_grants;
CREATE TRIGGER trg_pag_updated_at BEFORE UPDATE ON prospect_access_grants
  FOR EACH ROW EXECUTE FUNCTION set_prospect_rgpd_updated_at();

DROP TRIGGER IF EXISTS trg_par_updated_at ON prospect_access_requests;
CREATE TRIGGER trg_par_updated_at BEFORE UPDATE ON prospect_access_requests
  FOR EACH ROW EXECUTE FUNCTION set_prospect_rgpd_updated_at();

COMMENT ON TABLE prospect_access_grants   IS 'Story 89.3 — grants d''accès aux coordonnées parent RGPD (per-line).';
COMMENT ON TABLE prospect_access_requests IS 'Story 89.3 — demandes d''accès RGPD en attente de résolution admin.';
COMMENT ON TABLE prospect_rgpd_access_log IS 'Story 89.3 — log immuable des accès démasqués (preuve RGPD, insert-only).';
