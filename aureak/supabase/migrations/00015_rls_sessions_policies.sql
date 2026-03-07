-- Story 4.1 — Policies RLS pour les tables sessions (Epic 4)
-- Doit être exécuté après 00014_sessions.sql

-- ─── implantations ────────────────────────────────────────────────────────────

CREATE POLICY "impl_admin_all" ON implantations
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Coach voit les implantations auxquelles il est assigné (permanent OU temporaire)
CREATE POLICY "impl_coach_read" ON implantations
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND (
      EXISTS (
        SELECT 1 FROM coach_implantation_assignments cia
        WHERE cia.coach_id = auth.uid()
          AND cia.implantation_id = implantations.id
      )
      OR EXISTS (
        SELECT 1 FROM coach_access_grants cag
        WHERE cag.coach_id = auth.uid()
          AND cag.implantation_id = implantations.id
          AND cag.expires_at > now()
          AND cag.revoked_at IS NULL
      )
    )
  );

-- ─── groups ───────────────────────────────────────────────────────────────────

CREATE POLICY "groups_admin_all" ON groups
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "groups_coach_read" ON groups
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
  );

-- ─── group_members ────────────────────────────────────────────────────────────

CREATE POLICY "gm_admin_all" ON group_members
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "gm_coach_read" ON group_members
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
  );

-- Parent voit les groupes de ses enfants
CREATE POLICY "gm_parent_read" ON group_members
  FOR SELECT USING (
    is_active_user()
    AND current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id = group_members.child_id
    )
  );

-- ─── session_blocks ───────────────────────────────────────────────────────────

CREATE POLICY "sb_admin_all" ON session_blocks
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "sb_coach_read" ON session_blocks
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
  );

-- ─── recurrence_series ────────────────────────────────────────────────────────

CREATE POLICY "rs_admin_all" ON recurrence_series
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "rs_coach_read" ON recurrence_series
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
  );

-- ─── sessions ─────────────────────────────────────────────────────────────────

CREATE POLICY "sessions_admin_all" ON sessions
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Coach : accès via assignation directe OU grant temporaire (pattern Story 2.3)
CREATE POLICY "sessions_coach_assigned_or_granted" ON sessions
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND (
      EXISTS (
        SELECT 1 FROM session_coaches sc
        WHERE sc.session_id = sessions.id
          AND sc.coach_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM coach_access_grants cag
        WHERE cag.coach_id = auth.uid()
          AND cag.implantation_id = sessions.implantation_id
          AND cag.expires_at > now()
          AND cag.revoked_at IS NULL
      )
    )
  );

-- ─── session_coaches ──────────────────────────────────────────────────────────

CREATE POLICY "sc_admin_all" ON session_coaches
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "sc_coach_own_read" ON session_coaches
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND coach_id = auth.uid()
  );

-- ─── session_themes ───────────────────────────────────────────────────────────

CREATE POLICY "st_admin_all" ON session_themes
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "st_coach_read" ON session_themes
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
  );

-- ─── session_situations ───────────────────────────────────────────────────────

CREATE POLICY "ss_admin_all" ON session_situations
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "ss_coach_read" ON session_situations
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
  );
