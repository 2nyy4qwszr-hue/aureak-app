'use client'
// Story 65-1 — Activités Hub : Tableau des séances avec pagination
import React, { useEffect, useState, useMemo } from 'react'
import { View, Pressable, StyleSheet, StyleProp } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listSessionsWithAttendance,
  listAllGroups,
  listEvaluationsBySession,
  listActiveAbsenceAlerts,
} from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, methodologyMethodColors } from '@aureak/theme'
import type { SessionAttendanceSummary } from '@aureak/api-client'
import type { Evaluation } from '@aureak/types'
import type { ScopeState } from './FiltresScope'
import type { TemporalFilter } from './PseudoFiltresTemporels'

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

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth()    === n.getMonth()    &&
    d.getDate()     === n.getDate()
  )
}

function applyTemporalFilter(
  sessions: SessionAttendanceSummary[],
  filter  : TemporalFilter,
): SessionAttendanceSummary[] {
  const now = new Date()
  return sessions.filter(s => {
    const d = new Date(s.scheduledAt)
    if (filter === 'today')    return isToday(s.scheduledAt)
    if (filter === 'upcoming') return d > now && !isToday(s.scheduledAt)
    // past (default)
    return d < now && !isToday(s.scheduledAt)
  })
}

// ── Badge STATUT ──────────────────────────────────────────────────────────────

type StatusConfig = { label: string; bg: string; text: string }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  'réalisée' : { label: 'Réalisée',  bg: colors.status.successBg, text: colors.status.successText },
  'terminée' : { label: 'Réalisée',  bg: colors.status.successBg, text: colors.status.successText },
  'planifiée': { label: 'Planifiée', bg: colors.status.infoBg,    text: '#1D4ED8'                 },
  'en_cours' : { label: 'En cours',  bg: colors.border.goldBg,    text: '#92400E'                 },
  'annulée'  : { label: 'Annulée',   bg: colors.status.errorBg,   text: colors.status.errorText   },
  'reportée' : { label: 'Reportée',  bg: colors.status.orangeBg,  text: colors.status.orangeText  },
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
    fontWeight: '600',
    fontFamily: 'Montserrat',
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
    fontFamily: 'Montserrat',
    color,
  }
  return (
    <View style={badgeStyle}>
      <AureakText style={textStyle}>{icon} {method}</AureakText>
    </View>
  )
}

// ── Avatars Coach ─────────────────────────────────────────────────────────────

const ALPHA_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

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
        const bg   = ALPHA_COLORS[i % ALPHA_COLORS.length]
        const init = getInitials(name)
        const avatarStyle: ViewStyle = {
          width          : 28,
          height         : 28,
          borderRadius   : 14,
          justifyContent : 'center',
          alignItems     : 'center',
          borderWidth    : 1.5,
          borderColor    : colors.light.surface,
          backgroundColor: bg,
          marginLeft     : i > 0 ? -8 : 0,
        }
        return (
          <View key={id} style={avatarStyle}>
            <AureakText style={styles.avatarText}>{init}</AureakText>
          </View>
        )
      })}
      {extra > 0 && (
        <View style={[styles.avatarExtra, { marginLeft: -8 }]}>
          <AureakText style={styles.avatarExtraText}>+{extra}</AureakText>
        </View>
      )}
    </View>
  )
}

// ── Barre présence ────────────────────────────────────────────────────────────

function PresenceBar({ present, total }: { present: number; total: number }) {
  if (total === 0) return <AureakText style={styles.cellMuted}>—</AureakText>
  const pct      = (present / total) * 100
  const barColor = pct >= 80
    ? colors.status.present
    : pct >= 60
      ? colors.status.warning
      : colors.status.absent
  const fillStyle: ViewStyle = {
    height         : 4,
    borderRadius   : 2,
    backgroundColor: barColor,
    width          : `${Math.min(pct, 100)}%` as unknown as number,
  }
  return (
    <View style={styles.presenceCell}>
      <AureakText style={styles.presenceText}>{present}/{total}</AureakText>
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
  scope         : ScopeState
  temporalFilter: TemporalFilter
}

export function TableauSeances({ scope, temporalFilter }: Props) {
  const router = useRouter()

  const [sessions,   setSessions]   = useState<SessionAttendanceSummary[]>([])
  const [groupNames, setGroupNames] = useState<Map<string, string>>(new Map())
  const [evalCounts, setEvalCounts] = useState<Map<string, number>>(new Map())
  const [anomalies,  setAnomalies]  = useState<Set<string>>(new Set())
  const [loading,    setLoading]    = useState(false)
  const [page,       setPage]       = useState(0)

  useEffect(() => {
    setLoading(true)
    setPage(0)
    ;(async () => {
      try {
        const params: { implantationId?: string; groupId?: string } = {}
        if (scope.scope === 'implantation' && scope.implantationId) params.implantationId = scope.implantationId
        if (scope.scope === 'groupe'        && scope.groupId)        params.groupId        = scope.groupId

        const sessData = await listSessionsWithAttendance(params)
        setSessions(sessData)

        // Résoudre noms de groupes (listAllGroups retourne GroupWithMeta[] directement)
        const allGroups = await listAllGroups()
        const gMap      = new Map<string, string>()
        allGroups.forEach(g => gMap.set(g.id, g.name))
        setGroupNames(gMap)

        // Enrichir chaque séance avec badges + anomalies
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
  }, [scope.scope, scope.implantationId, scope.groupId])

  // Filtrer par temporel
  const filtered = useMemo(
    () => applyTemporalFilter(sessions, temporalFilter),
    [sessions, temporalFilter],
  )

  // Paginer
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Enrichir les lignes de la page courante
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

  const start = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1
  const end   = Math.min((page + 1) * PAGE_SIZE, filtered.length)

  const COL_HEADERS = ['STATUT', 'DATE', 'MÉTHODE', 'GROUPE', 'COACH', 'PRÉSENCE', 'BADGES', 'ANOMALIE', '']

  return (
    <View style={styles.card}>
      {/* En-tête tableau */}
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

      {/* Lignes vides */}
      {enriched.length === 0 && (
        <View style={styles.emptyRow}>
          <AureakText style={styles.emptyText}>Aucune séance pour ce filtre.</AureakText>
        </View>
      )}

      {/* Lignes de données */}
      {enriched.map((s, idx) => {
        const isCancelled = s.status === 'annulée' || s.status === 'cancelled'
        const rowStyle: ViewStyle = {
          flexDirection    : 'row',
          alignItems       : 'center',
          paddingVertical  : 12,
          paddingHorizontal: space.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.divider,
          backgroundColor  : idx % 2 === 0 ? colors.light.surface : colors.light.muted,
          opacity          : isCancelled ? 0.55 : 1,
        }
        const textModifier: TextStyle = isCancelled
          ? { fontStyle: 'italic', color: colors.text.subtle }
          : {}

        return (
          <Pressable
            key={s.sessionId}
            style={rowStyle}
            onPress={() => router.push(`/(admin)/seances/${s.sessionId}` as Parameters<typeof router.push>[0])}
          >
            {/* STATUT */}
            <View style={styles.colCell}>
              <StatusBadge status={s.status} />
            </View>

            {/* DATE */}
            <AureakText style={StyleSheet.flatten([styles.colDate, textModifier])}>
              {formatDate(s.scheduledAt)}
            </AureakText>

            {/* MÉTHODE — non disponible via listSessionsWithAttendance */}
            <View style={styles.colCell}>
              <MethodeBadge method={null} />
            </View>

            {/* GROUPE */}
            <AureakText style={StyleSheet.flatten([styles.colText, textModifier])}>
              {s.groupName ?? '—'}
            </AureakText>

            {/* COACH — non disponible via listSessionsWithAttendance */}
            <View style={styles.colCell}>
              <CoachAvatars coachIds={[]} coachNames={new Map()} />
            </View>

            {/* PRÉSENCE */}
            <View style={styles.colCell}>
              <PresenceBar present={s.presentCount} total={s.totalAttendance} />
            </View>

            {/* BADGES */}
            <AureakText
              style={s.badgeCount > 0 ? styles.colBadgeCount : styles.colBadgeCountZero}
            >
              {s.badgeCount > 0 ? String(s.badgeCount) : '—'}
            </AureakText>

            {/* ANOMALIE */}
            <AureakText style={styles.colAnomaly}>
              {s.hasAnomaly ? '⚠️' : ''}
            </AureakText>

            {/* Chevron */}
            <AureakText style={styles.chevron}>›</AureakText>
          </Pressable>
        )
      })}

      {/* Pagination */}
      <View style={styles.pagination}>
        <AureakText style={styles.paginationInfo}>
          Affichage de {start}–{end} sur {filtered.length} séances
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
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.card,
    marginHorizontal : space.lg,
    marginBottom     : space.lg,
    overflow         : 'hidden',
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  tableHeader: {
    flexDirection    : 'row',
    backgroundColor  : colors.light.muted,
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  colHeader: {
    flex         : 1,
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : 'Montserrat',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  colHeaderChevron: {
    width        : 32,
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : 'Montserrat',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  colCell: {
    flex         : 1,
    flexDirection: 'row',
    alignItems   : 'center',
  },
  colDate: {
    flex      : 1,
    fontSize  : 12,
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
    fontWeight: '500',
  },
  colText: {
    flex      : 1,
    fontSize  : 13,
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
  },
  colBadgeCount: {
    flex      : 1,
    fontSize  : 13,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
  },
  colBadgeCountZero: {
    flex      : 1,
    fontSize  : 13,
    fontFamily: 'Montserrat',
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
    fontFamily: 'Montserrat',
    color     : colors.text.subtle,
  },
  presenceCell: {
    flex: 1,
    gap : 4,
  },
  presenceText: {
    fontSize  : 12,
    fontWeight: '600',
    fontFamily: 'Montserrat',
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
    fontSize  : 10,
    fontWeight: '700',
    fontFamily: 'Montserrat',
    color     : '#FFFFFF',
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
    fontFamily: 'Montserrat',
    color     : colors.text.dark,
  },
  emptyRow: {
    padding   : space.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize  : 14,
    fontFamily: 'Montserrat',
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
    fontFamily: 'Montserrat',
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
    fontFamily: 'Montserrat',
    color     : colors.text.muted,
  },
  loadingContainer: {
    padding   : space.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize  : 14,
    fontFamily: 'Montserrat',
    color     : colors.text.muted,
  },
})
