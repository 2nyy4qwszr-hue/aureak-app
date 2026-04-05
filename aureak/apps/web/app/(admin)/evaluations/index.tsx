'use client'
// Story 6.x — Vue admin des évaluations
// Story 55-1 — EvaluationCard FUT-style
// Story 55-4 — Filtre "Records seulement"
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listEvaluationsAdmin } from '@aureak/api-client'
import type { AdminEvalRow } from '@aureak/api-client'
import { AureakText, EvaluationCard } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { EvaluationWithChild } from '@aureak/types'
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

export default function EvaluationsPage() {
  const router = useRouter()
  const [evals, setEvals]           = useState<AdminEvalRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [recordsOnly, setRecordsOnly] = useState(false)
  const [from, setFrom]             = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return d.toISOString().split('T')[0] as string
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0] as string)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await listEvaluationsAdmin(from, to)
      setEvals(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[EvaluationsPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [from, to])

  const topCount = evals.filter(e => e.topSeance).length

  // Filtre "Records seulement" (Story 55-4)
  // topSeance est utilisé comme proxy pour isPersonalBest côté AdminEvalRow
  const displayedEvals = recordsOnly
    ? evals.filter(e => e.topSeance)
    : evals

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
    color     : '#3D2E00',
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
    backgroundColor: colors.text.dark,
    borderColor    : colors.text.dark,
  },
  chipActiveGold: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
    boxShadow      : shadows.gold,
  } as never,
  chipText     : { fontSize: 12, color: colors.text.muted, fontWeight: '600' as never },
  chipTextActive: { color: '#FFFFFF' },
  chipTextGold : { color: '#3D2E00' },

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
