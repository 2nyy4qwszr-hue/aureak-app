// Story 7.3 — Fiche enfant : présences, évaluations fusionnées, historique
import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { getChildProfile, getAttendanceSource } from '@aureak/api-client'
import { IndicatorToggle, StarToggle, Text } from '@aureak/ui'
import type { EvaluationSignal } from '@aureak/types'
import { colors } from '@aureak/theme'

type AttendanceRow = {
  id        : string
  status    : string
  created_at: string
  source?   : 'field' | 'admin'
  sessions? : {
    id          : string
    scheduled_at: string
    groups?     : { name: string } | null
  } | null
}

type EvalRow = {
  session_id  : string
  receptivite : EvaluationSignal
  gout_effort : EvaluationSignal
  attitude    : EvaluationSignal
  top_seance  : 'star' | 'none'
}

export default function ChildProfileScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const [attendances, setAttendances] = useState<AttendanceRow[]>([])
  const [evaluations, setEvaluations] = useState<EvalRow[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    getChildProfile(childId).then(async ({ attendances: atts, evaluations: evals }) => {
      // Enrichir chaque présence avec sa source (terrain/admin)
      const enriched = await Promise.all(
        (atts as unknown as AttendanceRow[]).map(async att => {
          const { data } = await getAttendanceSource(att.id)
          return { ...att, source: data?.source as 'field' | 'admin' | undefined }
        })
      )
      setAttendances(enriched)
      setEvaluations(evals as EvalRow[])
      setLoading(false)
    })
  }, [childId])

  if (loading) return <ActivityIndicator style={styles.loader} color={colors.accent.gold} />

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Fiche enfant</Text>

      {/* ─── Section présences ─────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Présences récentes</Text>
      {attendances.map(att => (
        <View key={att.id} style={styles.row}>
          <Text style={styles.cell}>
            {att.sessions?.scheduled_at
              ? new Date(att.sessions.scheduled_at).toLocaleDateString('fr-FR')
              : '—'}
          </Text>
          <Text style={{ flex: 1, color: statusColor(att.status), fontSize: 14 }}>{att.status}</Text>
          <Text style={styles.sourceTag}>
            {att.source === 'admin' ? '✏️ Modifié' : '🌿 Terrain'}
          </Text>
        </View>
      ))}

      {/* ─── Section évaluations ───────────────────────────────── */}
      <Text style={styles.sectionTitle}>Évaluations</Text>
      {evaluations.map(ev => (
        <View key={ev.session_id} style={styles.evalRow}>
          <IndicatorToggle value={ev.receptivite} onChange={() => {}} disabled label="Récept." />
          <IndicatorToggle value={ev.gout_effort} onChange={() => {}} disabled label="Effort" />
          <IndicatorToggle value={ev.attitude}    onChange={() => {}} disabled label="Attitude" />
          <StarToggle value={ev.top_seance === 'star'} onChange={() => {}} disabled />
        </View>
      ))}
    </ScrollView>
  )
}

function statusColor(status: string): string {
  switch (status) {
    case 'present': return colors.status.present
    case 'absent' : return colors.status.absent
    case 'late'   : return colors.accent.gold
    default       : return colors.text.secondary
  }
}

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.background.primary, padding: 16 },
  loader      : { flex: 1 },
  title       : { color: colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  sectionTitle: { color: colors.accent.gold, fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  row         : { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.background.surface },
  cell        : { flex: 1, color: colors.text.primary, fontSize: 14 },
  sourceTag   : { color: colors.text.secondary, fontSize: 12 },
  evalRow     : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.background.surface },
})
