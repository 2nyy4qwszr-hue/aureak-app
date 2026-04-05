-- Migration 00132 — Academy Milestones (Story 59-7)
-- Table des jalons collectifs de l'académie avec célébration dashboard

-- ── Table academy_milestones ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS academy_milestones (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  milestone_code   TEXT        NOT NULL,
  milestone_label  TEXT        NOT NULL,
  threshold_value  INTEGER     NOT NULL,
  current_value    INTEGER     NOT NULL DEFAULT 0,
  reached_at       TIMESTAMPTZ NULL,
  celebrated       BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, milestone_code)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE academy_milestones ENABLE ROW LEVEL SECURITY;

-- Admin : lecture + écriture
CREATE POLICY "admin_milestones_all" ON academy_milestones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = academy_milestones.tenant_id
        AND profiles.role = 'admin'
    )
  );

-- Staff (coach) : lecture seule
CREATE POLICY "staff_milestones_read" ON academy_milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tenant_id = academy_milestones.tenant_id
        AND profiles.role IN ('coach', 'admin')
    )
  );

-- ── Seed milestones (insérés pour chaque tenant existant) ────────────────────
-- Note : les seeds sont des lignes par tenant. En prod, un trigger ou Edge Function
-- initialise les milestones au moment de la création du tenant.
-- Ici, on insère pour les tenants existants.

INSERT INTO academy_milestones (tenant_id, milestone_code, milestone_label, threshold_value)
SELECT
  t.id,
  m.milestone_code,
  m.milestone_label,
  m.threshold_value
FROM tenants t
CROSS JOIN (VALUES
  ('SESSION_100',       '100 séances validées',             100),
  ('SESSION_500',       '500 séances validées',             500),
  ('PLAYER_500',        '500 joueurs inscrits',             500),
  ('PLAYER_1000',       '1000 joueurs inscrits',           1000),
  ('ATTENDANCE_1000',   '1000 présences enregistrées',    1000),
  ('ATTENDANCE_10000',  '10 000 présences enregistrées', 10000)
) AS m(milestone_code, milestone_label, threshold_value)
ON CONFLICT (tenant_id, milestone_code) DO NOTHING;

-- ── Fonction check_academy_milestones ─────────────────────────────────────────
-- Compare les valeurs actuelles aux thresholds et met à jour reached_at si franchi.
-- Retourne JSONB des milestones nouvellement atteints (celebrated = false).

CREATE OR REPLACE FUNCTION check_academy_milestones(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sessions_count    INTEGER;
  v_players_count     INTEGER;
  v_attendances_count INTEGER;
  v_newly_reached     JSONB := '[]'::JSONB;
  v_row               academy_milestones%ROWTYPE;
  v_current           INTEGER;
BEGIN
  -- Compter les valeurs actuelles
  SELECT COUNT(*)::INTEGER INTO v_sessions_count
  FROM sessions
  WHERE tenant_id = p_tenant_id
    AND deleted_at IS NULL
    AND closed_at IS NOT NULL;

  SELECT COUNT(*)::INTEGER INTO v_players_count
  FROM profiles
  WHERE tenant_id = p_tenant_id
    AND role = 'child';

  SELECT COUNT(*)::INTEGER INTO v_attendances_count
  FROM attendance_records ar
  JOIN sessions s ON s.id = ar.session_id
  WHERE s.tenant_id = p_tenant_id;

  -- Mettre à jour les milestones
  FOR v_row IN
    SELECT * FROM academy_milestones
    WHERE tenant_id = p_tenant_id
  LOOP
    -- Déterminer la valeur courante selon le code
    CASE
      WHEN v_row.milestone_code LIKE 'SESSION_%' THEN
        v_current := v_sessions_count;
      WHEN v_row.milestone_code LIKE 'PLAYER_%' THEN
        v_current := v_players_count;
      WHEN v_row.milestone_code LIKE 'ATTENDANCE_%' THEN
        v_current := v_attendances_count;
      ELSE
        v_current := 0;
    END CASE;

    -- Mettre à jour current_value toujours
    UPDATE academy_milestones
    SET current_value = v_current
    WHERE id = v_row.id;

    -- Si le seuil est franchi et pas encore atteint → marquer reached_at
    IF v_current >= v_row.threshold_value AND v_row.reached_at IS NULL THEN
      UPDATE academy_milestones
      SET reached_at = now()
      WHERE id = v_row.id;

      -- Ajouter à la liste des nouveaux milestones
      v_newly_reached := v_newly_reached || jsonb_build_object(
        'id',              v_row.id,
        'milestone_code',  v_row.milestone_code,
        'milestone_label', v_row.milestone_label,
        'threshold_value', v_row.threshold_value,
        'current_value',   v_current,
        'celebrated',      v_row.celebrated
      );
    END IF;
  END LOOP;

  -- Retourner uniquement les non célébrés
  RETURN (
    SELECT COALESCE(jsonb_agg(m), '[]'::JSONB)
    FROM academy_milestones m
    WHERE m.tenant_id = p_tenant_id
      AND m.reached_at IS NOT NULL
      AND m.celebrated = false
    ORDER BY m.reached_at ASC
  );
END;
$$;
