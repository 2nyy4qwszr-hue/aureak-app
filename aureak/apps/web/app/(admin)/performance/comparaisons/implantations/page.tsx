'use client'
// Story 57-6 — Vue comparaison deux implantations côte à côte
// Story 98.3 — Migrée /implantations/compare → /performance/comparaisons/implantations
//              AdminPageHeader v2 ("Comparaison des implantations")
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'

import {
  listImplantations,
  compareImplantations,
} from '@aureak/api-client'
import { computeImplantationHealth } from '@aureak/business-logic'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { Implantation, ImplantationHoverStats } from '@aureak/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

type CompareResult = { impl1: ImplantationHoverStats; impl2: ImplantationHoverStats }

type Metric = {
  key  : keyof ImplantationHoverStats
  label: string
  unit : string
}

const METRICS: Metric[] = [
  { key: 'attendanceRatePct',     label: 'Présence',       unit: '%' },
  { key: 'masteryRatePct',        label: 'Maîtrise',       unit: '%' },
  { key: 'sessionCountThisMonth', label: 'Séances (mois)', unit: ''  },
  { key: 'activeGroupCount',      label: 'Groupes actifs', unit: ''  },
]

// ── ComparePage ───────────────────────────────────────────────────────────────

export default function ComparePage() {
  const { width } = useWindowDimensions()
  const isMobile = width <= 640
  const router = useRouter()

  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [id1,           setId1]           = useState<string | null>(null)
  const [id2,           setId2]           = useState<string | null>(null)
  const [result,        setResult]        = useState<CompareResult | null>(null)
  const [comparing,     setComparing]     = useState(false)
  const [loadError,     setLoadError]     = useState<string | null>(null)

  // Chargement liste implantations au mount
  useEffect(() => {
    listImplantations().then(({ data, error }) => {
      if (error) {
        if (process.env.NODE_ENV !== 'production')
          console.error('[ComparePage] listImplantations error:', error)
        setLoadError('Impossible de charger les implantations.')
      } else {
        setImplantations(data)
      }
    })
  }, [])

  // Déclencher la comparaison dès que id1 et id2 sont définis et différents
  useEffect(() => {
    if (!id1 || !id2 || id1 === id2) return
    setResult(null)
    setComparing(true)
    compareImplantations(id1, id2)
      .then(({ data, error }) => {
        if (error) {
          if (process.env.NODE_ENV !== 'production')
            console.error('[ComparePage] compareImplantations error:', error)
        } else {
          setResult(data)
        }
      })
      .finally(() => setComparing(false))
  }, [id1, id2])

  const impl1Name = implantations.find(i => i.id === id1)?.name ?? '—'
  const impl2Name = implantations.find(i => i.id === id2)?.name ?? '—'

  const health1 = result ? computeImplantationHealth(result.impl1.attendanceRatePct, result.impl1.masteryRatePct) : null
  const health2 = result ? computeImplantationHealth(result.impl2.attendanceRatePct, result.impl2.masteryRatePct) : null

  return (
    <View style={styles.page}>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, isMobile && { padding: space.md }]}>
      {loadError && (
        <AureakText variant="body" style={{ color: colors.accent.red }}>{loadError}</AureakText>
      )}

      {/* ── Sélecteurs côte à côte ── */}
      <View style={[styles.selectorsRow, isMobile && { flexDirection: 'column', gap: space.md }]}>
        {/* Colonne 1 */}
        <View style={styles.selectorCol}>
          <AureakText variant="label" style={styles.colLabel}>IMPLANTATION A</AureakText>
          <View style={styles.picker}>
            <ScrollView>
              {implantations
                .filter(i => i.id !== id2)
                .map(impl => (
                  <Pressable
                    key={impl.id}
                    style={[styles.pickerOption, id1 === impl.id && styles.pickerOptionActive]}
                    onPress={() => setId1(impl.id)}
                  >
                    <AureakText
                      variant="body"
                      style={{ color: id1 === impl.id ? colors.accent.gold : colors.text.dark, fontWeight: id1 === impl.id ? '700' : '400' }}
                    >
                      {impl.name}
                    </AureakText>
                  </Pressable>
                ))
              }
            </ScrollView>
          </View>
        </View>

        {/* Colonne 2 */}
        <View style={styles.selectorCol}>
          <AureakText variant="label" style={styles.colLabel}>IMPLANTATION B</AureakText>
          <View style={styles.picker}>
            <ScrollView>
              {implantations
                .filter(i => i.id !== id1)
                .map(impl => (
                  <Pressable
                    key={impl.id}
                    style={[styles.pickerOption, id2 === impl.id && styles.pickerOptionActive]}
                    onPress={() => setId2(impl.id)}
                  >
                    <AureakText
                      variant="body"
                      style={{ color: id2 === impl.id ? colors.accent.gold : colors.text.dark, fontWeight: id2 === impl.id ? '700' : '400' }}
                    >
                      {impl.name}
                    </AureakText>
                  </Pressable>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </View>

      {/* ── Résultats comparaison ── */}
      {!id1 || !id2 ? (
        <View style={styles.placeholder}>
          <AureakText variant="body" style={{ color: colors.text.muted, textAlign: 'center' }}>
            Sélectionnez deux implantations pour comparer leurs métriques
          </AureakText>
        </View>
      ) : comparing ? (
        /* Skeleton */
        <View style={styles.resultCard}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={styles.skeletonRow} />
          ))}
        </View>
      ) : result ? (
        /* Tableau de métriques */
        <View style={styles.resultCard}>
          {/* En-têtes colonnes */}
          <View style={styles.resultHeaderRow}>
            <View style={{ flex: 2 }} />
            <View style={[styles.resultColHeader, { borderColor: colors.accent.gold + '40' }]}>
              <AureakText variant="label" style={{ color: colors.accent.gold, textAlign: 'center' }} numberOfLines={1}>
                {impl1Name}
              </AureakText>
              {health1 && (
                <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center', fontSize: 10 }}>
                  Score {health1.score}% — {health1.label}
                </AureakText>
              )}
            </View>
            <View style={[styles.resultColHeader, { borderColor: colors.accent.gold + '40' }]}>
              <AureakText variant="label" style={{ color: colors.accent.gold, textAlign: 'center' }} numberOfLines={1}>
                {impl2Name}
              </AureakText>
              {health2 && (
                <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center', fontSize: 10 }}>
                  Score {health2.score}% — {health2.label}
                </AureakText>
              )}
            </View>
          </View>

          {/* Lignes métriques */}
          {METRICS.map(metric => {
            const v1 = result.impl1[metric.key] as number
            const v2 = result.impl2[metric.key] as number
            const higher1 = v1 > v2
            const higher2 = v2 > v1
            const isPercent = metric.unit === '%'

            return (
              <View key={metric.key} style={styles.metricRow}>
                {/* Label */}
                <AureakText variant="caption" style={{ flex: 2, fontSize: 13, color: colors.text.muted }}>
                  {metric.label}
                </AureakText>

                {/* Valeur + barre 1 */}
                <View style={[styles.metricCell, higher1 && styles.metricCellHighlight]}>
                  <AureakText
                    variant="body"
                    style={{ fontWeight: '700', color: higher1 ? colors.accent.gold : colors.text.dark, textAlign: 'center' }}
                  >
                    {v1}{metric.unit}
                  </AureakText>
                  {isPercent && (
                    <View style={styles.barTrack}>
                      <View style={[
                        styles.barFill,
                        { width: `${v1}%`, backgroundColor: higher1 ? colors.accent.gold : colors.border.light },
                      ] as any} />
                    </View>
                  )}
                </View>

                {/* Valeur + barre 2 */}
                <View style={[styles.metricCell, higher2 && styles.metricCellHighlight]}>
                  <AureakText
                    variant="body"
                    style={{ fontWeight: '700', color: higher2 ? colors.accent.gold : colors.text.dark, textAlign: 'center' }}
                  >
                    {v2}{metric.unit}
                  </AureakText>
                  {isPercent && (
                    <View style={styles.barTrack}>
                      <View style={[
                        styles.barFill,
                        { width: `${v2}%`, backgroundColor: higher2 ? colors.accent.gold : colors.border.light },
                      ] as any} />
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      ) : null}
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page          : { flex: 1, backgroundColor: colors.light.primary },
  container     : { flex: 1, backgroundColor: colors.light.primary },
  content       : { padding: space.xl, gap: space.lg },
  header        : { gap: space.sm },
  backBtn       : {
    alignSelf        : 'flex-start',
    paddingVertical  : space.xs,
    paddingHorizontal: space.sm,
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '40',
    borderRadius     : radius.xs,
  },
  selectorsRow  : {
    flexDirection: 'row',
    gap          : space.lg,
  },
  selectorCol   : {
    flex: 1,
    gap : space.xs,
  },
  colLabel      : {
    color      : colors.text.muted,
    letterSpacing: 1,
  },
  picker        : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    maxHeight      : 200,
    overflow       : 'hidden',
  },
  pickerOption  : {
    padding        : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pickerOptionActive: {
    backgroundColor: colors.accent.gold + '12',
  },
  placeholder   : {
    padding        : space.xl,
    alignItems     : 'center',
    backgroundColor: colors.light.muted,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  resultCard    : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : space.sm,
    boxShadow      : shadows.sm,
  } as any,
  skeletonRow   : {
    height         : 40,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    gap          : space.sm,
    marginBottom : space.xs,
  },
  resultColHeader: {
    flex           : 1,
    borderWidth    : 1,
    borderRadius   : radius.xs,
    padding        : space.xs,
    alignItems     : 'center',
    gap            : 2,
  },
  metricRow     : {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    paddingVertical: space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  metricLabel   : {
    flex     : 2,
    fontSize : 13,
  },
  metricCell    : {
    flex           : 1,
    borderRadius   : radius.xs,
    padding        : space.xs,
    gap            : 4,
    alignItems     : 'center',
  },
  metricCellHighlight: {
    backgroundColor: colors.accent.gold + '18',
  },
  barTrack      : {
    width          : '100%',
    height         : 4,
    backgroundColor: colors.border.light,
    borderRadius   : radius.xs,
    overflow       : 'hidden',
  },
  barFill       : {
    height      : '100%',
    borderRadius: radius.xs,
  },
})
