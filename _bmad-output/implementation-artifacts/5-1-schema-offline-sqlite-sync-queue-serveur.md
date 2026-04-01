# Story 5.1 : Schéma Offline SQLite & Sync Queue Serveur

Status: done

## Story

En tant que développeur,
Je veux créer le schéma SQLite local (miroir minimal des séances et présences) et la table `sync_queue` serveur avec suivi d'état complet,
Afin que le mode terrain fonctionne intégralement sans réseau et que toute opération soit récupérable après déconnexion.

## Acceptance Criteria

**AC1 — Base SQLite locale**
- **When** l'app démarre pour la première fois
- **Then** les tables `local_sessions`, `local_session_attendees`, `local_attendances`, `local_sync_queue` sont créées via `expo-sqlite`

**AC2 — Table `sync_queue` serveur**
- **And** table Supabase `sync_queue` avec index partiel sur `status IN ('pending','failed')`

**AC3 — `SyncQueueService` dans `@aureak/business-logic`**
- **And** expose `enqueue(op)`, `getLocalPending()`, `markSynced(operationId)`, `markFailed(operationId, error)`

**AC4 — RLS**
- **And** un coach voit uniquement ses propres opérations (`actor_id = auth.uid()`) ; admin voit tout le tenant

## Tasks / Subtasks

- [ ] Task 1 — Migration `00015_sync_queue.sql` (AC: #2, #4)
  - [ ] 1.1 Créer la table `sync_queue` serveur + index partiel
  - [ ] 1.2 Activer RLS + policies

- [ ] Task 2 — Initialisation SQLite dans `apps/mobile` (AC: #1)
  - [ ] 2.1 Créer `apps/mobile/src/db/schema.ts` avec les 4 tables SQLite + migrations SQLite via `expo-sqlite`
  - [ ] 2.2 Appeler l'initialisation au démarrage de l'app dans `apps/mobile/app/_layout.tsx`

- [ ] Task 3 — `SyncQueueService` dans `@aureak/business-logic` (AC: #3)
  - [ ] 3.1 Créer `packages/business-logic/src/sync/SyncQueueService.ts`
  - [ ] 3.2 Écrire les tests Vitest avec mock SQLite

- [ ] Task 4 — Policies RLS dans `00010_rls_policies.sql` (AC: #4)
  - [ ] 4.1 Coach = SELECT/INSERT ses propres opérations ; admin = ALL

## Dev Notes

### Schéma SQLite local

```typescript
// apps/mobile/src/db/schema.ts
import * as SQLite from 'expo-sqlite'

export async function initLocalDB() {
  const db = await SQLite.openDatabaseAsync('aureak-local.db')

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_sessions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planifiée',
      attendance_started_at TEXT,
      attendance_completed_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS local_session_attendees (
      session_id TEXT NOT NULL,
      child_id TEXT NOT NULL,
      child_name TEXT NOT NULL,
      PRIMARY KEY (session_id, child_id)
    );

    CREATE TABLE IF NOT EXISTS local_attendances (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      child_id TEXT NOT NULL,
      status TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      operation_id TEXT NOT NULL UNIQUE,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS local_sync_queue (
      id TEXT PRIMARY KEY,
      operation_id TEXT NOT NULL UNIQUE,
      entity_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS lsq_status ON local_sync_queue (status, created_at);
  `)

  return db
}
```

### Migration `00015_sync_queue.sql`

```sql
CREATE TABLE sync_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id    UUID NOT NULL,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  device_id       TEXT,
  actor_id        UUID NOT NULL REFERENCES auth.users(id),
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('attendance','evaluation','coach_presence')),
  entity_id       UUID,
  payload         JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','syncing','failed','done')),
  retry_count     INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  last_attempt_at TIMESTAMPTZ,
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operation_id)
);
CREATE INDEX sync_queue_pending_idx ON sync_queue (tenant_id, status)
  WHERE status IN ('pending','failed');

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
```

### `SyncQueueService`

```typescript
// packages/business-logic/src/sync/SyncQueueService.ts
import * as SQLite from 'expo-sqlite'
import { v4 as uuidv4 } from 'uuid'

export type QueueOperation = {
  entityType : 'attendance' | 'evaluation' | 'coach_presence'
  payload    : Record<string, unknown>
}

export class SyncQueueService {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async enqueue(op: QueueOperation): Promise<string> {
    const operationId = uuidv4()
    await this.db.runAsync(
      `INSERT INTO local_sync_queue (id, operation_id, entity_type, payload, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [uuidv4(), operationId, op.entityType, JSON.stringify(op.payload), new Date().toISOString()]
    )
    return operationId
  }

  async getLocalPending() {
    return this.db.getAllAsync<{ operation_id: string; entity_type: string; payload: string }>(
      `SELECT * FROM local_sync_queue WHERE status IN ('pending','failed') ORDER BY created_at ASC`
    )
  }

  async markSynced(operationId: string) {
    await this.db.runAsync(
      `UPDATE local_sync_queue SET status = 'done' WHERE operation_id = ?`,
      [operationId]
    )
  }

  async markFailed(operationId: string, error: string) {
    await this.db.runAsync(
      `UPDATE local_sync_queue SET status = 'failed', retry_count = retry_count + 1, last_error = ?
       WHERE operation_id = ?`,
      [error, operationId]
    )
  }
}
```

### Dépendances

- **Prérequis** : Stories 4.2 (attendances) + 1.2 (processed_operations)
- **À compléter en Story 5.2** : `apply_event()` RPC utilise `sync_queue` et `processed_operations`
- **À compléter en Story 5.3** : `SyncQueueService.enqueue()` appelé à chaque tap présence

### References
- [Source: epics.md#Story-5.1] — lignes 1585–1663

## Dev Agent Record
### Agent Model Used
claude-sonnet-4-6
### Debug Log References
### Completion Notes List
### File List
