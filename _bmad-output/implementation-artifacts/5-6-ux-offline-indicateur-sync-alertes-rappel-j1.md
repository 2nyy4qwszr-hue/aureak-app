# Story 5.6 : UX Offline — Indicateur Sync, Alertes & Rappel J+1

Status: done

## Story

En tant que Coach,
Je veux voir en permanence l'état de ma synchronisation, être alerté immédiatement en cas d'échec, et recevoir un rappel le lendemain si des données restent non synchronisées,
Afin de ne jamais douter de l'état de mes données terrain.

## Acceptance Criteria

**AC1 — Indicateur de sync permanent**
- **When** des opérations sont en attente dans `local_sync_queue`
- **Then** indicateur visible : "X opérations en attente" / "Synchronisation…" / "Tout est à jour"

**AC2 — Banner d'échec**
- **And** si `status = 'failed'` et `retry_count >= 3` : banner rouge "Échec de synchronisation — Vérifiez votre connexion" + bouton "Réessayer"

**AC3 — Rappel J+1**
- **And** si opérations `pending`/`failed` subsistent le lendemain à 8h : Edge Function cron envoie notification push "Des présences du [date] n'ont pas été synchronisées — Ouvrez l'app"

## Tasks / Subtasks

- [ ] Task 1 — Hook `useSyncStatus` dans `@aureak/business-logic` (AC: #1, #2)
  - [ ] 1.1 Créer `packages/business-logic/src/sync/useSyncStatus.ts` : polling SQLite toutes les 2s sur `local_sync_queue`
  - [ ] 1.2 Retourner `{ pendingCount, failedCount, isSyncing }`

- [ ] Task 2 — Composant `SyncStatusBanner` dans `@aureak/ui` (AC: #1, #2)
  - [ ] 2.1 Créer `packages/ui/src/SyncStatusBanner.tsx` avec les 3 états visuels
  - [ ] 2.2 Intégrer dans le layout mobile `apps/mobile/app/(coach)/_layout.tsx`

- [ ] Task 3 — Edge Function cron rappel J+1 (AC: #3)
  - [ ] 3.1 Créer `supabase/functions/sync-reminder/index.ts` (déclenchée par pg_cron à 8h)
  - [ ] 3.2 Détecter coaches avec `sync_queue.status IN ('pending','failed')` datant d'hier
  - [ ] 3.3 Envoyer notification push via `push_tokens` + logger dans `notification_send_logs`

- [ ] Task 4 — Bouton "Réessayer" (AC: #2)
  - [ ] 4.1 Bouton qui appelle `SyncQueueService.processPending()` manuellement

## Dev Notes

### Hook `useSyncStatus`

```typescript
// packages/business-logic/src/sync/useSyncStatus.ts
import { useEffect, useState } from 'react'
import { useOfflineStore } from './useOfflineStore'

export type SyncStatus = {
  pendingCount: number
  failedCount : number
  isSyncing   : boolean
}

export function useSyncStatus(db: SQLite.SQLiteDatabase): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0, failedCount: 0, isSyncing: false
  })

  useEffect(() => {
    const refresh = async () => {
      const [pending, failed] = await Promise.all([
        db.getAllAsync('SELECT COUNT(*) as c FROM local_sync_queue WHERE status = ?', ['pending']),
        db.getAllAsync('SELECT COUNT(*) as c FROM local_sync_queue WHERE status = ?', ['failed']),
      ])
      setStatus({
        pendingCount: (pending[0] as any).c,
        failedCount : (failed[0] as any).c,
        isSyncing   : false,
      })
    }

    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [db])

  return status
}
```

### Composant `SyncStatusBanner`

```typescript
// packages/ui/src/SyncStatusBanner.tsx
import { tokens } from '@aureak/theme'

export function SyncStatusBanner({ status, onRetry }: {
  status : SyncStatus
  onRetry: () => void
}) {
  if (status.pendingCount === 0 && status.failedCount === 0) {
    return <Text color={tokens.color.statusPresent}>✓ Tout est à jour</Text>
  }

  if (status.failedCount >= 3) {
    return (
      <View style={{ backgroundColor: tokens.color.error, padding: tokens.space[3] }}>
        <Text>Échec de synchronisation — Vérifiez votre connexion</Text>
        <Button onPress={onRetry} size="sm">Réessayer</Button>
      </View>
    )
  }

  return (
    <Text color={tokens.color.statusAttention}>
      {status.isSyncing ? 'Synchronisation…' : `${status.pendingCount} opération(s) en attente`}
    </Text>
  )
}
```

### Edge Function `sync-reminder` (cron J+1 8h)

```typescript
// supabase/functions/sync-reminder/index.ts
Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Trouver les coaches avec des opérations non synchronisées d'hier
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: staleOps } = await supabase
    .from('sync_queue')
    .select('actor_id, created_at')
    .in('status', ['pending', 'failed'])
    .lt('created_at', new Date().toISOString())
    .gte('created_at', yesterday.toISOString())

  const coachIds = [...new Set(staleOps?.map(o => o.actor_id) ?? [])]

  for (const coachId of coachIds) {
    const { data: tokens } = await supabase
      .from('push_tokens').select('token').eq('user_id', coachId)

    for (const { token } of tokens ?? []) {
      // Envoyer via Expo Push API
      await fetch('https://exp.host/--/api/v2/push/send', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          to   : token,
          title: 'Synchronisation en attente',
          body : `Des présences du ${yesterday.toLocaleDateString('fr-FR')} n'ont pas été synchronisées — Ouvrez l'app pour les envoyer`
        })
      })

      await supabase.from('notification_send_logs').insert({
        recipient_id: coachId, channel: 'push',
        event_type: 'sync_reminder', status: 'sent', urgency: 'routine'
      })
    }
  }

  return new Response(JSON.stringify({ processed: coachIds.length }))
})
```

### Dépendances

- **Prérequis** : Stories 5.1 (local_sync_queue) + 5.3 (BackgroundSyncService) + 4.3 (push_tokens, notification_send_logs)

### References
- [Source: epics.md#Story-5.6] — lignes 1849–1870

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
