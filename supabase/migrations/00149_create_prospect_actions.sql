-- Story 88.3 — Historique actions commerciales : prospect_actions (append-only)
-- Enum prospect_action_type + table + trigger status change + RLS + index

-- 1. Enum prospect_action_type (8 valeurs)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prospect_action_type') THEN
    CREATE TYPE prospect_action_type AS ENUM (
      'premier_contact',
      'relance',
      'identification_contact',
      'obtention_rdv',
      'presentation',
      'closing',
      'note',
      'changement_statut'
    );
  END IF;
END $$;

-- 2. Table prospect_actions (append-only : pas de updated_at ni deleted_at)
CREATE TABLE IF NOT EXISTS prospect_actions (
  id                UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  club_prospect_id  UUID                NOT NULL REFERENCES club_prospects(id) ON DELETE CASCADE,
  performed_by      UUID                NOT NULL REFERENCES auth.users(id),
  action_type       prospect_action_type NOT NULL,
  description       TEXT,
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_prospect_actions_prospect_date
  ON prospect_actions(club_prospect_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_actions_performer
  ON prospect_actions(performed_by);

-- 4. RLS enable
ALTER TABLE prospect_actions ENABLE ROW LEVEL SECURITY;

-- 5. Policies — SELECT : admin voit tout le tenant, commercial voit actions sur ses prospects
CREATE POLICY prospect_actions_select ON prospect_actions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM club_prospects cp
    WHERE cp.id = prospect_actions.club_prospect_id
    AND cp.deleted_at IS NULL
    AND cp.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() ->> 'role') = 'admin'
      OR cp.assigned_commercial_id = auth.uid()
    )
  )
);

-- INSERT : commercial peut insérer si performed_by = auth.uid() ET prospect assigné à lui (ou admin)
CREATE POLICY prospect_actions_insert ON prospect_actions FOR INSERT WITH CHECK (
  performed_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM club_prospects cp
    WHERE cp.id = prospect_actions.club_prospect_id
    AND cp.deleted_at IS NULL
    AND cp.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (
      (auth.jwt() ->> 'role') = 'admin'
      OR cp.assigned_commercial_id = auth.uid()
    )
  )
);

-- PAS de UPDATE/DELETE policies — table append-only

-- 6. Trigger : log automatique changement de statut sur club_prospects
CREATE OR REPLACE FUNCTION log_prospect_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO prospect_actions (club_prospect_id, performed_by, action_type, description)
    VALUES (
      NEW.id,
      auth.uid(),
      'changement_statut',
      'Statut: ' || OLD.status::text || ' -> ' || NEW.status::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_prospect_status_change ON club_prospects;
CREATE TRIGGER trg_log_prospect_status_change
  AFTER UPDATE OF status ON club_prospects
  FOR EACH ROW
  EXECUTE FUNCTION log_prospect_status_change();
