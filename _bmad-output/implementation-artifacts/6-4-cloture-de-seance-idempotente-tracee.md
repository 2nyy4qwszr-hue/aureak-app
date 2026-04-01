# Story 6.4 : Clôture de Séance — Idempotente & Tracée

Status: done

## Story

En tant que Coach,
Je veux clôturer une séance de façon idempotente avec une garantie d'envoi unique de la notification parent,
Afin que la clôture ne puisse jamais être exécutée deux fois et que l'historique de clôture soit toujours consultable.

## Acceptance Criteria

**AC1 — RPC `close_session()` idempotente**
- **When** le Coach tape "Clôturer la séance" (`validation_status IN ('validated_lead','validated_both')` + ≥ 1 confirmation lead)
- **Then** RPC `close_session(session_id, operation_id)` : idempotency check, émet `SESSION_CLOSED` dans `event_log`, UPDATE `sessions.status = 'terminée'`, mark `processed_operations`

**AC2 — Colonnes ajoutées à `sessions`**
- **And** `closed_at`, `closed_by`, `notification_sent_at` ajoutées via ALTER TABLE

**AC3 — Notification post-clôture send-once**
- **And** Edge Function `notify-session-closed` déclenchée : vérifie `notification_sent_at IS NULL`, envoie push aux parents, met `notification_sent_at = now()` atomiquement

**AC4 — Coach informe si déjà clôturée**
- **And** tentative sur séance `terminée` → message "Séance déjà clôturée" — pas d'erreur bloquante

## Tasks / Subtasks

- [ ] Task 1 — Migration colonnes `sessions` (AC: #2)
  - [ ] 1.1 `ALTER TABLE sessions ADD COLUMN closed_at TIMESTAMPTZ, closed_by UUID, notification_sent_at TIMESTAMPTZ`

- [ ] Task 2 — RPC `close_session` (AC: #1)
  - [ ] 2.1 Créer RPC SECURITY DEFINER (code complet dans epics.md)
  - [ ] 2.2 Appeler `can_close_session()` (Story 4.6) avant clôture

- [ ] Task 3 — Edge Function `notify-session-closed` (AC: #3)
  - [ ] 3.1 Créer `supabase/functions/notify-session-closed/index.ts`
  - [ ] 3.2 Déclencher via Database Webhook sur `event_log WHERE event_type = 'SESSION_CLOSED'`
  - [ ] 3.3 Envoyer push aux parents des enfants présents (status != 'absent')
  - [ ] 3.4 `UPDATE sessions SET notification_sent_at = now()` atomique après premier envoi réussi

- [ ] Task 4 — UI Mobile clôture (AC: #1, #4)
  - [ ] 4.1 Bouton "Clôturer la séance" dans `apps/mobile/app/(coach)/session/[sessionId]/validation.tsx`
  - [ ] 4.2 Gérer le cas idempotent (message informatif, pas d'erreur)

## Dev Notes

### RPC `close_session` — code complet (depuis epics.md)

```sql
CREATE OR REPLACE FUNCTION close_session(p_session_id UUID, p_operation_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM processed_operations WHERE operation_id = p_operation_id) THEN
    RETURN jsonb_build_object('idempotent', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM sessions WHERE id = p_session_id
      AND validation_status IN ('validated_lead','validated_both')
      AND tenant_id = current_tenant_id()
  ) THEN
    RAISE EXCEPTION 'Session % not ready for close', p_session_id;
  END IF;

  -- Vérifier la présence du lead coach
  IF NOT can_close_session(p_session_id) THEN
    RAISE EXCEPTION 'Confirmation du coach lead requise avant clôture';
  END IF;

  INSERT INTO event_log (
    tenant_id, entity_type, entity_id, event_type, payload,
    actor_id, operation_id, source
  ) VALUES (
    current_tenant_id(), 'session', p_session_id, 'SESSION_CLOSED',
    jsonb_build_object('closed_by', auth.uid(), 'closed_at', now()),
    auth.uid(), p_operation_id, 'field'
  ) RETURNING id INTO v_event_id;

  UPDATE sessions SET
    status    = 'terminée',
    closed_at = now(),
    closed_by = auth.uid()
  WHERE id = p_session_id;

  INSERT INTO processed_operations (operation_id, tenant_id)
  VALUES (p_operation_id, current_tenant_id());

  RETURN jsonb_build_object('closed', true, 'event_id', v_event_id);
END; $$;
REVOKE ALL ON FUNCTION close_session(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION close_session(UUID, UUID) TO authenticated;
```

### Edge Function `notify-session-closed`

```typescript
// supabase/functions/notify-session-closed/index.ts
Deno.serve(async (req) => {
  const { record } = await req.json()
  if (record.event_type !== 'SESSION_CLOSED') return new Response('skipped')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const sessionId = record.entity_id

  // Vérifier send-once
  const { data: session } = await supabase
    .from('sessions').select('notification_sent_at, tenant_id').eq('id', sessionId).single()
  if (session?.notification_sent_at) return new Response('already_sent')

  // Récupérer les enfants présents et leurs parents
  const { data: attendances } = await supabase
    .from('attendances')
    .select('child_id')
    .eq('session_id', sessionId)
    .in('status', ['present', 'late', 'trial'])

  const childIds = attendances?.map(a => a.child_id) ?? []

  const { data: links } = await supabase
    .from('parent_child_links')
    .select('parent_id')
    .in('child_id', childIds)

  const parentIds = [...new Set(links?.map(l => l.parent_id) ?? [])]

  // Envoyer via le système de notification (Story 7.1)
  let firstSentAt: string | null = null
  for (const parentId of parentIds) {
    // ... envoi push + log notification_send_logs
    firstSentAt = new Date().toISOString()
  }

  // Update send-once atomique
  if (firstSentAt) {
    await supabase.from('sessions')
      .update({ notification_sent_at: firstSentAt })
      .eq('id', sessionId).is('notification_sent_at', null)
  }

  return new Response(JSON.stringify({ sent: parentIds.length }))
})
```

### Contenu notification post-clôture

- **Titre** : "Séance terminée — [Group name]"
- **Corps** : "Coach [Prénom], thèmes du jour : [theme1, theme2]. [N] enfants présents."
- **CTA** : "Voir le compte-rendu"

### Dépendances

- **Prérequis** : Stories 5.2 (event_log) + 6.1 (evaluations) + 6.3 (validation_status) + 4.6 (can_close_session) + 4.3 (notification_send_logs)

### References
- [Source: epics.md#Story-6.4] — lignes 2009–2079

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
