// Story 5.6 — Hook useSyncStatus : état de la queue de sync offline
import { useEffect, useState } from 'react'
import type { SyncDB } from './SyncQueueService'

export type SyncStatus = {
  pendingCount: number
  failedCount : number
  isSyncing   : boolean
}

const POLL_INTERVAL_MS = 2000

export function useSyncStatus(db: SyncDB | null): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    failedCount : 0,
    isSyncing   : false,
  })

  useEffect(() => {
    if (!db) return

    let active = true

    const poll = async () => {
      try {
        const rows = await db.getAllAsync<{ status: string; retry_count: number }>(
          `SELECT status, retry_count FROM local_sync_queue WHERE status IN ('pending','failed','syncing')`
        )
        if (!active) return
        const pendingCount = rows.filter(r => r.status === 'pending').length
        const failedCount  = rows.filter(r => r.status === 'failed').length
        const isSyncing    = rows.some(r => r.status === 'syncing')
        setStatus({ pendingCount, failedCount, isSyncing })
      } catch {
        // SQLite indisponible — ignorer silencieusement
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [db])

  return status
}
