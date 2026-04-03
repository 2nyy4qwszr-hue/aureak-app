-- RLS Policies — Story 4.2 (attendances) + Story 4.3 (notifications)
-- ============================================================

-- ─── session_attendees ────────────────────────────────────────────────────────

CREATE POLICY "sa_admin_all" ON session_attendees
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "sa_coach_read" ON session_attendees
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
  );

-- Parent voit le roster de ses enfants
CREATE POLICY "sa_parent_read" ON session_attendees
  FOR SELECT USING (
    is_active_user()
    AND current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id = session_attendees.child_id
    )
  );

-- ─── attendances ──────────────────────────────────────────────────────────────

CREATE POLICY "att_admin_all" ON attendances
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Coach de la session peut INSERT/SELECT
CREATE POLICY "att_coach_rw" ON attendances
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND EXISTS (
      SELECT 1 FROM session_coaches sc
      WHERE sc.session_id = attendances.session_id
        AND sc.coach_id = auth.uid()
    )
  );

-- Club (partenaire) : lecture via club_child_links
CREATE POLICY "att_club_read" ON attendances
  FOR SELECT USING (
    is_active_user()
    AND current_user_role() = 'club'
    AND EXISTS (
      SELECT 1 FROM club_child_links ccl
      WHERE ccl.club_id = auth.uid()
        AND ccl.child_id = attendances.child_id
    )
  );

-- Parent : lecture de la présence de ses enfants
CREATE POLICY "att_parent_read" ON attendances
  FOR SELECT USING (
    is_active_user()
    AND current_user_role() = 'parent'
    AND EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id = attendances.child_id
    )
  );

-- ─── coach_presence_confirmations ─────────────────────────────────────────────

CREATE POLICY "cpc_admin_all" ON coach_presence_confirmations
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "cpc_coach_own" ON coach_presence_confirmations
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND coach_id = auth.uid()
  );

-- ─── block_checkins ───────────────────────────────────────────────────────────

CREATE POLICY "bc_admin_all" ON block_checkins
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

CREATE POLICY "bc_coach_own" ON block_checkins
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'coach'
    AND coach_id = auth.uid()
  );

-- ─── push_tokens ──────────────────────────────────────────────────────────────

-- Chaque utilisateur gère ses propres tokens
CREATE POLICY "pt_own" ON push_tokens
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND user_id = auth.uid()
  );

-- Admin peut lire les tokens (pour envoi ciblé)
CREATE POLICY "pt_admin_read" ON push_tokens
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- ─── notification_preferences ─────────────────────────────────────────────────

CREATE POLICY "np_own" ON notification_preferences
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "np_admin_read" ON notification_preferences
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- ─── notification_send_logs ───────────────────────────────────────────────────

-- Admin lecture uniquement
CREATE POLICY "nsl_admin_read" ON notification_send_logs
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() = 'admin'
  );

-- Insertion réservée aux Edge Functions (service_role bypass RLS)
-- Les Edge Functions utilisent le service role key — pas de policy INSERT nécessaire
