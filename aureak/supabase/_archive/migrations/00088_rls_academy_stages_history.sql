-- Migration 00088 : RLS policies for academy/stage/history tables
-- These tables had RLS enabled but no SELECT policies, blocking the app from reading data.
-- Pattern matches existing migrations (00010, 00036, etc.): tenant_id = current_tenant_id()

-- ── child_directory_history ────────────────────────────────────────────────
-- Table created in a prior migration; ensure RLS is enabled
ALTER TABLE IF EXISTS child_directory_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cdh_tenant_read"   ON child_directory_history;
DROP POLICY IF EXISTS "cdh_staff_write"   ON child_directory_history;
DROP POLICY IF EXISTS "cdh_staff_delete"  ON child_directory_history;

CREATE POLICY "cdh_tenant_read" ON child_directory_history
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "cdh_staff_write" ON child_directory_history
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

CREATE POLICY "cdh_staff_update" ON child_directory_history
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

CREATE POLICY "cdh_staff_delete" ON child_directory_history
  FOR DELETE USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

-- ── stages ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "stages_tenant_read"   ON stages;
DROP POLICY IF EXISTS "stages_staff_write"   ON stages;
DROP POLICY IF EXISTS "stages_staff_update"  ON stages;
DROP POLICY IF EXISTS "stages_staff_delete"  ON stages;

CREATE POLICY "stages_tenant_read" ON stages
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "stages_staff_write" ON stages
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

CREATE POLICY "stages_staff_update" ON stages
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

CREATE POLICY "stages_staff_delete" ON stages
  FOR DELETE USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  );

-- ── child_stage_participations ─────────────────────────────────────────────
DROP POLICY IF EXISTS "csp_tenant_read"   ON child_stage_participations;
DROP POLICY IF EXISTS "csp_staff_write"   ON child_stage_participations;
DROP POLICY IF EXISTS "csp_staff_delete"  ON child_stage_participations;

CREATE POLICY "csp_tenant_read" ON child_stage_participations
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "csp_staff_write" ON child_stage_participations
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

CREATE POLICY "csp_staff_delete" ON child_stage_participations
  FOR DELETE USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

-- ── academy_seasons ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "as_tenant_read"   ON academy_seasons;
DROP POLICY IF EXISTS "as_admin_write"   ON academy_seasons;

CREATE POLICY "as_tenant_read" ON academy_seasons
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "as_admin_write" ON academy_seasons
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'admin'
  );

-- ── child_academy_memberships ──────────────────────────────────────────────
DROP POLICY IF EXISTS "cam_tenant_read"   ON child_academy_memberships;
DROP POLICY IF EXISTS "cam_staff_write"   ON child_academy_memberships;

CREATE POLICY "cam_tenant_read" ON child_academy_memberships
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "cam_staff_write" ON child_academy_memberships
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'coach')
  );

-- ── stage_days / stage_blocks / stage_block_participants ───────────────────
ALTER TABLE IF EXISTS stage_days              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stage_blocks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stage_block_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sd_tenant_read"  ON stage_days;
DROP POLICY IF EXISTS "sd_staff_write"  ON stage_days;
CREATE POLICY "sd_tenant_read" ON stage_days
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "sd_staff_write" ON stage_days
  FOR ALL USING (tenant_id = current_tenant_id() AND current_user_role() IN ('admin','coach'));

DROP POLICY IF EXISTS "sb_tenant_read"  ON stage_blocks;
DROP POLICY IF EXISTS "sb_staff_write"  ON stage_blocks;
CREATE POLICY "sb_tenant_read" ON stage_blocks
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "sb_staff_write" ON stage_blocks
  FOR ALL USING (tenant_id = current_tenant_id() AND current_user_role() IN ('admin','coach'));

DROP POLICY IF EXISTS "sbp_tenant_read" ON stage_block_participants;
DROP POLICY IF EXISTS "sbp_staff_write" ON stage_block_participants;
CREATE POLICY "sbp_tenant_read" ON stage_block_participants
  FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "sbp_staff_write" ON stage_block_participants
  FOR ALL USING (tenant_id = current_tenant_id() AND current_user_role() IN ('admin','coach'));
