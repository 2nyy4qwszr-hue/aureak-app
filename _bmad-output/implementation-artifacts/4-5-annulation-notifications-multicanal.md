# Story 4.5 : Annulation & Notifications Multicanal

Status: done

## Story

En tant qu'Admin,
Je veux annuler une séance avec envoi automatique de notifications à tous les participants selon leurs préférences de canal,
Afin qu'aucun parent ne soit pris par surprise et que chaque envoi soit tracé pour audit.

## Acceptance Criteria

**AC1 — Annulation de séance**
- **When** l'Admin annule une séance (motif obligatoire)
- **Then** `sessions.status = 'annulée'`, `sessions.cancelled_at = now()`, `sessions.cancellation_reason` stocké

**AC2 — Notifications multicanal**
- **And** une Edge Function itère sur les parents des enfants de `session_attendees`
- **And** pour chaque parent : consulte `notification_preferences` et envoie selon canaux activés (push via Expo, email via Resend, SMS via Twilio)
- **And** chaque tentative loguée dans `notification_send_logs` (`sent` | `failed` | `skipped`)
- **And** `skipped` utilisé si le canal est désactivé dans les préférences

**AC3 — SLA et audit**
- **And** notification envoyée en < 2 min pour push et email
- **And** annulation journalisée dans `audit_logs`

**AC4 — Enrichissement `notification_send_logs`**
- **And** ajout des colonnes `urgency` et `provider_response` + contrainte `unique_send_once`

## Tasks / Subtasks

- [ ] Task 1 — Migration enrichissement `notification_send_logs` (AC: #4)
  - [ ] 1.1 `ALTER TABLE notification_send_logs ADD COLUMN urgency TEXT NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine','urgent'))`
  - [ ] 1.2 `ALTER TABLE notification_send_logs ADD COLUMN provider_response JSONB`
  - [ ] 1.3 `ALTER TABLE notification_send_logs ADD CONSTRAINT unique_send_once UNIQUE (tenant_id, recipient_id, reference_id, event_type, channel)`

- [ ] Task 2 — RPC `cancel_session` (AC: #1, #3)
  - [ ] 2.1 Créer une RPC SECURITY DEFINER qui met à jour `sessions` et logue dans `audit_logs`

- [ ] Task 3 — Edge Function `cancel-session-notify` (AC: #2)
  - [ ] 3.1 Créer `supabase/functions/cancel-session-notify/index.ts`
  - [ ] 3.2 Déclencher via Database Webhook sur UPDATE `sessions WHERE status = 'annulée'`
  - [ ] 3.3 Itérer parents, consulter préférences, envoyer via Expo/Resend/Twilio
  - [ ] 3.4 Logger dans `notification_send_logs` avec `ON CONFLICT DO NOTHING` sur `unique_send_once`

- [ ] Task 4 — UI Admin (web) (AC: #1)
  - [ ] 4.1 Dialog "Annuler la séance" dans `apps/web/app/(admin)/sessions/[sessionId]/` avec champ motif obligatoire

## Dev Notes

### RPC `cancel_session`

```sql
CREATE OR REPLACE FUNCTION cancel_session(p_session_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user_role() != 'admin' THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_reason IS NULL OR p_reason = '' THEN
    RAISE EXCEPTION 'Le motif d''annulation est obligatoire';
  END IF;

  UPDATE sessions SET
    status              = 'annulée',
    cancelled_at        = now(),
    cancellation_reason = p_reason
  WHERE id = p_session_id AND tenant_id = current_tenant_id()
    AND status IN ('planifiée','en_cours');

  INSERT INTO audit_logs (tenant_id, user_id, entity_type, entity_id, action, metadata)
  VALUES (
    current_tenant_id(), auth.uid(),
    'session', p_session_id, 'session_cancelled',
    jsonb_build_object('reason', p_reason, 'cancelled_at', now())
  );
END; $$;
REVOKE ALL ON FUNCTION cancel_session FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_session TO authenticated;
```

### Edge Function `cancel-session-notify`

```typescript
// supabase/functions/cancel-session-notify/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { record } = await req.json()
  if (record.status !== 'annulée') return new Response('skipped')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Récupérer les parents des enfants présents dans le roster
  const { data: attendees } = await supabase
    .from('session_attendees')
    .select('child_id, profiles!child_id(parent_child_links(parent_id))')
    .eq('session_id', record.id)

  const parentIds = [...new Set(
    attendees?.flatMap(a => a.profiles?.parent_child_links?.map(l => l.parent_id) ?? []) ?? []
  )]

  for (const parentId of parentIds) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('push_enabled, email_enabled, sms_enabled')
      .eq('user_id', parentId).single()

    const channels = [
      prefs?.push_enabled  && 'push',
      prefs?.email_enabled && 'email',
      prefs?.sms_enabled   && 'sms',
    ].filter(Boolean) as string[]

    for (const channel of channels) {
      // Tentative d'envoi (INSERT idempotent)
      const { error: insertErr } = await supabase.from('notification_send_logs').insert({
        tenant_id: record.tenant_id, recipient_id: parentId,
        channel, event_type: 'session_cancelled', reference_id: record.id,
        status: 'sent', urgency: 'urgent'
      }).onConflict('unique_send_once').ignore()

      if (!insertErr) {
        // Envoyer via le canal approprié
        // push → Expo Push API, email → Resend, sms → Twilio
      }
    }
  }

  return new Response(JSON.stringify({ processed: parentIds.length }))
})
```

### Règle d'urgence

Les annulations de séance sont `urgency = 'urgent'` → envoyer sur TOUS les canaux activés (pas seulement push).

### Dépendances

- **Prérequis** : Stories 4.1, 4.2, 4.3 (notification_preferences, notification_send_logs, push_tokens)
- **À compléter en Story 7.1** : `send-notification` Edge Function centralisée

### References
- [Source: epics.md#Story-4.5] — lignes 1484–1503

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
