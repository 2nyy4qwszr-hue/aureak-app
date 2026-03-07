# Story 7.2 : Notification Post-Séance (SESSION_CLOSED → Send-Once)

Status: ready-for-dev

## Story

En tant que Parent,
Je veux recevoir une notification push dans les 5 minutes après la clôture de la séance de mon enfant, sans jamais la recevoir deux fois,
Afin d'être informé rapidement du compte-rendu de séance sans être spammé.

## Acceptance Criteria

**AC1 — Déclenchement via Database Webhook**
- **When** une séance passe en `status = 'terminée'` (événement `SESSION_CLOSED` dans `event_log`)
- **Then** la Edge Function `notify-session-closed` est déclenchée via Database Webhook filtré sur `event_log.event_type = 'SESSION_CLOSED'`

**AC2 — Itération parents + send-once**
- **And** la fonction itère tous les parents des enfants présents (`attendances.status IN ('present','late','trial')`)
- **And** pour chaque parent : INSERT dans `notification_send_logs` (canal `push`, `event_type = 'session_closed'`, `urgency = 'routine'`, `reference_id = session_id`) avec `ON CONFLICT ON CONSTRAINT unique_send_once DO NOTHING`

**AC3 — Envoi push + provider_response**
- **And** si l'INSERT réussit → notification push envoyée via Expo Push API et `provider_response` mis à jour
- **And** erreurs push loguées avec `status = 'failed'` + `provider_response` — pas de retry auto MVP

**AC4 — Contenu notification**
- **And** titre : "Séance terminée — [nom du groupe]"
- **And** corps : "Coach [Prénom], thèmes : [theme1, theme2]. [N] enfants présents."
- **And** CTA : "Voir le compte-rendu"

**AC5 — notification_sent_at**
- **And** `sessions.notification_sent_at` mis à jour seulement après le premier envoi réel (`sent` dans logs), via UPDATE atomique `.is('notification_sent_at', null)`

**AC6 — Couverture FRs**
- **And** UX-7 couvert : notification parent < 5 min après clôture
- **And** FR29 couvert : notification push parent à clôture de séance

## Tasks / Subtasks

- [ ] Task 1 — Edge Function `notify-session-closed` complète (AC: #1–#5)
  - [ ] 1.1 Implémenter la logique complète (itération parents présents → INSERT log → envoi push → update session)
  - [ ] 1.2 Utiliser `send-notification` (Story 7.1) pour l'envoi effectif par canal
  - [ ] 1.3 Configurer le Database Webhook sur `event_log` filtré `event_type = 'SESSION_CLOSED'`

- [ ] Task 2 — Contenu notification dynamique (AC: #4)
  - [ ] 2.1 Query les thèmes de la séance depuis `session_themes JOIN themes`
  - [ ] 2.2 Compter les enfants présents dans `attendances`

- [ ] Task 3 — Gestion erreurs provider (AC: #3)
  - [ ] 3.1 Logger `status = 'failed'` + `provider_response` pour tokens expirés/invalides
  - [ ] 3.2 Ne pas bloquer les autres parents sur une erreur individuelle

## Dev Notes

### Architecture `notify-session-closed` complète

```typescript
// supabase/functions/notify-session-closed/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { record } = await req.json()
  if (record.event_type !== 'SESSION_CLOSED') return new Response('skipped')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const sessionId = record.entity_id

  // Vérifier send-once au niveau session
  const { data: session } = await supabase
    .from('sessions')
    .select('notification_sent_at, tenant_id, group_id')
    .eq('id', sessionId).single()
  if (session?.notification_sent_at) return new Response('already_sent')

  // Récupérer les thèmes de la séance
  const { data: sessionThemes } = await supabase
    .from('session_themes')
    .select('themes(name)')
    .eq('session_id', sessionId)

  const themeNames = sessionThemes?.map((st: any) => st.themes?.name).filter(Boolean).join(', ') ?? ''

  // Enfants présents
  const { data: attendances } = await supabase
    .from('attendances')
    .select('child_id')
    .eq('session_id', sessionId)
    .in('status', ['present', 'late', 'trial'])

  const childIds = attendances?.map((a: any) => a.child_id) ?? []

  // Récupérer le nom du groupe et du coach
  const { data: sessionData } = await supabase
    .from('sessions')
    .select('groups(name), profiles!sessions_lead_coach_id_fkey(first_name)')
    .eq('id', sessionId).single()

  const groupName = (sessionData as any)?.groups?.name ?? 'Groupe'
  const coachName = (sessionData as any)?.profiles?.first_name ?? 'Votre coach'

  // Parents des enfants présents
  const { data: links } = await supabase
    .from('parent_child_links')
    .select('parent_id')
    .in('child_id', childIds)

  const parentIds = [...new Set(links?.map((l: any) => l.parent_id) ?? [])]

  let firstSentAt: string | null = null

  for (const parentId of parentIds) {
    // Déléguer à send-notification (idempotency via unique_send_once)
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        tenantId   : session!.tenant_id,
        recipientId: parentId,
        eventType  : 'session_closed',
        referenceId: sessionId,
        urgency    : 'routine',
        title      : `Séance terminée — ${groupName}`,
        body       : `Coach ${coachName}, thèmes : ${themeNames}. ${childIds.length} enfants présents.`,
      })
    })
    if (!firstSentAt) firstSentAt = new Date().toISOString()
  }

  // Update send-once atomique sur la session
  if (firstSentAt) {
    await supabase.from('sessions')
      .update({ notification_sent_at: firstSentAt })
      .eq('id', sessionId)
      .is('notification_sent_at', null)
  }

  return new Response(JSON.stringify({ sent: parentIds.length }))
})
```

### Database Webhook configuration

Le webhook doit être configuré dans Supabase Dashboard :
- **Table** : `event_log`
- **Events** : INSERT
- **URL** : `${SUPABASE_URL}/functions/v1/notify-session-closed`
- **Filter** : aucun (le filtre `event_type = 'SESSION_CLOSED'` est dans la fonction)

### Dépendances

- **Prérequis** : Story 7.1 (send-notification Edge Function + unique_send_once) + Story 6.4 (close_session → SESSION_CLOSED) + Story 4.3 (push_tokens, notification_preferences)
- **Consommé par** : Story 7.3 (board parent consulte notification_sent_at)

### References
- [Source: epics.md#Story-7.2] — lignes 2122–2141

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
