'use client'
// Story 65-3 — Activités Hub : onglet Évaluations (vue transversale, 3 sous-filtres)
import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react'
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, fonts, shadows } from '@aureak/theme'
import {
  listEvaluationsAdmin,
} from '@aureak/api-client'
import type { AdminEvalRow } from '@aureak/api-client'

import { ActivitesCountsContext } from '../_layout'
import { ActivitesHeader }        from '../../../../components/admin/activites/ActivitesHeader'
import { FiltresScope }           from '../../../../components/admin/activites/FiltresScope'
import { PrimaryAction }          from '../../../../components/admin/PrimaryAction'
import type { ScopeState }        from '../../../../components/admin/activites/FiltresScope'
import type { TemporalFilter }    from '../../../../components/admin/activites/PseudoFiltresTemporels'

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
 * Retourne la couleur token selon le score numérique 0–10.
 */
function noteColor(score: number): string {
  if (score >= 7) return colors.status.success
  if (score >= 5) return colors.status.attention
  return colors.status.absent
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

// Cercle distinctif pour Note K (gold) et Note C (gris)
// Couleurs non tokénisées documentées ici en attendant extension de @aureak/theme
function NoteCircle({ score, variant }: { score: number; variant: 'K' | 'C' }) {
  const isK = variant === 'K'
  return (
    <View style={{
      width          : 40,
      height         : 40,
      borderRadius   : 20,
      borderWidth    : isK ? 2 : 1,
      borderColor    : isK ? colors.accent.gold : colors.border.divider,
      justifyContent : 'center',
      alignItems     : 'center',
      backgroundColor: 'transparent',
    }}>
      <AureakText style={{
        fontFamily: fonts.body,
        fontSize  : 14,
        fontWeight: '700',
        color     : isK ? colors.accent.goldDark : colors.text.dark, // gold dark / text dark
        lineHeight: 18,
      }}>
        {Math.round(score)}
      </AureakText>
    </View>
  )
}

// Avatar carré arrondi Figma — 40×40 borderRadius:12, fond elevated, initiales
function PlayerAvatar({ name }: { name: string | null }) {
  return (
    <View style={styles.avatar}>
      <AureakText style={styles.avatarText}>{getInitials(name)}</AureakText>
    </View>
  )
}

function StatCard({
  label, value, sub, icon, dark, badge, badgeColor, valueColor,
}: {
  label: string; value: string; sub?: string; icon?: string; dark?: boolean;
  badge?: string; badgeColor?: string; valueColor?: string;
}) {
  const valueStyle: TextStyle  = {
    ...(dark ? { ...styles.statValue, ...styles.statValueDark } : styles.statValue),
    ...(valueColor ? { color: valueColor } : {}),
  }
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
      {icon ? <AureakText style={dark ? styles.statIconLight : styles.statIcon}>{icon}</AureakText> : null}
      <AureakText style={labelStyle}>{label}</AureakText>
      <AureakText style={valueStyle}>{value}</AureakText>
      {badge ? (
        <View style={{ ...styles.statBadge, backgroundColor: badgeColor ?? colors.status.success }}>
          <AureakText style={styles.statBadgeText}>{badge}</AureakText>
        </View>
      ) : null}
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
  const router        = useRouter()
  const activitesCnts = useContext(ActivitesCountsContext)
  const { width }     = useWindowDimensions()
  const isMobile      = width <= 640

  const [scope,          setScope]          = useState<ScopeState>({ scope: 'global' })
  const [temporalFilter]                    = useState<TemporalFilter>('past')
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
      <ActivitesHeader counts={activitesCnts ?? undefined} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Vue Joueur — card résumé (scope joueur uniquement) */}
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

        {/* Filtres scope + toggle evalType sur une ligne (stack mobile) */}
        <View style={[styles.filtresRow, isMobile && styles.filtresRowMobile]}>
          <FiltresScope value={scope} onChange={setScope} />
          <View style={styles.toggleRow}>
            {(['badges', 'connaissances', 'competences'] as EvalType[]).map(type => {
              const isActive = type === evalType
              const label = type === 'badges' ? 'Badges' : type === 'connaissances' ? 'Connaissances' : 'Compétences'
              return (
                <Pressable
                  key={type}
                  onPress={() => setEvalType(type)}
                  style={[styles.toggleBtn, isActive && styles.toggleBtnActive] as never}
                >
                  <AureakText style={[styles.toggleLabel, isActive && styles.toggleLabelActive] as never}>
                    {label}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>
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
                <AureakText style={styles.emptyIcon}>📋</AureakText>
                <AureakText style={styles.emptyTitle}>Aucune évaluation</AureakText>
                <AureakText style={styles.emptyText}>Aucune évaluation sur cette période.</AureakText>
              </View>
            ) : isMobile ? (
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View style={[styles.tableContainer, { minWidth: 640 }]}>
                  {/* En-tête tableau (scrollable mobile) */}
                  <View style={styles.tableHeader}>
                    <View style={styles.colJoueur}>
                      <AureakText style={styles.colHeader}>JOUEUR</AureakText>
                    </View>
                    <Pressable
                      style={styles.colDate}
                      onPress={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                    >
                      <AureakText style={styles.colHeader}>
                        DATE {sortDir === 'desc' ? '↓' : '↑'}
                      </AureakText>
                    </Pressable>
                    <View style={styles.colSignal}>
                      <AureakText style={styles.colHeader}>NOTE K</AureakText>
                    </View>
                    <View style={styles.colSignal}>
                      <AureakText style={styles.colHeader}>NOTE C</AureakText>
                    </View>
                    <View style={styles.colComment}>
                      <AureakText style={styles.colHeader}>COMMENTAIRE</AureakText>
                    </View>
                  </View>
                  {paginated.map((row, idx) => (
                    <Pressable
                      key={row.id}
                      style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
                      onPress={() => router.push(`/(admin)/seances/${row.sessionId}` as Parameters<typeof router.push>[0])}
                    >
                      <View style={[styles.cell, styles.colJoueur, styles.playerCell]}>
                        <PlayerAvatar name={row.childName} />
                        <View style={styles.playerInfo}>
                          <AureakText style={styles.playerName} numberOfLines={1}>
                            {row.childName ?? 'Joueur inconnu'}
                          </AureakText>
                          {row.groupName ? (
                            <AureakText style={styles.playerSubtitle} numberOfLines={1}>
                              {row.groupName}
                            </AureakText>
                          ) : null}
                        </View>
                      </View>
                      <View style={[styles.cell, styles.colDate]}>
                        <AureakText style={styles.cellText}>{formatDate(row.evalAt)}</AureakText>
                      </View>
                      <View style={[styles.cell, styles.colSignal]}>
                        <NoteCircle score={signalToScore(row.receptivite)} variant="K" />
                      </View>
                      <View style={[styles.cell, styles.colSignal]}>
                        <NoteCircle score={signalToScore(row.goutEffort)} variant="C" />
                      </View>
                      <View style={[styles.cell, styles.colComment]}>
                        <AureakText style={styles.commentText} numberOfLines={1}>
                          {truncate((row as AdminEvalRow & { comment?: string }).comment ?? null, 40)}
                        </AureakText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.tableContainer}>
                {/* En-tête tableau */}
                <View style={styles.tableHeader}>
                  <View style={styles.colJoueur}>
                    <AureakText style={styles.colHeader}>JOUEUR</AureakText>
                  </View>
                  <Pressable
                    style={styles.colDate}
                    onPress={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  >
                    <AureakText style={styles.colHeader}>
                      DATE {sortDir === 'desc' ? '↓' : '↑'}
                    </AureakText>
                  </Pressable>
                  <View style={styles.colSignal}>
                    <AureakText style={styles.colHeader}>NOTE K</AureakText>
                  </View>
                  <View style={styles.colSignal}>
                    <AureakText style={styles.colHeader}>NOTE C</AureakText>
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
                        {row.groupName ? (
                          <AureakText style={styles.playerSubtitle} numberOfLines={1}>
                            {row.groupName}
                          </AureakText>
                        ) : (row as AdminEvalRow).topSeance ? (
                          <AureakText style={{ fontSize: 10, color: colors.accent.gold, fontFamily: fonts.body, fontWeight: '700' }}>⭐ Top séance</AureakText>
                        ) : null}
                      </View>
                    </View>

                    {/* Date */}
                    <View style={[styles.cell, styles.colDate]}>
                      <AureakText style={styles.cellText}>{formatDate(row.evalAt)}</AureakText>
                    </View>

                    {/* NOTE K — réceptivité (NoteCircle gold) */}
                    <View style={[styles.cell, styles.colSignal]}>
                      <NoteCircle score={signalToScore(row.receptivite)} variant="K" />
                    </View>

                    {/* NOTE C — goût d'effort (NoteCircle gris) */}
                    <View style={[styles.cell, styles.colSignal]}>
                      <NoteCircle score={signalToScore(row.goutEffort)} variant="C" />
                    </View>

                    {/* Commentaire */}
                    <View style={[styles.cell, styles.colComment]}>
                      <AureakText style={styles.commentText} numberOfLines={1}>
                        {truncate((row as AdminEvalRow & { comment?: string }).comment ?? null, 50)}
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

      <PrimaryAction
        label="Nouvelle évaluation"
        onPress={() => router.push('/activites/evaluations/new' as never)}
      />
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
    paddingTop      : space.md,
    paddingBottom   : space.xxl,
    gap             : space.md,
    backgroundColor : colors.light.primary,
  },
  filtresRow: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
    zIndex           : 9999,
  },
  filtresRowMobile: {
    flexDirection    : 'column',
    alignItems       : 'stretch',
    gap              : space.sm,
    paddingHorizontal: space.md,
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
    flex           : 1,
    minWidth       : 160,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore web shadow
    boxShadow      : shadows.sm,
  },
  statCardDark: {
    backgroundColor: colors.accent.goldDark,
    borderColor    : colors.accent.goldDark,
  },
  statBadge: {
    alignSelf        : 'flex-start',
    paddingHorizontal: 6,
    paddingVertical  : 2,
    borderRadius     : 4,
    marginTop        : 4,
  },
  statBadgeText: {
    fontFamily: fonts.body,
    fontSize  : 10,
    fontWeight: '700',
    color     : colors.text.primary,
  },
  statValue: {
    fontFamily  : fonts.body,
    fontSize    : 28,
    fontWeight  : '900',
    color       : colors.text.dark,
    lineHeight  : 36,
    marginBottom: 4,
  },
  statValueDark: {
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily   : fonts.body,
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom : 4,
  },
  statLabelDark: {
    fontFamily   : fonts.body,
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.accent.goldLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom : 4,
  },
  statSub: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.subtle,
    marginTop : 4,
  },
  statSubDark: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.primary + '99',
    marginTop : 4,
  },
  statIcon: {
    fontSize    : 22,
    marginBottom: 4,
  },
  statIconLight: {
    fontSize    : 22,
    marginBottom: 4,
    color       : colors.text.primary,
  },

  // ── Eval Type SegmentedToggle (aligné sur SeancesPage.timeToggle) ──────────
  toggleRow: {
    flexDirection  : 'row',
    gap            : 4,
    alignSelf      : 'flex-start',
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    padding        : 3,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical  : 5,
    borderRadius     : radius.xs - 2,
    borderWidth      : 1,
    borderColor      : 'transparent',
  },
  toggleBtnActive: {
    backgroundColor: colors.light.surface,
    borderColor    : colors.border.divider,
  },
  toggleLabel: {
    fontSize  : 12,
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  toggleLabelActive: {
    color     : colors.text.dark,
    fontWeight: '600',
  },

  // ── Tableau évaluations ───────────────────────────────────────────────────
  tableContainer: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : colors.light.muted,
    paddingVertical  : 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  colHeader: {
    fontFamily   : fonts.display,
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    minHeight        : 52,
    paddingHorizontal: 16,
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
    fontSize  : 14,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  cellText: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  noteValue: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '700',
  },
  commentText: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  starIcon: {
    fontSize: 14,
  },

  // Avatar joueur — carré arrondi Figma 40×40, fond elevated, initiales Montserrat Bold 14px
  avatar: {
    width          : 40,
    height         : 40,
    borderRadius   : 12,
    backgroundColor: colors.light.elevated,  // #f1ede5
    justifyContent : 'center',
    alignItems     : 'center',
    flexShrink     : 0,
  },
  avatarText: {
    fontFamily: fonts.body,
    fontSize  : 14,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  playerSubtitle: {
    fontFamily: fonts.body,
    fontSize  : 10,
    color     : colors.text.muted,
    marginTop : 1,
  },

  // ── Pagination ────────────────────────────────────────────────────────────
  pagination: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'center',
    gap            : space.md,
    paddingVertical: space.md,
    backgroundColor: colors.light.muted,
    borderTopWidth : 1,
    borderTopColor : colors.border.divider,
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
    paddingVertical  : space.xxl,
    paddingHorizontal: space.lg,
    alignItems       : 'center',
    gap              : space.sm,
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  emptyIcon: {
    fontSize  : 32,
    lineHeight: 40,
    textAlign : 'center',
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize  : 15,
    fontWeight: '700' as const,
    color     : colors.text.dark,
    textAlign : 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
    textAlign : 'center',
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
