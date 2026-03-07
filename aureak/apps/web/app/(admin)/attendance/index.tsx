'use client'
// Story 5.5 — Timeline admin : vue agrégée des présences par séance
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { supabase } from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

type AttendanceRow = {
  id         : string
  sessionId  : string
  childId    : string
  status     : 'present' | 'absent' | 'late' | 'excused'
  recordedAt : string
  recordedBy : string
  childName  : string | null
}

const STATUS_LABEL: Record<string, string> = {
  present: 'Présent',
  absent : 'Absent',
  late   : 'En retard',
  excused: 'Excusé',
}

const STATUS_VARIANT: Record<string, 'present' | 'attention' | 'zinc'> = {
  present: 'present',
  absent : 'zinc',
  late   : 'attention',
  excused: 'zinc',
}

export default function AttendancePage() {
  const [rows, setRows]   = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom]   = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0] as string
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0] as string)

  const load = async () => {
    setLoading(true)
    // Join attendances with profiles for child name, filter by recorded_at window
    const { data } = await supabase
      .from('attendances')
      .select(`
        id,
        session_id,
        child_id,
        status,
        recorded_at,
        recorded_by,
        profiles!attendances_child_id_fkey ( display_name )
      `)
      .gte('recorded_at', new Date(from + 'T00:00:00').toISOString())
      .lte('recorded_at', new Date(to + 'T23:59:59').toISOString())
      .order('recorded_at', { ascending: false })
      .limit(500)

    const list: AttendanceRow[] = ((data ?? []) as unknown[]).map((r) => {
      const row = r as {
        id: string; session_id: string; child_id: string; status: string
        recorded_at: string; recorded_by: string
        profiles: { display_name: string | null }[] | null
      }
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return {
        id        : row.id,
        sessionId : row.session_id,
        childId   : row.child_id,
        status    : row.status as AttendanceRow['status'],
        recordedAt: row.recorded_at,
        recordedBy: row.recorded_by,
        childName : (profile as { display_name: string | null } | undefined)?.display_name ?? null,
      }
    })
    setRows(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [from, to])

  const presentCount = rows.filter(r => r.status === 'present').length
  const absentCount  = rows.filter(r => r.status === 'absent').length
  const total        = rows.length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <View>
          <AureakText variant="h2">Présences</AureakText>
          {!loading && total > 0 && (
            <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
              {total} enregistrement{total > 1 ? 's' : ''} sur la période
            </AureakText>
          )}
        </View>
        {/* Date filter */}
        <View style={styles.filterRow}>
          <View style={styles.dateField}>
            <AureakText variant="caption" style={styles.filterLabel}>Du</AureakText>
            <input
              type="date"
              value={from}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
              style={webInputStyle}
            />
          </View>
          <View style={styles.dateField}>
            <AureakText variant="caption" style={styles.filterLabel}>Au</AureakText>
            <input
              type="date"
              value={to}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
              style={webInputStyle}
            />
          </View>
        </View>
      </View>

      {/* Summary KPIs */}
      {!loading && total > 0 && (
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <AureakText variant="h2" style={{ color: colors.accent.gold }}>{total}</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>Enregistrements</AureakText>
          </View>
          <View style={styles.kpi}>
            <AureakText variant="h2" style={{ color: colors.status.present }}>{presentCount}</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>Présences</AureakText>
          </View>
          <View style={styles.kpi}>
            <AureakText variant="h2" style={{ color: colors.text.secondary }}>{absentCount}</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>Absences</AureakText>
          </View>
          <View style={styles.kpi}>
            <AureakText variant="h2" style={{ color: colors.accent.gold }}>
              {total > 0 ? Math.round((presentCount / total) * 100) : 0}%
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>Taux</AureakText>
          </View>
        </View>
      )}

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
      ) : rows.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>
          Aucune présence enregistrée sur cette période.
        </AureakText>
      ) : (
        rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <AureakText variant="body" style={{ fontWeight: '600' }}>
                {row.childName ?? row.childId.slice(0, 8)}
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.secondary }}>
                {new Date(row.recordedAt).toLocaleString('fr-FR', {
                  day: '2-digit', month: '2-digit', year: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                })}
              </AureakText>
            </View>
            <Badge
              label={STATUS_LABEL[row.status] ?? row.status}
              variant={STATUS_VARIANT[row.status] ?? 'zinc'}
            />
          </View>
        ))
      )}
    </ScrollView>
  )
}

const webInputStyle = {
  padding        : '6px 10px',
  borderRadius   : '6px',
  border         : `1px solid ${colors.accent.zinc}`,
  backgroundColor: colors.background.surface,
  color          : colors.text.primary,
  fontSize       : '13px',
} as React.CSSProperties

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.background.primary },
  content    : { padding: space.xl, gap: space.md },
  pageHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as never, gap: space.md },
  filterRow  : { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' as never },
  filterLabel: { color: colors.text.secondary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' as never, fontSize: 10 },
  dateField  : { gap: 4 },
  kpiRow   : {
    flexDirection    : 'row',
    gap              : space.md,
    backgroundColor  : colors.background.surface,
    borderRadius     : 10,
    padding          : space.md,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
  },
  kpi      : { flex: 1, alignItems: 'center', gap: 2 },
  row      : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    backgroundColor: colors.background.surface,
    borderRadius   : 8,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
  },
})
