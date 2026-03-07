# Story 7.1 : Infrastructure Notifications — Push Tokens, Préférences & Urgence

Status: ready-for-dev

## Story

En tant que développeur,
Je veux finaliser l'infrastructure de notifications avec un modèle d'idempotency robuste, des règles d'urgence par type d'événement, et une traçabilité complète par canal,
Afin qu'aucune notification ne soit envoyée deux fois et que les parents ne soient notifiés que selon leurs préférences.

## Acceptance Criteria

**AC1 — Enrichissement `notification_send_logs`**
- **And** colonnes `urgency` et `provider_response` ajoutées + contrainte `unique_send_once`

**AC2 — Règle d'urgence**
- **And** `urgent` → tous canaux activés ; `routine` → push uniquement

**AC3 — Push tokens RLS**
- **And** utilisateur gère ses propres tokens (INSERT/DELETE sur ses tokens)

**AC4 — Edge Function `send-notification` centralisée**
- **And** logique : consulte `notification_preferences`, applique règle urgence, itère canaux, logue avec `ON CONFLICT DO NOTHING` sur `unique_send_once`

## Tasks / Subtasks

- [ ] Task 1 — Migration enrichissement infrastructure (AC: #1, #3)
  - [ ] 1.1 Vérifier/créer `push_tokens` (déjà en Story 4.3 — compléter les policies)
  - [ ] 1.2 Enrichir `notification_send_logs` : `urgency`, `provider_response`, contrainte `unique_send_once`

- [ ] Task 2 — Policies RLS complètes (AC: #3)
  - [ ] 2.1 `push_tokens` : user = ALL ses propres tokens ; service_role = SELECT
  - [ ] 2.2 `notification_preferences` : user = ALL ses propres préférences ; admin = SELECT

- [ ] Task 3 — Edge Function `send-notification` (AC: #4)
  - [ ] 3.1 Créer `supabase/functions/send-notification/index.ts`
  - [ ] 3.2 Implémenter la logique urgence + canaux + idempotency

- [ ] Task 4 — Unifier les appels de notification (AC: #2)
  - [ ] 4.1 Refactorer `cancel-session-notify` et `notify-session-closed` pour appeler `send-notification`

- [ ] Task 5 — Enregistrement push token côté mobile (AC: #3)
  - [ ] 5.1 Dans `apps/mobile/app/_layout.tsx`, à la connexion : récupérer le token Expo via `expo-notifications`, upsert dans `push_tokens`

## Dev Notes

### Migration enrichissement `notification_send_logs`

```sql
-- Si pas déjà fait en Story 4.5 :
ALTER TABLE notification_send_logs
  ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT 'routine'
    CHECK (urgency IN ('routine','urgent')),
  ADD COLUMN IF NOT EXISTS provider_response JSONB;

ALTER TABLE notification_send_logs
  ADD CONSTRAINT IF NOT EXISTS unique_send_once
    UNIQUE (tenant_id, recipient_id, reference_id, event_type, channel);
```

### Edge Function `send-notification`

```typescript
// supabase/functions/send-notification/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type NotificationPayload = {
  tenantId   : string
  recipientId: string
  eventType  : string
  referenceId: string
  urgency    : 'routine' | 'urgent'
  title      : string
  body       : string
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const payload: NotificationPayload = await req.json()

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('push_enabled, email_enabled, sms_enabled')
    .eq('user_id', payload.recipientId).single()

  // Règle d'urgence
  const channels = payload.urgency === 'urgent'
    ? ['push', prefs?.email_enabled && 'email', prefs?.sms_enabled && 'sms'].filter(Boolean)
    : [prefs?.push_enabled && 'push'].filter(Boolean)

  for (const channel of channels as string[]) {
    // Tentative INSERT idempotent (ON CONFLICT DO NOTHING)
    const { error } = await supabase.from('notification_send_logs').insert({
      tenant_id   : payload.tenantId,
      recipient_id: payload.recipientId,
      channel,
      event_type  : payload.eventType,
      reference_id: payload.referenceId,
      urgency     : payload.urgency,
      status      : 'sent',
    })

    if (error?.code === '23505') continue  // Déjà envoyé — skip

    if (!error) {
      // Envoyer selon le canal
      if (channel === 'push') {
        const { data: tokens } = await supabase
          .from('push_tokens').select('token').eq('user_id', payload.recipientId)

        for (const { token } of tokens ?? []) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ to: token, title: payload.title, body: payload.body })
          })
        }
      } else if (channel === 'email') {
        // Resend API
      } else if (channel === 'sms') {
        // Twilio API
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }))
})
```

### Enregistrement push token (mobile)

```typescript
// apps/mobile/app/_layout.tsx (suite de l'init)
import * as Notifications from 'expo-notifications'

async function registerPushToken(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  const token = (await Notifications.getExpoPushTokenAsync()).data
  await supabase.from('push_tokens').upsert(
    { user_id: userId, token, platform: Platform.OS },
    { onConflict: 'user_id,token' }
  )
}
```

### Dépendances

- **Prérequis** : Story 4.3 (push_tokens, notification_preferences, notification_send_logs) + Story 4.5 (urgency)
- **Consommé par** : Stories 7.2, 8.4, 9.2, 10.1, 11.1, 12.4

### References
- [Source: epics.md#Story-7.1] — lignes 2089–2118

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
