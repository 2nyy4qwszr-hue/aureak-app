// Story 5.5 — Timeline admin : historique présences + restauration
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getAttendanceTimeline, restoreAttendance, markConflictsReviewed,
} from '@aureak/api-client'
import type { TimelineEvent, AttendanceTimeline } from '@aureak/api-client'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const SOURCE_LABELS: Record<string, string> = {
  field: 'Terrain',
  admin: 'Admin',
  sync : 'Sync',
}

const EVENT_LABELS: Record<string, string> = {
  ATTENDANCE_SET              : 'Présence enregistrée',
  ATTENDANCE_CONFLICT_RESOLVED: 'Conflit résolu',
  ATTENDANCE_RESTORED         : 'Présence restaurée',
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.lg },
  card     : {
    backgroundColor: colors.light.surface,
    borderRadius: 8, padding: space.md,
    borderWidth: 1, borderColor: colors.border.light,
    gap: space.xs,
  },
  eventCard: {
    backgroundColor: colors.light.muted,
    borderRadius: 6, padding: space.sm,
    borderWidth: 1, borderColor: colors.border.light,
    gap: 4,
  },
  conflictCard: {
    backgroundColor: colors.status.attention + '15',
    borderColor    : colors.status.attention,
  },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center', flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: space.sm, paddingVertical: 2,
    borderRadius: 12, borderWidth: 1,
  },
})

export default function AttendanceTimelinePage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const { childId }   = useLocalSearchParams<{ childId: string }>()
  const router        = useRouter()

  const [data,      setData]      = useState<AttendanceTimeline | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)

  const fetch = async () => {
    if (!sessionId || !childId) return
    setLoading(true)
    try {
      const { data: d, error: e } = await getAttendanceTimeline(sessionId, childId)
      if (e) {
        if (process.env.NODE_ENV !== 'production') console.error('[timeline] load error:', e)
        setError('Erreur lors du chargement.')
      } else {
        setData(d)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [sessionId, childId])

  const handleRestore = async (ev: TimelineEvent) => {
    if (!sessionId || !childId) return
    const oldStatus = (ev.payload['old_status'] as string) ?? (ev.payload['new_status'] as string)
    if (!oldStatus) return
    setRestoring(ev.id)
    try {
      const { error: e } = await restoreAttendance(sessionId, childId, oldStatus, ev.id)
      if (e) {
        if (process.env.NODE_ENV !== 'production') console.error('[timeline] restore error:', e)
        setError('Erreur lors de la restauration.')
      } else {
        await fetch()
      }
    } finally {
      setRestoring(null)
    }
  }

  const handleMarkReviewed = async () => {
    if (!sessionId) return
    const { error: e } = await markConflictsReviewed(sessionId)
    if (e) {
      if (process.env.NODE_ENV !== 'production') console.error('[timeline] markReviewed error:', e)
    } else {
      await fetch()
    }
  }

  const hasUnreviewedConflicts = data?.events.some(
    ev => ev.eventType === 'ATTENDANCE_CONFLICT_RESOLVED'
  ) ?? false

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.light.primary }}>
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      <AureakText variant="h2">Timeline présences</AureakText>

      {error && (
        <AureakText variant="caption" style={{ color: colors.status.absent }}>{error}</AureakText>
      )}

      {/* Snapshot courant */}
      {data?.snapshot && (
        <View style={styles.card}>
          <AureakText variant="label">État actuel</AureakText>
          <View style={styles.row}>
            <View style={[styles.badge, { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '15' }]}>
              <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                {data.snapshot.status}
              </AureakText>
            </View>
            {data.snapshot.updatedAt && (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Mis à jour le {new Date(data.snapshot.updatedAt).toLocaleString('fr-BE')}
              </AureakText>
            )}
          </View>
        </View>
      )}

      {/* Badge conflits */}
      {hasUnreviewedConflicts && (
        <View style={[styles.card, { borderColor: colors.status.attention, backgroundColor: colors.status.attention + '10' }]}>
          <AureakText variant="body" style={{ color: colors.status.attention, fontWeight: '600' }}>
            Conflits détectés — nécessite une review
          </AureakText>
          <AureakButton
            label="Marquer comme révisé"
            onPress={handleMarkReviewed}
            variant="secondary"
          />
        </View>
      )}

      {/* Historique */}
      <AureakText variant="label">Historique ({data?.events.length ?? 0} événements)</AureakText>

      {data?.events.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted, textAlign: 'center' }}>
          Aucun événement enregistré.
        </AureakText>
      )}

      {data?.events.map((ev) => (
        <View
          key={ev.id}
          style={[
            styles.eventCard,
            ev.eventType === 'ATTENDANCE_CONFLICT_RESOLVED' && styles.conflictCard,
          ]}
        >
          <View style={styles.row}>
            <AureakText variant="body" style={{ fontWeight: '600', flex: 1 }}>
              {EVENT_LABELS[ev.eventType] ?? ev.eventType}
            </AureakText>
            <View style={[styles.badge, { borderColor: colors.border.light }]}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {SOURCE_LABELS[ev.source] ?? ev.source}
              </AureakText>
            </View>
          </View>

          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            {new Date(ev.occurredAt).toLocaleString('fr-BE')}
            {ev.actorName ? ` · ${ev.actorName}` : ''}
            {ev.deviceId  ? ` · ${ev.deviceId}` : ''}
          </AureakText>

          {ev.payload['new_status'] && (
            <AureakText variant="caption" style={{ color: colors.text.dark }}>
              {ev.payload['old_status'] ? `${ev.payload['old_status']} → ` : ''}
              {ev.payload['new_status'] as string}
              {ev.payload['resolution'] ? ` (${ev.payload['resolution']})` : ''}
            </AureakText>
          )}

          {ev.eventType !== 'ATTENDANCE_RESTORED' && ev.payload['new_status'] && (
            <AureakButton
              label={restoring === ev.id ? 'Restauration...' : 'Restaurer cet état'}
              onPress={() => handleRestore(ev)}
              loading={restoring === ev.id}
              variant="ghost"
            />
          )}
        </View>
      ))}
    </ScrollView>
  )
}
