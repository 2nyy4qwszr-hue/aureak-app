-- Story 10.5 — Export jobs conformes

CREATE TABLE export_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  requested_by UUID NOT NULL REFERENCES profiles(user_id),
  export_type  TEXT NOT NULL CHECK (export_type IN (
    'attendance_report',
    'evaluation_report',
    'mastery_report',
    'gdpr_personal_data',
    'cross_implantation_anonymous'
  )),
  filters      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','ready','failed','expired')),
  file_url     TEXT,
  file_format  TEXT NOT NULL DEFAULT 'csv' CHECK (file_format IN ('csv','json')),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON export_jobs
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_only" ON export_jobs
  FOR ALL USING (current_user_role() = 'admin');
