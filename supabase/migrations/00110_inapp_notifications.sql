-- Migration 00110 — Notifications in-app
-- Story tbd-notifs-inapp
-- Table pour stocker les notifications destinées aux utilisateurs admin/coach

CREATE TABLE IF NOT EXISTS inapp_notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL DEFAULT '',
  type        TEXT        NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'warning', 'success', 'error')),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour charger rapidement les notifs non lues d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_inapp_notifications_user_unread
  ON inapp_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- RLS : chaque utilisateur ne voit que ses propres notifications
ALTER TABLE inapp_notifications ENABLE ROW LEVEL SECURITY;

DO $rls_own$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inapp_notifications' AND policyname = 'own_notifications'
  ) THEN
    CREATE POLICY "own_notifications"
      ON inapp_notifications
      FOR ALL
      USING (user_id = auth.uid());
  END IF;
END $rls_own$;

-- Les admins peuvent insérer des notifs pour n'importe quel utilisateur du même tenant
-- Note: colonne user_role (pas role) dans la table profiles
DO $rls_admin$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inapp_notifications' AND policyname = 'admin_insert_notifications'
  ) THEN
    CREATE POLICY "admin_insert_notifications"
      ON inapp_notifications
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid()
            AND user_role = 'admin'
            AND tenant_id = inapp_notifications.tenant_id
        )
      );
  END IF;
END $rls_admin$;

COMMENT ON TABLE inapp_notifications IS
  'Story tbd-notifs-inapp — Notifications in-app pour admin et coaches';
