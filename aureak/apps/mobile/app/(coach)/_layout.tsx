import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { useRouter } from 'expo-router'
import { useAuthStore, useSyncStatus, SyncQueueService } from '@aureak/business-logic'
import { SyncStatusBanner } from '@aureak/ui'
import { getLocalDB } from '../../src/db/schema'
import type { SyncDB } from '@aureak/business-logic'

export default function CoachLayout() {
  const router = useRouter()
  const { role, isLoading } = useAuthStore()
  const [db, setDb] = useState<SyncDB | null>(null)
  const [service, setService] = useState<SyncQueueService | null>(null)

  const syncStatus = useSyncStatus(db)

  useEffect(() => {
    if (!isLoading && role !== 'coach') {
      router.replace('/(auth)/login' as never)
      return
    }
    try {
      const localDb = getLocalDB()
      setDb(localDb)
      setService(new SyncQueueService(localDb))
    } catch {
      // DB non initialisée encore — ignoré
    }
  }, [role, isLoading, router])

  if (isLoading || role !== 'coach') return null

  const handleRetry = () => {
    if (service) service.processPending().catch(() => {/* silent */})
  }

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBanner status={syncStatus} onRetry={handleRetry} />
      <Stack />
    </View>
  )
}
