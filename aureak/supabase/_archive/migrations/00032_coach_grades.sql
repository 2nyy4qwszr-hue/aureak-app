-- Story 11.1 — Grades coach & historique immuable

CREATE TYPE coach_grade_level AS ENUM ('bronze','silver','gold','platinum');

CREATE TABLE coach_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  coach_id    UUID NOT NULL REFERENCES profiles(user_id),
  grade_level coach_grade_level NOT NULL,
  awarded_by  UUID NOT NULL REFERENCES profiles(user_id),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE coach_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON coach_grades
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_insert" ON coach_grades
  FOR INSERT WITH CHECK (current_user_role() = 'admin' AND awarded_by = auth.uid());
CREATE POLICY "read_own_or_admin" ON coach_grades
  FOR SELECT USING (coach_id = auth.uid() OR current_user_role() = 'admin');
CREATE POLICY "no_update" ON coach_grades FOR UPDATE USING (false);
CREATE POLICY "no_delete" ON coach_grades FOR DELETE USING (false);

-- Vue grade courant (dernière attribution par coach)
CREATE VIEW coach_current_grade AS
SELECT DISTINCT ON (tenant_id, coach_id)
  tenant_id, coach_id, grade_level, awarded_by, awarded_at, notes
FROM coach_grades
ORDER BY tenant_id, coach_id, awarded_at DESC;

-- Helper RLS : grade du user courant
CREATE OR REPLACE FUNCTION current_user_grade()
RETURNS coach_grade_level LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT grade_level
  FROM coach_current_grade
  WHERE tenant_id = current_tenant_id() AND coach_id = auth.uid()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION current_user_grade() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_grade() TO authenticated;

-- RPC award_coach_grade
CREATE OR REPLACE FUNCTION award_coach_grade(
  p_coach_id UUID,
  p_grade    coach_grade_level,
  p_notes    TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_grade_id UUID;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  INSERT INTO coach_grades (tenant_id, coach_id, grade_level, awarded_by, notes)
  VALUES (current_tenant_id(), p_coach_id, p_grade, auth.uid(), p_notes)
  RETURNING id INTO v_grade_id;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'coach_grade_awarded', 'coach', p_coach_id,
    jsonb_build_object('grade', p_grade, 'grade_id', v_grade_id));

  RETURN v_grade_id;
END;
$$;
REVOKE ALL ON FUNCTION award_coach_grade FROM PUBLIC;
GRANT EXECUTE ON FUNCTION award_coach_grade TO authenticated;
