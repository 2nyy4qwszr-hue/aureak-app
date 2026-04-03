-- Story 3.2 — Critères → Faults → Cues
-- ============================================================

CREATE TABLE criteria (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES theme_sequences(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX criteria_seq_idx ON criteria (sequence_id, sort_order);
CREATE INDEX criteria_tenant_idx ON criteria (tenant_id);

CREATE TABLE faults (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  label        TEXT NOT NULL,
  description  TEXT,
  sort_order   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX faults_criterion_idx ON faults (criterion_id, sort_order);
CREATE INDEX faults_tenant_idx ON faults (tenant_id);

CREATE TABLE cues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id    UUID NOT NULL REFERENCES faults(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cues_fault_idx ON cues (fault_id, sort_order);
CREATE INDEX cues_tenant_idx ON cues (tenant_id);

-- ─── Triggers d'intégrité tenant ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION enforce_criteria_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT tenant_id FROM theme_sequences WHERE id = NEW.sequence_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'criteria.tenant_id must match theme_sequences.tenant_id (sequence_id=%)', NEW.sequence_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_criteria_tenant
  BEFORE INSERT OR UPDATE ON criteria
  FOR EACH ROW EXECUTE FUNCTION enforce_criteria_tenant();

CREATE OR REPLACE FUNCTION enforce_faults_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT tenant_id FROM criteria WHERE id = NEW.criterion_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'faults.tenant_id must match criteria.tenant_id (criterion_id=%)', NEW.criterion_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_faults_tenant
  BEFORE INSERT OR UPDATE ON faults
  FOR EACH ROW EXECUTE FUNCTION enforce_faults_tenant();

CREATE OR REPLACE FUNCTION enforce_cues_tenant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT tenant_id FROM faults WHERE id = NEW.fault_id) <> NEW.tenant_id THEN
    RAISE EXCEPTION 'cues.tenant_id must match faults.tenant_id (fault_id=%)', NEW.fault_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cues_tenant
  BEFORE INSERT OR UPDATE ON cues
  FOR EACH ROW EXECUTE FUNCTION enforce_cues_tenant();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE faults   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cues     ENABLE ROW LEVEL SECURITY;
