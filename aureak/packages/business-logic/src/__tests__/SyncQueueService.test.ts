import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncQueueService } from '../sync/SyncQueueService'
import type { SyncDB, LocalQueueItem, ApplyEventFn } from '../sync/SyncQueueService'

function makeMockDB(): SyncDB & { rows: LocalQueueItem[] } {
  const rows: LocalQueueItem[] = []
  return {
    rows,
    async runAsync(sql: string, params?: unknown[]) {
      if (sql.includes('INSERT INTO local_sync_queue')) {
        rows.push({
          id          : params?.[0] as string ?? crypto.randomUUID(),
          operation_id: params?.[1] as string ?? crypto.randomUUID(),
          entity_type : params?.[2] as string ?? 'attendance',
          payload     : params?.[3] as string ?? '{}',
          status      : 'pending',
          retry_count : 0,
          last_error  : null,
          created_at  : params?.[4] as string ?? new Date().toISOString(),
        })
      } else if (sql.includes("SET status = 'done'")) {
        const opId = params?.[0] as string
        const row = rows.find(r => r.operation_id === opId)
        if (row) row.status = 'done'
      } else if (sql.includes("SET status = 'failed'")) {
        const opId = params?.[1] as string
        const row = rows.find(r => r.operation_id === opId)
        if (row) {
          row.status = 'failed'
          row.retry_count++
          row.last_error = params?.[0] as string ?? null
        }
      }
    },
    async getAllAsync<T>(): Promise<T[]> {
      return rows.filter(r => r.status === 'pending' || r.status === 'failed') as T[]
    },
  }
}

describe('SyncQueueService', () => {
  let db: ReturnType<typeof makeMockDB>
  let service: SyncQueueService

  beforeEach(() => {
    db = makeMockDB()
    service = new SyncQueueService(db)
  })

  it('enqueue() ajoute une opération dans la queue', async () => {
    const opId = await service.enqueue({
      entityType: 'attendance',
      payload   : { session_id: '1', child_id: '2', new_status: 'present' },
    })
    expect(opId).toBeTruthy()
    expect(db.rows).toHaveLength(1)
    expect(db.rows[0].status).toBe('pending')
  })

  it('markSynced() passe le status à done', async () => {
    await service.enqueue({ entityType: 'attendance', payload: {} })
    const opId = db.rows[0].operation_id
    await service.markSynced(opId)
    expect(db.rows[0].status).toBe('done')
  })

  it('markFailed() incrémente retry_count', async () => {
    await service.enqueue({ entityType: 'attendance', payload: {} })
    const opId = db.rows[0].operation_id
    await service.markFailed(opId, 'Network error')
    expect(db.rows[0].status).toBe('failed')
    expect(db.rows[0].retry_count).toBe(1)
    expect(db.rows[0].last_error).toBe('Network error')
  })

  it('processPending() sync les opérations pending', async () => {
    await service.enqueue({
      entityType: 'attendance',
      payload   : {
        session_id : 'sess-1',
        child_id   : 'child-1',
        new_status : 'present',
        occurred_at: new Date().toISOString(),
      },
    })

    const mockApplyEvent: ApplyEventFn = vi.fn().mockResolvedValue({ snapshot: { id: 'att-1' } })
    const serviceWithNetwork = new SyncQueueService(db, mockApplyEvent)

    const result = await serviceWithNetwork.processPending()
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(0)
    expect(mockApplyEvent).toHaveBeenCalledOnce()
  })

  it('processPending() gère les erreurs et incrémente retry_count', async () => {
    await service.enqueue({
      entityType: 'attendance',
      payload   : { session_id: 's', child_id: 'c', new_status: 'present', occurred_at: new Date().toISOString() },
    })

    const mockApplyEvent: ApplyEventFn = vi.fn().mockRejectedValue(new Error('500 Server Error'))
    const serviceWithNetwork = new SyncQueueService(db, mockApplyEvent)

    const result = await serviceWithNetwork.processPending()
    expect(result.synced).toBe(0)
    expect(result.failed).toBe(1)
    expect(db.rows[0].status).toBe('failed')
    expect(db.rows[0].retry_count).toBe(1)
  })
})
