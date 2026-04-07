'use client'
// Story 65-3 — Activités Hub : onglet Évaluations (vue transversale, 3 sous-filtres)
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, fonts } from '@aureak/theme'
import {
  listEvaluationsAdmin,
} from '@aureak/api-client'
import type { AdminEvalRow } from '@aureak/api-client'

import { ActivitesHeader }        from '../components/ActivitesHeader'
import { FiltresScope }           from '../components/FiltresScope'
import { PseudoFiltresTemporels } from '../components/PseudoFiltresTemporels'
import type { ScopeState }        from '../components/FiltresScope'
import type { TemporalFilter }    from '../components/PseudoFiltresTemporels'

// ─── Types internes ───────────────────────────────────────────────────────────

type EvalType = 'badges' | 'connaissances' | 'competences'
type SortDir  = 'asc' | 'desc'

type EvalRowEnriched = AdminEvalRow & {
  sessionName?: string
  groupName?  : string
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  return `${day}/${month}/${year}`
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

function truncate(text: string | null, max: number): string {
  if (!text) return '—'
  return text.length <= max ? text : text.slice(0, max) + '...'
}

function signalColor(signal: string): string {
  if (signal === 'positive')  return colors.status.success   // #10B981
  if (signal === 'attention') return colors.status.warning   // #F59E0B
  return colors.border.light                                 // #E5E7EB
}

function signalLabel(signal: string): string {
  if (signal === 'positive')  return 'Positif'
  if (signal === 'attention') return 'À surveiller'
  return '—'
}

/**
 * Calcule le score composite 0–10 à partir des 3 signaux qualitatifs.
 */
function signalToScore(s: string): number {
  if (s === 'positive') return 10
  if (s === 'none')     return 5
  return 0
}

function computeScore(row: AdminEvalRow): number {
  return (signalToScore(row.receptivite) + signalToScore(row.goutEffort) + signalToScore(row.attitude)) / 3
}

/**
 * Calcule les bornes de date selon le filtre temporel.
 * Pour les évaluations : passées = 30j, aujourd'hui = 1j, à venir = 0 éval.
 */
function getDateRange(filter: TemporalFilter): { from: string; to: string } {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const fmt   = (d: Date) => d.toISOString().split('T')[0] as string

  if (filter === 'today') {
    return { from: fmt(today), to: fmt(today) }
  }
  if (filter === 'upcoming') {
    // Pas d'évals futures — on retourne les 7 prochains jours (données vides en pratique)
    const next7 = new Date(today.getTime() + 7 * 24 * 3600_000)
    return { from: fmt(today), to: fmt(next7) }
  }
  // past : 30 derniers jours
  const past30 = new Date(today.getTime() - 30 * 24 * 3600_000)
  return { from: fmt(past30), to: fmt(today) }
}

const PAGE_SIZE = 20

// ─── Composants internes ─────────────────────────────────────────────────────

function SignalDot({ signal }: { signal: string }) {
  return (
    <View style={{
      width          : 16,
      height         : 16,
      borderRadius   : 8,
      backgroundColor: signalColor(signal),
    }} accessibilityLabel={signalLabel(signal)} />
  )
}

function PlayerAvatar({ name }: { name: string | null }) {
  return (
    <View style={styles.avatar}>
      <AureakText style={styles.avatarText}>{getInitials(name)}</AureakText>
    </View>
  )
}

function StatCard({
  label, value, sub, dark,
}: { label: string; value: string; sub?: string; dark?: boolean }) {
  const valueStyle: TextStyle  = dark
    ? { ...styles.statValue, ...styles.statValueDark }
    : styles.statValue
  const labelStyle: TextStyle  = dark
    ? { ...styles.statLabel, ...styles.statLabelDark }
    : styles.statLabel
  const subStyle: TextStyle = dark
    ? { ...styles.statSub, ...styles.statSubDark }
    : styles.statSub
  const cardStyle: ViewStyle = dark
    ? { ...styles.statCard, ...styles.statCardDark }
    : styles.statCard

  return (
    <View style={cardStyle}>
      <AureakText style={valueStyle}>{value}</AureakText>
      <AureakText style={labelStyle}>{label}</AureakText>
      {sub ? <AureakText style={subStyle}>{sub}</AureakText> : null}
    </View>
  )
}

function PlaceholderModule({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.placeholderCard}>
      <AureakText style={styles.placeholderIcon}>{icon}</AureakText>
      <AureakText style={styles.placeholderTitle}>{title}</AureakText>
      <AureakText style={styles.placeholderText}>{description}</AureakText>
    </View>
  )
}

function PlayerSummaryCard({
  name, group, totalEvals, avgScore,
}: { name: string; group: string; totalEvals: number; avgScore: number }) {
  return (
    <View style={styles.playerSummaryCard}>
      <PlayerAvatar name={name} />
      <View style={styles.playerSummaryInfo}>
        <AureakText style={styles.playerSummaryName}>{name}</AureakText>
        <AureakText style={styles.playerSummaryGroup}>{group}</AureakText>
      </View>
      <View style={styles.playerSummaryStats}>
        <AureakText style={styles.playerStatValue}>{totalEvals}</AureakText>
        <AureakText style={styles.playerStatLabel}>évals</AureakText>
      </View>
      <View style={styles.playerSummaryStats}>
        <AureakText style={styles.playerStatValue}>{avgScore.toFixed(1)}/10</AureakText>
        <AureakText style={styles.playerStatLabel}>note moy.</AureakText>
      </View>
    </View>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function EvaluationsPage() {
  const router = useRouter()

  const [scope,          setScope]          = useState<ScopeState>({ scope: 'global' })
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('past')
  const [evalType,       setEvalType]       = useState<EvalType>('badges')
  const [evals,          setEvals]          = useState<EvalRowEnriched[]>([])
  const [loading,        setLoading]        = useState(false)
  const [page,           setPage]           = useState(1)
  const [sortDir,        setSortDir]        = useState<SortDir>('desc')

  // ─── Chargement évaluations ────────────────────────────────────────────────
  const loadEvals = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = getDateRange(temporalFilter)
      const { data } = await listEvaluationsAdmin(from, to)
      // Filtrer par childId si scope joueur
      const filtered = (data ?? []).filter(row => {
        if (scope.scope === 'joueur' && scope.childId) {
          return row.childId === scope.childId
        }
        return true
      })
      setEvals(filtered)
      setPage(1)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[EvaluationsPage] loadEvals error:', err)
    } finally {
      setLoading(false)
    }
  }, [temporalFilter, scope])

  useEffect(() => {
    void loadEvals()
  }, [loadEvals])

  // ─── Stats calculées ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (evals.length === 0) return null

    const scores = evals.map(computeScore)
    const avg    = scores.reduce((s, v) => s + v, 0) / scores.length

    // Évals ce mois (30 derniers jours)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000)
    const evalsThisMonth = evals.filter(e => new Date(e.evalAt) >= thirtyDaysAgo)
    const sessionIdsThisMonth = new Set(evalsThisMonth.map(e => e.sessionId))

    // Évals mois précédent (30–60 jours)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600_000)
    const evalsLastMonth = evals.filter(e => {
      const d = new Date(e.evalAt)
      return d >= sixtyDaysAgo && d < thirtyDaysAgo
    })
    const avgLastMonth = evalsLastMonth.length > 0
      ? evalsLastMonth.map(computeScore).reduce((s, v) => s + v, 0) / evalsLastMonth.length
      : null

    const progression = avgLastMonth !== null && avgLastMonth > 0
      ? ((avg - avgLastMonth) / avgLastMonth) * 100
      : null

    // Top Performer : joueur avec meilleure note moyenne
    const byChild = new Map<string, { name: string | null; scores: number[] }>()
    for (const e of evals) {
      const entry = byChild.get(e.childId) ?? { name: e.childName, scores: [] }
      entry.scores.push(computeScore(e))
      byChild.set(e.childId, entry)
    }
    let topName  = '—'
    let topScore = -Infinity
    for (const [, entry] of byChild.entries()) {
      const avg2 = entry.scores.reduce((s, v) => s + v, 0) / entry.scores.length
      if (avg2 > topScore) {
        topScore = avg2
        topName  = entry.name ?? '—'
      }
    }

    return {
      avg                  : avg,
      avgDisplay           : avg.toFixed(1),
      evalsThisMonth       : evalsThisMonth.length,
      sessionsThisMonth    : sessionIdsThisMonth.size,
      progression,
      topName,
    }
  }, [evals])

  // ─── Tri ──────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...evals].sort((a, b) => {
      const ta = new Date(a.evalAt).getTime()
      const tb = new Date(b.evalAt).getTime()
      return sortDir === 'desc' ? tb - ta : ta - tb
    })
  }, [evals, sortDir])

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ─── Vue Joueur : résumé ──────────────────────────────────────────────────
  const playerSummary = useMemo(() => {
    if (scope.scope !== 'joueur' || !scope.childId || evals.length === 0) return null
    const scores   = evals.map(computeScore)
    const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length
    const name     = evals[0]?.childName ?? 'Joueur'
    return { name, group: '—', totalEvals: evals.length, avgScore }
  }, [scope, evals])

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ActivitesHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Filtres scope + temporels sur une ligne */}
        <View style={styles.filtresRow}>
          <FiltresScope value={scope} onChange={setScope} />
          <PseudoFiltresTemporels value={temporalFilter} onChange={setTemporalFilter} />
        </View>

        {/* Vue Joueur — card résumé */}
        {playerSummary && (
          <View style={styles.section}>
            <PlayerSummaryCard
              name={playerSummary.name}
              group={playerSummary.group}
              totalEvals={playerSummary.totalEvals}
              avgScore={playerSummary.avgScore}
            />
          </View>
        )}

        {/* 4 Stat Cards */}
        <View style={styles.statCardsRow}>
          <StatCard
            label="Moyenne Générale"
            value={stats ? `${stats.avgDisplay}/10` : '—'}
            sub={stats?.progression !== null && stats?.progression !== undefined
              ? `${stats.progression >= 0 ? '↑' : '↓'} ${Math.abs(stats.progression).toFixed(0)}% vs mois préc.`
              : undefined}
          />
          <StatCard
            label="Évals ce mois"
            value={stats ? String(stats.evalsThisMonth) : '—'}
            sub={stats ? `${stats.sessionsThisMonth} séance${stats.sessionsThisMonth > 1 ? 's' : ''} concernée${stats.sessionsThisMonth > 1 ? 's' : ''}` : undefined}
          />
          <StatCard
            label="Progression Technique"
            value={stats?.progression !== null && stats?.progression !== undefined
              ? `${stats.progression >= 0 ? '+' : ''}${stats.progression.toFixed(0)}%`
              : '—'}
            sub={loading ? 'Calcul...' : undefined}
          />
          <StatCard
            label="Top Performer"
            value={stats?.topName ?? '—'}
            dark
          />
        </View>

        {/* Pills sous-filtres Éval Type */}
        <View style={styles.evalTypePills}>
          {(['badges', 'connaissances', 'competences'] as EvalType[]).map(type => {
            const isActive   = type === evalType
            const pillStyle  : ViewStyle  = isActive
              ? { ...styles.evalTypePill, ...styles.evalTypePillActive }
              : styles.evalTypePill
            const pillTxtStyle: TextStyle = isActive
              ? { ...styles.evalTypePillText, ...styles.evalTypePillTextActive }
              : styles.evalTypePillText
            return (
              <Pressable key={type} style={pillStyle} onPress={() => setEvalType(type)}>
                <AureakText style={pillTxtStyle}>{type.toUpperCase()}</AureakText>
              </Pressable>
            )
          })}
        </View>

        {/* Contenu selon sous-filtre */}
        {evalType === 'badges' && (
          <View style={styles.section}>
            {loading ? (
              <View style={styles.loadingRow}>
                <AureakText style={styles.loadingText}>Chargement des évaluations...</AureakText>
              </View>
            ) : paginated.length === 0 ? (
              <View style={styles.emptyRow}>
                <AureakText style={styles.emptyText}>Aucune évaluation sur cette période.</AureakText>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                {/* En-tête tableau */}
                <View style={styles.tableHeader}>
                  <View style={styles.colJoueur}>
                    <AureakText style={styles.colHeader}>JOUEUR</AureakText>
                  </View>
                  <View style={styles.colSeance}>
                    <AureakText style={styles.colHeader}>SÉANCE</AureakText>
                  </View>
                  <Pressable
                    style={styles.colDate}
                    onPress={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  >
                    <AureakText style={styles.colHeader}>
                      DATE {sortDir === 'desc' ? '↓' : '↑'}
                    </AureakText>
                  </Pressable>
                  <View style={[styles.colSignal, { alignItems: 'center' }]}>
                    <AureakText style={styles.colHeader}>RÉCEPTIVITÉ</AureakText>
                  </View>
                  <View style={[styles.colSignal, { alignItems: 'center' }]}>
                    <AureakText style={styles.colHeader}>EFFORT</AureakText>
                  </View>
                  <View style={[styles.colSignal, { alignItems: 'center' }]}>
                    <AureakText style={styles.colHeader}>ATTITUDE</AureakText>
                  </View>
                  <View style={[styles.colTop, { alignItems: 'center' }]}>
                    <AureakText style={styles.colHeader}>TOP</AureakText>
                  </View>
                  <View style={styles.colComment}>
                    <AureakText style={styles.colHeader}>COMMENTAIRE</AureakText>
                  </View>
                </View>

                {/* Lignes tableau */}
                {paginated.map((row, idx) => (
                  <Pressable
                    key={row.id}
                    style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
                    onPress={() => router.push(`/(admin)/seances/${row.sessionId}` as Parameters<typeof router.push>[0])}
                  >
                    {/* Joueur */}
                    <View style={[styles.cell, styles.colJoueur, styles.playerCell]}>
                      <PlayerAvatar name={row.childName} />
                      <View style={styles.playerInfo}>
                        <AureakText style={styles.playerName} numberOfLines={1}>
                          {row.childName ?? 'Joueur inconnu'}
                        </AureakText>
                      </View>
                    </View>

                    {/* Séance */}
                    <View style={[styles.cell, styles.colSeance]}>
                      <AureakText style={styles.cellText} numberOfLines={1}>
                        {row.sessionName ?? row.sessionId.slice(0, 8) + '…'}
                      </AureakText>
                    </View>

                    {/* Date */}
                    <View style={[styles.cell, styles.colDate]}>
                      <AureakText style={styles.cellText}>{formatDate(row.evalAt)}</AureakText>
                    </View>

                    {/* Réceptivité */}
                    <View style={[styles.cell, styles.colSignal, { alignItems: 'center' }]}>
                      <SignalDot signal={row.receptivite} />
                    </View>

                    {/* Effort */}
                    <View style={[styles.cell, styles.colSignal, { alignItems: 'center' }]}>
                      <SignalDot signal={row.goutEffort} />
                    </View>

                    {/* Attitude */}
                    <View style={[styles.cell, styles.colSignal, { alignItems: 'center' }]}>
                      <SignalDot signal={row.attitude} />
                    </View>

                    {/* Top Séance */}
                    <View style={[styles.cell, styles.colTop, { alignItems: 'center' }]}>
                      {(row as AdminEvalRow).topSeance ? (
                        <AureakText style={styles.starIcon}>⭐</AureakText>
                      ) : null}
                    </View>

                    {/* Commentaire */}
                    <View style={[styles.cell, styles.colComment]}>
                      <AureakText style={styles.commentText} numberOfLines={2}>
                        —
                      </AureakText>
                    </View>
                  </Pressable>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <View style={styles.pagination}>
                    <Pressable
                      style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                      onPress={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <AureakText style={styles.pageBtnText}>← Préc.</AureakText>
                    </Pressable>
                    <AureakText style={styles.pageInfo}>
                      Page {page} / {totalPages}
                    </AureakText>
                    <Pressable
                      style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                      onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <AureakText style={styles.pageBtnText}>Suiv. →</AureakText>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {evalType === 'connaissances' && (
          <View style={styles.section}>
            <PlaceholderModule
              icon="📚"
              title="Module Connaissances"
              description="disponible prochainement. Les évaluations de connaissances seront liées aux thèmes pédagogiques des séances."
            />
          </View>
        )}

        {evalType === 'competences' && (
          <View style={styles.section}>
            <PlaceholderModule
              icon="🎯"
              title="Module Compétences"
              description="disponible prochainement. Les évaluations de compétences seront liées au référentiel technique gardien."
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop   : space.md,
    paddingBottom: space.xxl,
  },
  filtresRow: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    zIndex           : 9999,
  },
  section: {
    paddingHorizontal: space.lg,
    marginBottom     : space.lg,
  },

  // ── Stat Cards ────────────────────────────────────────────────────────────
  statCardsRow: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    marginBottom     : space.lg,
    flexWrap         : 'wrap',
  },
  statCard: {
    flex             : 1,
    minWidth         : 160,
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.card,
    padding          : space.md,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  statCardDark: {
    backgroundColor: colors.dark.surface,
    borderColor    : colors.dark.surface,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize  : 24,
    fontWeight: '700',
    color     : colors.text.dark,
    marginBottom: 4,
  },
  statValueDark: {
    color: colors.accent.gold,
  },
  statLabel: {
    fontFamily: fonts.display,
    fontSize  : 11,
    fontWeight: '600',
    color     : colors.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  statLabelDark: {
    color: colors.text.secondary,
  },
  statSub: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.subtle,
    marginTop : 4,
  },
  statSubDark: {
    color: colors.accent.gold,
  },

  // ── Eval Type Pills ───────────────────────────────────────────────────────
  evalTypePills: {
    flexDirection    : 'row',
    gap              : space.sm,
    paddingHorizontal: space.lg,
    marginBottom     : space.md,
  },
  evalTypePill: {
    paddingHorizontal: 14,
    paddingVertical  : 5,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
    backgroundColor  : 'transparent',
  },
  evalTypePillActive: {
    backgroundColor: colors.accent.gold,
  },
  evalTypePillText: {
    fontFamily   : fonts.display,
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.accent.gold,
  },
  evalTypePillTextActive: {
    color: colors.text.dark,
  },

  // ── Tableau évaluations ───────────────────────────────────────────────────
  tableContainer: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : colors.light.elevated,
    paddingVertical  : 10,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  colHeader: {
    fontFamily   : fonts.display,
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingVertical  : 10,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  tableRowAlt: {
    backgroundColor: colors.light.muted,
  },
  cell: {
    justifyContent: 'center',
  },

  // Colonnes (largeurs)
  colJoueur : { flex: 2, minWidth: 120 },
  colSeance : { flex: 2, minWidth: 120 },
  colDate   : { flex: 1, minWidth: 80  },
  colSignal : { flex: 1, minWidth: 60, alignItems: 'center' },
  colTop    : { width: 40, alignItems: 'center' },
  colComment: { flex: 2, minWidth: 120 },

  // Cellule joueur
  playerCell: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  cellText: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  commentText: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
    fontStyle : 'italic',
  },
  starIcon: {
    fontSize: 14,
  },

  // Avatar joueur
  avatar: {
    width          : 32,
    height         : 32,
    borderRadius   : 16,
    backgroundColor: colors.accent.goldLight,
    justifyContent : 'center',
    alignItems     : 'center',
    flexShrink     : 0,
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize  : 11,
    fontWeight: '700',
    color     : colors.text.dark,
  },

  // ── Pagination ────────────────────────────────────────────────────────────
  pagination: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'center',
    gap            : space.md,
    paddingVertical: space.md,
  },
  pageBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  pageInfo: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },

  // ── Loading / Empty ───────────────────────────────────────────────────────
  loadingRow: {
    paddingVertical: space.xl,
    alignItems     : 'center',
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
  },
  emptyRow: {
    paddingVertical: space.xl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
  },

  // ── Placeholder Modules ───────────────────────────────────────────────────
  placeholderCard: {
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    padding          : space.xl,
    alignItems       : 'center',
    justifyContent   : 'center',
    gap              : space.md,
  },
  placeholderIcon: {
    fontSize  : 48,
    lineHeight: 56,
    textAlign : 'center',
  },
  placeholderTitle: {
    fontFamily: fonts.display,
    fontSize  : 18,
    fontWeight: '700',
    color     : colors.text.dark,
    textAlign : 'center',
  },
  placeholderText: {
    fontFamily: fonts.body,
    fontSize  : 14,
    color     : colors.text.muted,
    textAlign : 'center',
    maxWidth  : 480,
    lineHeight: 20,
  },

  // ── Vue Joueur — card résumé ──────────────────────────────────────────────
  playerSummaryCard: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.md,
    backgroundColor: colors.light.surface,
    borderRadius   : 16,
    borderWidth    : 1,
    borderColor    : colors.border.goldSolid,
    padding        : space.md,
    marginBottom   : space.md,
  },
  playerSummaryInfo: {
    flex: 1,
  },
  playerSummaryName: {
    fontFamily: fonts.display,
    fontSize  : 16,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  playerSummaryGroup: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
    marginTop : 2,
  },
  playerSummaryStats: {
    alignItems: 'center',
    minWidth  : 64,
  },
  playerStatValue: {
    fontFamily: fonts.mono,
    fontSize  : 16,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  playerStatLabel: {
    fontFamily: fonts.body,
    fontSize  : 10,
    color     : colors.text.muted,
    marginTop : 2,
  },
})
