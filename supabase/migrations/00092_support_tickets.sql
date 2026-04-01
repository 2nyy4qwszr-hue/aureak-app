-- =============================================================================
-- Migration 00092 : Support tickets parent (Story 7.4)
-- Tables : tickets + ticket_replies
-- RLS : parent voit ses propres tickets ; coach/admin voient tous (tenant)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  parent_id   UUID NOT NULL REFERENCES profiles(user_id),
  child_id    UUID REFERENCES profiles(user_id),
  session_id  UUID,              -- FK optionnelle vers sessions (story 4.1)
  category    TEXT NOT NULL CHECK (category IN ('absence','retard','question','logistique')),
  subject     TEXT NOT NULL CHECK (char_length(subject) <= 120),
  body        TEXT NOT NULL CHECK (char_length(body) <= 2000),
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','in_progress','resolved','closed')),
  assigned_to UUID REFERENCES profiles(user_id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS tickets_tenant_idx  ON tickets (tenant_id);
CREATE INDEX IF NOT EXISTS tickets_parent_idx  ON tickets (parent_id);
CREATE INDEX IF NOT EXISTS tickets_status_idx  ON tickets (tenant_id, status) WHERE status != 'closed';

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_parent_own"      ON tickets;
DROP POLICY IF EXISTS "tickets_staff_all"        ON tickets;

-- Parent voit ses propres tickets uniquement
CREATE POLICY "tickets_parent_own" ON tickets
  FOR ALL USING (
    parent_id = auth.uid()
    AND tenant_id = current_tenant_id()
    AND is_active_user()
  );

-- Coach et Admin voient tous les tickets du tenant
CREATE POLICY "tickets_staff_all" ON tickets
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() IN ('admin', 'coach')
  );

-- =============================================================================

CREATE TABLE IF NOT EXISTS ticket_replies (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  author_id UUID NOT NULL REFERENCES profiles(user_id),
  body      TEXT NOT NULL CHECK (char_length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_replies_ticket_idx ON ticket_replies (ticket_id);
CREATE INDEX IF NOT EXISTS ticket_replies_tenant_idx ON ticket_replies (tenant_id);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "replies_parent_via_ticket" ON ticket_replies;
DROP POLICY IF EXISTS "replies_staff_all"          ON ticket_replies;

-- Parent voit les réponses de ses propres tickets (via EXISTS)
CREATE POLICY "replies_parent_via_ticket" ON ticket_replies
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
        AND t.parent_id = auth.uid()
    )
  );

-- Parent peut insérer dans ses propres tickets
CREATE POLICY "replies_parent_insert" ON ticket_replies
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
        AND t.parent_id = auth.uid()
    )
  );

-- Coach et Admin : accès complet
CREATE POLICY "replies_staff_all" ON ticket_replies
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND is_active_user()
    AND current_user_role() IN ('admin', 'coach')
  );
