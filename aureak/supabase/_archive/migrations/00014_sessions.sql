-- Story 4.1 — Modèle de Données : Sessions, Blocs & Récurrence
-- ============================================================
-- Prérequis : Epic 2 (profiles, coach_implantation_assignments, coach_access_grants)
--             Epic 3 (themes, situations)
-- ============================================================

CREATE TABLE implantations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  address    TEXT,
  gps_lat    NUMERIC,
  gps_lon    NUMERIC,
  gps_radius INTEGER NOT NULL DEFAULT 300,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX impl_tenant_idx ON implantations (tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  name            TEXT NOT NULL,
  age_group       TEXT CHECK (age_group IN ('U5','U8','U11','Senior')),
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX groups_implantation_idx ON groups (implantation_id) WHERE deleted_at IS NULL;

CREATE TABLE group_members (
  group_id  UUID NOT NULL REFERENCES groups(id),
  child_id  UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, child_id)
);

CREATE INDEX gm_child_idx  ON group_members (child_id);
CREATE INDEX gm_tenant_idx ON group_members (tenant_id);

CREATE TABLE session_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  implantation_id UUID NOT NULL REFERENCES implantations(id),
  date            DATE NOT NULL,
  label           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sb_implantation_date_idx ON session_blocks (implantation_id, date);

CREATE TABLE recurrence_series (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  rule       JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  implantation_id         UUID NOT NULL REFERENCES implantations(id),
  group_id                UUID NOT NULL REFERENCES groups(id),
  session_block_id        UUID REFERENCES session_blocks(id),
  recurrence_id           UUID REFERENCES recurrence_series(id),
  is_exception            BOOLEAN NOT NULL DEFAULT false,
  original_session_id     UUID REFERENCES sessions(id),
  scheduled_at            TIMESTAMPTZ NOT NULL,
  duration_minutes        INTEGER NOT NULL DEFAULT 90,
  location                TEXT,
  status                  TEXT NOT NULL DEFAULT 'planifiée'
    CHECK (status IN ('planifiée','en_cours','terminée','annulée')),
  attendance_started_at   TIMESTAMPTZ,
  attendance_completed_at TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  cancellation_reason     TEXT,
  deleted_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sessions_tenant_status   ON sessions (tenant_id, status, scheduled_at);
CREATE INDEX sessions_implantation    ON sessions (implantation_id, scheduled_at);
CREATE INDEX sessions_group_idx       ON sessions (group_id, scheduled_at);

CREATE TABLE session_coaches (
  session_id UUID NOT NULL REFERENCES sessions(id),
  coach_id   UUID NOT NULL REFERENCES profiles(user_id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  role       TEXT NOT NULL DEFAULT 'lead' CHECK (role IN ('lead','assistant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, coach_id)
);

-- Garantit un seul lead coach par séance
CREATE UNIQUE INDEX one_lead_per_session ON session_coaches (session_id) WHERE role = 'lead';
CREATE INDEX sc_coach_idx ON session_coaches (coach_id);

CREATE TABLE session_themes (
  session_id UUID NOT NULL REFERENCES sessions(id),
  theme_id   UUID NOT NULL REFERENCES themes(id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  sort_order INTEGER,
  PRIMARY KEY (session_id, theme_id)
);

CREATE TABLE session_situations (
  session_id   UUID NOT NULL REFERENCES sessions(id),
  situation_id UUID NOT NULL REFERENCES situations(id),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  sort_order   INTEGER,
  PRIMARY KEY (session_id, situation_id)
);

-- ─── FK différées : implantations existe maintenant ───────────────────────────

-- FK coach_implantation_assignments → implantations (créée sans FK en Story 2.2)
ALTER TABLE coach_implantation_assignments
  ADD CONSTRAINT fk_cia_implantation
  FOREIGN KEY (implantation_id) REFERENCES implantations(id);

-- FK coach_access_grants → implantations (créée sans FK en Story 2.3)
ALTER TABLE coach_access_grants
  ADD CONSTRAINT fk_cag_implantation
  FOREIGN KEY (implantation_id) REFERENCES implantations(id);

-- Note : quick_auth_devices (Story 2.4) est en backlog — FK ajoutée lors de l'implémentation

-- ─── Fonction RPC : changement atomique de lead coach ─────────────────────────

CREATE OR REPLACE FUNCTION change_session_lead(
  p_session_id UUID,
  p_new_lead_id UUID
) RETURNS VOID
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  UPDATE session_coaches SET role = 'assistant'
    WHERE session_id = p_session_id AND role = 'lead';
  INSERT INTO session_coaches (session_id, coach_id, tenant_id, role)
    VALUES (p_session_id, p_new_lead_id, current_tenant_id(), 'lead')
    ON CONFLICT (session_id, coach_id) DO UPDATE SET role = 'lead';
END;
$$;

REVOKE ALL ON FUNCTION change_session_lead(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION change_session_lead(UUID, UUID) TO authenticated;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE implantations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_blocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_series  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_coaches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_themes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_situations ENABLE ROW LEVEL SECURITY;
