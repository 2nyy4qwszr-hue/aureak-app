-- Epic 89 — Story 89.5 : Liste d'attente intelligente + notification absence
-- Crée la table trial_waitlist pour gérer les prospects en attente d'une place
-- dans un groupe. Quand une absence est enregistrée, le système parcourt la
-- waitlist (ordre FIFO sur requested_at) et notifie le premier prospect en
-- attente. Le parent a 24h pour confirmer, sinon le slot passe au suivant.
--
-- AC implémentés ici : #1 (table + RLS), fondations pour #3/#4/#5/#6.

-- 1. Enum waitlist_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waitlist_status') THEN
    CREATE TYPE waitlist_status AS ENUM (
      'waiting',    -- inscrit en liste d'attente, pas encore de slot
      'notified',   -- un slot libre a été détecté, parent notifié
      'confirmed',  -- parent a confirmé la présence à la séance d'essai
      'expired'     -- pas de confirmation dans les 24h → slot passé au suivant
    );
  END IF;
END $$;

-- 2. Table trial_waitlist
CREATE TABLE IF NOT EXISTS trial_waitlist (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID            NOT NULL REFERENCES tenants(id),

  -- Prospect (child_directory, pas profiles — il n'a pas encore de compte auth)
  child_id         UUID            NOT NULL REFERENCES child_directory(id) ON DELETE CASCADE,

  -- Cible
  group_id         UUID            NOT NULL REFERENCES groups(id),
  implantation_id  UUID            NOT NULL REFERENCES implantations(id),

  -- Destinataire notification
  parent_email     TEXT            NOT NULL,
  parent_phone     TEXT,

  -- Cycle de vie
  status           waitlist_status NOT NULL DEFAULT 'waiting',
  requested_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  notified_at      TIMESTAMPTZ,
  confirmed_at     TIMESTAMPTZ,
  expired_at       TIMESTAMPTZ,

  -- Lien séance si confirmation (référence vers la session où le slot s'est libéré)
  notified_session_id UUID         REFERENCES sessions(id),

  -- Token de confirmation unique (utilisé dans le lien email envoyé au parent)
  confirm_token    UUID            NOT NULL DEFAULT gen_random_uuid() UNIQUE,

  -- Audit
  created_by       UUID            REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,

  -- Un même prospect ne peut pas être en waitlist deux fois pour le même groupe (hors soft-deleted)
  CONSTRAINT trial_waitlist_unique_active
    EXCLUDE USING btree (child_id WITH =, group_id WITH =)
    WHERE (deleted_at IS NULL AND status IN ('waiting', 'notified'))
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_trial_waitlist_tenant
  ON trial_waitlist(tenant_id, status, requested_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_trial_waitlist_group_waiting
  ON trial_waitlist(group_id, requested_at)
  WHERE deleted_at IS NULL AND status = 'waiting';

CREATE INDEX IF NOT EXISTS idx_trial_waitlist_child
  ON trial_waitlist(child_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_trial_waitlist_notified_expiry
  ON trial_waitlist(notified_at)
  WHERE deleted_at IS NULL AND status = 'notified';

-- 4. RLS — admin/scout du tenant, plus accès public limité via confirm_token
ALTER TABLE trial_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trial_waitlist_select_tenant ON trial_waitlist;
CREATE POLICY trial_waitlist_select_tenant
  ON trial_waitlist FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS trial_waitlist_insert_tenant ON trial_waitlist;
CREATE POLICY trial_waitlist_insert_tenant
  ON trial_waitlist FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

DROP POLICY IF EXISTS trial_waitlist_update_tenant ON trial_waitlist;
CREATE POLICY trial_waitlist_update_tenant
  ON trial_waitlist FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- La confirmation parent (via lien email → Edge Function) passe par service role,
-- donc pas besoin de policy publique. Le token seul identifie la ligne.

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION update_trial_waitlist_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_trial_waitlist_updated_at ON trial_waitlist;
CREATE TRIGGER trg_trial_waitlist_updated_at
  BEFORE UPDATE ON trial_waitlist
  FOR EACH ROW EXECUTE FUNCTION update_trial_waitlist_updated_at();

-- 6. Trigger attendance → waitlist : quand une absence est enregistrée sur
-- attendances, on déclenche une notification HTTP vers l'Edge Function
-- notify-waitlist qui fera le reste (envoi email, update notified_at).
--
-- On passe par pg_net.http_post pour ne pas bloquer l'INSERT d'attendance.
-- Si pg_net n'est pas dispo (dev local), la fonction ne fait rien silencieusement.

CREATE OR REPLACE FUNCTION notify_waitlist_on_absence()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_session_group_id UUID;
  v_project_url      TEXT;
  v_service_key      TEXT;
BEGIN
  -- Ne s'exécute que pour les absences
  IF NEW.status <> 'absent' THEN
    RETURN NEW;
  END IF;

  -- Trouver le group_id de la session
  SELECT group_id INTO v_session_group_id
  FROM sessions WHERE id = NEW.session_id;

  IF v_session_group_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- S'il n'y a personne en waitlist pour ce groupe, rien à faire
  IF NOT EXISTS (
    SELECT 1 FROM trial_waitlist
    WHERE group_id = v_session_group_id
      AND status = 'waiting'
      AND deleted_at IS NULL
  ) THEN
    RETURN NEW;
  END IF;

  -- Appel asynchrone à l'Edge Function via pg_net (si dispo)
  BEGIN
    v_project_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.service_role_key', true);

    IF v_project_url IS NOT NULL AND v_service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url     := v_project_url || '/functions/v1/notify-waitlist',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body    := jsonb_build_object(
          'groupId',   v_session_group_id,
          'sessionId', NEW.session_id,
          'tenantId',  NEW.tenant_id
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ne jamais bloquer l'INSERT d'attendance si la notification échoue
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_waitlist_on_absence ON attendances;
CREATE TRIGGER trg_notify_waitlist_on_absence
  AFTER INSERT ON attendances
  FOR EACH ROW
  WHEN (NEW.status = 'absent')
  EXECUTE FUNCTION notify_waitlist_on_absence();

-- 7. Expiration 24h — SQL function appelable par un scheduler (pg_cron, edge
-- cron, GitHub Actions, etc.). Passe status='notified' → 'expired' quand
-- notified_at > 24h. Retourne les IDs expirés pour que l'Edge Function qui
-- l'appelle puisse re-déclencher la notification au prospect suivant.
CREATE OR REPLACE FUNCTION expire_waitlist_entries()
RETURNS TABLE (
  waitlist_id UUID,
  group_id    UUID,
  tenant_id   UUID,
  session_id  UUID
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE trial_waitlist
     SET status     = 'expired',
         expired_at = NOW()
   WHERE status            = 'notified'
     AND notified_at       < NOW() - INTERVAL '24 hours'
     AND deleted_at        IS NULL
  RETURNING id, group_id, tenant_id, notified_session_id;
END;
$$;
