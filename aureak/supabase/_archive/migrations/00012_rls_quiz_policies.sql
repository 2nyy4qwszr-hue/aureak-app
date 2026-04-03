-- Story 2.6 — Policies RLS pour Story 3.5 : quiz_questions, quiz_options
-- Doit être exécuté après 00011_referentiel_quiz.sql

-- quiz_questions
-- Admin : CRUD complet dans son tenant
CREATE POLICY "qq_tenant_isolation" ON quiz_questions
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());
CREATE POLICY "qq_admin_full" ON quiz_questions
  FOR ALL USING (current_user_role() = 'admin');
-- Coach : lecture des questions publiées uniquement
CREATE POLICY "qq_coach_read_published" ON quiz_questions
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND current_user_role() = 'coach'
    AND is_active_user()
    AND status = 'published'
    AND deleted_at IS NULL
  );

-- quiz_options
CREATE POLICY "qo_tenant_isolation" ON quiz_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      WHERE qq.id = quiz_options.question_id
        AND qq.tenant_id = current_tenant_id()
        AND is_active_user()
    )
  );
CREATE POLICY "qo_admin_full" ON quiz_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      WHERE qq.id = quiz_options.question_id
        AND current_user_role() = 'admin'
    )
  );
CREATE POLICY "qo_coach_read_published" ON quiz_options
  FOR SELECT USING (
    current_user_role() = 'coach'
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM quiz_questions qq
      WHERE qq.id = quiz_options.question_id
        AND qq.tenant_id = current_tenant_id()
        AND qq.status = 'published'
        AND qq.deleted_at IS NULL
    )
  );
