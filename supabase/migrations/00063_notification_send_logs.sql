-- Migration 00063 — notification_send_logs : déduplication des notifications push
-- Utilisée par les Edge Functions (session-close-reminder, etc.) pour éviter
-- les doublons d'envoi dans une fenêtre de temps donnée.

CREATE TABLE IF NOT EXISTS notification_send_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT        NOT NULL UNIQUE,       -- ex : "sessionId:close_reminder_1"
  tenant_id  UUID        NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajoute created_at si la table existait déjà sans cette colonne (idempotent)
ALTER TABLE notification_send_logs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Index pour le nettoyage périodique des vieux logs
CREATE INDEX IF NOT EXISTS notification_send_logs_created_idx
  ON notification_send_logs (created_at);

-- RLS : seul le service role (Edge Functions) écrit dans cette table
ALTER TABLE notification_send_logs ENABLE ROW LEVEL SECURITY;

-- Pas de politique pour les utilisateurs : cette table est privée aux Edge Functions
-- qui utilisent le service_role_key (bypass RLS).

COMMENT ON TABLE notification_send_logs IS
  'Déduplication des notifications push. Nettoyage suggéré : DELETE WHERE created_at < now() - interval ''7 days''';
