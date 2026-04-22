-- Epic 88 — Story 88.3 : Attribution commerciale — historique d'actions append-only
-- Table immuable : trace QUI a fait QUOI sur un prospect, à quel moment.
-- Base pour la décision de rémunération (story 88.4).

-- 1. Enum type d'action
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

-- 2. Table prospect_actions (append-only : pas d'updated_at ni deleted_at)
CREATE TABLE IF NOT EXISTS prospect_actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_prospect_id  UUID NOT NULL REFERENCES club_prospects(id) ON DELETE CASCADE,
  performed_by      UUID NOT NULL REFERENCES auth.users(id),
  action_type       prospect_action_type NOT NULL,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_actions_prospect_desc
  ON prospect_actions(club_prospect_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_actions_performer
  ON prospect_actions(performed_by, created_at DESC);

-- 3. RLS — append-only : SELECT + INSERT seulement, pas de UPDATE ni DELETE
ALTER TABLE prospect_actions ENABLE ROW LEVEL SECURITY;

-- SELECT : admin tenant-scope / commercial sur ses prospects
CREATE POLICY prospect_actions_select
  ON prospect_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_prospects cp
      WHERE cp.id = prospect_actions.club_prospect_id
        AND cp.tenant_id = public.current_tenant_id_with_fallback()
        AND (
          public.current_user_role_with_fallback() = 'admin'
          OR cp.assigned_commercial_id = auth.uid()
        )
    )
  );

-- INSERT : performed_by = auth.uid() ET prospect accessible
CREATE POLICY prospect_actions_insert
  ON prospect_actions FOR INSERT
  WITH CHECK (
    performed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_prospects cp
      WHERE cp.id = prospect_actions.club_prospect_id
        AND cp.tenant_id = public.current_tenant_id_with_fallback()
        AND (
          public.current_user_role_with_fallback() = 'admin'
          OR cp.assigned_commercial_id = auth.uid()
        )
    )
  );

-- Pas de policy UPDATE/DELETE → append-only strict

-- 4. Trigger auto-log changement statut
CREATE OR REPLACE FUNCTION log_prospect_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO prospect_actions (club_prospect_id, performed_by, action_type, description)
    VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.assigned_commercial_id),
      'changement_statut',
      'Statut : ' || OLD.status::text || ' → ' || NEW.status::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_club_prospects_status_change ON club_prospects;
CREATE TRIGGER trg_club_prospects_status_change
  AFTER UPDATE OF status ON club_prospects
  FOR EACH ROW
  EXECUTE FUNCTION log_prospect_status_change();

-- 5. Commentaires
COMMENT ON TABLE prospect_actions IS 'Audit trail append-only des actions commerciales sur club_prospects (story 88.3). Base pour décision rémunération (88.4).';
COMMENT ON COLUMN prospect_actions.action_type IS '8 valeurs : premier_contact, relance, identification_contact, obtention_rdv, presentation, closing, note, changement_statut (auto-trigger).';
COMMENT ON FUNCTION log_prospect_status_change() IS 'Trigger AFTER UPDATE OF status : log automatique dans prospect_actions pour traçabilité.';
