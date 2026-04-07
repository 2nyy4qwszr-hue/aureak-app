'use client'
// Story 65-2 — Activités Hub : onglet Présences (vue transversale)
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, fonts } from '@aureak/theme'
import {
  listAllGroups,
  listGroupsByImplantation,
  listGroupMembersWithProfiles,
  listAttendancesBySession,
  listSessionsWithAttendance,
  listAttendancesByChild,
  getChildDirectoryEntry,
} from '@aureak/api-client'
import type { GroupWithMeta, GroupMemberWithName, ChildDirectoryEntry } from '@aureak/types'
import type { SessionAttendanceSummary, AttendanceHistoryRow } from '@aureak/api-client'

import { ActivitesHeader }        from '../components/ActivitesHeader'
import { FiltresScope }           from '../components/FiltresScope'
import { PseudoFiltresTemporels } from '../components/PseudoFiltresTemporels'
import type { ScopeState }        from '../components/FiltresScope'
import type { TemporalFilter }    from '../components/PseudoFiltresTemporels'
import type { AttendanceStatus }  from '@aureak/types'

// ─── Types internes ───────────────────────────────────────────────────────────

type AttendanceRow = {
  sessionId: string
  childId  : string
  status   : AttendanceStatus
}

type GroupPresenceRow = {
  groupId        : string
  groupName      : string
  implantationName: string
  sessions       : { sessionId: string; date: string; rate: number }[]
  avgRate        : number
}

type PlayerHeatmapRow = {
  childId    : string
  displayName: string
  statuses   : (AttendanceStatus | null)[]
  rate       : number
  isAtRisk   : boolean
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatSessionDate(iso: string): string {
  const d = new Date(iso)
  const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
  const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function isAtRisk(statuses: (AttendanceStatus | null)[]): boolean {
  const lastThree = statuses.slice(-3)
  return lastThree.filter(s => s === 'absent').length >= 2
}

function getCellStyle(rate: number): { bg: string; text: string } {
  if (rate >= 80) return { bg: colors.status.successBg,  text: colors.status.successText }
  if (rate >= 60) return { bg: colors.status.orangeBg,   text: colors.status.orangeText  }
  return               { bg: colors.status.errorBg,    text: colors.status.errorText   }
}

function getDotColor(status: AttendanceStatus | null): string {
  switch (status) {
    case 'present' : return colors.status.present
    case 'absent'  : return colors.status.absent
    case 'late'    : return colors.status.attention
    case 'injured' : return colors.status.injured
    default        : return colors.status.neutral
  }
}

const PAGE_SIZE = 10

// ─── Stat Cards ───────────────────────────────────────────────────────────────

type StatCardsProps = {
  sessions: SessionAttendanceSummary[]
}

function StatCardsPresences({ sessions }: StatCardsProps) {
  const stats = useMemo(() => {
    const totalSessions = sessions.length

    // Taux moyen global
    let totalPresent = 0, totalAll = 0
    for (const s of sessions) {
      totalPresent += s.presentCount + s.lateCount
      totalAll     += s.totalAttendance
    }
    const avgRate = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0

    // Groupes sous 70% — calculé sur la moyenne par groupe
    const groupMap = new Map<string, { present: number; total: number }>()
    for (const s of sessions) {
      const g = groupMap.get(s.groupId) ?? { present: 0, total: 0 }
      g.present += s.presentCount + s.lateCount
      g.total   += s.totalAttendance
      groupMap.set(s.groupId, g)
    }
    let groupsUnder70 = 0
    for (const [, g] of groupMap) {
      const r = g.total > 0 ? (g.present / g.total) * 100 : 0
      if (r < 70) groupsUnder70++
    }

    // Tendance : compare moyenne des 3 dernières séances vs moyenne globale
    let trend = 0
    if (sessions.length >= 2) {
      const sorted   = [...sessions].sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime())
      const recent   = sorted.slice(-3)
      let rP = 0, rT = 0
      for (const s of recent) { rP += s.presentCount + s.lateCount; rT += s.totalAttendance }
      const recentRate = rT > 0 ? (rP / rT) * 100 : 0
      trend = parseFloat((recentRate - avgRate).toFixed(1))
    }

    return { avgRate, groupsUnder70, totalSessions, implantationsCount: groupMap.size, trend }
  }, [sessions])

  const trendPositive = stats.trend >= 0
  const trendDisplay  = `${trendPositive ? '+' : ''}${stats.trend}`

  return (
    <View style={cardStyles.row}>
      {/* Card 1 — Présence Générale */}
      <View style={[cardStyles.card, { flex: 1 }]}>
        <AureakText style={cardStyles.statIcon}>📊</AureakText>
        <AureakText style={cardStyles.cardLabel}>Présence Générale</AureakText>
        <AureakText style={cardStyles.cardStat}>{stats.avgRate} %</AureakText>
        <View style={cardStyles.progressTrack}>
          <View style={[cardStyles.progressFill, { width: `${Math.min(stats.avgRate, 100)}%` as unknown as number }]} />
        </View>
      </View>

      {/* Card 2 — Groupes sous 70% */}
      <View style={[cardStyles.card, { flex: 1 }]}>
        <AureakText style={cardStyles.statIcon}>👥</AureakText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <AureakText style={cardStyles.cardLabel}>Groupes sous 70%</AureakText>
          {stats.groupsUnder70 > 0 && (
            <View style={cardStyles.badgeRed}>
              <AureakText style={cardStyles.badgeRedText}>!</AureakText>
            </View>
          )}
        </View>
        <AureakText style={cardStyles.cardStat}>{stats.groupsUnder70}</AureakText>
        <AureakText style={cardStyles.cardSub}>
          {stats.implantationsCount} groupe{stats.implantationsCount > 1 ? 's' : ''} suivis
        </AureakText>
      </View>

      {/* Card 3 — Total Séances */}
      <View style={[cardStyles.card, { flex: 1 }]}>
        <AureakText style={cardStyles.statIcon}>📅</AureakText>
        <AureakText style={cardStyles.cardLabel}>Total Séances</AureakText>
        <AureakText style={cardStyles.cardStat}>{stats.totalSessions}</AureakText>
        <AureakText style={cardStyles.cardSub}>Période sélectionnée</AureakText>
      </View>

      {/* Card 4 — Tendance Global (fond dark) */}
      <View style={[cardStyles.card, cardStyles.cardDark, { flex: 1 }]}>
        <AureakText style={cardStyles.statIconLight}>↗</AureakText>
        <AureakText style={cardStyles.cardLabelDark}>Tendance Global</AureakText>
        <AureakText style={{ ...(cardStyles.cardStatGold as object), color: trendPositive ? colors.status.present : colors.status.absent } as import('react-native').TextStyle}>
          {stats.totalSessions >= 2 ? trendDisplay : '—'}
        </AureakText>
        <AureakText style={cardStyles.cardSubDark}>
          {stats.totalSessions >= 2 ? 'pts vs moyenne période' : 'Données insuffisantes'}
        </AureakText>
      </View>
    </View>
  )
}

const cardStyles = StyleSheet.create({
  row: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
    flexWrap         : 'wrap',
  },
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    minWidth       : 160,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore web shadow
    boxShadow      : shadows.sm,
  },
  cardDark: {
    backgroundColor: colors.text.dark,
    borderColor    : colors.text.dark,
  },
  cardLabel: {
    fontSize     : 10,
    fontFamily   : fonts.heading,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom : space.sm,
  },
  cardLabelDark: {
    fontSize     : 10,
    fontFamily   : fonts.heading,
    fontWeight   : '700',
    color        : colors.accent.goldLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom : space.sm,
  },
  cardStat: {
    fontSize    : 28,
    fontFamily  : 'Montserrat',
    fontWeight  : '900',
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  cardStatGold: {
    fontSize    : 28,
    fontFamily  : 'Montserrat',
    fontWeight  : '900',
    color       : colors.accent.gold,
    marginBottom: space.xs,
  },
  cardSub: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  cardSubDark: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.text.primary + '99',
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
  progressTrack: {
    height         : 4,
    backgroundColor: colors.border.divider,
    borderRadius   : 2,
    marginTop      : space.sm,
    overflow       : 'hidden',
  },
  progressFill: {
    height         : 4,
    backgroundColor: colors.accent.gold,
    borderRadius   : 2,
  },
  badgeRed: {
    backgroundColor: colors.status.absent,
    borderRadius   : radius.badge,
    width          : 18,
    height         : 18,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  badgeRedText: {
    color     : colors.text.primary,
    fontSize  : 10,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
})

// ─── Tableau Global / Implantation ────────────────────────────────────────────

type TableauGroupesProps = {
  rows   : GroupPresenceRow[]
  page   : number
  onPage : (p: number) => void
  onClickGroup: (groupId: string) => void
}

function TableauGroupes({ rows, page, onPage, onClickGroup }: TableauGroupesProps) {
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const sliced = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Obtenir les 5 dernières dates (union de toutes les sessions)
  const allDates = useMemo(() => {
    const dateSet = new Set<string>()
    for (const r of rows) {
      for (const s of r.sessions) dateSet.add(s.date)
    }
    return Array.from(dateSet).slice(-5)
  }, [rows])

  if (rows.length === 0) {
    return (
      <View style={tableStyles.empty}>
        <AureakText style={tableStyles.emptyText}>Aucune donnée de présence disponible.</AureakText>
      </View>
    )
  }

  return (
    <View style={tableStyles.container}>
      {/* Titre + légende */}
      <View style={tableStyles.header}>
        <AureakText style={tableStyles.title}>Registre des Présences</AureakText>
        <View style={tableStyles.legend}>
          <View style={tableStyles.legendItem}>
            <View style={[tableStyles.legendDot, { backgroundColor: colors.status.present }]} />
            <AureakText style={tableStyles.legendLabel}>Présent</AureakText>
          </View>
          <View style={tableStyles.legendItem}>
            <View style={[tableStyles.legendDot, { backgroundColor: colors.status.absent }]} />
            <AureakText style={tableStyles.legendLabel}>Absent</AureakText>
          </View>
          <View style={tableStyles.legendItem}>
            <View style={[tableStyles.legendDot, { backgroundColor: colors.status.attention }]} />
            <AureakText style={tableStyles.legendLabel}>Retard</AureakText>
          </View>
        </View>
      </View>

      {/* Table header */}
      <View style={tableStyles.tableHeader}>
        <View style={{ flex: 2 }}>
          <AureakText style={tableStyles.th}>GROUPE</AureakText>
        </View>
        {allDates.map(d => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <AureakText style={tableStyles.th}>{d}</AureakText>
          </View>
        ))}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AureakText style={tableStyles.th}>ASSIDUITÉ</AureakText>
        </View>
      </View>

      {/* Lignes */}
      {sliced.map(row => (
        <Pressable
          key={row.groupId}
          style={({ pressed }) => [tableStyles.tableRow, pressed && tableStyles.tableRowPressed]}
          onPress={() => onClickGroup(row.groupId)}
        >
          <View style={{ flex: 2 }}>
            <AureakText style={tableStyles.groupName}>{row.groupName}</AureakText>
            <AureakText style={tableStyles.groupImplantation}>{row.implantationName}</AureakText>
          </View>
          {allDates.map(d => {
            const sess = row.sessions.find(s => s.date === d)
            const rate = sess?.rate ?? null
            if (rate === null) {
              return <View key={d} style={[tableStyles.cell, { flex: 1 }]}>
                <AureakText style={tableStyles.cellEmpty}>—</AureakText>
              </View>
            }
            const { bg, text } = getCellStyle(rate)
            return (
              <View key={d} style={[tableStyles.cell, { flex: 1, backgroundColor: bg }]}>
                <AureakText style={{ ...tableStyles.cellText, color: text }}>{rate}%</AureakText>
              </View>
            )
          })}
          {/* Assiduité moyenne */}
          <View style={[tableStyles.cell, { flex: 1 }]}>
            <AureakText style={tableStyles.avgText}>{row.avgRate}%</AureakText>
          </View>
        </Pressable>
      ))}

      {/* Pagination */}
      <View style={tableStyles.pagination}>
        <AureakText style={tableStyles.paginationLabel}>
          Affichage de {page + 1} sur {totalPages} page{totalPages > 1 ? 's' : ''} ({rows.length} groupes)
        </AureakText>
        <View style={tableStyles.paginationBtns}>
          <Pressable
            style={[tableStyles.paginationBtn, page === 0 && tableStyles.paginationBtnDisabled]}
            onPress={() => onPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <AureakText style={tableStyles.paginationBtnText}>←</AureakText>
          </Pressable>
          <Pressable
            style={[tableStyles.paginationBtn, page >= totalPages - 1 && tableStyles.paginationBtnDisabled]}
            onPress={() => onPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            <AureakText style={tableStyles.paginationBtnText}>→</AureakText>
          </Pressable>
        </View>
      </View>

      <AureakText style={tableStyles.clickHint}>
        Cliquer sur un groupe pour voir le détail joueurs
      </AureakText>
    </View>
  )
}

const tableStyles = StyleSheet.create({
  empty: {
    margin         : space.lg,
    padding        : space.xl,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    alignItems     : 'center',
  },
  emptyText: {
    color     : colors.text.muted,
    fontSize  : 14,
    fontFamily: fonts.body,
  },
  container: {
    marginHorizontal: space.lg,
    marginBottom    : space.lg,
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
    overflow        : 'hidden',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore web shadow
    boxShadow       : shadows.sm,
  },
  header: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    padding          : space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  title: {
    fontSize  : 15,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  legend: {
    flexDirection: 'row',
    gap          : space.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 4,
  },
  legendDot: {
    width       : 8,
    height      : 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  th: {
    fontSize     : 10,
    fontFamily   : fonts.heading,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  tableRowPressed: {
    backgroundColor: colors.light.hover,
  },
  groupName: {
    fontSize  : 13,
    fontFamily: fonts.heading,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  groupImplantation: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  cell: {
    alignItems    : 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius  : radius.xs,
    marginHorizontal: 2,
  },
  cellText: {
    fontSize  : 12,
    fontFamily: fonts.mono,
    fontWeight: '600',
  },
  cellEmpty: {
    fontSize  : 12,
    fontFamily: fonts.mono,
    color     : colors.text.subtle,
  },
  avgText: {
    fontSize  : 13,
    fontFamily: fonts.mono,
    fontWeight: '700',
    color     : colors.text.dark,
    textAlign : 'center',
  },
  pagination: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  },
  paginationLabel: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  paginationBtns: {
    flexDirection: 'row',
    gap          : space.sm,
  },
  paginationBtn: {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.surface,
  },
  paginationBtnDisabled: {
    opacity: 0.4,
  },
  paginationBtnText: {
    fontSize  : 13,
    fontFamily: fonts.mono,
    color     : colors.text.dark,
  },
  clickHint: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
    textAlign : 'center',
    padding   : space.sm,
    fontStyle : 'italic',
  },
})

// ─── Heatmap Groupe ───────────────────────────────────────────────────────────

type HeatmapGroupeProps = {
  rows          : PlayerHeatmapRow[]
  sessionDates  : string[]
  sortDesc      : boolean
  onToggleSort  : () => void
  onClickPlayer : (childId: string) => void
}

function HeatmapGroupe({ rows, sessionDates, sortDesc, onToggleSort, onClickPlayer }: HeatmapGroupeProps) {
  const atRisk = rows.filter(r => r.isAtRisk)
  const sorted = [...rows].sort((a, b) => sortDesc ? b.rate - a.rate : a.rate - b.rate)

  return (
    <View style={heatStyles.container}>
      {/* Section À surveiller */}
      {atRisk.length > 0 && (
        <View style={heatStyles.atRiskBanner}>
          <AureakText style={heatStyles.atRiskTitle}>🔴 À surveiller</AureakText>
          <View style={heatStyles.atRiskList}>
            {atRisk.map(p => (
              <Pressable key={p.childId} onPress={() => onClickPlayer(p.childId)}>
                <View style={heatStyles.atRiskBadge}>
                  <AureakText style={heatStyles.atRiskBadgeText}>{p.displayName}</AureakText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Table header */}
      <View style={heatStyles.tableHeader}>
        <View style={{ width: 180 }}>
          <AureakText style={heatStyles.th}>JOUEUR</AureakText>
        </View>
        {sessionDates.map(d => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <AureakText style={heatStyles.th}>{d}</AureakText>
          </View>
        ))}
        <Pressable onPress={onToggleSort} style={{ width: 80, alignItems: 'center' }}>
          <AureakText style={heatStyles.th}>
            ASSIDUITÉ {sortDesc ? '↓' : '↑'}
          </AureakText>
        </Pressable>
      </View>

      {/* Lignes joueurs */}
      {sorted.map(row => (
        <View key={row.childId} style={heatStyles.tableRow}>
          {/* Avatar + Nom */}
          <View style={heatStyles.playerCell}>
            <View style={heatStyles.avatar}>
              <AureakText style={heatStyles.avatarText}>
                {row.displayName.slice(0, 2).toUpperCase()}
              </AureakText>
            </View>
            <Pressable onPress={() => onClickPlayer(row.childId)}>
              <AureakText style={heatStyles.playerName}>{row.displayName}</AureakText>
            </Pressable>
          </View>
          {/* Dots statuts */}
          {row.statuses.map((status, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[heatStyles.dot, { backgroundColor: getDotColor(status) }]} />
            </View>
          ))}
          {/* Assiduité % */}
          <View style={{ width: 80, alignItems: 'center' }}>
            <AureakText style={heatStyles.rateText}>{row.rate}%</AureakText>
          </View>
        </View>
      ))}

      {sorted.length === 0 && (
        <View style={{ padding: space.xl, alignItems: 'center' }}>
          <AureakText style={{ color: colors.text.muted, fontSize: 14, fontFamily: fonts.body }}>
            Aucun joueur dans ce groupe.
          </AureakText>
        </View>
      )}
    </View>
  )
}

const heatStyles = StyleSheet.create({
  container: {
    marginHorizontal: space.lg,
    marginBottom    : space.lg,
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
    overflow        : 'hidden',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore web shadow
    boxShadow       : shadows.sm,
  },
  atRiskBanner: {
    backgroundColor  : colors.status.errorBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.status.errorBorder,
    padding          : space.md,
  },
  atRiskTitle: {
    fontSize  : 13,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color     : colors.status.errorText,
    marginBottom: space.sm,
  },
  atRiskList: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.sm,
  },
  atRiskBadge: {
    backgroundColor  : colors.status.errorBg,
    borderWidth      : 1,
    borderColor      : colors.status.errorBorder,
    borderRadius     : radius.badge,
    paddingHorizontal: 10,
    paddingVertical  : 4,
  },
  atRiskBadgeText: {
    fontSize  : 12,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.status.errorText,
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  th: {
    fontSize     : 10,
    fontFamily   : fonts.heading,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  thSortable: {
    // aucun style supplémentaire nécessaire
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  playerCell: {
    width       : 180,
    flexDirection: 'row',
    alignItems  : 'center',
    gap         : space.sm,
  },
  avatar: {
    width          : 32,
    height         : 32,
    borderRadius   : 16,
    backgroundColor: colors.accent.gold + '33',
    alignItems     : 'center',
    justifyContent : 'center',
  },
  avatarText: {
    fontSize  : 11,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  playerName: {
    fontSize     : 13,
    fontFamily   : fonts.body,
    fontWeight   : '500',
    color        : colors.text.dark,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore web textDecoration
    textDecoration: 'underline',
  },
  dot: {
    width       : 20,
    height      : 20,
    borderRadius: 10,
  },
  rateText: {
    fontSize  : 13,
    fontFamily: fonts.mono,
    fontWeight: '700',
    color     : colors.text.dark,
  },
})

// ─── Vue Joueur Inline ────────────────────────────────────────────────────────

type VueJoueurInlineProps = {
  childId   : string
  loading   : boolean
  entry     : ChildDirectoryEntry | null
  history   : AttendanceHistoryRow[]
  onViewFull: () => void
}

function VueJoueurInline({ loading, entry, history, onViewFull }: VueJoueurInlineProps) {
  if (loading) {
    return (
      <View style={vueJoueurStyles.container}>
        <AureakText style={vueJoueurStyles.loadingText}>Chargement…</AureakText>
      </View>
    )
  }

  if (!entry) {
    return (
      <View style={vueJoueurStyles.container}>
        <AureakText style={vueJoueurStyles.loadingText}>Joueur introuvable.</AureakText>
      </View>
    )
  }

  const initials   = entry.displayName.slice(0, 2).toUpperCase()
  const globalRate = Math.round(
    (history.filter(h => h.status === 'present' || h.status === 'late').length /
     Math.max(history.length, 1)) * 100
  )

  const sorted10 = [...history]
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .slice(0, 10)

  const today30ago = new Date()
  today30ago.setDate(today30ago.getDate() - 30)
  const hist30 = history.filter(h => new Date(h.sessionDate) >= today30ago)
  const rate30 = hist30.length > 0
    ? Math.round((hist30.filter(h => h.status === 'present' || h.status === 'late').length / hist30.length) * 100)
    : 0

  return (
    <View style={vueJoueurStyles.container}>
      {/* Card résumé */}
      <View style={vueJoueurStyles.card}>
        <View style={vueJoueurStyles.cardRow}>
          <View style={vueJoueurStyles.avatar}>
            <AureakText style={vueJoueurStyles.avatarText}>{initials}</AureakText>
          </View>
          <View style={vueJoueurStyles.cardInfo}>
            <AureakText style={vueJoueurStyles.playerName}>{entry.displayName}</AureakText>
            <AureakText style={vueJoueurStyles.playerSub}>
              {history[0]?.groupName ?? '—'}
            </AureakText>
            <AureakText style={vueJoueurStyles.playerSub}>Assiduité : {globalRate} %</AureakText>
          </View>
        </View>
      </View>

      {/* Timeline 10 dernières séances */}
      <View style={vueJoueurStyles.section}>
        <AureakText style={vueJoueurStyles.sectionTitle}>10 dernières séances</AureakText>
        {sorted10.length === 0 ? (
          <AureakText style={vueJoueurStyles.emptyText}>Aucune séance enregistrée</AureakText>
        ) : (
          sorted10.map((item, i) => (
            <View key={i} style={vueJoueurStyles.timelineRow}>
              <View style={[vueJoueurStyles.dot, { backgroundColor: getDotColor(item.status as AttendanceStatus) }]} />
              <AureakText style={vueJoueurStyles.timelineDate}>
                {formatSessionDate(item.sessionDate)}
              </AureakText>
              <AureakText style={vueJoueurStyles.timelineStatus}>{item.status}</AureakText>
            </View>
          ))
        )}
      </View>

      {/* Stats */}
      <View style={vueJoueurStyles.statsRow}>
        <View style={[cardStyles.card, { flex: 1 }]}>
          <AureakText style={cardStyles.cardLabel}>Assiduité 30 jours</AureakText>
          <AureakText style={cardStyles.cardStat}>{rate30} %</AureakText>
        </View>
        <View style={[cardStyles.card, { flex: 1 }]}>
          <AureakText style={cardStyles.cardLabel}>Assiduité totale</AureakText>
          <AureakText style={cardStyles.cardStat}>{globalRate} %</AureakText>
        </View>
      </View>

      {/* Lien opt-in */}
      <Pressable onPress={onViewFull} style={vueJoueurStyles.fullLink}>
        <AureakText style={vueJoueurStyles.fullLinkText}>Voir la fiche complète →</AureakText>
      </Pressable>
    </View>
  )
}

const emptyPlayerStyles = StyleSheet.create({
  container: {
    flex           : 1,
    alignItems     : 'center',
    justifyContent : 'center',
    paddingVertical: space.xxl,
    gap            : space.sm,
  },
  title: {
    fontSize  : 16,
    fontWeight: '600',
    color     : colors.text.primary,
    textAlign : 'center',
    fontFamily: fonts.body,
  },
  sub: {
    fontSize  : 13,
    color     : colors.text.muted,
    textAlign : 'center',
    fontFamily: fonts.body,
  },
})

const vueJoueurStyles = StyleSheet.create({
  container: {
    paddingHorizontal: space.lg,
    paddingTop       : space.md,
    gap              : space.md,
  },
  loadingText: {
    color     : colors.text.muted,
    fontSize  : 14,
    fontFamily: fonts.body,
    textAlign : 'center',
    paddingVertical: space.xl,
  },
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow      : shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.md,
  },
  avatar: {
    width          : 48,
    height         : 48,
    borderRadius   : 24,
    backgroundColor: colors.accent.gold + '33',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  avatarText: {
    color     : colors.text.dark,
    fontSize  : 16,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  cardInfo: {
    flex: 1,
    gap : 2,
  },
  playerName: {
    fontSize  : 16,
    fontWeight: '700',
    color     : colors.text.primary,
    fontFamily: fonts.body,
  },
  playerSub: {
    fontSize  : 12,
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  section: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow      : shadows.sm,
    gap            : space.xs,
  },
  sectionTitle: {
    fontSize    : 13,
    fontWeight  : '700',
    color       : colors.text.dark,
    fontFamily  : fonts.body,
    marginBottom: space.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    paddingVertical: 4,
    gap          : space.sm,
  },
  dot: {
    width       : 8,
    height      : 8,
    borderRadius: 4,
  },
  timelineDate: {
    fontSize  : 12,
    color     : colors.text.muted,
    fontFamily: fonts.mono,
    width     : 90,
  },
  timelineStatus: {
    fontSize  : 12,
    color     : colors.text.dark,
    fontFamily: fonts.body,
  },
  statsRow: {
    flexDirection: 'row',
    gap          : space.md,
  },
  emptyText: {
    fontSize  : 13,
    color     : colors.text.muted,
    fontFamily: fonts.body,
    textAlign : 'center',
    paddingVertical: space.sm,
  },
  fullLink: {
    alignItems : 'flex-end',
    marginTop  : space.md,
    paddingBottom: space.md,
  },
  fullLinkText: {
    color     : colors.accent.gold,
    fontSize  : 13,
    fontFamily: fonts.body,
    fontWeight: '600',
  },
})

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PresencesPage() {
  const router = useRouter()

  const [scope,          setScope]          = useState<ScopeState>({ scope: 'global' })
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('past')
  const [loading,        setLoading]        = useState(false)
  const [page,           setPage]           = useState(0)
  const [sortDesc,       setSortDesc]       = useState(true)

  // Données brutes
  const [sessions,      setSessions]      = useState<SessionAttendanceSummary[]>([])
  const [groups,        setGroups]        = useState<GroupWithMeta[]>([])
  const [members,       setMembers]       = useState<GroupMemberWithName[]>([])
  const [attendance,    setAttendance]    = useState<AttendanceRow[]>([])

  // Données joueur (scope 'joueur')
  const [loadingPlayer, setLoadingPlayer] = useState(false)
  const [playerEntry,   setPlayerEntry]   = useState<ChildDirectoryEntry | null>(null)
  const [playerHistory, setPlayerHistory] = useState<AttendanceHistoryRow[]>([])

  // ── Chargement sessions ───────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const params: { implantationId?: string; groupId?: string } = {}
        if (scope.scope === 'implantation' && scope.implantationId) params.implantationId = scope.implantationId
        if (scope.scope === 'groupe' && scope.groupId) params.groupId = scope.groupId

        const result = await listSessionsWithAttendance(params)
        setSessions(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PresencesPage] listSessionsWithAttendance error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [scope])

  // ── Chargement groupes (vue global/implantation) ──────────────────────────
  useEffect(() => {
    if (scope.scope !== 'global' && scope.scope !== 'implantation') return
    ;(async () => {
      try {
        if (scope.scope === 'implantation' && scope.implantationId) {
          const result = await listGroupsByImplantation(scope.implantationId)
          setGroups((result.data ?? []) as GroupWithMeta[])
        } else {
          const result = await listAllGroups()
          setGroups(result ?? [])
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PresencesPage] listGroups error:', err)
      }
    })()
  }, [scope])

  // ── Chargement données joueur ─────────────────────────────────────────────
  useEffect(() => {
    if (scope.scope !== 'joueur' || !scope.childId) {
      setPlayerEntry(null)
      setPlayerHistory([])
      return
    }
    setLoadingPlayer(true)
    ;(async () => {
      try {
        const today     = new Date()
        const startDate = new Date(today)
        startDate.setFullYear(today.getFullYear() - 1)

        const [entry, history] = await Promise.all([
          getChildDirectoryEntry(scope.childId!),
          listAttendancesByChild(
            scope.childId!,
            startDate.toISOString().split('T')[0],
            today.toISOString().split('T')[0],
          ),
        ])
        setPlayerEntry(entry)
        setPlayerHistory(history)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PresencesPage] loadPlayerData error:', err)
      } finally {
        setLoadingPlayer(false)
      }
    })()
  }, [scope])

  // ── Chargement membres + attendances (vue groupe) ─────────────────────────
  useEffect(() => {
    if (scope.scope !== 'groupe' || !scope.groupId) return
    setLoading(true)
    ;(async () => {
      try {
        const memberData = await listGroupMembersWithProfiles(scope.groupId!)
        setMembers(memberData ?? [])

        // 5 dernières séances du groupe
        const groupSessions = sessions.slice(0, 5)
        const attRows: AttendanceRow[] = []
        for (const s of groupSessions) {
          const { data: atts } = await listAttendancesBySession(s.sessionId)
          for (const a of (atts ?? [])) {
            attRows.push({ sessionId: s.sessionId, childId: a.childId, status: a.status as AttendanceStatus })
          }
        }
        setAttendance(attRows)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PresencesPage] loadGroupData error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [scope, sessions])

  // ── Calcul tableau groupes × séances ─────────────────────────────────────
  const groupPresenceRows = useMemo<GroupPresenceRow[]>(() => {
    if (scope.scope !== 'global' && scope.scope !== 'implantation') return []

    // 5 dernières séances (toutes confondues)
    const last5Sessions = sessions.slice(0, 5)

    return groups.map(g => {
      const groupSessions = last5Sessions.filter(s => s.groupId === g.id)
      const sessionRows = groupSessions.map(s => {
        const total = s.totalAttendance
        const present = s.presentCount + s.lateCount
        const rate = total > 0 ? Math.round((present / total) * 100) : 0
        return { sessionId: s.sessionId, date: formatSessionDate(s.scheduledAt), rate }
      })
      const avgRate = sessionRows.length > 0
        ? Math.round(sessionRows.reduce((acc, s) => acc + s.rate, 0) / sessionRows.length)
        : 0
      return {
        groupId        : g.id,
        groupName      : g.name,
        implantationName: (g as GroupWithMeta).implantationName ?? '',
        sessions       : sessionRows,
        avgRate,
      }
    })
  }, [groups, sessions, scope])

  // ── Calcul heatmap joueurs × séances ──────────────────────────────────────
  const { heatmapRows, sessionDates } = useMemo(() => {
    if (scope.scope !== 'groupe') return { heatmapRows: [], sessionDates: [] }

    const last5 = sessions.slice(0, 5)
    const dates  = last5.map(s => formatSessionDate(s.scheduledAt))

    const rows: PlayerHeatmapRow[] = members.map(m => {
      const statuses: (AttendanceStatus | null)[] = last5.map(s => {
        const att = attendance.find(a => a.sessionId === s.sessionId && a.childId === m.childId)
        return att?.status ?? null
      })
      const presentCount = statuses.filter(s => s === 'present' || s === 'late').length
      const total        = statuses.filter(s => s !== null).length
      const rate         = total > 0 ? Math.round((presentCount / total) * 100) : 0
      return {
        childId    : m.childId,
        displayName: m.displayName,
        statuses,
        rate,
        isAtRisk   : isAtRisk(statuses),
      }
    })

    return { heatmapRows: rows, sessionDates: dates }
  }, [members, attendance, sessions, scope])

  // ── Clic sur groupe → passer en mode groupe ───────────────────────────────
  const handleClickGroup = useCallback((groupId: string) => {
    setScope({
      scope          : 'groupe',
      implantationId : scope.implantationId,
      groupId,
    })
    setPage(0)
  }, [scope.implantationId])

  // ── Clic sur joueur → fiche ────────────────────────────────────────────────
  const handleClickPlayer = useCallback((childId: string) => {
    router.push(`/(admin)/children/${childId}` as Parameters<typeof router.push>[0])
  }, [router])

  return (
    <View style={pageStyles.container}>
      <ActivitesHeader />
      <ScrollView style={pageStyles.scroll} contentContainerStyle={pageStyles.scrollContent}>
        {/* Filtres scope + temporels sur une ligne */}
        <View style={pageStyles.filtresRow}>
          <FiltresScope value={scope} onChange={next => { setScope(next); setPage(0) }} />
          <PseudoFiltresTemporels value={temporalFilter} onChange={setTemporalFilter} />
        </View>

        {/* Stat cards */}
        <StatCardsPresences sessions={sessions} />

        {/* Vue selon filtre */}
        {loading && (
          <View style={pageStyles.loadingWrapper}>
            <AureakText style={pageStyles.loadingText}>Chargement…</AureakText>
          </View>
        )}

        {!loading && (scope.scope === 'global' || scope.scope === 'implantation') && (
          <TableauGroupes
            rows={groupPresenceRows}
            page={page}
            onPage={setPage}
            onClickGroup={handleClickGroup}
          />
        )}

        {!loading && scope.scope === 'groupe' && scope.groupId && (
          <HeatmapGroupe
            rows={heatmapRows}
            sessionDates={sessionDates}
            sortDesc={sortDesc}
            onToggleSort={() => setSortDesc(v => !v)}
            onClickPlayer={handleClickPlayer}
          />
        )}

        {scope.scope === 'joueur' && (
          scope.childId ? (
            <VueJoueurInline
              childId={scope.childId}
              loading={loadingPlayer}
              entry={playerEntry}
              history={playerHistory}
              onViewFull={() => router.push(`/(admin)/children/${scope.childId}` as Parameters<typeof router.push>[0])}
            />
          ) : (
            <View style={emptyPlayerStyles.container}>
              <AureakText style={emptyPlayerStyles.title}>
                Sélectionner un joueur dans le filtre ci-dessus
              </AureakText>
              <AureakText style={emptyPlayerStyles.sub}>
                Utilisez le filtre Scope › Joueur pour chercher un joueur par nom.
              </AureakText>
            </View>
          )
        )}
      </ScrollView>
    </View>
  )
}

const pageStyles = StyleSheet.create({
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
  loadingWrapper: {
    padding    : space.xl,
    alignItems : 'center',
  },
  loadingText: {
    color     : colors.text.muted,
    fontSize  : 14,
    fontFamily: fonts.body,
  },
})
