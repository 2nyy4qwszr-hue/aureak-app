# Story 5.3 : Enregistrement Présence Offline (< 2s)

Status: deferred

## Story

En tant que Coach,
Je veux enregistrer la présence d'un enfant en une action rapide, même sans réseau, avec retour visuel immédiat,
Afin de ne jamais perdre une présence terrain et de ne pas être ralenti par des problèmes de connectivité.

## Acceptance Criteria

**AC1 — Écriture SQLite < 50ms**
- **When** le Coach tape sur le statut d'un enfant
- **Then** écriture dans `local_attendances` (SQLite) immédiate (< 50ms) — pas d'attente réseau

**AC2 — Optimistic update UI**
- **And** l'interface affiche le nouveau statut immédiatement

**AC3 — Enfile dans `local_sync_queue`**
- **And** opération enfilée avec `operation_id` UUID, `entity_type = 'attendance'`, payload complet

**AC4 — Sync dans les 5s si réseau**
- **And** si réseau disponible, sync tentée dans les 5 secondes

**AC5 — SLA < 2s**
- **And** durée totale tap → retour visuel confirmé localement < 2s en online, immédiate en offline

**AC6 — Trigger `attendance_started_at`**
- **And** `sessions.attendance_started_at` mis à jour (trigger Story 4.2) dès la première attendance côté serveur

## Tasks / Subtasks

- [ ] Task 1 — Hook `useRecordAttendance` dans `@aureak/business-logic` (AC: #1–#3)
  - [ ] 1.1 Créer `packages/business-logic/src/sync/useRecordAttendance.ts`
  - [ ] 1.2 Écrire dans SQLite via `SyncQueueService` + update local state
  - [ ] 1.3 Tester performance : mock SQLite doit écrire en < 50ms

- [ ] Task 2 — Background sync service (AC: #4)
  - [ ] 2.1 Créer `packages/business-logic/src/sync/BackgroundSyncService.ts` — polling toutes les 5s sur `NetInfo.isConnected`
  - [ ] 2.2 Si connecté : appeler `processPending()` (Story 5.4)

- [ ] Task 3 — UI Mobile — liste présences avec toggles (AC: #1, #2, #5)
  - [ ] 3.1 Créer `apps/mobile/app/(coach)/session/[sessionId]/presences.tsx`
  - [ ] 3.2 Afficher la liste `local_session_attendees` avec `IndicatorToggle` pour chaque statut
  - [ ] 3.3 Utiliser `useRecordAttendance` — optimistic update via Zustand local state
  - [ ] 3.4 Afficher le statut de sync (Stories 5.6) en bandeau

## Dev Notes

### Hook `useRecordAttendance`

```typescript
// packages/business-logic/src/sync/useRecordAttendance.ts
import { useOfflineStore } from './useOfflineStore'
import { SyncQueueService } from './SyncQueueService'
import { v4 as uuidv4 } from 'uuid'

export function useRecordAttendance(sessionId: string) {
  const { db, updateLocalAttendance } = useOfflineStore()
  const syncService = new SyncQueueService(db)

  const record = async (childId: string, status: AttendanceStatus) => {
    const operationId = uuidv4()
    const now = new Date().toISOString()

    // 1. Écriture SQLite immédiate (< 50ms)
    await db.runAsync(
      `INSERT INTO local_attendances (id, session_id, child_id, status, recorded_by, recorded_at, operation_id, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT (session_id, child_id) DO UPDATE SET status = ?, recorded_at = ?`,
      [uuidv4(), sessionId, childId, status, currentUserId, now, operationId, status, now]
    )

    // 2. Optimistic update UI
    updateLocalAttendance(sessionId, childId, status)

    // 3. Enfiler dans la queue
    await syncService.enqueue({
      entityType: 'attendance',
      payload: {
        operation_id: operationId,
        session_id  : sessionId,
        child_id    : childId,
        new_status  : status,
        occurred_at : now,
        device_id   : getDeviceId(),
        source      : 'field',
      }
    })
  }

  return { record }
}
```

### Background Sync Service

```typescript
// packages/business-logic/src/sync/BackgroundSyncService.ts
import NetInfo from '@react-native-community/netinfo'

export class BackgroundSyncService {
  private intervalId: ReturnType<typeof setInterval> | null = null

  start(processFn: () => Promise<void>) {
    this.intervalId = setInterval(async () => {
      const state = await NetInfo.fetch()
      if (state.isConnected) {
        await processFn()
      }
    }, 5000)
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId)
  }
}
```

### Zustand `useOfflineStore`

```typescript
// packages/business-logic/src/sync/useOfflineStore.ts
import { create } from 'zustand'

type OfflineState = {
  attendances : Record<string, Record<string, AttendanceStatus>>  // [sessionId][childId]
  pendingCount: number
  updateLocalAttendance: (sessionId: string, childId: string, status: AttendanceStatus) => void
  setPendingCount: (count: number) => void
}

export const useOfflineStore = create<OfflineState>((set) => ({
  attendances : {},
  pendingCount: 0,
  updateLocalAttendance: (sessionId, childId, status) => set(state => ({
    attendances: {
      ...state.attendances,
      [sessionId]: { ...state.attendances[sessionId], [childId]: status }
    }
  })),
  setPendingCount: (count) => set({ pendingCount: count }),
}))
```

### Performance : garantir < 2s

- SQLite write : < 50ms (WAL mode activé en Story 5.1)
- Optimistic update Zustand : < 1ms
- Re-render React : < 16ms (60fps)
- Total cible : < 100ms (bien en dessous de 2s)

### Dépendances

- **Prérequis** : Stories 5.1 (SQLite schema + SyncQueueService) + 5.2 (apply_event)
- **Utilisé en Story 5.4** : `BackgroundSyncService` appelle `processPending()`

### References
- [Source: epics.md#Story-5.3] — lignes 1782–1801

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
