# Story 7.4 : Système de Tickets Parent (Minimal Tracé)

Status: ready-for-dev

## Story

En tant que Parent,
Je veux soumettre une demande au staff via un formulaire structuré et suivre l'avancement de la réponse,
Afin de centraliser toute communication avec l'académie dans l'app sans fil email dispersé.

## Acceptance Criteria

**AC1 — Formulaire de création de ticket**
- **When** le Parent ouvre "Contacter le staff"
- **Then** un formulaire est disponible avec : catégorie obligatoire, sujet (max 120 chars), message (max 2000 chars), enfant concerné, séance liée (optionnel)

**AC2 — Tables `tickets` et `ticket_replies` créées**
- **And** migration crée les deux tables avec contraintes CHECK

**AC3 — Templates sujets front-end**
- **And** templates de sujet pré-remplis par catégorie (constantes front-end, pas en DB)

**AC4 — Notifications**
- **And** Coach/Admin reçoit push à la création d'un ticket (`urgency = 'routine'`, `event_type = 'ticket_created'`)
- **And** Parent reçoit push à chaque réponse d'un Coach/Admin

**AC5 — Journalisation**
- **And** chaque changement de `tickets.status` journalisé dans `audit_logs`

**AC6 — RLS**
- **And** Parent voit uniquement ses propres tickets et réponses ; Coach/Admin du tenant voient tous les tickets

**AC7 — Couverture FRs**
- **And** FR31 couvert : parent soumet demande via ticket structuré
- **And** FR32 couvert : Coach/Admin répond aux tickets parents (tracé)
- **And** FR33 couvert : parent notifié à chaque réponse

## Tasks / Subtasks

- [ ] Task 1 — Migration `00018_tickets.sql` (AC: #2)
  - [ ] 1.1 Créer tables `tickets` et `ticket_replies` + activer RLS

- [ ] Task 2 — RLS policies (AC: #6)
  - [ ] 2.1 `tickets` : parent = ses propres ; coach/admin = tous du tenant
  - [ ] 2.2 `ticket_replies` : hérite via ticket_id

- [ ] Task 3 — Mutations api-client (AC: #1, #4)
  - [ ] 3.1 `createTicket(params)` → INSERT + déclenche notification coach/admin via send-notification
  - [ ] 3.2 `replyToTicket(ticketId, body)` → INSERT ticket_replies + notification parent
  - [ ] 3.3 `updateTicketStatus(ticketId, status)` → UPDATE + INSERT audit_logs

- [ ] Task 4 — UI Mobile (AC: #1, #3)
  - [ ] 4.1 Créer `apps/mobile/app/(parent)/tickets/new.tsx` — formulaire création
  - [ ] 4.2 Créer `apps/mobile/app/(parent)/tickets/[ticketId]/index.tsx` — fil de réponses
  - [ ] 4.3 Créer `apps/mobile/app/(coach)/tickets/index.tsx` — liste tickets Coach/Admin

## Dev Notes

### Migration `00018_tickets.sql`

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_id UUID NOT NULL REFERENCES profiles(user_id),
  child_id UUID REFERENCES profiles(user_id),
  session_id UUID REFERENCES sessions(id),
  category TEXT NOT NULL
    CHECK (category IN ('absence','retard','question','logistique')),
  subject TEXT NOT NULL CHECK (char_length(subject) <= 120),
  body TEXT NOT NULL CHECK (char_length(body) <= 2000),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  assigned_to UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tickets
  FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY "parent_own" ON tickets
  FOR ALL USING (parent_id = auth.uid() OR current_user_role() IN ('admin','coach'));

CREATE TABLE ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(user_id),
  body TEXT NOT NULL CHECK (char_length(body) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON ticket_replies
  FOR ALL USING (tenant_id = current_tenant_id());
```

### Templates sujets front-end (constantes)

```typescript
// packages/business-logic/src/tickets/subject-templates.ts
export const TICKET_SUBJECT_TEMPLATES: Record<string, (childName: string, date: string) => string> = {
  absence   : (name, date) => `Absence de ${name} le ${date}`,
  retard    : (name, date) => `Retard prévu pour ${name} le ${date}`,
  question  : () => '',
  logistique: () => 'Question logistique — ',
}
```

### Journalisation changement de statut

```typescript
// Sur updateTicketStatus :
await supabase.from('audit_logs').insert({
  tenant_id  : tenantId,
  user_id    : userId,
  action     : 'ticket_status_changed',
  entity_type: 'ticket',
  entity_id  : ticketId,
  metadata   : { old_status: oldStatus, new_status: newStatus },
})
```

### Dépendances

- **Prérequis** : Story 7.1 (send-notification) + Story 1.2 (audit_logs) + Story 2.1 (profiles, parent_child_links)
- **Consommé par** : Story 10.4 (audit trail complet)

### References
- [Source: epics.md#Story-7.4] — lignes 2170–2228

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
