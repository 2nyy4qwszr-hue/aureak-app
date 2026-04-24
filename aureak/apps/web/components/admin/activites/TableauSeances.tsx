'use client'
// Tableau des séances avec pagination.
// Story 108.2 — accepte désormais { from, to, implantationId, groupId } directement
// (aligné sur les filtres /presences), remplace l'ancienne API scope + temporalFilter.
import React, { useEffect, useState, useMemo } from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listSessionsWithAttendance,
  listAllGroups,
  listEvaluationsBySession,
  listActiveAbsenceAlerts,
  batchResolveCoachNames,
} from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, methodologyMethodColors } from '@aureak/theme'
import type { SessionAttendanceSummary } from '@aureak/api-client'
import type { Evaluation } from '@aureak/types'

const PAGE_SIZE = 20

// ── Helpers date ──────────────────────────────────────────────────────────────

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function formatDate(iso: string): string {
  const d   = new Date(iso)
  const day = DAYS_FR[d.getDay()]
  const dd  = String(d.getDate()).padStart(2, '0')
  const mm  = String(d.getMonth() + 1).padStart(2, '0')
  const hh  = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${dd}/${mm} · ${hh}h${min}`
}

// ── Badge STATUT ──────────────────────────────────────────────────────────────

type StatusConfig = { label: string; bg: string; text: string }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  'réalisée' : { label: 'Réalisée',  bg: colors.status.present    + '30', text: colors.status.successText },
  'terminée' : { label: 'Réalisée',  bg: colors.status.present    + '30', text: colors.status.successText },
  'planifiée': { label: 'Planifiée', bg: colors.status.info       + '30', text: colors.status.infoText    },
  'en_cours' : { label: 'En cours',  bg: colors.accent.gold       + '45', text: colors.text.dark          },
  'annulée'  : { label: 'Annulée',   bg: colors.status.absent     + '30', text: colors.status.errorText   },
  'reportée' : { label: 'Reportée',  bg: colors.status.attention  + '30', text: colors.status.orangeText  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: colors.light.muted, text: colors.text.muted }
  const badgeStyle: ViewStyle = {
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : radius.badge,
    backgroundColor  : cfg.bg,
  }
  const textStyle: TextStyle = {
    fontSize  : 11,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : cfg.text,
  }
  return (
    <View style={badgeStyle}>
      <AureakText style={textStyle}>{cfg.label}</AureakText>
    </View>
  )
}

// ── Badge MÉTHODE ─────────────────────────────────────────────────────────────

const METHOD_ICONS: Record<string, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '🎯',
  'Situationnel'    : '📐',
  'Décisionnel'     : '🧠',
  'Perfectionnement': '💎',
  'Intégration'     : '🔗',
}

function MethodeBadge({ method }: { method: string | null }) {
  if (!method) return <AureakText style={styles.cellMuted}>—</AureakText>
  const colorMap = methodologyMethodColors as Record<string, string>
  const color    = colorMap[method] ?? colors.text.muted
  const icon     = METHOD_ICONS[method] ?? ''
  const badgeStyle: ViewStyle = {
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : radius.badge,
    backgroundColor  : color + '22',
    borderWidth      : 1,
    borderColor      : color + '55',
  }
  const textStyle: TextStyle = {
    fontSize  : 11,
    fontWeight: '600',
    fontFamily: fonts.body,
    color,
  }
  return (
    <View style={badgeStyle}>
      <AureakText style={textStyle}>{icon} {method}</AureakText>
    </View>
  )
}

// ── Avatars Coach ─────────────────────────────────────────────────────────────

const COACH_AVATAR_COLORS = [
  colors.accent.gold,
  colors.status.success,
  colors.accent.red,
  colors.status.warning,
  colors.accent.silver,
] as const

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function CoachAvatars({
  coachIds,
  coachNames,
}: {
  coachIds  : string[]
  coachNames: Map<string, string>
}) {
  const MAX_SHOWN = 2
  const shown     = coachIds.slice(0, MAX_SHOWN)
  const extra     = coachIds.length - MAX_SHOWN

  if (coachIds.length === 0) {
    return <AureakText style={styles.cellMuted}>—</AureakText>
  }

  return (
    <View style={styles.avatarRow}>
      {shown.map((id, i) => {
        const name = coachNames.get(id) ?? '?'
        const init = getInitials(name)
        const avatarStyle: ViewStyle = {
          width          : 28,
          height         : 28,
          borderRadius   : 14,
          justifyContent : 'center',
          alignItems     : 'center',
          borderWidth    : 1.5,
          borderColor    : colors.light.surface,
          backgroundColor: COACH_AVATAR_COLORS[i % COACH_AVATAR_COLORS.length] + '33',
          marginLeft     : i > 0 ? -6 : 0,
        }
        return (
          <View key={id} style={avatarStyle}>
            <AureakText style={styles.avatarText}>{init}</AureakText>
          </View>
        )
      })}
      {extra > 0 && (
        <View style={[styles.avatarExtra, { marginLeft: -6 }]}>
          <AureakText style={styles.avatarExtraText}>+{extra}</AureakText>
        </View>
      )}
    </View>
  )
}

// ── Barre présence ────────────────────────────────────────────────────────────

function rateColor(pct: number): string {
  if (pct >= 80) return colors.status.present
  if (pct >= 60) return colors.status.warning
  return colors.status.absent
}

function PresenceBar({ present, total }: { present: number; total: number }) {
  if (total === 0) return <AureakText style={styles.cellMuted}>—</AureakText>
  const pct       = (present / total) * 100
  const textColor = rateColor(pct)
  const fillStyle: ViewStyle = {
    height         : 4,
    borderRadius   : 2,
    backgroundColor: textColor,
    width          : `${Math.min(pct, 100)}%` as unknown as number,
  }
  return (
    <View style={styles.presenceCell}>
      <AureakText style={StyleSheet.flatten([styles.presenceText, { color: textColor }])}>{present} / {total}</AureakText>
      <View style={styles.presenceBarBg}>
        <View style={fillStyle} />
      </View>
    </View>
  )
}

// ── Types internes ────────────────────────────────────────────────────────────

type EnrichedSession = SessionAttendanceSummary & {
  badgeCount : number
  hasAnomaly : boolean
}

// ── Composant principal ───────────────────────────────────────────────────────

type Props = {
  from?          : string
  to?            : string
  implantationId?: string
  groupId?       : string
}

export function TableauSeances({ from, to, implantationId, groupId }: Props) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width <= 640

  const [sessions,    setSessions]    = useState<SessionAttendanceSummary[]>([])
  const [groupNames,  setGroupNames]  = useState<Map<string, string>>(new Map())
  const [coachNames,  setCoachNames]  = useState<Map<string, string>>(new Map())
  const [evalCounts,  setEvalCounts]  = useState<Map<string, number>>(new Map())
  const [anomalies,   setAnomalies]   = useState<Set<string>>(new Set())
  const [loading,     setLoading]     = useState(false)
  const [page,        setPage]        = useState(0)

  useEffect(() => {
    setLoading(true)
    setPage(0)
    ;(async () => {
      try {
        const params: { from?: string; to?: string; implantationId?: string; groupId?: string } = {}
        if (from)           params.from           = from
        if (to)             params.to             = to
        if (implantationId) params.implantationId = implantationId
        if (groupId)        params.groupId        = groupId

        const sessData = await listSessionsWithAttendance(params)
        setSessions(sessData)

        const allCoachIds = [...new Set(sessData.flatMap(s => s.coachIds))]
        const cNames = await batchResolveCoachNames(allCoachIds)
        setCoachNames(cNames)

        const allGroups = await listAllGroups()
        const gMap      = new Map<string, string>()
        allGroups.forEach(g => gMap.set(g.id, g.name))
        setGroupNames(gMap)

        const evalMap  = new Map<string, number>()
        const anomaSet = new Set<string>()

        await Promise.all(sessData.map(async s => {
          try {
            const { data: evals } = await listEvaluationsBySession(s.sessionId)
            const starCount = (evals as Evaluation[]).filter(e => e.topSeance === 'star').length
            evalMap.set(s.sessionId, starCount)

            if (s.groupId) {
              const alerts = await listActiveAbsenceAlerts(s.groupId)
              if (alerts.length > 0) anomaSet.add(s.sessionId)
            }
          } catch (err) {
            if (process.env.NODE_ENV !== 'production') console.error('[TableauSeances] enrich error:', err)
          }
        }))

        setEvalCounts(new Map(evalMap))
        setAnomalies(new Set(anomaSet))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[TableauSeances] load error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [from, to, implantationId, groupId])

  const pageCount = Math.ceil(sessions.length / PAGE_SIZE)
  const paginated = sessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const enriched: EnrichedSession[] = useMemo(
    () => paginated.map(s => ({
      ...s,
      badgeCount: evalCounts.get(s.sessionId) ?? 0,
      hasAnomaly: anomalies.has(s.sessionId),
      groupName : groupNames.get(s.groupId) ?? s.groupName,
    })),
    [paginated, evalCounts, anomalies, groupNames],
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AureakText style={styles.loadingText}>Chargement des séances…</AureakText>
      </View>
    )
  }

  const start = sessions.length === 0 ? 0 : page * PAGE_SIZE + 1
  const end   = Math.min((page + 1) * PAGE_SIZE, sessions.length)

  const COL_HEADERS = ['STATUT', 'DATE', 'MÉTHODE', 'GROUPE', 'COACH', 'PRÉSENCE', 'BADGES', 'ANOMALIE', '']

  return (
    <View style={[styles.card, isMobile && styles.cardMobile]}>
      {!isMobile && (
        <View style={styles.tableHeader}>
          {COL_HEADERS.map((col, i) => (
            <AureakText
              key={i}
              style={i === COL_HEADERS.length - 1 ? styles.colHeaderChevron : styles.colHeader}
            >
              {col}
            </AureakText>
          ))}
        </View>
      )}

      {enriched.length === 0 && (
        <View style={styles.emptyRow}>
          <AureakText style={styles.emptyText}>
            Aucune séance sur cette période.
          </AureakText>
        </View>
      )}

      {enriched.map((s, idx) => {
        const isCancelled = s.status === 'annulée' || s.status === 'cancelled'
        const textModifier: TextStyle = isCancelled
          ? { fontStyle: 'italic', color: colors.text.subtle }
          : {}

        if (isMobile) {
          return (
            <Pressable
              key={s.sessionId}
              style={[styles.mobileRow, { opacity: isCancelled ? 0.55 : 1 }]}
              onPress={() => router.push(`/(admin)/activites/seances/${s.sessionId}` as Parameters<typeof router.push>[0])}
            >
              <View style={styles.mobileRowTop}>
                <AureakText style={StyleSheet.flatten([styles.mobileDate, textModifier])}>
                  {formatDate(s.scheduledAt)}
                </AureakText>
                <AureakText style={styles.chevron}>›</AureakText>
              </View>
              <View style={styles.mobileBadges}>
                <StatusBadge status={s.status} />
                <MethodeBadge method={s.methodName} />
                {s.hasAnomaly && <AureakText style={styles.mobileAnomaly}>⚠️</AureakText>}
              </View>
              <AureakText style={StyleSheet.flatten([styles.mobileGroup, textModifier])}>
                {s.groupName ?? '—'}
              </AureakText>
              <View style={styles.mobileFooter}>
                <CoachAvatars coachIds={s.coachIds} coachNames={coachNames} />
                <View style={styles.mobilePresence}>
                  <PresenceBar present={s.presentCount} total={s.totalAttendance} />
                </View>
                {s.badgeCount > 0 && (
                  <AureakText style={styles.mobileBadgeCount}>🏅 {s.badgeCount}</AureakText>
                )}
              </View>
            </Pressable>
          )
        }

        const rowStyle: ViewStyle = {
          flexDirection    : 'row',
          alignItems       : 'center',
          minHeight        : 52,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.divider,
          backgroundColor  : idx % 2 === 0 ? colors.light.surface : colors.light.muted,
          opacity          : isCancelled ? 0.55 : 1,
        }

        return (
          <Pressable
            key={s.sessionId}
            style={rowStyle}
            onPress={() => router.push(`/(admin)/activites/seances/${s.sessionId}` as Parameters<typeof router.push>[0])}
          >
            <View style={styles.colCell}>
              <StatusBadge status={s.status} />
            </View>
            <AureakText style={StyleSheet.flatten([styles.colDate, textModifier])}>
              {formatDate(s.scheduledAt)}
            </AureakText>
            <View style={styles.colCell}>
              <MethodeBadge method={s.methodName} />
            </View>
            <AureakText style={StyleSheet.flatten([styles.colText, textModifier])}>
              {s.groupName ?? '—'}
            </AureakText>
            <View style={styles.colCell}>
              <CoachAvatars coachIds={s.coachIds} coachNames={coachNames} />
            </View>
            <View style={styles.colCell}>
              <PresenceBar present={s.presentCount} total={s.totalAttendance} />
            </View>
            <AureakText
              style={s.badgeCount > 0 ? styles.colBadgeCount : styles.colBadgeCountZero}
            >
              {s.badgeCount > 0 ? String(s.badgeCount) : '—'}
            </AureakText>
            <AureakText style={styles.colAnomaly}>
              {s.hasAnomaly ? '⚠️' : ''}
            </AureakText>
            <AureakText style={styles.chevron}>›</AureakText>
          </Pressable>
        )
      })}

      <View style={styles.pagination}>
        <AureakText style={styles.paginationInfo}>
          Affichage de {start}–{end} sur {sessions.length} séances
        </AureakText>
        <View style={styles.paginationActions}>
          <Pressable
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            disabled={page === 0}
            onPress={() => setPage(p => Math.max(0, p - 1))}
          >
            <AureakText style={styles.pageBtnText}>‹</AureakText>
          </Pressable>
          <AureakText style={styles.pageNum}>{page + 1} / {Math.max(1, pageCount)}</AureakText>
          <Pressable
            style={[styles.pageBtn, page >= pageCount - 1 && styles.pageBtnDisabled]}
            disabled={page >= pageCount - 1}
            onPress={() => setPage(p => Math.min(pageCount - 1, p + 1))}
          >
            <AureakText style={styles.pageBtnText}>›</AureakText>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius     : 10,
    marginHorizontal : space.lg,
    marginBottom     : space.lg,
    overflow         : 'hidden',
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  tableHeader: {
    flexDirection    : 'row',
    backgroundColor  : colors.light.muted,
    paddingVertical  : 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  colHeader: {
    flex         : 1,
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    letterSpacing: 1,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
  },
  colHeaderChevron: {
    width        : 32,
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    letterSpacing: 1,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
  },
  colCell: {
    flex         : 1,
    flexDirection: 'row',
    alignItems   : 'center',
  },
  colDate: {
    flex      : 1,
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.dark,
    fontWeight: '500',
  },
  colText: {
    flex      : 1,
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.dark,
  },
  colBadgeCount: {
    flex      : 1,
    fontSize  : 13,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  colBadgeCountZero: {
    flex      : 1,
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
  },
  colAnomaly: {
    flex    : 1,
    fontSize: 16,
  },
  chevron: {
    width    : 32,
    fontSize : 18,
    color    : colors.text.muted,
    textAlign: 'center',
  },
  cellMuted: {
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
  },
  presenceCell: {
    flex: 1,
    gap : 4,
  },
  presenceText: {
    fontSize  : 13,
    fontWeight: '600',
    fontFamily: fonts.body,
    color     : colors.text.dark,
  },
  presenceBarBg: {
    height         : 4,
    backgroundColor: colors.border.light,
    borderRadius   : 2,
    overflow       : 'hidden',
    width          : 60,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems   : 'center',
  },
  avatarText: {
    fontSize  : 11,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  avatarExtra: {
    width          : 28,
    height         : 28,
    borderRadius   : 14,
    justifyContent : 'center',
    alignItems     : 'center',
    borderWidth    : 1.5,
    borderColor    : colors.light.surface,
    backgroundColor: colors.accent.goldLight,
  },
  avatarExtraText: {
    fontSize  : 10,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  emptyRow: {
    padding        : space.xl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
  },
  emptyText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
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
  paginationInfo: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  paginationActions: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  pageBtn: {
    width          : 28,
    height         : 28,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    justifyContent : 'center',
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
  },
  pageBtnDisabled: {
    opacity: 0.35,
  },
  pageBtnText: {
    fontSize: 16,
    color   : colors.text.dark,
  },
  pageNum: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  loadingContainer: {
    padding   : space.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },

  cardMobile: {
    marginHorizontal: space.sm,
  },
  mobileRow: {
    flexDirection    : 'column',
    paddingVertical  : 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor  : colors.light.surface,
    gap              : 8,
  },
  mobileRowTop: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
  },
  mobileDate: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  mobileBadges: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 6,
    flexWrap     : 'wrap',
  },
  mobileAnomaly: {
    fontSize: 14,
  },
  mobileGroup: {
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  mobileFooter: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 10,
    flexWrap     : 'wrap',
  },
  mobilePresence: {
    flex: 1,
    minWidth: 80,
  },
  mobileBadgeCount: {
    fontSize  : 12,
    fontFamily: fonts.display,
    fontWeight: '700',
    color     : colors.accent.gold,
  },
})
