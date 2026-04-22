'use client'
// Story 97.10 — AdminPageHeader v2 (titre = typeLabel) + EvenementsHeader tabs
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, fonts, shadows } from '@aureak/theme'
import { listEvents } from '@aureak/api-client'
import type { StageWithMeta } from '@aureak/types'
import type { EventType } from '@aureak/types'

import { AdminPageHeader }          from '../AdminPageHeader'
import { EvenementsHeader }         from './EvenementsHeader'
import { PseudoFiltresTemporels }   from '../activites/PseudoFiltresTemporels'
import type { TemporalFilter }      from '../activites/PseudoFiltresTemporels'

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day   = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year  = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} → ${formatDate(end)}`
}

function statusColor(status: string): string {
  switch (status) {
    case 'en_cours'  : return colors.status.success
    case 'planifié'  : return colors.status.attention
    case 'terminé'   : return colors.text.muted
    case 'annulé'    : return colors.status.absent
    default          : return colors.text.muted
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'en_cours'  : return 'En cours'
    case 'planifié'  : return 'Planifié'
    case 'terminé'   : return 'Terminé'
    case 'annulé'    : return 'Annulé'
    default          : return status
  }
}

function getDateRange(filter: TemporalFilter): { from: Date; to: Date } {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (filter === 'today') {
    const tomorrow = new Date(today.getTime() + 24 * 3600_000)
    return { from: today, to: tomorrow }
  }
  if (filter === 'upcoming') {
    const future = new Date(today.getTime() + 365 * 24 * 3600_000)
    return { from: today, to: future }
  }
  const pastYear = new Date(today.getTime() - 365 * 24 * 3600_000)
  return { from: pastYear, to: today }
}

const PAGE_SIZE = 20

// ─── Composants internes ─────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, dark,
}: {
  label: string; value: string; sub?: string; icon?: string; dark?: boolean
}) {
  const valueStyle: TextStyle = dark
    ? { ...styles.statValue, ...styles.statValueDark }
    : styles.statValue
  const labelStyle: TextStyle = dark
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
      {sub ? <AureakText style={subStyle}>{sub}</AureakText> : null}
    </View>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <View style={{
      paddingHorizontal: 8,
      paddingVertical  : 3,
      borderRadius     : 999,
      backgroundColor  : statusColor(status) + '18',
    }}>
      <AureakText style={{
        fontSize  : 11,
        fontWeight: '600',
        fontFamily: fonts.body,
        color     : statusColor(status),
      }}>
        {statusLabel(status)}
      </AureakText>
    </View>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  eventType    : EventType
  typeLabel    : string
  actionLabel? : string
  onActionPress?: () => void
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function EvenementsContent({ eventType, typeLabel, actionLabel, onActionPress }: Props) {
  const router = useRouter()

  const [events,         setEvents]         = useState<StageWithMeta[]>([])
  const [loading,        setLoading]        = useState(false)
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('upcoming')
  const [page,           setPage]           = useState(1)

  // ─── Chargement ───────────────────────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listEvents({ type: eventType })
      setEvents(data)
      setPage(1)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error(`[EvenementsContent:${eventType}] loadEvents error:`, err)
    } finally {
      setLoading(false)
    }
  }, [eventType])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  // ─── Filtrage temporel ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const { from, to } = getDateRange(temporalFilter)
    return events.filter(e => {
      const start = new Date(e.startDate)
      return start >= from && start < to
    })
  }, [events, temporalFilter])

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total      = filtered.length
    const upcoming   = filtered.filter(e => e.status === 'planifié').length
    const inProgress = filtered.filter(e => e.status === 'en_cours').length
    const done       = filtered.filter(e => e.status === 'terminé').length
    const cancelled  = filtered.filter(e => e.status === 'annulé').length
    const totalParticipants = filtered.reduce((acc, e) => acc + e.participantCount, 0)
    const totalDays  = filtered.reduce((acc, e) => acc + e.dayCount, 0)

    return { total, upcoming, inProgress, done, cancelled, totalParticipants, totalDays }
  }, [filtered])

  // ─── Tri ──────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )
  }, [filtered])

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Story 97.10 — AdminPageHeader v2 (titre = typeLabel) */}
      <AdminPageHeader
        title={typeLabel}
        actionButton={actionLabel && onActionPress ? { label: actionLabel, onPress: onActionPress } : undefined}
      />
      <EvenementsHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 4 Stat Cards */}
        <View style={styles.statCardsRow}>
          <StatCard
            icon="📅"
            label={`TOTAL ${typeLabel.toUpperCase()}`}
            value={String(stats.total)}
            sub={`${stats.upcoming} planifié${stats.upcoming > 1 ? 's' : ''}`}
          />
          <StatCard
            icon="🟢"
            label="EN COURS"
            value={String(stats.inProgress)}
            sub={`${stats.done} terminé${stats.done > 1 ? 's' : ''}`}
          />
          <StatCard
            icon="⚠️"
            label="ANNULÉS"
            value={String(stats.cancelled)}
            sub={`sur ${stats.total}`}
          />
          <StatCard
            icon="👥"
            label="PARTICIPANTS"
            value={String(stats.totalParticipants)}
            sub={`${stats.totalDays} jour${stats.totalDays > 1 ? 's' : ''} au total`}
            dark
          />
        </View>

        {/* Filtres temporels */}
        <View style={styles.filtresRow}>
          <View />
          <PseudoFiltresTemporels value={temporalFilter} onChange={setTemporalFilter} />
        </View>

        {/* Tableau */}
        {loading ? (
          <View style={styles.loadingWrapper}>
            <AureakText style={styles.loadingText}>Chargement...</AureakText>
          </View>
        ) : paginated.length === 0 ? (
          <View style={styles.emptyRow}>
            <AureakText style={styles.emptyIcon}>📅</AureakText>
            <AureakText style={styles.emptyTitle}>Aucun {typeLabel.toLowerCase()}</AureakText>
            <AureakText style={styles.emptyText}>Aucun {typeLabel.toLowerCase()} sur cette période.</AureakText>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* En-tête */}
            <View style={styles.tableHeader}>
              <View style={styles.colName}>
                <AureakText style={styles.colHeaderText}>NOM</AureakText>
              </View>
              <View style={styles.colDates}>
                <AureakText style={styles.colHeaderText}>DATES</AureakText>
              </View>
              <View style={styles.colLocation}>
                <AureakText style={styles.colHeaderText}>LIEU</AureakText>
              </View>
              <View style={styles.colDays}>
                <AureakText style={styles.colHeaderText}>JOURS</AureakText>
              </View>
              <View style={styles.colParticipants}>
                <AureakText style={styles.colHeaderText}>PARTICIPANTS</AureakText>
              </View>
              <View style={styles.colStatus}>
                <AureakText style={styles.colHeaderText}>STATUT</AureakText>
              </View>
            </View>

            {/* Lignes */}
            {paginated.map((row, idx) => (
              <Pressable
                key={row.id}
                style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
                onPress={() => router.push(`/evenements/stages/${row.id}` as Parameters<typeof router.push>[0])}
              >
                <View style={[styles.cell, styles.colName]}>
                  <AureakText style={styles.nameText} numberOfLines={1}>{row.name}</AureakText>
                  {row.implantationName && (
                    <AureakText style={styles.subtitleText} numberOfLines={1}>
                      {row.implantationName}
                    </AureakText>
                  )}
                </View>

                <View style={[styles.cell, styles.colDates]}>
                  <AureakText style={styles.cellText}>
                    {formatDateRange(row.startDate, row.endDate)}
                  </AureakText>
                </View>

                <View style={[styles.cell, styles.colLocation]}>
                  <AureakText style={styles.cellText} numberOfLines={1}>
                    {row.location ?? '—'}
                  </AureakText>
                </View>

                <View style={[styles.cell, styles.colDays]}>
                  <AureakText style={styles.cellTextMono}>
                    {row.dayCount}
                  </AureakText>
                </View>

                <View style={[styles.cell, styles.colParticipants]}>
                  <AureakText style={styles.cellTextMono}>
                    {row.participantCount}{row.maxParticipants ? `/${row.maxParticipants}` : ''}
                  </AureakText>
                </View>

                <View style={[styles.cell, styles.colStatus]}>
                  <StatusBadge status={row.status} />
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
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scrollContent: {
    paddingTop      : space.md,
    paddingBottom   : space.xxl,
    backgroundColor : colors.light.primary,
  },
  filtresRow: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    zIndex           : 9999,
  },

  // ── Stat Cards ────────────────────────────────────────────────────────────
  statCardsRow: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
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
    // @ts-ignore web shadow
    boxShadow      : shadows.sm,
  },
  statCardDark: {
    backgroundColor: colors.accent.goldDark,
    borderWidth    : 0,
  },
  statValue: {
    fontFamily  : fonts.display,
    fontSize    : 28,
    fontWeight  : '900',
    color       : colors.text.dark,
    lineHeight  : 36,
    marginBottom: 4,
  },
  statValueDark: {
    color: colors.accent.goldPale,
  },
  statLabel: {
    fontFamily   : fonts.heading,
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom : 4,
  },
  statLabelDark: {
    color: colors.accent.goldPale,
  },
  statSub: {
    fontFamily: fonts.body,
    fontSize  : 11,
    color     : colors.text.muted,
    marginTop : 4,
  },
  statSubDark: {
    color: colors.accent.goldPale,
  },
  statIcon: {
    fontSize    : 22,
    marginBottom: 4,
  },
  statIconLight: {
    fontSize    : 22,
    marginBottom: 4,
    color       : colors.accent.goldPale,
  },

  // ── Tableau ───────────────────────────────────────────────────────────────
  tableContainer: {
    marginHorizontal: space.lg,
    marginBottom    : space.lg,
    backgroundColor : colors.light.surface,
    borderRadius    : 10,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
    overflow        : 'hidden',
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
  colHeaderText: {
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

  // Colonnes
  colName         : { flex: 2, minWidth: 140 },
  colDates        : { flex: 2, minWidth: 160 },
  colLocation     : { flex: 1, minWidth: 100 },
  colDays         : { flex: 0.5, minWidth: 60, alignItems: 'center' as const },
  colParticipants : { flex: 1, minWidth: 80, alignItems: 'center' as const },
  colStatus       : { flex: 1, minWidth: 90, alignItems: 'center' as const },

  nameText: {
    fontFamily: fonts.body,
    fontSize  : 14,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  subtitleText: {
    fontFamily: fonts.body,
    fontSize  : 10,
    color     : colors.text.muted,
    marginTop : 1,
  },
  cellText: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.muted,
  },
  cellTextMono: {
    fontFamily: fonts.mono,
    fontSize  : 13,
    fontWeight: '700',
    color     : colors.text.dark,
  },

  // ── Pagination ────────────────────────────────────────────────────────────
  pagination: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
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
  loadingWrapper: {
    padding   : space.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize  : 14,
    color     : colors.text.muted,
  },
  emptyRow: {
    marginHorizontal : space.lg,
    marginBottom     : space.lg,
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
})
