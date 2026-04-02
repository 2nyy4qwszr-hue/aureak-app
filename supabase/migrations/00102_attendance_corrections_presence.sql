-- =============================================================================
-- Migration 00102 — Story 33.1 : Dashboard Admin Présences
-- Colonnes attendance_type + corrections admin + coach_presence_type
-- Vue v_session_presence_summary
-- =============================================================================

-- =============================================================================
-- 1. Colonne attendance_type sur session_attendees
-- Distingue les académiciens (member) des enfants essai (trial)
-- Note : le statut 'trial' dans attendance_status est pour la présence elle-même,
-- attendance_type est le contexte d'appartenance au groupe
-- =============================================================================
ALTER TABLE session_attendees
  ADD COLUMN IF NOT EXISTS attendance_type TEXT NOT NULL DEFAULT 'member'
  CHECK (attendance_type IN ('member', 'trial'));

-- =============================================================================
-- 2. Table attendance_corrections
-- Trace toutes les modifications de présence effectuées par un admin
-- =============================================================================
CREATE TABLE IF NOT EXISTS attendance_corrections (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id    UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  child_id      UUID         NOT NULL,
  corrected_by  UUID         NOT NULL REFERENCES profiles(user_id),
  old_status    TEXT,
  new_status    TEXT         NOT NULL,
  corrected_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attendance_corrections_session_idx
  ON attendance_corrections (session_id, tenant_id);
CREATE INDEX IF NOT EXISTS attendance_corrections_child_idx
  ON attendance_corrections (child_id, corrected_at DESC);

ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_corrections_admin" ON attendance_corrections
  FOR ALL TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Coach read-only
CREATE POLICY "attendance_corrections_coach_read" ON attendance_corrections
  FOR SELECT TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'coach'
  );

-- =============================================================================
-- 3. Coach presence granulaire sur coach_presence_confirmations
-- type : full (tout le temps), partial (avec horaires), absent
-- =============================================================================
ALTER TABLE coach_presence_confirmations
  ADD COLUMN IF NOT EXISTS presence_type TEXT NOT NULL DEFAULT 'full'
  CHECK (presence_type IN ('full', 'partial', 'absent')),
  ADD COLUMN IF NOT EXISTS partial_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partial_end   TIMESTAMPTZ;

-- =============================================================================
-- 4. Vue v_session_presence_summary
-- Agrège les présences par séance : total, membres, essais, absents
-- =============================================================================
CREATE OR REPLACE VIEW v_session_presence_summary AS
SELECT
  s.id                AS session_id,
  s.tenant_id,
  s.group_id,
  s.implantation_id,
  s.scheduled_at,
  s.status            AS session_status,
  s.session_type,
  s.closed_at,
  s.label,

  -- Tous les inscrits (roster)
  COUNT(DISTINCT sa.child_id)                                                      AS total_roster,

  -- Membres présents
  COUNT(DISTINCT a.child_id) FILTER (
    WHERE a.status IN ('present','late')
      AND COALESCE(sa.attendance_type, 'member') = 'member'
  )                                                                                AS member_present,

  -- Essais présents
  COUNT(DISTINCT a.child_id) FILTER (
    WHERE a.status IN ('present','late','trial')
      AND sa.attendance_type = 'trial'
  )                                                                                AS trial_present,

  -- Absents
  COUNT(DISTINCT a.child_id) FILTER (WHERE a.status = 'absent')                  AS absent_count,

  -- Non renseigné
  COUNT(DISTINCT sa.child_id) - COUNT(DISTINCT a.child_id)                        AS unconfirmed_count

FROM sessions s
LEFT JOIN session_attendees sa ON sa.session_id = s.id
LEFT JOIN attendances        a ON a.session_id  = s.id AND a.child_id = sa.child_id
WHERE s.deleted_at IS NULL
GROUP BY
  s.id, s.tenant_id, s.group_id, s.implantation_id,
  s.scheduled_at, s.status, s.session_type, s.closed_at, s.label;
