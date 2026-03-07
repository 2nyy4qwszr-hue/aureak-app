// Story 5.3 — BackgroundSyncService : polling toutes les 5s si réseau disponible
import type { SyncQueueService } from './SyncQueueService'

const SYNC_INTERVAL_MS = 5000

export class BackgroundSyncService {
  private intervalId: ReturnType<typeof setInterval> | null = null

  constructor(
    private syncQueue : SyncQueueService,
    private isConnected: () => boolean | Promise<boolean>
  ) {}

  start() {
    if (this.intervalId) return  // Déjà démarré

    this.intervalId = setInterval(async () => {
      const connected = await this.isConnected()
      if (connected) {
        await this.syncQueue.processPending().catch(console.error)
      }
    }, SYNC_INTERVAL_MS)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async syncNow(): Promise<{ synced: number; failed: number }> {
    const connected = await this.isConnected()
    if (!connected) return { synced: 0, failed: 0 }
    return this.syncQueue.processPending()
  }
}
