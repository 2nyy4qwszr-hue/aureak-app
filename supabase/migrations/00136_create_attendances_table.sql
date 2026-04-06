-- =============================================================================
-- Migration 00136 — Story 49.9 : BUG P0 — Table attendances absente en remote
-- Crée les tables session_attendees, attendances, coach_presence_confirmations,
-- block_checkins avec RLS, triggers et colonnes additionnelles (migrations 00058,
-- 00062, 00102, 00103).
-- =============================================================================

-- =============================================================================
-- 1. session_attendees
-- Roster attendu d'une séance (pré-rempli depuis group_members)
-- =============================================================================
CREATE TABLE IF NOT EXISTS session_attendees (
  session_id       UUID        NOT NULL REFERENCES sessions(id),
  child_id         UUID        NOT NULL REFERENCES profiles(user_id),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id),
  -- Ajouté par 00058 : joueur invité ponctuel (non-membre du groupe)
  is_guest         BOOLEAN     NOT NULL DEFAULT false,
  -- Ajouté par 00062 : notes coach + déclin de contact
  coach_notes      TEXT        NULL,
  contact_declined BOOLEAN     NOT NULL DEFAULT false,
  -- Ajouté par 00102 : contexte d'appartenance (académicien vs essai)
  attendance_type  TEXT        NOT NULL DEFAULT 'member'
    CHECK (attendance_type IN ('member', 'trial')),
  PRIMARY KEY (session_id, child_id)
);

CREATE INDEX IF NOT EXISTS sa_child_idx   ON session_attendees (child_id);
CREATE INDEX IF NOT EXISTS sa_tenant_idx  ON session_attendees (tenant_id);
CREATE INDEX IF NOT EXISTS session_attendees_is_guest_idx
  ON session_attendees (session_id, is_guest)
  WHERE is_guest = true;

-- =============================================================================
-- 2. attendances
-- Présences réelles enregistrées lors de la séance (event sourcing)
-- =============================================================================
CREATE TABLE IF NOT EXISTS attendances (
  id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID             NOT NULL REFERENCES sessions(id),
  child_id        UUID             NOT NULL REFERENCES profiles(user_id),
  tenant_id       UUID             NOT NULL REFERENCES tenants(id),
  status          attendance_status NOT NULL,
  recorded_by     UUID             NOT NULL REFERENCES profiles(user_id),
  recorded_at     TIMESTAMPTZ      NOT NULL DEFAULT now(),
  synced_at       TIMESTAMPTZ,
  -- Ajouté par 00102 : contexte d'appartenance (académicien vs essai)
  attendance_type TEXT             NOT NULL DEFAULT 'member'
    CHECK (attendance_type IN ('member', 'trial')),
  -- Ajouté par 00103 : type de retard
  late_type       TEXT             NULL
    CHECK (late_type IN ('under_15', 'over_15')),
  UNIQUE (session_id, child_id)
);

CREATE INDEX IF NOT EXISTS attendances_session_idx ON attendances (session_id, tenant_id);
CREATE INDEX IF NOT EXISTS attendances_child_idx   ON attendances (child_id);

-- =============================================================================
-- 3. coach_presence_confirmations
-- Confirmation de présence du coach à la séance (avec granularité full/partial)
-- =============================================================================
CREATE TABLE IF NOT EXISTS coach_presence_confirmations (
  session_id    UUID        NOT NULL REFERENCES sessions(id),
  coach_id      UUID        NOT NULL REFERENCES profiles(user_id),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id),
  confirmed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_id     TEXT,
  -- Ajouté par 00102 : présence granulaire
  presence_type TEXT        NOT NULL DEFAULT 'full'
    CHECK (presence_type IN ('full', 'partial', 'absent')),
  partial_start TIMESTAMPTZ,
  partial_end   TIMESTAMPTZ,
  PRIMARY KEY (session_id, coach_id)
);

-- =============================================================================
-- 4. block_checkins
-- Check-in coach par bloc de séance
-- Note : session_block_id est un UUID libre (pas de FK vers session_blocks
-- car cette table n'est pas encore créée dans les migrations actives)
-- =============================================================================
CREATE TABLE IF NOT EXISTS block_checkins (
  session_block_id UUID        NOT NULL,
  coach_id         UUID        NOT NULL REFERENCES profiles(user_id),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id),
  checked_in_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_block_id, coach_id)
);

-- =============================================================================
-- 5. Trigger : première attendance → session en_cours
-- =============================================================================
CREATE OR REPLACE FUNCTION trg_attendance_start_session()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  UPDATE sessions
  SET
    attendance_started_at = COALESCE(attendance_started_at, now()),
    status = CASE WHEN status = 'planifiée' THEN 'en_cours' ELSE status END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

-- Drop & recreate pour idempotence
DROP TRIGGER IF EXISTS trg_attendance_start ON attendances;
CREATE TRIGGER trg_attendance_start
  AFTER INSERT ON attendances
  FOR EACH ROW EXECUTE FUNCTION trg_attendance_start_session();

-- =============================================================================
-- 6. RPC prefill_session_attendees
-- Pré-remplit le roster depuis group_members
-- =============================================================================
CREATE OR REPLACE FUNCTION prefill_session_attendees(p_session_id UUID)
  RETURNS INT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_group_id  UUID;
  v_tenant_id UUID;
  v_count     INT;
BEGIN
  SELECT group_id, tenant_id INTO v_group_id, v_tenant_id
    FROM sessions
    WHERE id = p_session_id AND tenant_id = current_tenant_id();

  INSERT INTO session_attendees (session_id, child_id, tenant_id)
  SELECT p_session_id, child_id, v_tenant_id
    FROM group_members
    WHERE group_id = v_group_id
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION prefill_session_attendees(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION prefill_session_attendees(UUID) TO authenticated;

-- =============================================================================
-- 7. Activer RLS
-- =============================================================================
ALTER TABLE session_attendees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_presence_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_checkins               ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 8. Politiques RLS — session_attendees
-- =============================================================================

-- Admin : accès complet sur son tenant
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'session_attendees' AND policyname = 'sa_admin_all'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "sa_admin_all" ON session_attendees
        FOR ALL USING (
          tenant_id = current_tenant_id()
          AND is_active_user()
          AND current_user_role() = 'admin'
        )
    $policy$;
  END IF;
END $$;

-- Coach : lecture du roster des séances de son tenant
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'session_attendees' AND policyname = 'sa_coach_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "sa_coach_read" ON session_attendees
        FOR SELECT USING (
          tenant_id = current_tenant_id()
          AND is_active_user()
          AND current_user_role() = 'coach'
        )
    $policy$;
  END IF;
END $$;

-- Parent : lecture du roster pour ses enfants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'session_attendees' AND policyname = 'sa_parent_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "sa_parent_read" ON session_attendees
        FOR SELECT USING (
          is_active_user()
          AND current_user_role() = 'parent'
          AND EXISTS (
            SELECT 1 FROM parent_child_links pcl
            WHERE pcl.parent_id = auth.uid()
              AND pcl.child_id = session_attendees.child_id
          )
        )
    $policy$;
  END IF;
END $$;

-- =============================================================================
-- 9. Politiques RLS — attendances
-- =============================================================================

-- Admin : accès complet sur son tenant
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'attendances' AND policyname = 'att_admin_all'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "att_admin_all" ON attendances
        FOR ALL USING (
          tenant_id = current_tenant_id()
          AND is_active_user()
          AND current_user_role() = 'admin'
        )
    $policy$;
  END IF;
END $$;

-- Coach de la session : lecture/écriture
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'attendances' AND policyname = 'att_coach_rw'
  ) THEN
    EXECUTE $policy$
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
        )
    $policy$;
  END IF;
END $$;

-- Club partenaire : lecture via club_child_links
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'attendances' AND policyname = 'att_club_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "att_club_read" ON attendances
        FOR SELECT USING (
          is_active_user()
          AND current_user_role() = 'club'
          AND EXISTS (
            SELECT 1 FROM club_child_links ccl
            WHERE ccl.club_id = auth.uid()
              AND ccl.child_id = attendances.child_id
          )
        )
    $policy$;
  END IF;
END $$;

-- Parent : lecture de la présence de ses enfants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'attendances' AND policyname = 'att_parent_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "att_parent_read" ON attendances
        FOR SELECT USING (
          is_active_user()
          AND current_user_role() = 'parent'
          AND EXISTS (
            SELECT 1 FROM parent_child_links pcl
            WHERE pcl.parent_id = auth.uid()
              AND pcl.child_id = attendances.child_id
          )
        )
    $policy$;
  END IF;
END $$;

-- =============================================================================
-- 10. Politiques RLS — coach_presence_confirmations
-- =============================================================================

-- Admin : accès complet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_presence_confirmations' AND policyname = 'cpc_admin_all'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "cpc_admin_all" ON coach_presence_confirmations
        FOR ALL USING (
          tenant_id = current_tenant_id()
          AND is_active_user()
          AND current_user_role() = 'admin'
        )
    $policy$;
  END IF;
END $$;

-- Coach : ses propres confirmations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_presence_confirmations' AND policyname = 'cpc_coach_own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "cpc_coach_own" ON coach_presence_confirmations
        FOR ALL USING (
          tenant_id = current_tenant_id()
          AND is_active_user()
          AND current_user_role() = 'coach'
          AND coach_id = auth.uid()
        )
    $policy$;
  END IF;
END $$;

-- =============================================================================
-- 11. Politiques RLS — block_checkins
-- =============================================================================

-- Admin : accès complet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'block_checkins' AND policyname = 'bc_admin_all'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "bc_admin_all" ON block_checkins
        FOR ALL USING (
          tenant_id = current_tenant_id()
          AND is_active_user()
          AND current_user_role() = 'admin'
        )
    $policy$;
  END IF;
END $$;

-- Coach : ses propres check-ins
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'block_checkins' AND policyname = 'bc_coach_own'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "bc_coach_own" ON block_checkins
        FOR ALL USING (
          tenant_id = current_tenant_id()
          AND is_active_user()
          AND current_user_role() = 'coach'
          AND coach_id = auth.uid()
        )
    $policy$;
  END IF;
END $$;

-- =============================================================================
-- 12. Vue v_session_presence_summary (dépend de attendances + session_attendees)
-- Crée/recrée la vue si elle n'existe pas encore
-- (normalement créée par 00102 qui a échoué car attendances inexistante)
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
