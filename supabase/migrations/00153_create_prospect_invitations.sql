-- Epic 89 — Story 89.4 : Invitation séance gratuite depuis l'app
-- Ajoute le champ prospect_status sur child_directory + table prospect_invitations
--
-- Contexte : un gardien prospect est contacté → invité → enregistré. Les scouts et
-- admins doivent pouvoir envoyer une invitation par email (template Aureak) et
-- tracer l'envoi (qui, quand, à quelle adresse).

-- 1. Enum prospect_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prospect_status') THEN
    CREATE TYPE prospect_status AS ENUM (
      'prospect',    -- identifié mais pas encore contacté
      'contacte',    -- premier contact réalisé (appel, message)
      'invite'       -- invitation séance gratuite envoyée
    );
  END IF;
END $$;

-- 2. Colonne prospect_status sur child_directory
--    Nullable — un Académicien n'a pas de prospect_status. Renseignée uniquement
--    pour les statuts "Nouveau" ou "Stagiaire" (terminologie import Notion).
ALTER TABLE child_directory
  ADD COLUMN IF NOT EXISTS prospect_status prospect_status;

CREATE INDEX IF NOT EXISTS idx_child_directory_prospect_status
  ON child_directory(tenant_id, prospect_status)
  WHERE prospect_status IS NOT NULL AND deleted_at IS NULL;

-- 3. Table prospect_invitations (trace des envois)
CREATE TABLE IF NOT EXISTS prospect_invitations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id),
  child_id         UUID        NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,
  invited_by       UUID        NOT NULL REFERENCES auth.users(id),

  -- Destinataire parent
  parent_email     TEXT        NOT NULL,
  parent_name      TEXT,

  -- Infos pratiques pour la séance gratuite (toutes nullable — scout peut ne pas
  -- choisir d'implantation précise, etc.)
  implantation_id  UUID        REFERENCES implantations(id),
  message          TEXT,

  -- Traçabilité envoi
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status           TEXT        NOT NULL DEFAULT 'sent',   -- 'sent' | 'failed' | 'delivered'
  resend_id        TEXT,                                  -- id Resend pour debug

  -- Timestamps + soft-delete
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prospect_invitations_child
  ON prospect_invitations(child_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_invitations_tenant
  ON prospect_invitations(tenant_id, sent_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prospect_invitations_invited_by
  ON prospect_invitations(invited_by)
  WHERE deleted_at IS NULL;

-- 4. RLS — isolation tenant + tous les admin/scout voient tout du tenant
ALTER TABLE prospect_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prospect_invitations_select ON prospect_invitations;
CREATE POLICY prospect_invitations_select
  ON prospect_invitations FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS prospect_invitations_insert ON prospect_invitations;
CREATE POLICY prospect_invitations_insert
  ON prospect_invitations FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND invited_by = auth.uid()
  );

DROP POLICY IF EXISTS prospect_invitations_update ON prospect_invitations;
CREATE POLICY prospect_invitations_update
  ON prospect_invitations FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION update_prospect_invitations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_prospect_invitations_updated_at ON prospect_invitations;
CREATE TRIGGER trg_prospect_invitations_updated_at
  BEFORE UPDATE ON prospect_invitations
  FOR EACH ROW EXECUTE FUNCTION update_prospect_invitations_updated_at();
