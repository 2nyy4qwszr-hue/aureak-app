-- Migration 00144 : Soft-delete sur table tickets (Story 78.2)
-- Ajoute deleted_at pour RGPD. Filtre appliqué côté API (listMyTickets).

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tickets_deleted_at_idx ON tickets (deleted_at) WHERE deleted_at IS NULL;

-- Recréer la policy parent pour exclure les tickets supprimés
-- Note : les admins/coaches restent couverts par "tickets_staff_all" (00092)
DROP POLICY IF EXISTS "tickets_parent_own" ON tickets;
CREATE POLICY "tickets_parent_own" ON tickets
  FOR ALL
  USING (
    deleted_at IS NULL
    AND parent_id = auth.uid()
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );
