-- Story 33.3 — Vue Parent : Présences, Badges & Heatmap Assiduité
-- Migration 00104

-- ─── absence_justifications ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS absence_justifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL,
  child_id     UUID        NOT NULL,
  session_id   UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reason       TEXT        NOT NULL CHECK (reason IN ('injury','match','school','school_trip','vacation','other')),
  note         TEXT,
  submitted_by UUID        NOT NULL REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, session_id)
);

-- ─── RLS absence_justifications ──────────────────────────────────────────────

ALTER TABLE absence_justifications ENABLE ROW LEVEL SECURITY;

-- Admin : accès total
CREATE POLICY "absence_justifications_admin" ON absence_justifications
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Parent : uniquement ses propres enfants
CREATE POLICY "absence_justifications_parent_read" ON absence_justifications
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND child_id IN (
      SELECT child_id FROM parent_children WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "absence_justifications_parent_insert" ON absence_justifications
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'parent'
    AND submitted_by = auth.uid()
    AND child_id IN (
      SELECT child_id FROM parent_children WHERE parent_id = auth.uid()
    )
  );

-- Coach : lecture pour les groupes dont il est responsable
CREATE POLICY "absence_justifications_coach_read" ON absence_justifications
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
    AND session_id IN (
      SELECT s.id FROM sessions s
      JOIN group_staff gs ON gs.group_id = s.group_id
      WHERE gs.coach_id = auth.uid()
    )
  );

-- ─── Vue v_child_attendance_heatmap ──────────────────────────────────────────

CREATE OR REPLACE VIEW v_child_attendance_heatmap AS
SELECT
  a.child_id,
  a.tenant_id,
  DATE(s.scheduled_at) AS session_date,
  s.id                 AS session_id,
  s.group_id,
  a.status             AS raw_status,
  aj.reason            AS justification_reason,
  CASE
    WHEN a.status IN ('present','late','trial') THEN 'present'
    WHEN a.status = 'injured'                   THEN 'injured'
    WHEN a.status = 'absent' AND aj.reason IS NOT NULL
         AND aj.reason != 'other'               THEN 'justified'
    WHEN a.status = 'absent'                    THEN 'absent'
    ELSE 'unconfirmed'
  END AS heatmap_status
FROM attendances a
JOIN sessions s ON s.id = a.session_id
LEFT JOIN absence_justifications aj
  ON aj.session_id = a.session_id AND aj.child_id = a.child_id;

-- ─── Vue v_child_badge_history ────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_child_badge_history AS
SELECT
  sba.child_id,
  sba.tenant_id,
  sba.badge_id,
  bb.name       AS badge_name,
  bb.emoji,
  sba.session_id,
  DATE(s.scheduled_at) AS session_date,
  sba.awarded_by,
  COALESCE(p.display_name, sba.awarded_by::TEXT) AS awarded_by_name
FROM session_badge_awards sba
JOIN behavioral_badges bb ON bb.id = sba.badge_id
JOIN sessions s           ON s.id  = sba.session_id
LEFT JOIN profiles p      ON p.user_id = sba.awarded_by;

-- ─── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_absence_justifications_child_session
  ON absence_justifications (child_id, session_id);
