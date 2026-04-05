'use client'
// Story 6.x — Vue admin des évaluations
// Story 55-1 — EvaluationCard FUT-style
// Story 55-4 — Filtre "Records seulement"
// Story 55-5 — Analyse biais coach
// Story 55-6 — Section alertes joueurs en danger
import { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listEvaluationsAdmin, getCoachEvaluationBias, listDangerousPlayers,
} from '@aureak/api-client'
import type { AdminEvalRow, BiasPeriod } from '@aureak/api-client'
import { AureakText, EvaluationCard } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { EvaluationWithChild, CoachBiasReport, DangerousPlayer } from '@aureak/types'
import { signalScore } from '@aureak/ui'

// ── Convertisseur AdminEvalRow → EvaluationWithChild ─────────────────────────

function toEvalWithChild(ev: AdminEvalRow): EvaluationWithChild {
  return {
    id           : ev.id,
    sessionId    : ev.sessionId,
    childId      : ev.childId,
    coachId      : '',
    tenantId     : '',
    receptivite  : ev.receptivite as 'positive' | 'attention' | 'none',
    goutEffort   : ev.goutEffort  as 'positive' | 'attention' | 'none',
    attitude     : ev.attitude    as 'positive' | 'attention' | 'none',
    topSeance    : ev.topSeance ? 'star' : 'none',
    note         : null,
    lastEventId  : null,
    updatedBy    : null,
    updatedAt    : ev.evalAt,
    createdAt    : ev.evalAt,
    childName    : ev.childName,
    sessionDate  : ev.evalAt,
    sessionName  : null,
    coachName    : null,
    photoUrl     : null,
    isPersonalBest: false,
  }
}

// ── Helpers export CSV ────────────────────────────────────────────────────────

function exportBiasCSV(reports: CoachBiasReport[], period: BiasPeriod) {
  const dateStr = new Date().toISOString().split('T')[0]
  const header  = 'coach,nb_eval,note_moyenne,delta_vs_mediane\n'
  const rows    = reports.map(r =>
    [
      r.coachName,
      r.evalCount,
      r.avgScore !== null ? r.avgScore.toFixed(1) : 'N/A',
      r.deltaVsMedian !== null ? (r.deltaVsMedian >= 0 ? '+' : '') + r.deltaVsMedian.toFixed(1) : 'N/A',
    ].join(',')
  ).join('\n')
  const csv  = header + rows
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = window.URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `biais-coachs-${period}-${dateStr}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// ── Section alertes joueurs en danger (Story 55-6) ───────────────────────────

function DangerAlertsSection({
  players, onNavigate,
}: { players: DangerousPlayer[]; onNavigate: (childId: string) => void }) {
  if (players.length === 0) return null

  return (
    <View style={alert.container}>
      <View style={alert.header}>
        <AureakText style={alert.title as never}>Alertes joueurs</AureakText>
        <View style={alert.badge}>
          <AureakText style={alert.badgeText as never}>{players.length}</AureakText>
        </View>
      </View>
      <AureakText style={alert.subtitle as never}>
        Joueurs avec {'\u22653'} séances consécutives sous 5.0
      </AureakText>
      <View style={alert.list}>
        {players.map(p => (
          <Pressable
            key={p.childId}
            style={({ pressed }) => [alert.row, pressed && { opacity: 0.75 }]}
            onPress={() => onNavigate(p.childId)}
            accessibilityRole="button"
            accessibilityLabel={`Voir fiche de ${p.displayName}`}
          >
            <View style={alert.leftBorder} />
            <View style={alert.rowContent}>
              <AureakText style={alert.playerName as never}>{p.displayName}</AureakText>
              <AureakText style={alert.playerMeta as never}>
                Dernière note : {p.lastScore.toFixed(1)} · {p.streakCount} séances consécutives
              </AureakText>
            </View>
            <View style={alert.pill}>
              <AureakText style={alert.pillText as never}>Alerte</AureakText>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const alert = StyleSheet.create({
  container  : {
    backgroundColor: colors.accent.red + '1A',
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.accent.red + '40',
    padding        : space.md,
    gap            : space.sm,
  },
  header     : { flexDirection: 'row' as never, alignItems: 'center' as never, gap: space.sm },
  title      : { fontSize: 14, fontWeight: '700' as never, color: colors.accent.red },
  badge      : {
    backgroundColor: colors.accent.red,
    borderRadius   : 12,
    paddingHorizontal: 8,
    paddingVertical  : 2,
  },
  badgeText  : { color: '#fff', fontSize: 11, fontWeight: '700' as never },
  subtitle   : { fontSize: 12, color: colors.accent.red + 'CC' },
  list       : { gap: space.sm },
  row        : {
    flexDirection  : 'row' as never,
    alignItems     : 'center' as never,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    overflow       : 'hidden' as never,
    gap            : space.sm,
  },
  leftBorder : { width: 3, alignSelf: 'stretch' as never, backgroundColor: colors.accent.red },
  rowContent : { flex: 1, paddingVertical: space.sm, gap: 2 },
  playerName : { fontSize: 13, fontWeight: '600' as never, color: colors.text.dark },
  playerMeta : { fontSize: 11, color: colors.text.muted },
  pill       : {
    backgroundColor: colors.accent.red,
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : 12,
    marginRight      : space.sm,
  },
  pillText   : { color: '#fff', fontSize: 10, fontWeight: '700' as never },
})

// ── Section analyse biais coachs (Story 55-5) ────────────────────────────────

const BIAS_PERIOD_LABELS: Record<BiasPeriod, string> = {
  '30d'   : '30 jours',
  '90d'   : '90 jours',
  'season': 'Saison',
}

const BIAS_LEVEL_COLOR: Record<CoachBiasReport['biasLevel'], string> = {
  neutral     : colors.status.present,
  moderate    : colors.status.attention,
  strong      : colors.status.absent,
  insufficient: colors.text.muted,
}

function CoachBiasSection() {
  const [period, setPeriod]           = useState<BiasPeriod>('30d')
  const [reports, setReports]         = useState<CoachBiasReport[]>([])
  const [biasLoading, setBiasLoading] = useState(false)
  const [expanded, setExpanded]       = useState(false)

  const loadBias = useCallback(async (p: BiasPeriod) => {
    setBiasLoading(true)
    try {
      const { data } = await getCoachEvaluationBias(p)
      setReports(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CoachBiasSection] error:', err)
    } finally {
      setBiasLoading(false)
    }
  }, [])

  useEffect(() => {
    if (expanded) loadBias(period)
  }, [expanded, period, loadBias])

  const handlePeriod = (p: BiasPeriod) => {
    setPeriod(p)
    if (expanded) loadBias(p)
  }

  return (
    <View style={bias.container}>
      {/* Accordéon header */}
      <Pressable
        style={({ pressed }) => [bias.accordionHeader, pressed && { opacity: 0.8 }]}
        onPress={() => setExpanded(v => !v)}
        accessibilityRole="button"
        accessibilityLabel="Analyse biais coachs"
      >
        <AureakText style={bias.accordionTitle as never}>Analyse coachs</AureakText>
        <AureakText style={bias.accordionChevron as never}>{expanded ? '▲' : '▼'}</AureakText>
      </Pressable>

      {expanded && (
        <View style={bias.body}>
          {/* Sélecteur période */}
          <View style={bias.periodRow}>
            {(Object.keys(BIAS_PERIOD_LABELS) as BiasPeriod[]).map(p => (
              <Pressable
                key={p}
                style={[bias.periodChip, period === p && bias.periodChipActive]}
                onPress={() => handlePeriod(p)}
              >
                <AureakText style={[bias.periodLabel, period === p && bias.periodLabelActive] as never}>
                  {BIAS_PERIOD_LABELS[p]}
                </AureakText>
              </Pressable>
            ))}
            {/* Bouton export CSV */}
            {reports.length > 0 && !biasLoading && (
              <Pressable
                style={bias.exportBtn}
                onPress={() => exportBiasCSV(reports, period)}
                accessibilityLabel="Exporter CSV biais coachs"
              >
                <AureakText style={bias.exportBtnText as never}>Exporter CSV</AureakText>
              </Pressable>
            )}
          </View>

          {biasLoading ? (
            <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement...</AureakText>
          ) : reports.length === 0 ? (
            <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>
              Aucune donnée sur cette période.
            </AureakText>
          ) : (
            <View style={bias.table}>
              {/* En-tête */}
              <View style={bias.tableHeader}>
                <AureakText style={[bias.cell, bias.cellFlex] as never}>Coach</AureakText>
                <AureakText style={[bias.cell, bias.cellNb] as never}>Évals</AureakText>
                <AureakText style={[bias.cell, bias.cellNb] as never}>Moy.</AureakText>
                <AureakText style={[bias.cell, bias.cellNb] as never}>Delta</AureakText>
                <AureakText style={[bias.cell, bias.cellIndicator] as never}>Statut</AureakText>
              </View>
              {/* Lignes */}
              {reports.map(r => (
                <View key={r.coachId} style={bias.tableRow}>
                  <AureakText style={[bias.cell, bias.cellFlex, bias.cellName] as never} numberOfLines={1}>
                    {r.coachName}
                  </AureakText>
                  <AureakText style={[bias.cell, bias.cellNb] as never}>{r.evalCount}</AureakText>
                  <AureakText style={[bias.cell, bias.cellNb] as never}>
                    {r.avgScore !== null ? r.avgScore.toFixed(1) : '—'}
                  </AureakText>
                  <AureakText style={[bias.cell, bias.cellNb] as never}>
                    {r.deltaVsMedian !== null
                      ? (r.deltaVsMedian >= 0 ? '+' : '') + r.deltaVsMedian.toFixed(1)
                      : '—'}
                  </AureakText>
                  <View style={bias.cellIndicator}>
                    <View style={[bias.dot, { backgroundColor: BIAS_LEVEL_COLOR[r.biasLevel] }]} />
                    <AureakText style={[bias.dotLabel, { color: BIAS_LEVEL_COLOR[r.biasLevel] }] as never}>
                      {r.biasLevel === 'insufficient' ? '< 5 éval.' :
                       r.biasLevel === 'neutral'      ? 'Neutre'    :
                       r.biasLevel === 'moderate'     ? 'Modéré'    : 'Fort'}
                    </AureakText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const bias = StyleSheet.create({
  container      : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden' as never,
  },
  accordionHeader: {
    flexDirection  : 'row' as never,
    justifyContent : 'space-between' as never,
    alignItems     : 'center' as never,
    padding        : space.md,
    backgroundColor: colors.light.surface,
  },
  accordionTitle  : { fontSize: 14, fontWeight: '700' as never, color: colors.text.dark },
  accordionChevron: { fontSize: 12, color: colors.text.muted },
  body            : { padding: space.md, gap: space.md, borderTopWidth: 1, borderTopColor: colors.border.light },
  periodRow       : { flexDirection: 'row' as never, gap: space.sm, flexWrap: 'wrap' as never, alignItems: 'center' as never },
  periodChip      : {
    paddingHorizontal: space.md,
    paddingVertical  : 5,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  periodChipActive: { backgroundColor: colors.text.dark, borderColor: colors.text.dark },
  periodLabel     : { fontSize: 12, color: colors.text.muted, fontWeight: '600' as never },
  periodLabelActive: { color: '#fff' },
  exportBtn       : {
    marginLeft       : 'auto' as never,
    paddingHorizontal: space.md,
    paddingVertical  : 5,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  exportBtnText   : { fontSize: 12, color: colors.text.dark, fontWeight: '600' as never },
  table           : { gap: 0, borderRadius: radius.xs, overflow: 'hidden' as never },
  tableHeader     : {
    flexDirection  : 'row' as never,
    backgroundColor: colors.light.muted,
    paddingVertical: 8,
    paddingHorizontal: space.sm,
    gap            : space.sm,
  },
  tableRow        : {
    flexDirection   : 'row' as never,
    paddingVertical : 10,
    paddingHorizontal: space.sm,
    gap             : space.sm,
    borderTopWidth  : 1,
    borderTopColor  : colors.border.light,
  },
  cell            : { fontSize: 12, color: colors.text.dark },
  cellFlex        : { flex: 1 },
  cellNb          : { width: 56, textAlign: 'right' as never },
  cellIndicator   : { width: 80, flexDirection: 'row' as never, alignItems: 'center' as never, gap: 4 },
  cellName        : { fontWeight: '600' as never },
  dot             : { width: 8, height: 8, borderRadius: 4 },
  dotLabel        : { fontSize: 11, fontWeight: '600' as never },
})

// ── Page principale ───────────────────────────────────────────────────────────

export default function EvaluationsPage() {
  const router = useRouter()
  const [evals, setEvals]               = useState<AdminEvalRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [recordsOnly, setRecordsOnly]   = useState(false)
  const [dangerPlayers, setDangerPlayers] = useState<DangerousPlayer[]>([])
  const [from, setFrom]                 = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return d.toISOString().split('T')[0] as string
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0] as string)

  const load = async () => {
    setLoading(true)
    try {
      const [evalsRes, dangerRes] = await Promise.all([
        listEvaluationsAdmin(from, to),
        listDangerousPlayers(),
      ])
      setEvals(evalsRes.data)
      setDangerPlayers(dangerRes.data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[EvaluationsPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [from, to])

  const topCount = evals.filter(e => e.topSeance).length

  // Filtre "Records seulement" (Story 55-4)
  const displayedEvals = recordsOnly
    ? evals.filter(e => e.topSeance)
    : evals

  const navigateToChild = (childId: string) => {
    router.push(`/(admin)/children/${childId}` as never)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Évaluations</AureakText>
          {!loading && evals.length > 0 && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {evals.length} évaluation{evals.length > 1 ? 's' : ''} · {topCount} top séance{topCount > 1 ? 's' : ''}
            </AureakText>
          )}
        </View>

        {/* Contrôles droite : comparaison + filtres date */}
        <View style={styles.headerRight}>
          {/* Bouton "Comparer joueurs" (Story 55-2) */}
          <Pressable
            style={styles.compareBtn}
            onPress={() => router.push('/(admin)/evaluations/comparison' as never)}
            accessibilityLabel="Comparer deux joueurs"
          >
            <AureakText style={styles.compareBtnText as never}>Comparer joueurs</AureakText>
          </Pressable>

          {/* Filtres date */}
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
      </View>

      {/* ── Section alertes joueurs en danger (Story 55-6) ── */}
      {!loading && dangerPlayers.length > 0 && (
        <DangerAlertsSection players={dangerPlayers} onNavigate={navigateToChild} />
      )}

      {/* ── Section analyse biais coachs (Story 55-5) ── */}
      <CoachBiasSection />

      {/* ── Chips filtres rapides (Story 55-4) ── */}
      <View style={styles.chips}>
        <Pressable
          style={[styles.chip, !recordsOnly && styles.chipActive]}
          onPress={() => setRecordsOnly(false)}
        >
          <AureakText style={[styles.chipText, !recordsOnly && styles.chipTextActive] as never}>
            Toutes
          </AureakText>
        </Pressable>
        <Pressable
          style={[styles.chip, recordsOnly && styles.chipActiveGold]}
          onPress={() => setRecordsOnly(true)}
        >
          <AureakText style={[styles.chipText, recordsOnly && styles.chipTextGold] as never}>
            Records seulement
          </AureakText>
        </Pressable>
      </View>

      {/* ── Contenu ── */}
      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      ) : displayedEvals.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          {recordsOnly ? 'Aucun record sur cette période.' : 'Aucune évaluation sur cette période.'}
        </AureakText>
      ) : (
        <View style={styles.grid}>
          {displayedEvals.map((ev) => (
            <View key={ev.id} style={styles.cardWrapper}>
              <EvaluationCard
                evaluation={toEvalWithChild(ev)}
                showPhoto={false}
                compact={false}
                isPersonalBest={ev.topSeance}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const webInputStyle = {
  padding        : '6px 10px',
  borderRadius   : '6px',
  border         : `1px solid ${colors.border.light}`,
  backgroundColor: colors.light.surface,
  color          : colors.text.dark,
  fontSize       : '13px',
} as React.CSSProperties

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.light.primary },
  content     : { padding: space.xl, gap: space.md },
  pageHeader  : {
    flexDirection    : 'row' as never,
    justifyContent   : 'space-between' as never,
    alignItems       : 'flex-start' as never,
    flexWrap         : 'wrap' as never,
    gap              : space.md,
  },
  headerRight : { flexDirection: 'row' as never, alignItems: 'flex-end' as never, gap: space.md, flexWrap: 'wrap' as never },
  filterRow   : { flexDirection: 'row' as never, gap: space.md, flexWrap: 'wrap' as never },
  filterLabel : { color: colors.text.muted, fontWeight: '700' as never, letterSpacing: 1, textTransform: 'uppercase' as never, fontSize: 10 },

  // Bouton comparaison
  compareBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : radius.button,
    alignSelf        : 'flex-end' as never,
    boxShadow        : shadows.gold,
  } as never,
  compareBtnText: {
    color     : colors.status.successText,
    fontSize  : 13,
    fontWeight: '700' as never,
  },

  // Chips filtres
  chips: { flexDirection: 'row' as never, gap: space.sm },
  chip : {
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  chipActive: {
    backgroundColor: colors.dark.surface,
    borderColor    : colors.border.dark,
  },
  chipActiveGold: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
    boxShadow      : shadows.gold,
  } as never,
  chipText     : { fontSize: 12, color: colors.text.muted, fontWeight: '600' as never },
  chipTextActive: { color: '#FFFFFF' },
  chipTextGold : { color: colors.status.successText },

  // Grille cards
  grid: {
    flexDirection: 'row' as never,
    flexWrap     : 'wrap' as never,
    gap          : space.md,
  },
  cardWrapper: {
    width: 260,
  },
})
