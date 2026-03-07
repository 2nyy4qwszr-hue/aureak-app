// Story 5.1 — SyncQueueService : gestion de la queue de sync offline
// Story 5.4 — processPending() avec gestion idempotency et retries
import type { AttendanceStatus } from '@aureak/types'

export type QueueOperation = {
  entityType : 'attendance' | 'evaluation' | 'coach_presence'
  payload    : Record<string, unknown>
}

export type LocalQueueItem = {
  id          : string
  operation_id: string
  entity_type : string
  payload     : string
  status      : 'pending' | 'failed' | 'done'
  retry_count : number
  last_error  : string | null
  created_at  : string
}

// Interface minimale de la DB SQLite (évite la dépendance directe à expo-sqlite en tests)
export interface SyncDB {
  runAsync(sql: string, params?: unknown[]): Promise<unknown>
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>
}

// Interface pour l'appel réseau (injectable pour tests)
export type ApplyEventFn = (params: {
  operationId: string
  sessionId  : string
  childId    : string
  newStatus  : AttendanceStatus
  occurredAt : string
  deviceId?  : string
  source?    : 'field' | 'admin' | 'sync'
}) => Promise<{ idempotent?: boolean; snapshot?: unknown; conflict?: string }>

const MAX_RETRIES = 5

export class SyncQueueService {
  constructor(
    private db         : SyncDB,
    private applyEvent?: ApplyEventFn
  ) {}

  async enqueue(op: QueueOperation): Promise<string> {
    const operationId = crypto.randomUUID()
    await this.db.runAsync(
      `INSERT INTO local_sync_queue (id, operation_id, entity_type, payload, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [crypto.randomUUID(), operationId, op.entityType, JSON.stringify(op.payload), new Date().toISOString()]
    )
    return operationId
  }

  async getLocalPending(): Promise<LocalQueueItem[]> {
    return this.db.getAllAsync<LocalQueueItem>(
      `SELECT * FROM local_sync_queue
       WHERE status IN ('pending','failed')
         AND retry_count < ${MAX_RETRIES}
       ORDER BY created_at ASC`
    )
  }

  async markSynced(operationId: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE local_sync_queue SET status = 'done' WHERE operation_id = ?`,
      [operationId]
    )
    await this.db.runAsync(
      `UPDATE local_attendances SET synced = 1 WHERE operation_id = ?`,
      [operationId]
    )
  }

  async markFailed(operationId: string, error: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE local_sync_queue
       SET status = 'failed', retry_count = retry_count + 1, last_error = ?
       WHERE operation_id = ?`,
      [error, operationId]
    )
  }

  async processPending(): Promise<{ synced: number; failed: number }> {
    if (!this.applyEvent) {
      throw new Error('applyEvent function not provided to SyncQueueService')
    }

    const pending = await this.getLocalPending()
    let synced = 0, failed = 0

    for (const op of pending) {
      const payload = JSON.parse(op.payload) as Record<string, unknown>
      try {
        const result = await this.applyEvent({
          operationId: op.operation_id,
          sessionId  : payload['session_id'] as string,
          childId    : payload['child_id'] as string,
          newStatus  : payload['new_status'] as AttendanceStatus,
          occurredAt : payload['occurred_at'] as string,
          deviceId   : payload['device_id'] as string | undefined,
          source     : (payload['source'] as 'field' | 'admin' | 'sync') ?? 'field',
        })

        if (result.idempotent || result.snapshot) {
          await this.markSynced(op.operation_id)
          synced++
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e)
        await this.markFailed(op.operation_id, errMsg)
        failed++
      }
    }

    return { synced, failed }
  }
}
