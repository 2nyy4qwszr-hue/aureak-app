'use client'
// Story 6.x — Vue admin des évaluations
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { supabase } from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

type EvalRow = {
  id          : string
  sessionId   : string
  childId     : string
  childName   : string | null
  receptivite : string
  goutEffort  : string
  attitude    : string
  topSeance   : boolean
  evalAt      : string
}

const SIGNAL_VARIANT: Record<string, 'present' | 'attention' | 'zinc'> = {
  acquired    : 'present',
  in_progress : 'attention',
  not_acquired: 'zinc',
}

const SIGNAL_LABEL: Record<string, string> = {
  acquired    : 'Acquis',
  in_progress : 'En cours',
  not_acquired: 'Non acquis',
}

export default function EvaluationsPage() {
  const [evals, setEvals]     = useState<EvalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom]       = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return d.toISOString().split('T')[0] as string
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0] as string)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('evaluations')
      .select(`
        id,
        session_id,
        child_id,
        receptivite,
        gout_effort,
        attitude,
        top_seance,
        updated_at,
        profiles!evaluations_child_id_fkey ( display_name )
      `)
      .gte('updated_at', new Date(from + 'T00:00:00').toISOString())
      .lte('updated_at', new Date(to + 'T23:59:59').toISOString())
      .order('updated_at', { ascending: false })
      .limit(500)

    const list: EvalRow[] = ((data ?? []) as unknown[]).map((r) => {
      const row = r as {
        id: string; session_id: string; child_id: string
        receptivite: string; gout_effort: string; attitude: string
        top_seance: boolean; updated_at: string
        profiles: { display_name: string | null }[] | null
      }
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return {
        id         : row.id,
        sessionId  : row.session_id,
        childId    : row.child_id,
        childName  : (profile as { display_name: string | null } | undefined)?.display_name ?? null,
        receptivite: row.receptivite,
        goutEffort : row.gout_effort,
        attitude   : row.attitude,
        topSeance  : row.top_seance,
        evalAt     : row.updated_at,
      }
    })
    setEvals(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [from, to])

  const topCount  = evals.filter(e => e.topSeance).length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <View>
          <AureakText variant="h2">Évaluations</AureakText>
          {!loading && evals.length > 0 && (
            <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
              {evals.length} évaluation{evals.length > 1 ? 's' : ''} · {topCount} top séance{topCount > 1 ? 's' : ''}
            </AureakText>
          )}
        </View>
        {/* Date filter */}
        <View style={styles.filterRow}>
          <View style={{ gap: 4 }}>
            <AureakText variant="caption" style={styles.filterLabel}>Du</AureakText>
            <input
              type="date"
              value={from}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
              style={webInputStyle}
            />
          </View>
          <View style={{ gap: 4 }}>
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


      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
      ) : evals.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>
          Aucune évaluation sur cette période.
        </AureakText>
      ) : (
        evals.map((ev) => (
          <View key={ev.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>
                  {ev.childName ?? ev.childId.slice(0, 8)}
                  {ev.topSeance ? ' ⭐' : ''}
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.secondary }}>
                  {new Date(ev.evalAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </AureakText>
              </View>
            </View>
            <View style={styles.signals}>
              <Badge
                label={`R: ${SIGNAL_LABEL[ev.receptivite] ?? ev.receptivite}`}
                variant={SIGNAL_VARIANT[ev.receptivite] ?? 'zinc'}
              />
              <Badge
                label={`E: ${SIGNAL_LABEL[ev.goutEffort] ?? ev.goutEffort}`}
                variant={SIGNAL_VARIANT[ev.goutEffort] ?? 'zinc'}
              />
              <Badge
                label={`A: ${SIGNAL_LABEL[ev.attitude] ?? ev.attitude}`}
                variant={SIGNAL_VARIANT[ev.attitude] ?? 'zinc'}
              />
            </View>
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
  kpiRow    : {
    flexDirection    : 'row',
    gap              : space.md,
    backgroundColor  : colors.background.surface,
    borderRadius     : 10,
    padding          : space.md,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
  },
  kpi       : { flex: 1, alignItems: 'center', gap: 2 },
  card      : {
    backgroundColor  : colors.background.surface,
    borderRadius     : 8,
    padding          : space.md,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
    gap              : space.xs,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  signals   : { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' as never },
})
