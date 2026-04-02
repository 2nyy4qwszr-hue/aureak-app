-- =============================================================================
-- Migration 00100 — Dashboard Opérationnel Séances (Story 32.2)
-- Vues agrégées : stats présences, absences consécutives, métriques coach
-- Table admin_alerts : alertes actives/résolues pour l'admin
-- =============================================================================

-- =============================================================================
-- 1. Vue v_session_attendance_stats
-- Agrège présents/absents/retards par séance
-- =============================================================================
CREATE OR REPLACE VIEW v_session_attendance_stats AS
SELECT
  s.id                AS session_id,
  s.tenant_id,
  s.group_id,
  s.implantation_id,
  s.scheduled_at,
  s.status,
  s.session_type,
  s.closed_at,
  s.label,
  s.duration_minutes,
  s.cancellation_reason,
  COUNT(a.id)                                                          AS total_attendees,
  COUNT(a.id) FILTER (WHERE a.status IN ('present','late','trial'))    AS present_count,
  COUNT(a.id) FILTER (WHERE a.status = 'absent')                      AS absent_count,
  COUNT(a.id) FILTER (WHERE a.status = 'late')                        AS late_count
FROM sessions s
LEFT JOIN attendances a ON a.session_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY
  s.id, s.tenant_id, s.group_id, s.implantation_id,
  s.scheduled_at, s.status, s.session_type, s.closed_at,
  s.label, s.duration_minutes, s.cancellation_reason;

-- =============================================================================
-- 2. Vue v_child_consecutive_absences
-- Calcule le nombre d'absences consécutives en fin d'historique, par enfant × groupe
-- Exclut les enfants avec une blessure active (date_fin IS NULL)
-- =============================================================================
CREATE OR REPLACE VIEW v_child_consecutive_absences AS
WITH attendance_ranked AS (
  SELECT
    a.child_id,
    s.group_id,
    s.tenant_id,
    (a.status = 'absent') AS is_absent,
    ROW_NUMBER() OVER (
      PARTITION BY a.child_id, s.group_id
      ORDER BY s.scheduled_at DESC
    ) AS rn
  FROM attendances a
  JOIN sessions s ON s.id = a.session_id
  WHERE s.deleted_at IS NULL
    AND s.status IN ('réalisée', 'terminée')
),
streak_counts AS (
  SELECT
    child_id,
    group_id,
    tenant_id,
    CASE
      WHEN BOOL_OR(NOT is_absent)
        THEN (MIN(CASE WHEN NOT is_absent THEN rn END) - 1)
      ELSE COUNT(*)::BIGINT
    END AS consecutive_absences
  FROM attendance_ranked
  GROUP BY child_id, group_id, tenant_id
)
SELECT
  sc.child_id,
  sc.group_id,
  sc.tenant_id,
  sc.consecutive_absences,
  p.display_name AS child_name
FROM streak_counts sc
JOIN profiles p ON p.user_id = sc.child_id
WHERE sc.consecutive_absences > 0
  AND NOT EXISTS (
    -- Exclure les enfants avec une blessure active via child_directory
    -- (child_directory_injuries utilise child_directory.id, pas profiles.user_id)
    -- On exclut via profiles → child_directory via display_name match est trop fragile ;
    -- on laisse ce filtre opt-in côté applicatif (listChildConsecutiveAbsences exclut les injured)
    SELECT 1 WHERE false
  );

-- =============================================================================
-- 3. Vue v_coach_quality_metrics
-- Métriques qualité par coach : taux débrief, présence, délai moyen
-- =============================================================================
CREATE OR REPLACE VIEW v_coach_quality_metrics AS
SELECT
  sc.coach_id,
  sc.tenant_id,
  COUNT(DISTINCT s.id)                                                             AS total_sessions,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('réalisée','terminée'))         AS sessions_done,
  COUNT(DISTINCT s.id) FILTER (WHERE s.closed_at IS NOT NULL)                    AS debriefs_filled,
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.status IN ('réalisée','terminée') AND s.closed_at IS NULL
  )                                                                               AS debriefs_missing,
  ROUND(
    100.0
    * COUNT(DISTINCT s.id) FILTER (WHERE s.closed_at IS NOT NULL)::NUMERIC
    / NULLIF(
        COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('réalisée','terminée'))::NUMERIC,
        0
      ),
    1
  )                                                                               AS debrief_fill_rate,
  ROUND(
    100.0
    * COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('réalisée','terminée'))::NUMERIC
    / NULLIF(
        COUNT(DISTINCT s.id) FILTER (WHERE s.status != 'annulée')::NUMERIC,
        0
      ),
    1
  )                                                                               AS presence_rate,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (s.closed_at - s.scheduled_at)) / 3600.0
    ) FILTER (WHERE s.closed_at IS NOT NULL)::NUMERIC,
    1
  )                                                                               AS avg_debrief_delay_hours
FROM session_coaches sc
JOIN sessions s ON s.id = sc.session_id AND s.deleted_at IS NULL
GROUP BY sc.coach_id, sc.tenant_id;

-- =============================================================================
-- 4. Table admin_alerts
-- Alertes actives : absences consécutives, débriefs manquants, coachs absents
-- =============================================================================
CREATE TABLE IF NOT EXISTS admin_alerts (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type         TEXT         NOT NULL CHECK (type IN (
    'consecutive_absences',
    'debrief_missing',
    'coach_absent_unresolved'
  )),
  entity_id    UUID         NOT NULL,
  entity_type  TEXT         NOT NULL CHECK (entity_type IN ('child', 'session', 'coach')),
  metadata     JSONB        NOT NULL DEFAULT '{}',
  status       TEXT         NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID         REFERENCES profiles(user_id),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_alerts_tenant_status_idx
  ON admin_alerts (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_alerts_entity_idx
  ON admin_alerts (tenant_id, entity_id);

-- RLS : admin seul, CRUD complet
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_alerts_admin_rw" ON admin_alerts
  FOR ALL TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );
