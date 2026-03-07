// Story 6.2 — Hook useRecordEvaluation (offline-first via SyncQueueService)
import type { EvaluationSignal } from '@aureak/types'
import { SyncQueueService } from './SyncQueueService'
import type { SyncDB } from './SyncQueueService'

type RecordEvaluationParams = {
  childId    : string
  receptivite: EvaluationSignal
  goutEffort : EvaluationSignal
  attitude   : EvaluationSignal
  topSeance  : 'star' | 'none'
  note?      : string
}

export function useRecordEvaluation(sessionId: string, db: SyncDB) {
  const syncService = new SyncQueueService(db)

  const record = async (params: RecordEvaluationParams): Promise<string> => {
    const operationId = crypto.randomUUID()
    await syncService.enqueue({
      entityType: 'evaluation',
      payload: {
        operation_id: operationId,
        session_id  : sessionId,
        child_id    : params.childId,
        receptivite : params.receptivite,
        gout_effort : params.goutEffort,
        attitude    : params.attitude,
        top_seance  : params.topSeance,
        note        : params.note ?? null,
        occurred_at : new Date().toISOString(),
        source      : 'field',
      },
    })
    return operationId
  }

  return { record }
}
