-- Story 7.4 — Système de tickets parent (minimal tracé)
-- ============================================================

-- ─── Table tickets ────────────────────────────────────────────────────────────

CREATE TABLE tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  parent_id   UUID NOT NULL REFERENCES profiles(user_id),
  child_id    UUID REFERENCES profiles(user_id),
  session_id  UUID REFERENCES sessions(id),
  category    TEXT NOT NULL
    CHECK (category IN ('absence','retard','question','logistique')),
  subject     TEXT NOT NULL CHECK (char_length(subject) <= 120),
  body        TEXT NOT NULL CHECK (char_length(body) <= 2000),
  status      TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  assigned_to UUID REFERENCES profiles(user_id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Isolation tenant
CREATE POLICY "tickets_tenant" ON tickets
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());

-- Parent voit ses propres tickets ; coach/admin voient tous
CREATE POLICY "tickets_parent_own" ON tickets
  FOR ALL USING (
    parent_id = auth.uid()
    OR current_user_role() IN ('admin', 'coach')
  );

CREATE INDEX tickets_tenant_status_idx ON tickets (tenant_id, status);
CREATE INDEX tickets_parent_idx        ON tickets (parent_id);

-- ─── Table ticket_replies ─────────────────────────────────────────────────────

CREATE TABLE ticket_replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  author_id  UUID NOT NULL REFERENCES profiles(user_id),
  body       TEXT NOT NULL CHECK (char_length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- Isolation tenant
CREATE POLICY "ticket_replies_tenant" ON ticket_replies
  FOR ALL USING (tenant_id = current_tenant_id() AND is_active_user());

-- Réponses visibles si le ticket est accessible
CREATE POLICY "ticket_replies_access" ON ticket_replies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
        AND (t.parent_id = auth.uid() OR current_user_role() IN ('admin','coach'))
    )
  );

CREATE INDEX ticket_replies_ticket_idx ON ticket_replies (ticket_id);
