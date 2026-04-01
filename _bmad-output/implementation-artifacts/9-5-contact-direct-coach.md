# Story 9.5 : Contact Direct Coach

Status: done

## Story

En tant qu'Admin,
Je veux envoyer un message direct à un coach (push + message interne) depuis le tableau de bord, avec traçabilité complète,
Afin de communiquer rapidement sans sortir de l'application.

## Acceptance Criteria

**AC1 — Formulaire contact coach**
- **When** l'Admin utilise "Contacter ce coach" (message + urgence : routine/urgent)
- **Then** notification push envoyée via Story 7.1 : `event_type = 'admin_message'`, canaux selon urgence

**AC2 — Table `admin_messages`**
- **And** message stocké dans `admin_messages` avec RLS

**AC3 — Traçabilité audit**
- **And** chaque envoi tracé dans `audit_logs` (`action = 'admin_message_sent'`)

**AC4 — Fil messages coach**
- **And** coach reçoit dans un fil "Messages de l'Admin" (`admin_messages WHERE recipient_id = auth.uid()`)

**AC5 — Historique admin**
- **And** Admin consulte l'historique de tous ses messages envoyés, filtré par coach et période

**AC6 — Couverture FRs**
- **And** FR45 couvert : contact direct coach tracé dans audit
- **And** `supabase db diff` reste clean

## Tasks / Subtasks

- [ ] Task 1 — Migration `00022_admin_messages.sql` (AC: #2)
  - [ ] 1.1 Créer `admin_messages` + RLS

- [ ] Task 2 — RPC `send_admin_message(recipient_id, message, urgency)` (AC: #1, #3)
  - [ ] 2.1 INSERT `admin_messages` + appel `send-notification` + INSERT `audit_logs`

- [ ] Task 3 — UI Admin (AC: #1, #5)
  - [ ] 3.1 Formulaire "Contacter coach" dans `apps/web/app/(admin)/coaches/[coachId]/contact.tsx`
  - [ ] 3.2 Liste historique messages envoyés

- [ ] Task 4 — UI Coach (AC: #4)
  - [ ] 4.1 Section "Messages Admin" dans `apps/mobile/app/(coach)/messages.tsx`

## Dev Notes

### Migration `00022_admin_messages.sql`

```sql
CREATE TABLE admin_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  sender_id    UUID NOT NULL REFERENCES profiles(user_id),
  recipient_id UUID NOT NULL REFERENCES profiles(user_id),
  message      TEXT NOT NULL CHECK (char_length(message) <= 2000),
  urgency      TEXT NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine','urgent')),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON admin_messages
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "admin_sender" ON admin_messages
  FOR INSERT WITH CHECK (current_user_role() = 'admin' AND sender_id = auth.uid());
CREATE POLICY "recipient_read" ON admin_messages
  FOR SELECT USING (recipient_id = auth.uid() OR current_user_role() = 'admin');
```

### RPC `send_admin_message`

```sql
CREATE OR REPLACE FUNCTION send_admin_message(
  p_recipient_id UUID,
  p_message TEXT,
  p_urgency TEXT DEFAULT 'routine'
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_msg_id UUID;
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  INSERT INTO admin_messages (tenant_id, sender_id, recipient_id, message, urgency)
  VALUES (current_tenant_id(), auth.uid(), p_recipient_id, p_message, p_urgency)
  RETURNING id INTO v_msg_id;

  INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (current_tenant_id(), auth.uid(), 'admin_message_sent', 'coach', p_recipient_id,
    jsonb_build_object('message_id', v_msg_id, 'urgency', p_urgency));

  RETURN v_msg_id;
END;
$$;
REVOKE ALL ON FUNCTION send_admin_message FROM PUBLIC;
GRANT EXECUTE ON FUNCTION send_admin_message TO authenticated;
```

### Notification via send-notification

Après l'INSERT, appeler depuis le client (ou depuis la RPC via HTTP) :
```typescript
await supabase.functions.invoke('send-notification', {
  body: {
    tenantId   : tenantId,
    recipientId: recipientId,
    eventType  : 'admin_message',
    referenceId: msgId,
    urgency    : urgency,
    title      : 'Message de l\'Admin',
    body       : message.substring(0, 100) + (message.length > 100 ? '...' : ''),
  }
})
```

### Dépendances

- **Prérequis** : Story 7.1 (send-notification) + Story 1.2 (audit_logs) + Story 9.4 (coaches = profils avec role='coach')

### References
- [Source: epics.md#Story-9.5] — lignes 3086–3127

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
