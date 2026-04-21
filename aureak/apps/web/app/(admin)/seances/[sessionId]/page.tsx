import React, { useEffect, useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Modal, Pressable, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  resolveProfileDisplayNames,
  getSessionById, listSessionCoaches, listAttendancesBySession,
  listSessionAttendees, addGuestToSession, removeGuestFromSession, listChildDirectory,
  postponeSession, cancelSessionWithShift, getChildDirectoryEntry,
  listSessionThemeBlocks, listSessionWorkshops,
  listGroupMembersWithDetails,
  addSessionThemeBlock, removeSessionThemeBlock, listMethodologyThemes,
  recordAttendance, updateSessionIntensity,
  listEvaluationsBySession,
  // Story 53-7
  listSessionsAdminView,
  // Story 53-10
  listAvailableCoaches, assignCoach, removeCoach,
  // Story 54-3
  getGroupMembersRecentStreaks,
  // Story 54-7
  listActiveAbsenceAlerts,
  // Story 58-3
  addSituationToSession,
  listMethodologySessionSituations,
  // Story 58-8
  listSessionModules,
  upsertSessionModule,
  // Story 61.5 — offline queue
  enqueueAction,
  useOfflineCache,
  // Story 8.6 — Vue coach résultats quiz
  listGroupQuizResults,
} from '@aureak/api-client'
import type { MethodologySituation, GroupQuizResult } from '@aureak/types'
import { MODULE_LABELS, MODULE_TYPES } from '@aureak/types'
import { SessionTimeline } from '../../../../components/admin/seances/SessionTimeline'
import type { PlayerRecentStreak, AbsenceAlertRow } from '@aureak/api-client'
import { AureakButton, AureakText, Badge, AttendanceToggle, BestSessionBadge, SwipeableRow } from '@aureak/ui'
import { colors, fonts, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type { Session, SessionCoach, Attendance, SessionAttendee, ChildDirectoryEntry, SessionThemeBlock, SessionWorkshop, GroupMemberWithDetails, MethodologyTheme, AttendanceStatus, SessionType, Evaluation } from '@aureak/types'
import { contentRefLabel } from '../../../../lib/admin/seances/utils'
import CoachDndBoard from '../_components/CoachDndBoard'
import { useAuthStore } from '@aureak/business-logic'

const STATUS_LABEL: Record<string, string> = {
  planifiée: 'Planifiée', en_cours: 'En cours', réalisée: 'Réalisée',
  annulée: 'Annulée', reportée: 'Reportée',
}
const STATUS_VARIANT: Record<string, 'gold' | 'present' | 'zinc' | 'attention'> = {
  planifiée: 'gold', en_cours: 'present', réalisée: 'zinc',
  annulée: 'attention', reportée: 'gold',
}

// ── Story 53-2 — MatchReportHeader ───────────────────────────────────────────

// Couleurs locales nommées supprimées — remplacées par tokens colors.dark.surface / colors.text.primary

const SESSION_TYPE_ICON: Partial<Record<string, string>> = {
  goal_and_player : '⚽',
  technique       : '🎯',
  situationnel    : '📐',
  decisionnel     : '🧠',
  perfectionnement: '💎',
  integration     : '🔗',
}

const DAYS_LONG_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS_LONG_FR = [
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre',
]

function SessionDetailSkeleton() {
  return (
    <View style={{ padding: space.xl, gap: space.md }}>
      <View style={{ height: 80, backgroundColor: colors.light.muted, borderRadius: radius.card, opacity: 0.6 }} />
      <View style={{ flexDirection: 'row', gap: space.md }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{ flex: 1, height: 60, backgroundColor: colors.light.muted, borderRadius: radius.card, opacity: 0.6 }} />
        ))}
      </View>
      <View style={{ height: 200, backgroundColor: colors.light.muted, borderRadius: radius.card, opacity: 0.6 }} />
    </View>
  )
}

function formatDateLong(scheduledAt: string): string {
  const d = new Date(scheduledAt)
  const weekday = DAYS_LONG_FR[d.getDay()]
  const day     = d.getDate()
  const month   = MONTHS_LONG_FR[d.getMonth()]
  const year    = d.getFullYear()
  const hh      = String(d.getHours()).padStart(2, '0')
  const mm      = String(d.getMinutes()).padStart(2, '0')
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month} ${year} · ${hh}h${mm}`
}

function MatchReportHeader({
  session, groupName, isMobile,
}: {
  session   : Session
  groupName : string
  isMobile? : boolean
}) {
  const typeColor   = session.sessionType
    ? ((methodologyMethodColors as Record<string, string>)[
        session.sessionType === 'goal_and_player'  ? 'Goal and Player'  :
        session.sessionType === 'technique'         ? 'Technique'         :
        session.sessionType === 'situationnel'      ? 'Situationnel'      :
        session.sessionType === 'decisionnel'       ? 'Décisionnel'       :
        session.sessionType === 'perfectionnement'  ? 'Perfectionnement'  :
        session.sessionType === 'integration'       ? 'Intégration'       :
        session.sessionType
      ] ?? colors.accent.gold)
    : colors.accent.gold

  const typeLabel   = session.sessionType ? (SESSION_TYPE_LABELS[session.sessionType as SessionType] ?? session.sessionType) : null
  const typeIcon    = session.sessionType ? (SESSION_TYPE_ICON[session.sessionType] ?? '📋') : null
  const dateLong    = formatDateLong(session.scheduledAt)
  const isCancelled = session.status === 'annulée'

  return (
    <View style={[mrh.header, isCancelled && { opacity: 0.7 }, Platform.OS === 'web' && { overflow: 'hidden' as never }]}>
      {/* Stripe or */}
      <View style={mrh.stripe} />

      {/* Badge statut top-right */}
      <View style={mrh.statusPill}>
        <Badge
          label={STATUS_LABEL[session.status] ?? session.status}
          variant={STATUS_VARIANT[session.status] ?? 'zinc'}
        />
      </View>

      {/* Badge méthode */}
      {typeLabel && typeIcon && (
        <View style={[mrh.methodBadge, isMobile && mrh.methodBadgeMobile, { backgroundColor: typeColor + '20', borderColor: typeColor }]}>
          <AureakText style={{ fontSize: 16 }}>{typeIcon}</AureakText>
          <AureakText style={[mrh.methodLabel, { color: typeColor }] as never}>{typeLabel}</AureakText>
        </View>
      )}

      {/* Nom groupe */}
      <AureakText style={mrh.groupName}>{groupName}</AureakText>

      {/* Date */}
      <AureakText style={mrh.dateText}>
        {dateLong} · {session.durationMinutes} min
      </AureakText>

      {/* Overlay annulée */}
      {isCancelled && (
        <View style={mrh.cancelledOverlay} pointerEvents="none">
          <AureakText style={mrh.cancelledText}>ANNULÉE</AureakText>
        </View>
      )}
    </View>
  )
}

import { Platform } from 'react-native'

const mrh = StyleSheet.create({
  header: {
    backgroundColor      : colors.dark.surface,
    borderBottomLeftRadius : 12,
    borderBottomRightRadius: 12,
    padding              : space.lg,
    paddingTop           : space.md + 3,   // room for stripe
    gap                  : space.xs,
    position             : 'relative' as never,
    marginBottom         : space.sm,
  },
  stripe: {
    position        : 'absolute' as never,
    top             : 0,
    left            : 0,
    right           : 0,
    height          : 3,
    backgroundColor : colors.accent.gold,
    borderTopLeftRadius : 12,
    borderTopRightRadius: 12,
  },
  statusPill: {
    position : 'absolute' as never,
    top      : 16,
    right    : 16,
  },
  methodBadge: {
    flexDirection  : 'row',
    alignSelf      : 'flex-start' as never,
    alignItems     : 'center',
    gap            : 6,
    borderWidth    : 1,
    borderRadius   : 8,
    paddingHorizontal: space.md,
    height         : 36,
    marginBottom   : 4,
  },
  methodBadgeMobile: { alignSelf: 'stretch' as never },
  methodLabel: {
    fontSize  : 13,
    fontWeight: '700' as never,
  },
  groupName: {
    fontSize  : 28,
    fontWeight: '900' as never,
    color     : colors.text.primary,
    lineHeight: 34,
    paddingRight: 100,   // éviter overlap avec le status pill
  },
  dateText: {
    fontSize: 13,
    color   : colors.text.muted,
    marginTop: 2,
  },
  cancelledOverlay: {
    position   : 'absolute' as never,
    top        : 0,
    left       : 0,
    right      : 0,
    bottom     : 0,
    alignItems : 'center',
    justifyContent: 'center',
  },
  cancelledText: {
    fontSize  : 42,
    fontWeight: '900' as never,
    color     : colors.text.primary,
    opacity   : 0.12,
    transform : [{ rotate: '-30deg' }],
    letterSpacing: 8,
  },
})

// ── Story 53-3 — IntensityPicker ─────────────────────────────────────────────

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Récupération active',
  2: 'Charge légère',
  3: 'Charge standard',
  4: 'Charge élevée',
  5: 'Haute intensité',
}

function IntensityPicker({
  value, onChange, disabled = false, saving = false,
}: {
  value   : number | null
  onChange: (level: number) => void
  disabled?: boolean
  saving?  : boolean
}) {
  return (
    <View style={ip.container}>
      <View style={ip.circles}>
        {[1, 2, 3, 4, 5].map(i => {
          const filled    = value !== null && i <= value
          const isGold    = i <= 3
          const fillColor = filled
            ? (isGold ? colors.accent.gold : (colors.accent.red))
            : colors.border.light
          return (
            <Pressable
              key={i}
              style={[ip.circle, { backgroundColor: fillColor, borderColor: filled ? fillColor : colors.border.light }]}
              onPress={() => { if (!disabled && !saving) onChange(i) }}
              disabled={disabled || saving}
            />
          )
        })}
        {saving && <AureakText style={{ fontSize: 10, color: colors.text.muted, marginLeft: 6 }}>…</AureakText>}
      </View>
      {value && (
        <AureakText style={ip.label}>{INTENSITY_LABELS[value] ?? `Niveau ${value}`}</AureakText>
      )}
    </View>
  )
}

const ip = StyleSheet.create({
  container: { gap: 6 },
  circles  : { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circle   : {
    width        : 28,
    height       : 28,
    borderRadius : 14,
    borderWidth  : 1.5,
  },
  label: { fontSize: 11, color: colors.text.muted },
})

// ── Story 53-6 — SessionSummaryCard ──────────────────────────────────────────

type SessionSummaryData = {
  presenceRate : number
  presentCount : number
  totalCount   : number
  avgScore     : number | null
  topEval      : Evaluation | null
}

/** Dérive un score numérique (0–10) depuis les signaux d'évaluation */
function evalToScore(e: Evaluation): number {
  const signalVal = (s: string) => s === 'positive' ? 1 : s === 'none' ? 0.5 : 0
  return ((signalVal(e.receptivite) + signalVal(e.goutEffort) + signalVal(e.attitude)) / 3) * 10
}

function SessionSummaryCard({
  summary, childNameMap,
}: {
  summary      : SessionSummaryData
  childNameMap : Record<string, string>
}) {
  const { presenceRate, presentCount, totalCount, avgScore, topEval } = summary
  const topScore = topEval ? evalToScore(topEval) : null
  const topName  = topEval ? (childNameMap[topEval.childId] ?? 'Joueur inconnu') : null
  const topInits = topName ? topName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '?'

  const presenceColor =
    presenceRate >= 80 ? colors.status.success :
    presenceRate >= 60 ? colors.status.warning : colors.accent.red

  return (
    <View style={ssc.card}>
      {/* Title */}
      <AureakText style={ssc.title}>Résumé de séance</AureakText>

      {/* Metrics row */}
      <View style={ssc.metricsRow}>
        {/* Taux de présence */}
        <View style={ssc.metric}>
          <AureakText style={[ssc.bigNum, { color: presenceColor }] as never}>{presenceRate}%</AureakText>
          <AureakText style={ssc.metricLabel}>PRÉSENTS</AureakText>
          <AureakText style={ssc.metricSub}>{presentCount} / {totalCount} joueurs</AureakText>
        </View>

        {/* Note moyenne */}
        <View style={ssc.metric}>
          {avgScore !== null ? (
            <>
              <AureakText style={ssc.bigNum}>{avgScore.toFixed(1)}/10</AureakText>
              <AureakText style={ssc.metricLabel}>NOTE MOY.</AureakText>
            </>
          ) : (
            <>
              <AureakText style={[ssc.bigNum, { color: colors.text.muted }] as never}>—</AureakText>
              <AureakText style={ssc.metricLabel}>NOTE MOY.</AureakText>
              <AureakText style={[ssc.metricSub, { color: colors.text.muted }] as never}>Non évalué</AureakText>
            </>
          )}
        </View>

        {/* Top joueur */}
        <View style={ssc.metric}>
          {topEval && topName ? (
            <>
              <View style={ssc.avatarRow}>
                <View style={ssc.avatar}>
                  <AureakText style={ssc.avatarText}>{topInits}</AureakText>
                </View>
              </View>
              <AureakText style={ssc.bigNumSm} numberOfLines={1}>{topName}</AureakText>
              <View style={ssc.topBadge}>
                <AureakText style={ssc.topBadgeText}>⭐ Top joueur</AureakText>
              </View>
              {topScore !== null && (
                <AureakText style={ssc.metricSub}>{topScore.toFixed(1)}/10</AureakText>
              )}
              {/* Story 55-4 — Badge "Meilleure séance" si topSeance = star */}
              {topEval?.topSeance === 'star' && (
                <BestSessionBadge size="sm" />
              )}
            </>
          ) : (
            <>
              <AureakText style={[ssc.bigNum, { color: colors.text.muted }] as never}>—</AureakText>
              <AureakText style={ssc.metricLabel}>TOP JOUEUR</AureakText>
              <AureakText style={[ssc.metricSub, { color: colors.text.muted }] as never}>Non évalué</AureakText>
            </>
          )}
        </View>
      </View>

      {/* Barre de progression présence */}
      <View style={ssc.progressBg}>
        <View style={[ssc.progressBar, { width: `${Math.min(presenceRate, 100)}%` as never, backgroundColor: presenceColor }]} />
      </View>
      <AureakText style={ssc.progressLabel}>{presenceRate}%</AureakText>
    </View>
  )
}

const ssc = StyleSheet.create({
  card       : {
    backgroundColor: colors.light.surface,
    borderWidth    : 1.5,
    borderColor    : colors.border.gold,
    borderRadius   : 12,
    padding        : space.md,
    gap            : space.sm,
    boxShadow      : shadows.md,
  } as never,
  title      : { fontSize: 14, fontWeight: '700' as never, color: colors.accent.gold, letterSpacing: 0.5 },
  metricsRow : { flexDirection: 'row', gap: space.sm },
  metric     : { flex: 1, alignItems: 'center' as never, gap: 4, paddingVertical: space.xs },
  bigNum     : { fontSize: 26, fontWeight: '900' as never, color: colors.text.dark, lineHeight: 32 },
  bigNumSm   : { fontSize: 13, fontWeight: '700' as never, color: colors.text.dark, textAlign: 'center' as never, maxWidth: 90 },
  metricLabel: { fontSize: 9, fontWeight: '700' as never, color: colors.text.muted, letterSpacing: 0.8, textTransform: 'uppercase' as never },
  metricSub  : { fontSize: 10, color: colors.text.muted },
  avatarRow  : { flexDirection: 'row', justifyContent: 'center' as never },
  avatar     : {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accent.gold + '30',
    borderWidth: 1, borderColor: colors.accent.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText : { fontSize: 13, fontWeight: '700' as never, color: colors.accent.gold },
  topBadge   : {
    backgroundColor: colors.accent.gold + '20',
    borderWidth: 1, borderColor: colors.accent.gold + '60',
    borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2,
  },
  topBadgeText: { fontSize: 10, fontWeight: '700' as never, color: colors.accent.gold },
  progressBg  : { height: 8, backgroundColor: colors.light.muted, borderRadius: 4, overflow: 'hidden' as never },
  progressBar : { height: 8, borderRadius: 4 },
  progressLabel: { fontSize: 9, color: colors.text.muted, textAlign: 'right' as never },
})

// ── Story 53-7 — StreakBadgeSection ──────────────────────────────────────────

function StreakBadgeSection({
  streaks, childNameMap,
}: {
  streaks      : { childId: string; streak: number }[]
  childNameMap : Record<string, string>
}) {
  const eligible = streaks.filter(s => s.streak >= 5).sort((a, b) => b.streak - a.streak)
  if (eligible.length === 0) return null

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <View style={str.card}>
      <AureakText style={str.title}>Séries d'assiduité 🔥</AureakText>
      {eligible.map((s, i) => {
        const name   = childNameMap[s.childId] ?? 'Joueur inconnu'
        const isExcp = s.streak >= 10
        const badge  = isExcp ? '🔥🔥 Série exceptionnelle' : '🔥 Série active'
        const bColor = isExcp ? (colors.accent.red) : colors.accent.gold
        return (
          <View
            key={s.childId}
            style={[str.row, i < eligible.length - 1 && str.rowBorder]}
          >
            <View style={str.avatar}>
              <AureakText style={[str.avatarText, { color: colors.accent.gold }] as never}>{initials(name)}</AureakText>
            </View>
            <View style={{ flex: 1 }}>
              <AureakText style={str.name}>{name}</AureakText>
              <AureakText style={[str.sub, { color: colors.text.muted }] as never}>{s.streak} présences consécutives</AureakText>
            </View>
            <View style={[str.badge, { borderColor: bColor + '60', backgroundColor: bColor + '18' }]}>
              <AureakText style={[str.badgeText, { color: bColor }] as never}>{badge}</AureakText>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const str = StyleSheet.create({
  card      : {
    backgroundColor: colors.light.surface,
    borderWidth: 1, borderColor: colors.border.light,
    borderRadius: 12, padding: space.md, gap: space.sm,
    boxShadow: shadows.sm,
  } as never,
  title     : { fontSize: 14, fontWeight: '700' as never, color: colors.text.dark },
  row       : { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  rowBorder : { borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  avatar    : {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accent.gold + '20',
    borderWidth: 1, borderColor: colors.accent.gold + '50',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 12, fontWeight: '700' as never },
  name      : { fontSize: 13, fontWeight: '600' as never, color: colors.text.dark },
  sub       : { fontSize: 10 },
  badge     : { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText : { fontSize: 10, fontWeight: '700' as never },
})

// Story 54-7 — Styles bandeau alertes absence
const ab54 = StyleSheet.create({
  banner: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    backgroundColor: colors.status.warningBg,
    borderWidth    : 1.5,
    borderColor    : colors.status.warning,
    borderRadius   : 10,
    padding        : space.sm,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700' as never, color: colors.status.warningText, marginBottom: 2 },
  bannerNames: { fontSize: 11, color: colors.status.warningText, opacity: 0.85 },
  dismissBtn : {
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    borderRadius     : 6,
    backgroundColor  : colors.status.warning + '30',
    borderWidth      : 1,
    borderColor      : colors.status.warning + '80',
    flexShrink       : 0,
  },
  dismissText: { fontSize: 11, fontWeight: '600' as never, color: colors.status.warningText },
})

// Story 54-5 — Styles bouton "Tous présents" + toast
const ap54 = StyleSheet.create({
  allPresentBtn: {
    backgroundColor   : colors.status.success,
    paddingHorizontal : space.sm,
    paddingVertical   : space.xs,
    borderRadius      : 8,
  },
  allPresentBtnDisabled: {
    opacity: 0.45,
  },
  allPresentBtnText: {
    fontSize  : 12,
    fontWeight: '700' as never,
    color     : colors.text.primary,
  },
  toast: {
    backgroundColor: colors.status.successBg,
    borderWidth    : 1,
    borderColor    : colors.status.successText,
    borderRadius   : 7,
    padding        : space.xs + 2,
  },
  toastText: {
    color     : colors.status.successText,
    fontWeight: '700' as never,
  },
})

// Story 47.3 — Styles actions rapides
const actSt = StyleSheet.create({
  quickBtn: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignItems: 'center' as never,
  },
})

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: colors.light.primary },
  content         : { padding: space.xl, gap: space.lg },
  // Story 65-9 — Bouton retour premium
  backBtn: {
    flexDirection  : 'row',
    alignItems     : 'center',
    alignSelf      : 'flex-start',
    paddingVertical: space.xs,
    marginBottom   : space.sm,
  },
  backBtnText: {
    color     : colors.accent.gold,
    fontSize  : 13,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  breadcrumb      : { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs },
  breadcrumbLink  : { color: colors.accent.gold, fontWeight: '600' },
  breadcrumbSep   : { color: colors.text.muted },
  breadcrumbCurrent: { color: colors.text.muted },
  card     : {
    backgroundColor: colors.light.surface,
    borderRadius: 8, padding: space.md,
    borderWidth: 1, borderColor: colors.border.light, gap: space.sm,
    boxShadow: shadows.sm,
  } as never,
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs,
    padding: space.sm, color: colors.text.dark, backgroundColor: colors.light.primary,
    flex: 1,
  },
})

// ── Story 53-5 — Duplication rapide ───────────────────────────────────────────

function buildDuplicatePrefill(
  session  : Session,
  coachIds : string[],
): string {
  const payload = {
    groupId       : session.groupId,
    implantationId: session.implantationId ?? '',
    sessionType   : session.sessionType ?? '',
    duration      : session.durationMinutes,
    terrain       : session.location ?? '',
    coachIds,
  }
  try {
    return btoa(JSON.stringify(payload))
  } catch {
    return ''
  }
}

// ── Story 53-7 — Calcul des streaks de présence (côté TS) ────────────────────

async function computePresenceStreaks(
  sessionId: string,
  groupId  : string,
  sessionDate: string
): Promise<{ childId: string; streak: number }[]> {
  try {
    // Récupérer les 15 dernières séances du groupe jusqu'à la séance courante
    const endDate   = new Date(sessionDate)
    const startDate = new Date(endDate)
    startDate.setFullYear(startDate.getFullYear() - 1)

    const { data: sessions } = await listSessionsAdminView({
      start      : startDate.toISOString(),
      end        : endDate.toISOString(),
      groupId,
      withCoaches: false,
    })

    // Trier par date desc, limiter à 15
    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .filter(s => s.status === 'réalisée')
      .slice(0, 15)

    if (recentSessions.length === 0) return []

    // Pour chaque séance, récupérer les présences
    const attendancesBySession: Record<string, Set<string>> = {}
    await Promise.all(
      recentSessions.map(async s => {
        const { data } = await listAttendancesBySession(s.id)
        attendancesBySession[s.id] = new Set(
          (data ?? []).filter((a: { status: string }) => a.status === 'present').map((a: { childId: string }) => a.childId)
        )
      })
    )

    // Collecter tous les joueurs présents dans au moins 1 séance
    const allPlayerIds = new Set<string>()
    Object.values(attendancesBySession).forEach(set => set.forEach(id => allPlayerIds.add(id)))

    // Calculer la streak pour chaque joueur (sessions triées desc = les plus récentes en premier)
    const result: { childId: string; streak: number }[] = []
    for (const childId of allPlayerIds) {
      let streak = 0
      for (const s of recentSessions) {
        if (attendancesBySession[s.id]?.has(childId)) {
          streak++
        } else {
          break // série brisée
        }
      }
      if (streak > 0) result.push({ childId, streak })
    }

    return result
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] computePresenceStreaks error:', err)
    return []
  }
}

// ── Stories 54-1/54-2/54-3/54-4 — Squad Status Board ────────────────────────

const SQUAD_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  present   : { bg: colors.status.success + '40', text: colors.status.successTextSub, label: '✓ Présent'     },
  absent    : { bg: colors.accent.red     + '40', text: colors.status.errorText,       label: '✗ Absent'      },
  late      : { bg: colors.status.warning + '40', text: colors.status.warningText,     label: '⏱ En retard'   },
  injured   : { bg: colors.status.warning + '40', text: colors.status.warningText,     label: '🩹 Blessé'     },
  trial     : { bg: colors.status.info    + '40', text: colors.status.info,            label: '👀 Essai'      },
  unconfirmed: { bg: colors.status.neutral + '40', text: colors.status.neutral,        label: '? Non confirmé'},
}
const SQUAD_STATUS_UNKNOWN = { bg: colors.accent.gold + '33', text: colors.accent.gold, label: '?' }

const SQUAD_STATUS_OPTIONS: Array<{ status: AttendanceStatus; label: string }> = [
  { status: 'present',    label: '✓ Présent'      },
  { status: 'absent',     label: '✗ Absent'       },
  { status: 'late',       label: '⏱ Retard'       },
  { status: 'injured',    label: '🩹 Blessé'      },
  { status: 'trial',      label: '👀 Essai'        },
]

type SquadCardProps = {
  member      : GroupMemberWithDetails
  status      : AttendanceStatus | null
  toggling    : boolean
  streak     ?: PlayerRecentStreak
  onStatus    : (childId: string, status: AttendanceStatus) => void
}

function SquadCard({ member, status, toggling, streak, onStatus }: SquadCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const inits = member.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const sc    = status ? (SQUAD_STATUS_COLORS[status] ?? SQUAD_STATUS_UNKNOWN) : SQUAD_STATUS_UNKNOWN

  // Streak sub-text (Story 54-3)
  let streakLabel: string | null = null
  let streakColor: string | null = null
  if (streak) {
    if (streak.consecutivePresences >= 10) {
      streakLabel = `🔥🔥 ${streak.consecutivePresences} consécutives`
      streakColor = colors.status.success
    } else if (streak.consecutivePresences >= 5) {
      streakLabel = `🔥 ${streak.consecutivePresences} consécutives`
      streakColor = colors.status.success
    } else if (streak.recentAbsences >= 2 && streak.consecutivePresences < 3) {
      streakLabel = `⚠️ ${streak.recentAbsences} abs. récentes`
      streakColor = colors.status.warning
    }
  }

  const isSimpleStatus = status === 'present' || status === 'absent' || status === null

  return (
    <View style={[sc54.card, { opacity: toggling ? 0.6 : 1 }]}>
      {/* Avatar + nom + streak */}
      <Pressable onPress={() => setShowMenu(v => !v)} style={sc54.cardInner}>
        <View style={[sc54.avatar, { backgroundColor: sc.bg, borderColor: sc.text + '80' }]}>
          <AureakText style={[sc54.avatarText, { color: sc.text }] as never}>{inits}</AureakText>
        </View>
        <AureakText style={sc54.name} numberOfLines={1}>{member.displayName}</AureakText>
        {/* Streak sub-text (Story 54-3) */}
        {streakLabel && streakColor && (
          <AureakText style={[sc54.streak, { color: streakColor }] as never}>{streakLabel}</AureakText>
        )}
        {/* Status badge for advanced statuses */}
        {!isSimpleStatus && (
          <View style={[sc54.badge, { backgroundColor: sc.bg, borderColor: sc.text + '60' }]}>
            <AureakText style={[sc54.badgeText, { color: sc.text }] as never}>{sc.label}</AureakText>
          </View>
        )}
      </Pressable>
      {/* Story 54-2 — AttendanceToggle neumorphique pour présent/absent (statuts simples) */}
      {isSimpleStatus && (
        <View style={sc54.toggleWrap}>
          <AttendanceToggle
            status   ={status as 'present' | 'absent' | null}
            onToggle ={() => onStatus(member.childId, status === 'present' ? 'absent' : 'present')}
            disabled ={toggling}
            size     ="sm"
          />
        </View>
      )}

      {/* Micro-menu statut (Story 54-1 AC5) */}
      {showMenu && (
        <View style={sc54.menu}>
          {SQUAD_STATUS_OPTIONS.map(opt => (
            <Pressable
              key={opt.status}
              style={[
                sc54.menuItem,
                status === opt.status && sc54.menuItemActive,
              ]}
              onPress={() => {
                onStatus(member.childId, opt.status)
                setShowMenu(false)
              }}
            >
              <AureakText style={[
                sc54.menuItemText,
                status === opt.status && sc54.menuItemTextActive,
              ] as never}>{opt.label}</AureakText>
            </Pressable>
          ))}
          <Pressable style={sc54.menuClose} onPress={() => setShowMenu(false)}>
            <AureakText style={sc54.menuCloseText}>✕</AureakText>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const sc54 = StyleSheet.create({
  card      : {
    backgroundColor : colors.light.surface,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    borderRadius    : 12,
    overflow        : 'visible' as never,
    position        : 'relative' as never,
  },
  cardInner : {
    alignItems: 'center' as never,
    padding   : space.sm,
    gap       : 6,
  },
  avatar    : {
    width        : 44, height: 44, borderRadius: 22,
    borderWidth  : 1.5,
    alignItems   : 'center' as never,
    justifyContent: 'center' as never,
  },
  avatarText: { fontSize: 14, fontWeight: '700' as never },
  name      : { fontSize: 12, fontWeight: '700' as never, color: colors.text.dark, textAlign: 'center' as never, maxWidth: 100 },
  streak    : { fontSize: 10, fontWeight: '600' as never, textAlign: 'center' as never },
  badge     : { borderWidth: 1, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'center' as never },
  badgeText : { fontSize: 10, fontWeight: '700' as never },
  menu      : {
    position        : 'absolute' as never,
    top             : 0,
    left            : 0,
    right           : 0,
    zIndex          : 10,
    backgroundColor : colors.light.surface,
    borderWidth     : 1.5,
    borderColor     : colors.accent.gold,
    borderRadius    : 12,
    padding         : space.xs,
    gap             : 4,
    boxShadow       : shadows.md,
  } as never,
  menuItem  : {
    paddingVertical  : 4,
    paddingHorizontal: space.xs,
    borderRadius     : 6,
  },
  menuItemActive: {
    backgroundColor: colors.accent.gold + '20',
  },
  menuItemText  : { fontSize: 11, color: colors.text.dark },
  menuItemTextActive: { fontWeight: '700' as never, color: colors.accent.gold },
  menuClose : { alignItems: 'center' as never, paddingTop: 2 },
  menuCloseText: { fontSize: 10, color: colors.text.muted },
  toggleWrap: { padding: space.xs, paddingTop: 0, alignItems: 'stretch' as never },
})

type SquadStatusGridProps = {
  members      : GroupMemberWithDetails[]
  attendanceMap: Record<string, AttendanceStatus | null>
  memberStreaks : Record<string, PlayerRecentStreak>
  onStatusChange: (childId: string, status: AttendanceStatus) => void
  toggling     : Set<string>
  isMobile     : boolean
}

function SquadStatusGrid({
  members, attendanceMap, memberStreaks, onStatusChange, toggling, isMobile,
}: SquadStatusGridProps) {
  // Story 54-4 — Séparer late / main
  const lateMembers = useMemo(
    () => members.filter(m => attendanceMap[m.childId] === 'late'),
    [members, attendanceMap]
  )
  const mainMembers = useMemo(
    () => members.filter(m => attendanceMap[m.childId] !== 'late'),
    [members, attendanceMap]
  )

  // Story 54-1 AC7 — Tri : enregistrés (alpha) puis non enregistrés (alpha)
  const sortedMain = useMemo(() => {
    const registered   = mainMembers.filter(m => attendanceMap[m.childId] !== null)
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' }))
    const unregistered = mainMembers.filter(m => attendanceMap[m.childId] === null)
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' }))
    return [...registered, ...unregistered]
  }, [mainMembers, attendanceMap])

  // Story 54-1 AC6 + 54-4 AC6 — Compteur global
  const presentCount    = useMemo(() => members.filter(m => attendanceMap[m.childId] === 'present').length, [members, attendanceMap])
  const absentCount     = useMemo(() => members.filter(m => attendanceMap[m.childId] === 'absent').length, [members, attendanceMap])
  const lateCount       = lateMembers.length
  const unknownCount    = useMemo(() => members.filter(m => attendanceMap[m.childId] === null).length, [members, attendanceMap])

  // Largeur de carte : 4 colonnes desktop / 2 colonnes mobile
  const colCount = isMobile ? 2 : 4

  return (
    <View style={{ gap: space.md }}>
      {/* Compteur global */}
      <View style={ssgSt.counter}>
        <AureakText style={[ssgSt.counterItem, { color: colors.status.success }] as never}>
          {presentCount} présents
        </AureakText>
        <AureakText style={ssgSt.counterDot}>·</AureakText>
        <AureakText style={[ssgSt.counterItem, { color: colors.accent.red }] as never}>
          {absentCount} absents
        </AureakText>
        {lateCount > 0 && (
          <>
            <AureakText style={ssgSt.counterDot}>·</AureakText>
            <AureakText style={[ssgSt.counterItem, { color: colors.status.warning }] as never}>
              {lateCount} retardataires
            </AureakText>
          </>
        )}
        <AureakText style={ssgSt.counterDot}>·</AureakText>
        <AureakText style={[ssgSt.counterItem, { color: colors.accent.gold }] as never}>
          {unknownCount} non enregistrés
        </AureakText>
      </View>

      {/* Story 54-4 — Zone Retardataires */}
      {lateMembers.length > 0 && (
        <View style={ssgSt.lateZone}>
          <View style={ssgSt.lateHeader}>
            <AureakText style={ssgSt.lateTitle}>⏱ Retardataires ({lateMembers.length})</AureakText>
          </View>
          <View style={ssgSt.lateList}>
            {lateMembers.map(m => (
              <View key={m.childId} style={ssgSt.lateRow}>
                <View style={ssgSt.lateAvatar}>
                  <AureakText style={ssgSt.lateAvatarText}>
                    {m.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AureakText>
                </View>
                <AureakText style={ssgSt.lateName} numberOfLines={1}>{m.displayName}</AureakText>
                <View style={ssgSt.lateBadge}>
                  <AureakText style={ssgSt.lateBadgeText}>⏱ En retard</AureakText>
                </View>
                <Pressable
                  style={ssgSt.lateBtn}
                  onPress={() => onStatusChange(m.childId, 'present')}
                  disabled={toggling.has(m.childId)}
                >
                  <AureakText style={ssgSt.lateBtnText}>→ Présent</AureakText>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Grille principale */}
      {lateMembers.length > 0 && (
        <View style={ssgSt.mainHeader}>
          <AureakText style={ssgSt.mainTitle}>Joueurs ({mainMembers.length})</AureakText>
        </View>
      )}
      <View style={[ssgSt.grid, { flexDirection: 'row' as never, flexWrap: 'wrap' as never, gap: space.sm }]}>
        {sortedMain.map(m => (
          <View
            key={m.childId}
            style={{ width: colCount === 4 ? 'calc(25% - 12px)' : 'calc(50% - 8px)' } as never}
          >
            {/* Story 61.4 — SwipeableRow sur mobile : droite=présent, gauche=absent (AC1, AC2, AC5, AC7) */}
            <SwipeableRow
              isMobile   ={isMobile}
              onSwipeRight={() => onStatusChange(m.childId, 'present')}
              onSwipeLeft ={() => onStatusChange(m.childId, 'absent')}
            >
              <SquadCard
                member   ={m}
                status   ={attendanceMap[m.childId] ?? null}
                toggling ={toggling.has(m.childId)}
                streak   ={memberStreaks[m.childId]}
                onStatus ={onStatusChange}
              />
            </SwipeableRow>
          </View>
        ))}
      </View>
    </View>
  )
}

const ssgSt = StyleSheet.create({
  counter    : { flexDirection: 'row' as never, flexWrap: 'wrap' as never, alignItems: 'center' as never, gap: 6 },
  counterItem: { fontSize: 12, fontWeight: '700' as never },
  counterDot : { fontSize: 12, color: colors.text.muted },
  // Late zone
  lateZone   : {
    backgroundColor: colors.status.warning + '18',
    borderWidth    : 1.5,
    borderColor    : colors.status.warning + '60',
    borderRadius   : 10,
    overflow       : 'hidden' as never,
  },
  lateHeader : {
    backgroundColor: colors.status.warning + '30',
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs + 2,
  },
  lateTitle  : { fontSize: 13, fontWeight: '700' as never, color: colors.status.warningText },
  lateList   : { padding: space.sm, gap: 8 },
  lateRow    : { flexDirection: 'row' as never, alignItems: 'center' as never, gap: space.xs },
  lateAvatar : {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.status.warning + '30',
    borderWidth: 1, borderColor: colors.status.warning + '80',
    alignItems: 'center' as never, justifyContent: 'center' as never,
    flexShrink: 0,
  },
  lateAvatarText: { fontSize: 11, fontWeight: '700' as never, color: colors.status.warningText },
  lateName   : { flex: 1, fontSize: 12, fontWeight: '600' as never, color: colors.text.dark },
  lateBadge  : {
    backgroundColor: colors.status.warning + '30', borderWidth: 1, borderColor: colors.status.warning + '60',
    borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2,
  },
  lateBadgeText: { fontSize: 10, fontWeight: '700' as never, color: colors.status.warningText },
  lateBtn    : {
    backgroundColor: colors.status.success + '20',
    borderWidth: 1, borderColor: colors.status.success + '60',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  lateBtnText: { fontSize: 11, fontWeight: '700' as never, color: colors.status.successTextSub },
  // Main section label (quand lateZone visible)
  mainHeader : {
    borderTopWidth: 1.5, borderTopColor: colors.border.light,
    paddingTop: space.xs,
  },
  mainTitle  : { fontSize: 12, fontWeight: '700' as never, color: colors.text.muted, textTransform: 'uppercase' as never, letterSpacing: 0.6 },
  grid       : {},
})

export default function SessionDetailPage() {
  const { sessionId, updated } = useLocalSearchParams<{ sessionId: string; updated?: string }>()
  const { user } = useAuthStore()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const [session,     setSession]     = useState<Session | null>(null)
  const [coaches,     setCoaches]     = useState<SessionCoach[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState<string | null>(null)
  // Story 19.5 — Toast après modification
  const [showUpdatedToast, setShowUpdatedToast] = useState(updated === 'true')
  // Story 13.1 — Guest players
  const [attendees,     setAttendees]    = useState<SessionAttendee[]>([])
  const [guestNameMap,  setGuestNameMap] = useState<Record<string, string>>({})
  const [coachNameMap,  setCoachNameMap] = useState<Record<string, string>>({})
  const [childNameMap,  setChildNameMap] = useState<Record<string, string>>({})
  // Story 21.2 — Theme blocks
  const [themeBlocks,   setThemeBlocks]  = useState<SessionThemeBlock[]>([])
  // Story 49.2 — Theme picker (édition post-création)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [availableThemes, setAvailableThemes] = useState<MethodologyTheme[]>([])
  const [addingTheme,     setAddingTheme]     = useState(false)
  const [themeAddError,   setThemeAddError]   = useState<string | null>(null)
  const [removingThemeId,  setRemovingThemeId]  = useState<string | null>(null)
  const [confirmRemoveId,  setConfirmRemoveId]  = useState<string | null>(null)
  const [themeRemoveError, setThemeRemoveError] = useState<string | null>(null)
  // Story 21.3 — Workshops
  const [workshops,     setWorkshops]    = useState<SessionWorkshop[]>([])
  // Story 46.1 — Group members
  const [groupMembers,  setGroupMembers] = useState<GroupMemberWithDetails[]>([])
  // Story 49-4 — Présences pré-remplies avec toggle
  const [attendanceMap,      setAttendanceMap]      = useState<Record<string, AttendanceStatus | null>>({})
  const [attendanceToggling, setAttendanceToggling] = useState<Set<string>>(new Set())
  const [attendanceError,    setAttendanceError]    = useState<string | null>(null)
  // Story 54-3 — Streaks récentes par joueur
  const [memberStreaks, setMemberStreaks] = useState<Record<string, PlayerRecentStreak>>({})
  const [guestSearch,   setGuestSearch]  = useState('')
  const [guestResults, setGuestResults]= useState<ChildDirectoryEntry[]>([])
  const [showGuestPicker, setShowGuestPicker] = useState(false)
  // Story 53-3 — Intensité
  const [intensityLevel,  setIntensityLevel]  = useState<number | null>(null)
  const [intensitySaving, setIntensitySaving] = useState(false)
  const [intensityError,  setIntensityError]  = useState<string | null>(null)
  // Story 53-6 — Évaluations pour résumé
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  // Story 53-7 — Streaks d'assiduité
  const [presenceStreaks, setPresenceStreaks] = useState<{ childId: string; streak: number }[]>([])
  // Story 53-10 — Coach DnD board édition
  const [allAvailableCoaches, setAllAvailableCoaches] = useState<{ id: string; name: string }[]>([])
  const [showCoachDnd,        setShowCoachDnd]        = useState(false)
  const [coachDndSaving,      setCoachDndSaving]      = useState(false)
  const [coachDndError,       setCoachDndError]       = useState<string | null>(null)
  // Story 54-5 — Validation groupée "Tous présents"
  const [allPresentSaving,    setAllPresentSaving]    = useState(false)
  const [showConfetti,        setShowConfetti]        = useState(false)
  const [allPresentToast,     setAllPresentToast]     = useState<string | null>(null)
  // Story 54-7 — Alertes absence pattern
  const [absenceAlerts,       setAbsenceAlerts]       = useState<AbsenceAlertRow[]>([])
  const [alertsDismissed,     setAlertsDismissed]     = useState(false)

  // Story 58-3 — Drag & drop situation depuis bibliothèque
  const [sessionSituations,  setSessionSituations]  = useState<MethodologySituation[]>([])
  const [isDragOver,         setIsDragOver]         = useState(false)
  const [addingSituation,    setAddingSituation]    = useState(false)
  const [highlightedSitId,   setHighlightedSitId]   = useState<string | null>(null)
  const [situationDropError, setSituationDropError] = useState<string | null>(null)

  // Story 58-8 — Timeline 3 phases
  const [sessionModules,  setSessionModules]  = useState<import('@aureak/types').MethodologySessionModule[]>([])
  const [loadingModules,  setLoadingModules]  = useState(false)
  const [editingModule,   setEditingModule]   = useState<import('@aureak/types').MethodologyModuleType | null>(null)
  const [moduleDurations, setModuleDurations] = useState<Record<string, number>>({})
  const [savingModule,    setSavingModule]    = useState(false)

  // Story 61.5 — Offline mode
  const { isOnline } = useOfflineCache()

  // Story 65-9 — Unsaved attendance guard
  const [hasUnsavedAttendance, setHasUnsavedAttendance] = useState(false)

  // Story 8.6 — Résultats quiz groupe
  const [quizResults,  setQuizResults]  = useState<GroupQuizResult[]>([])
  const [loadingQuiz,  setLoadingQuiz]  = useState(false)

  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError,  setCancelError]  = useState('')
  // Postpone dialog (Story 13.2)
  const [showPostponeDialog, setShowPostponeDialog] = useState(false)
  const [postponeDate,       setPostponeDate      ] = useState('')
  const [postponeError,      setPostponeError     ] = useState('')

  // Story 53-6 — useMemo résumé de séance
  const sessionSummary = useMemo((): SessionSummaryData | null => {
    if (!session || session.status !== 'réalisée') return null
    const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
    const totalCount   = groupMembers.length || 1
    const presenceRate = Math.round((presentCount / totalCount) * 100)
    const scoredEvals  = evaluations.map(e => ({ ...e, _score: evalToScore(e) }))
    const avgScore     = scoredEvals.length
      ? scoredEvals.reduce((sum, e) => sum + e._score, 0) / scoredEvals.length
      : null
    const topEval      = scoredEvals.length
      ? [...scoredEvals].sort((a, b) =>
          b._score !== a._score
            ? b._score - a._score
            : (childNameMap[a.childId] ?? a.childId).localeCompare(childNameMap[b.childId] ?? b.childId)
        )[0] ?? null
      : null
    return { presenceRate, presentCount, totalCount, avgScore, topEval: topEval ?? null }
  }, [session, attendanceMap, groupMembers, evaluations, childNameMap])

  // Story 54-5 — Membres non encore marqués présents
  const notPresentMembers = useMemo(
    () => groupMembers.filter(m => attendanceMap[m.childId] !== 'present'),
    [groupMembers, attendanceMap]
  )

  // Story 54-5 — Handler "Tous présents" avec optimistic update + rollback partiel
  const handleMarkAllPresent = async () => {
    if (allPresentSaving || notPresentMembers.length === 0 || !session || !sessionId) return
    const previousMap = { ...attendanceMap }
    // Optimistic update
    const newMap = { ...attendanceMap }
    notPresentMembers.forEach(m => { newMap[m.childId] = 'present' })
    setAttendanceMap(newMap)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 700)
    setAllPresentSaving(true)
    setAttendanceError(null)
    try {
      const results = await Promise.allSettled(
        notPresentMembers.map(m =>
          recordAttendance({
            sessionId,
            childId  : m.childId,
            tenantId : session.tenantId,
            status   : 'present',
            recordedBy: user?.id ?? '',
          })
        )
      )
      const failedIndexes = results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as { error: unknown }).error))
        .map(({ i }) => i)
      if (failedIndexes.length > 0) {
        // Rollback uniquement les présences échouées
        const rollbackMap = { ...newMap }
        failedIndexes.forEach(i => {
          const member = notPresentMembers[i]
          if (member) rollbackMap[member.childId] = previousMap[member.childId] ?? null
        })
        setAttendanceMap(rollbackMap)
        setAttendanceError(`${failedIndexes.length} présence(s) n'ont pas pu être enregistrées`)
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] handleMarkAllPresent partial failures:', failedIndexes.length)
        setTimeout(() => setAttendanceError(null), 5000)
      } else {
        const count = notPresentMembers.length
        setAllPresentToast(`✓ ${count} présence${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''}`)
        setTimeout(() => setAllPresentToast(null), 3500)
        // Story 65-9 — Marquer présences non confirmées
        setHasUnsavedAttendance(true)
      }
    } finally {
      setAllPresentSaving(false)
    }
  }

  const load = async () => {
    if (!sessionId) {
      setLoadError('Identifiant de séance manquant.')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const [s, c, a, att, tb, ws] = await Promise.all([
        getSessionById(sessionId),
        listSessionCoaches(sessionId),
        listAttendancesBySession(sessionId),
        listSessionAttendees(sessionId),
        listSessionThemeBlocks(sessionId),
        listSessionWorkshops(sessionId),
      ])
      if (s.error || !s.data) {
        setLoadError('Séance introuvable ou accès refusé.')
        return
      }
      setSession(s.data)
      setIntensityLevel(s.data.intensityLevel ?? null)
      setCoaches(c.data)
      setAttendances(a.data)
      setAttendees(att.data)
      setThemeBlocks(tb)
      setWorkshops(ws)

      // Story 46.1 — Load group members if group is set
      let sortedMembers: GroupMemberWithDetails[] = []
      if (s.data.groupId) {
        const members = await listGroupMembersWithDetails(s.data.groupId)
        sortedMembers = [...members].sort((a, b) =>
          a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' })
        )
        setGroupMembers(sortedMembers)
      } else {
        setGroupMembers([])
      }

      // Story 49-4 — Construire attendanceMap : tous les membres du groupe + présences existantes
      const map: Record<string, AttendanceStatus | null> = {}
      sortedMembers.forEach(m => { map[m.childId] = null })
      ;(a.data as Attendance[]).forEach(att => { map[att.childId] = att.status as AttendanceStatus })
      setAttendanceMap(map)

      // Story 54-3 — Charger les streaks récentes si groupe défini (silent fail)
      if (s.data.groupId) {
        getGroupMembersRecentStreaks(s.data.groupId, sessionId)
          .then(streaks => setMemberStreaks(streaks))
          .catch(err => {
            if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] getGroupMembersRecentStreaks error:', err)
          })
      }

      // Story 54-7 — Charger les alertes d'absence actives pour ce groupe (silent fail)
      if (s.data.groupId) {
        listActiveAbsenceAlerts(s.data.groupId)
          .then(alerts => { setAbsenceAlerts(alerts); setAlertsDismissed(false) })
          .catch(err => {
            if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] listActiveAbsenceAlerts error:', err)
          })
      }

      // Story 53-10 — Charger coaches disponibles pour DnD board
      listAvailableCoaches()
        .then(coaches => setAllAvailableCoaches(coaches))
        .catch(err => {
          if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] listAvailableCoaches error:', err)
        })

      // Story 53-6 + 53-7 — Charger évaluations et streaks si séance réalisée
      if (s.data.status === 'réalisée') {
        // Évaluations
        const evalResult = await listEvaluationsBySession(sessionId)
        if (!evalResult.error) setEvaluations(evalResult.data)
        // Streaks d'assiduité (calcul TS côté client)
        if (s.data.groupId) {
          const streaksData = await computePresenceStreaks(sessionId, s.data.groupId, s.data.scheduledAt)
          setPresenceStreaks(streaksData)
        }
      }

      // Resolve coach names from profiles
      if (c.data.length > 0) {
        const ids = c.data.map((coach: SessionCoach) => coach.coachId)
        const { data: cMap } = await resolveProfileDisplayNames(ids)
        setCoachNameMap(cMap)
      }

      // Resolve guest names from child_directory
      const guests = att.data.filter((x: SessionAttendee) => x.isGuest)
      if (guests.length > 0) {
        const entries = await Promise.all(guests.map((g: SessionAttendee) => getChildDirectoryEntry(g.childId)))
        const map: Record<string, string> = {}
        entries.forEach((e, i) => { if (e) map[guests[i].childId] = e.displayName })
        setGuestNameMap(map)
      }

      // Resolve non-guest child names for attendances
      if (a.data.length > 0) {
        const guestSet = new Set(guests.map((g: SessionAttendee) => g.childId))
        const nonGuestIds = (a.data as Attendance[])
          .filter(x => !guestSet.has(x.childId)).map(x => x.childId)
        if (nonGuestIds.length > 0) {
          const { data: kMap } = await resolveProfileDisplayNames(nonGuestIds)
          setChildNameMap(kMap)
        }
      }
    } catch (err) {
      setLoadError('Erreur lors du chargement de la séance.')
      if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sessionId])

  // Story 8.6 — Charger les résultats quiz du groupe pour cette séance
  useEffect(() => {
    if (!sessionId || !session?.groupId) return
    setLoadingQuiz(true)
    listGroupQuizResults(sessionId)
      .then(({ data }) => { setQuizResults(data) })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] listGroupQuizResults error:', err)
      })
      .finally(() => { setLoadingQuiz(false) })
  }, [sessionId, session?.groupId])

  // Story 58-8 — Charger les modules de phase quand la séance a un methodologySessionId
  useEffect(() => {
    const methSessionId = session?.methodologySessionId
    if (!methSessionId) return
    setLoadingModules(true)
    listSessionModules(methSessionId)
      .then(res => {
        if (res.data) {
          setSessionModules(res.data)
          // Pré-peupler les durées éditables
          const durs: Record<string, number> = {}
          res.data.forEach(m => { durs[m.moduleType] = m.durationMinutes })
          setModuleDurations(durs)
        }
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production')
          console.error('[SessionPage] loadModules error:', err)
      })
      .finally(() => setLoadingModules(false))
  }, [session?.methodologySessionId])

  const handleSaveModule = async (moduleType: import('@aureak/types').MethodologyModuleType, durationMinutes: number) => {
    const methSessionId = session?.methodologySessionId
    if (!methSessionId) return
    setSavingModule(true)
    try {
      const { error } = await upsertSessionModule(methSessionId, moduleType, durationMinutes)
      if (error && process.env.NODE_ENV !== 'production')
        console.error('[SessionPage] saveModule error:', error)
      else {
        setSessionModules(prev =>
          prev.some(m => m.moduleType === moduleType)
            ? prev.map(m => m.moduleType === moduleType ? { ...m, durationMinutes } : m)
            : [...prev, { id: '', sessionId: methSessionId, moduleType, durationMinutes, situations: [] }]
        )
        setModuleDurations(prev => ({ ...prev, [moduleType]: durationMinutes }))
        setEditingModule(null)
      }
    } finally {
      setSavingModule(false)
    }
  }

  // Story 58-3 — Rechargement des situations liées à la séance
  const reloadSituations = async () => {
    if (!sessionId) return
    const sits = await listMethodologySessionSituations(sessionId)
    setSessionSituations(sits)
  }

  // Story 58-3 — Handlers drag & drop situation
  const handleSituationDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('application/json')) setIsDragOver(true)
  }

  const handleSituationDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const raw = e.dataTransfer.getData('application/json')
    if (!raw || !sessionId) return
    let payload: { type?: string; situationId?: string }
    try { payload = JSON.parse(raw) } catch { return }
    if (payload.type !== 'situation' || !payload.situationId) return

    // Vérif doublon
    if (sessionSituations.some(s => s.id === payload.situationId)) {
      setSituationDropError('Exercice déjà dans cette séance')
      setTimeout(() => setSituationDropError(null), 3000)
      return
    }

    setAddingSituation(true)
    setSituationDropError(null)
    try {
      const { error } = await addSituationToSession(sessionId, payload.situationId!)
      if (error) {
        if (process.env.NODE_ENV !== 'production')
          console.error('[SessionPage] handleSituationDrop error:', error)
        return
      }
      setHighlightedSitId(payload.situationId!)
      setTimeout(() => setHighlightedSitId(null), 2000)
      await reloadSituations()
    } finally {
      setAddingSituation(false)
    }
  }

  // Guest search — debounced 300ms, min 2 chars
  useEffect(() => {
    if (guestSearch.trim().length < 2) { setGuestResults([]); return }
    const timer = setTimeout(() => {
      listChildDirectory({ search: guestSearch.trim(), pageSize: 8 })
        .then(({ data }) => setGuestResults(data))
        .catch(err => { if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] guestSearch error:', err) })
    }, 300)
    return () => clearTimeout(timer)
  }, [guestSearch])

  // Story 49.2 — Theme picker handlers
  const handleOpenThemePicker = async () => {
    setThemeAddError(null)
    if (availableThemes.length === 0) {
      setAddingTheme(true)
      try {
        const all = await listMethodologyThemes({ activeOnly: true })
        setAvailableThemes(all)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] listMethodologyThemes error:', err)
        setThemeAddError('Impossible de charger la liste des thèmes.')
        return
      } finally {
        setAddingTheme(false)
      }
    }
    setShowThemePicker(true)
  }

  const handleAddTheme = async (themeId: string) => {
    if (!session || !sessionId) return
    setAddingTheme(true)
    setThemeAddError(null)
    try {
      const { data, error } = await addSessionThemeBlock({
        sessionId,
        tenantId : session.tenantId,
        themeId,
        sortOrder: themeBlocks.length,
      })
      if (error || !data) {
        setThemeAddError(error ?? 'Erreur inconnue')
        return
      }
      const theme = availableThemes.find(t => t.id === themeId)
      setThemeBlocks(prev => [...prev, { ...data, themeName: theme?.title }])
      setShowThemePicker(false)
    } finally {
      setAddingTheme(false)
    }
  }

  const handleRemoveTheme = async (blockId: string) => {
    setRemovingThemeId(blockId)
    setThemeRemoveError(null)
    const snapshot = [...themeBlocks]
    setThemeBlocks(prev => prev.filter(b => b.id !== blockId)) // optimistic
    try {
      const { error } = await removeSessionThemeBlock(blockId)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] removeThemeBlock error:', error)
        setThemeBlocks(snapshot) // rollback
        setThemeRemoveError(error)
      }
    } finally {
      setRemovingThemeId(null)
      setConfirmRemoveId(null)
    }
  }

  const handleAddGuest = async (child: ChildDirectoryEntry) => {
    if (!sessionId || !session) return
    await addGuestToSession(sessionId, child.id, session.tenantId)
    setGuestNameMap(prev => ({ ...prev, [child.id]: child.displayName }))
    setGuestSearch('')
    setGuestResults([])
    setShowGuestPicker(false)
    load()
  }

  const handleRemoveGuest = async (childId: string) => {
    if (!sessionId) return
    await removeGuestFromSession(sessionId, childId)
    load()
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Le motif est obligatoire.')
      return
    }
    // Story 13.2 : utilise cancelSessionWithShift (log audit si contenu perdu)
    const { error } = await cancelSessionWithShift(sessionId!, cancelReason.trim())
    if (error) {
      setCancelError((error as Error).message ?? 'Erreur lors de l\'annulation.')
    } else {
      setShowCancelDialog(false)
      load()
    }
  }

  const handlePostpone = async () => {
    if (!postponeDate.trim()) {
      setPostponeError('La nouvelle date est obligatoire.')
      return
    }
    // Construire ISO datetime avec l'heure existante si possible
    const existingTime = session
      ? `${String(new Date(session.scheduledAt).getHours()).padStart(2,'0')}:${String(new Date(session.scheduledAt).getMinutes()).padStart(2,'0')}`
      : '18:00'
    const newDate = postponeDate.includes('T') ? postponeDate : `${postponeDate}T${existingTime}:00`
    const { error } = await postponeSession(sessionId!, newDate)
    if (error) {
      setPostponeError((error as Error).message ?? 'Erreur lors du report.')
    } else {
      setShowPostponeDialog(false)
      setPostponeDate('')
      setPostponeError('')
      load()
    }
  }

  // Story 54-1/54-4 — Changer statut avec optimistic update (multi-statut)
  const handleStatusChange = async (childId: string, newStatus: AttendanceStatus) => {
    if (!session || !sessionId) return
    if (attendanceToggling.has(childId)) return // debounce
    const prevStatus = attendanceMap[childId] ?? null
    // Optimistic update
    setAttendanceMap(prev => ({ ...prev, [childId]: newStatus }))
    setAttendanceToggling(prev => new Set([...prev, childId]))
    setAttendanceError(null)
    try {
      // Story 61.5 — Si offline, mettre en queue et retour immédiat (AC3)
      if (!isOnline) {
        enqueueAction({
          type   : 'update_attendance',
          payload: { sessionId, childId, tenantId: session.tenantId, status: newStatus },
        })
        return
      }
      const { error } = await recordAttendance({
        sessionId,
        childId,
        tenantId  : session.tenantId,
        status    : newStatus,
        recordedBy: user?.id ?? '',
      })
      if (error) {
        setAttendanceMap(prev => ({ ...prev, [childId]: prevStatus }))
        setAttendanceError('Erreur lors de la mise à jour — réessayez')
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] recordAttendance error:', error)
        setTimeout(() => setAttendanceError(null), 4000)
      }
    } finally {
      setAttendanceToggling(prev => {
        const next = new Set([...prev])
        next.delete(childId)
        return next
      })
    }
  }

  // Story 49-4 — Toggle présence avec optimistic update
  const handleTogglePresence = async (childId: string) => {
    if (!session || !sessionId) return
    if (attendanceToggling.has(childId)) return // debounce
    const prevStatus = attendanceMap[childId] ?? null
    // Statuts avancés : ne pas écraser avec toggle simple
    const advancedStatuses: Array<AttendanceStatus> = ['late', 'trial', 'injured', 'unconfirmed']
    if (prevStatus !== null && advancedStatuses.includes(prevStatus)) return
    const newStatus: AttendanceStatus = prevStatus === 'present' ? 'absent' : 'present'
    // Optimistic update
    setAttendanceMap(prev => ({ ...prev, [childId]: newStatus }))
    setAttendanceToggling(prev => new Set([...prev, childId]))
    setAttendanceError(null)
    try {
      const { error } = await recordAttendance({
        sessionId,
        childId,
        tenantId  : session.tenantId,
        status    : newStatus,
        recordedBy: user?.id ?? '',
      })
      if (error) {
        // Rollback
        setAttendanceMap(prev => ({ ...prev, [childId]: prevStatus }))
        setAttendanceError('Erreur lors de la mise à jour — réessayez')
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] recordAttendance error:', error)
        // Auto-dismiss after 4s
        setTimeout(() => setAttendanceError(null), 4000)
      } else {
        // Story 65-9 — Marquer présences non confirmées
        setHasUnsavedAttendance(true)
      }
    } finally {
      setAttendanceToggling(prev => {
        const next = new Set([...prev])
        next.delete(childId)
        return next
      })
    }
  }

  // Story 53-10 — Handlers DnD coaches
  const handleAssignCoach = async (coachId: string) => {
    if (!session || !sessionId) return
    setCoachDndSaving(true)
    setCoachDndError(null)
    try {
      const { error } = await assignCoach(sessionId, coachId, session.tenantId, 'assistant')
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] assignCoach error:', error)
        setCoachDndError('Erreur lors de l\'assignation du coach')
        return
      }
      setCoaches(prev => [...prev, { coachId, role: 'assistant', sessionId, tenantId: session.tenantId } as SessionCoach])
    } finally {
      setCoachDndSaving(false)
    }
  }

  const handleUnassignCoach = async (coachId: string) => {
    if (!sessionId) return
    setCoachDndSaving(true)
    setCoachDndError(null)
    try {
      const { error } = await removeCoach(sessionId, coachId)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] removeCoach error:', error)
        setCoachDndError('Erreur lors du retrait du coach')
        return
      }
      setCoaches(prev => prev.filter(c => c.coachId !== coachId))
    } finally {
      setCoachDndSaving(false)
    }
  }

  // Story 53-3 — Handler intensité avec optimistic update + rollback
  const handleIntensityChange = async (level: number) => {
    if (!sessionId || session?.status === 'annulée') return
    const prev = intensityLevel
    setIntensityLevel(level)
    setIntensityError(null)
    setIntensitySaving(true)
    try {
      await updateSessionIntensity(sessionId, level)
    } catch (err) {
      setIntensityLevel(prev) // rollback
      setIntensityError('Erreur lors de la mise à jour de l\'intensité')
      if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] updateSessionIntensity error:', err)
    } finally {
      setIntensitySaving(false)
    }
  }

  // Story 65-9 — Navigation guard : confirmation si présences non confirmées
  const handleBackNavigation = () => {
    if (hasUnsavedAttendance) {
      const ok = typeof window !== 'undefined'
        ? window.confirm('Des présences ont été marquées. Quitter sans valider ?')
        : true
      if (!ok) return
    }
    router.push('/(admin)/activites')
  }

  // Story 65-9 — beforeunload guard pour rechargement / fermeture onglet
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedAttendance) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
    return undefined
  }, [hasUnsavedAttendance])

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.light.primary }]}>
        <SessionDetailSkeleton />
      </View>
    )
  }

  if (loadError || !session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: space.xl }]}>
        <AureakText variant="h3" style={{ color: colors.accent.red, marginBottom: space.sm }}>
          Impossible d'afficher la séance
        </AureakText>
        <AureakText variant="body" style={{ color: colors.text.muted, textAlign: 'center' as never }}>
          {loadError ?? 'Séance introuvable.'}
        </AureakText>
        <Pressable
          style={{ marginTop: space.lg, paddingHorizontal: space.md, paddingVertical: space.sm, backgroundColor: colors.accent.gold, borderRadius: 8 }}
          onPress={() => router.push('/(admin)/activites')}
        >
          <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
            ← Retour aux séances
          </AureakText>
        </Pressable>
      </View>
    )
  }

  const sessionDate = new Date(session.scheduledAt).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  // Story 46.1 — Avatar initials helper
  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  // Story 46.1 — Age from birth_date
  const getAge = (birthDate: string | null): string => {
    if (!birthDate) return ''
    const birth = new Date(birthDate)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
    return `${age} ans`
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Toast mise à jour (Story 19.5) */}
      {showUpdatedToast && (
        <View style={{ backgroundColor: colors.status.successBg, borderWidth: 1, borderColor: colors.status.successText, borderRadius: 8, padding: space.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AureakText variant="caption" style={{ color: colors.status.successText, fontWeight: '700' as never }}>
            ✓ Séance mise à jour avec succès
          </AureakText>
          <Pressable onPress={() => setShowUpdatedToast(false)}>
            <AureakText variant="caption" style={{ color: colors.status.successText }}>×</AureakText>
          </Pressable>
        </View>
      )}

      {/* Story 65-9 — Bouton retour vers hub activités */}
      <Pressable onPress={handleBackNavigation} style={styles.backBtn}>
        <AureakText style={styles.backBtnText}>← Séances</AureakText>
      </Pressable>

      {/* Breadcrumb */}
      <View style={[styles.breadcrumb, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <Pressable onPress={handleBackNavigation}>
            <AureakText variant="caption" style={styles.breadcrumbLink}>Séances</AureakText>
          </Pressable>
          <AureakText variant="caption" style={styles.breadcrumbSep}>/</AureakText>
          <AureakText variant="caption" style={styles.breadcrumbCurrent}>
            {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </AureakText>
        </View>
        {/* Story 19.5 — Bouton Modifier (masqué si séance réalisée) */}
        {session.status !== 'réalisée' && (
          <Pressable
            style={{ backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: 4 }}
            onPress={() => router.push(`/seances/${sessionId}/edit` as never)}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' as never }}>
              ✏️ Modifier
            </AureakText>
          </Pressable>
        )}
      </View>

      {/* Story 53-2 — Header Match Report premium */}
      <MatchReportHeader
        session   ={session}
        groupName ={session.label ?? sessionDate}
        isMobile  ={isMobile}
      />

      {/* Story 53-6 — Résumé post-entraînement (visible seulement si réalisée) */}
      {session.status === 'réalisée' && sessionSummary && (
        <SessionSummaryCard summary={sessionSummary} childNameMap={childNameMap} />
      )}

      {/* Story 53-7 — Séries d'assiduité (visible seulement si réalisée) */}
      {session.status === 'réalisée' && presenceStreaks.length > 0 && (
        <StreakBadgeSection streaks={presenceStreaks} childNameMap={childNameMap} />
      )}

      {/* Story 53-3 — Indicateur d'intensité */}
      <View style={[styles.card, session.status === 'annulée' && { opacity: 0.5 }]}>
        <AureakText variant="label">Intensité de la séance</AureakText>
        <IntensityPicker
          value   ={intensityLevel}
          onChange={handleIntensityChange}
          disabled={session.status === 'annulée'}
          saving  ={intensitySaving}
        />
        {intensityError && (
          <AureakText variant="caption" style={{ color: colors.accent.red, marginTop: space.xs }}>
            {intensityError}
          </AureakText>
        )}
      </View>

      {/* Infos session */}
      <View style={styles.card}>
        {session.sessionType && (
          <AureakText variant="body" style={{ color: colors.accent.gold }}>
            Contenu : {contentRefLabel(session)}
          </AureakText>
        )}
        {session.contextType && (
          <AureakText variant="body" style={{ color: colors.text.muted }}>
            Contexte : {session.contextType === 'academie' ? '🏫 Académie' : '🏕️ Stage'}
          </AureakText>
        )}
        <AureakText variant="body">
          Durée : {session.durationMinutes} min
        </AureakText>
        {session.location && (
          <AureakText variant="body">Lieu : {session.location}</AureakText>
        )}
        {session.status === 'annulée' && session.cancellationReason && (
          <View style={{ backgroundColor: colors.status.errorBorderSevere, borderRadius: 6, padding: space.sm }}>
            <AureakText variant="caption" style={{ color: colors.status.errorText, fontWeight: '700' as never }}>
              Séance annulée — Contenu décalé (log audit créé)
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.status.errorText }}>
              Motif : {session.cancellationReason}
            </AureakText>
          </View>
        )}
        {session.status === 'reportée' && (
          <View style={{ backgroundColor: colors.status.warningBg, borderRadius: 6, padding: space.sm }}>
            <AureakText variant="caption" style={{ color: colors.status.warningText, fontWeight: '700' as never }}>
              → Séance reportée
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.status.warningText }}>
              La date affichée ci-dessus est la nouvelle date de cette séance.
            </AureakText>
          </View>
        )}
      </View>

      {/* Joueurs invités (Story 13.1) */}
      <View style={styles.card}>
        <View style={styles.row}>
          <AureakText variant="label">Joueurs invités</AureakText>
          <Pressable
            style={{ marginLeft: 'auto' as never, paddingHorizontal: space.sm, paddingVertical: space.xs, backgroundColor: colors.accent.gold + '20', borderRadius: 6, borderWidth: 1, borderColor: colors.accent.gold }}
            onPress={() => setShowGuestPicker(v => !v)}
          >
            <AureakText variant="caption" style={{ color: colors.accent.gold }}>+ Ajouter un gardien</AureakText>
          </Pressable>
        </View>
        {attendees.filter(a => a.isGuest).map(a => (
          <View key={a.childId} style={[styles.row, { justifyContent: 'space-between' as never }]}>
            <AureakText variant="body">{guestNameMap[a.childId] ?? a.childId.slice(0, 16) + '…'} (invité)</AureakText>
            <Pressable onPress={() => handleRemoveGuest(a.childId)}>
              <AureakText variant="caption" style={{ color: colors.status.errorText }}>Retirer</AureakText>
            </Pressable>
          </View>
        ))}
        {attendees.filter(a => a.isGuest).length === 0 && !showGuestPicker && (
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Aucun joueur invité</AureakText>
        )}
        {showGuestPicker && (
          <View style={{ gap: space.xs }}>
            <TextInput
              style={styles.input}
              placeholder="Rechercher un joueur par nom…"
              value={guestSearch}
              onChangeText={setGuestSearch}
              autoFocus
            />
            {guestResults.map(child => (
              <Pressable
                key={child.id}
                style={{ paddingVertical: space.sm, paddingHorizontal: space.xs, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}
                onPress={() => handleAddGuest(child)}
              >
                <AureakText variant="body">{child.displayName}</AureakText>
                {child.currentClub && (
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>{child.currentClub}</AureakText>
                )}
              </Pressable>
            ))}
            {guestSearch.trim().length > 0 && guestResults.length === 0 && (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Aucun joueur trouvé</AureakText>
            )}
          </View>
        )}
      </View>

      {/* Coaches — Story 53-10 : DnD board */}
      <View style={styles.card}>
        <View style={[styles.row, { justifyContent: 'space-between' as never }]}>
          <AureakText variant="label">Coaches</AureakText>
          <Pressable
            style={{ paddingHorizontal: space.sm, paddingVertical: 4, backgroundColor: colors.accent.gold + '20', borderRadius: 6, borderWidth: 1, borderColor: colors.accent.gold }}
            onPress={() => setShowCoachDnd(v => !v)}
          >
            <AureakText variant="caption" style={{ color: colors.accent.gold }}>
              {showCoachDnd ? 'Fermer' : '✏️ Modifier'}
            </AureakText>
          </Pressable>
        </View>

        {/* Liste lecture seule */}
        {!showCoachDnd && (
          <>
            {coaches.map(c => (
              <AureakText key={c.coachId} variant="body">
                {coachNameMap[c.coachId] ?? c.coachId.slice(0, 8) + '…'} ({c.role})
              </AureakText>
            ))}
            {coaches.length === 0 && (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Aucun coach assigné
              </AureakText>
            )}
          </>
        )}

        {/* DnD Board édition */}
        {showCoachDnd && (
          <View style={{ marginTop: space.xs }}>
            <CoachDndBoard
              availableCoaches={allAvailableCoaches}
              assignedCoachIds={coaches.map(c => c.coachId)}
              onAssign  ={handleAssignCoach}
              onUnassign={handleUnassignCoach}
            />
            {coachDndSaving && (
              <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: space.xs }}>
                Enregistrement…
              </AureakText>
            )}
            {coachDndError && (
              <AureakText variant="caption" style={{ color: colors.accent.red, marginTop: space.xs }}>
                {coachDndError}
              </AureakText>
            )}
          </View>
        )}
      </View>

      {/* Joueurs du groupe (Story 46.1) */}
      <View style={styles.card}>
        {session.groupId ? (
          <>
            <AureakText variant="label">
              {`Joueurs du groupe (${groupMembers.length})`}
            </AureakText>
            {groupMembers.length === 0 ? (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Aucun joueur dans ce groupe
              </AureakText>
            ) : (
              groupMembers.map(member => (
                <View key={member.childId} style={[styles.row, { paddingVertical: 4 }]}>
                  {/* Avatar initiales */}
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: colors.accent.gold + '30',
                    borderWidth: 1, borderColor: colors.accent.gold + '60',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <AureakText style={{ fontSize: 12, fontWeight: '700' as never, color: colors.accent.gold }}>
                      {initials(member.displayName)}
                    </AureakText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AureakText variant="body" style={{ fontWeight: '600' as never }}>
                      {member.displayName}
                    </AureakText>
                    {member.birthDate ? (
                      <AureakText variant="caption" style={{ color: colors.text.muted }}>
                        {getAge(member.birthDate)}
                      </AureakText>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <AureakText variant="label">Joueurs du groupe</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
              Séance ponctuelle — aucun groupe fixe
            </AureakText>
          </>
        )}
      </View>

      {/* Thèmes pédagogiques (Story 21.2 + Story 49.2 édition post-création) */}
      {!loading && (
        <View style={styles.card}>
          {/* Header avec bouton d'ajout */}
          <View style={[styles.row, { justifyContent: 'space-between' as never }]}>
            <AureakText variant="label">Thèmes pédagogiques</AureakText>
            <Pressable
              style={{
                paddingHorizontal: space.sm, paddingVertical: space.xs,
                backgroundColor: colors.accent.gold + '20',
                borderRadius: 6, borderWidth: 1, borderColor: colors.accent.gold,
                opacity: addingTheme ? 0.6 : 1,
              }}
              onPress={handleOpenThemePicker}
              disabled={addingTheme}
            >
              <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                {addingTheme ? '…' : '+ Ajouter un thème'}
              </AureakText>
            </Pressable>
          </View>

          {/* Liste des blocs existants */}
          {themeBlocks.length > 0 ? themeBlocks.map((b, i) => (
            <View key={b.id}>
              {/* Ligne thème */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.xs, paddingVertical: 2 }}>
                <AureakText variant="caption" style={{ color: colors.text.muted, minWidth: 18 }}>{i + 1}.</AureakText>
                <View style={{ flex: 1 }}>
                  <AureakText variant="body">{b.themeName ?? b.themeId}</AureakText>
                  {b.sequenceName && (
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      Séquence : {b.sequenceName}
                    </AureakText>
                  )}
                  {b.resourceLabel && (
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      Ressource : {b.resourceLabel}
                    </AureakText>
                  )}
                </View>
                {/* Bouton Retirer */}
                {removingThemeId !== b.id && confirmRemoveId !== b.id && (
                  <Pressable onPress={() => setConfirmRemoveId(b.id)}>
                    <AureakText variant="caption" style={{ color: colors.accent.red }}>Retirer</AureakText>
                  </Pressable>
                )}
                {removingThemeId === b.id && (
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>…</AureakText>
                )}
              </View>
              {/* Confirmation inline */}
              {confirmRemoveId === b.id && removingThemeId !== b.id && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: space.xs,
                  backgroundColor: colors.accent.red + '18', borderRadius: 6, padding: space.xs,
                  marginLeft: 22,
                }}>
                  <AureakText variant="caption" style={{ color: colors.accent.red, flex: 1 }}>
                    Retirer ce thème ?
                  </AureakText>
                  <Pressable
                    style={{ paddingHorizontal: space.xs, paddingVertical: 2, backgroundColor: colors.accent.red, borderRadius: 4 }}
                    onPress={() => handleRemoveTheme(b.id)}
                  >
                    <AureakText variant="caption" style={{ color: colors.light.surface, fontWeight: '700' as never }}>Confirmer</AureakText>
                  </Pressable>
                  <Pressable
                    style={{ paddingHorizontal: space.xs, paddingVertical: 2, borderWidth: 1, borderColor: colors.accent.red, borderRadius: 4 }}
                    onPress={() => setConfirmRemoveId(null)}
                  >
                    <AureakText variant="caption" style={{ color: colors.accent.red }}>Annuler</AureakText>
                  </Pressable>
                </View>
              )}
            </View>
          )) : (
            <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
              Aucun thème associé
            </AureakText>
          )}

          {/* Picker inline */}
          {showThemePicker && (
            <View style={{
              marginTop: space.xs,
              borderWidth: 1, borderColor: colors.border.light,
              borderRadius: radius.xs,
              backgroundColor: colors.light.surface,
              boxShadow: shadows.md,
              maxHeight: 280,
              overflow: 'hidden' as never,
            }}>
              <View style={{ padding: space.xs, borderBottomWidth: 1, borderBottomColor: colors.border.divider, flexDirection: 'row', justifyContent: 'space-between' as never, alignItems: 'center' }}>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  Sélectionner un thème
                </AureakText>
                <Pressable onPress={() => setShowThemePicker(false)}>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 230 }}>
                {availableThemes.filter(t => !themeBlocks.map(b => b.themeId).includes(t.id)).map(t => {
                  const methodColor = t.method
                    ? (methodologyMethodColors as Record<string, string>)[t.method] ?? colors.text.muted
                    : null
                  return (
                    <Pressable
                      key={t.id}
                      style={({ pressed }: { pressed: boolean }) => ({
                        paddingVertical: space.sm, paddingHorizontal: space.sm,
                        borderBottomWidth: 1, borderBottomColor: colors.border.divider,
                        flexDirection: 'row', alignItems: 'center', gap: space.xs,
                        backgroundColor: pressed ? colors.light.hover : colors.light.surface,
                      })}
                      onPress={() => handleAddTheme(t.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <AureakText variant="body">{t.title}</AureakText>
                      </View>
                      {methodColor && (
                        <View style={{
                          paddingHorizontal: 6, paddingVertical: 2,
                          borderRadius: 4,
                          backgroundColor: methodColor + '25',
                          borderWidth: 1, borderColor: methodColor + '70',
                        }}>
                          <AureakText style={{ fontSize: 10, fontWeight: '600' as never, color: methodColor }}>
                            {t.method}
                          </AureakText>
                        </View>
                      )}
                    </Pressable>
                  )
                })}
                {availableThemes.filter(t => !themeBlocks.map(b => b.themeId).includes(t.id)).length === 0 && (
                  <View style={{ padding: space.sm }}>
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
                      Tous les thèmes actifs sont déjà associés
                    </AureakText>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Erreur ajout */}
          {themeAddError && (
            <AureakText variant="caption" style={{ color: colors.accent.red, marginTop: space.xs }}>
              {themeAddError}
            </AureakText>
          )}
          {/* Erreur suppression (AC4 — rollback visible) */}
          {themeRemoveError && (
            <AureakText variant="caption" style={{ color: colors.accent.red, marginTop: space.xs }}>
              Erreur lors du retrait : {themeRemoveError}
            </AureakText>
          )}
        </View>
      )}

      {/* Ateliers (Story 21.3) */}
      {!loading && workshops.length > 0 && (
        <View style={styles.card}>
          <AureakText variant="label">Ateliers ({workshops.length})</AureakText>
          {workshops.map((w, i) => (
            <View key={w.id} style={{ gap: 2, paddingVertical: 4, borderBottomWidth: i < workshops.length - 1 ? 1 : 0, borderBottomColor: colors.border.divider }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.accent.gold + '20', borderWidth: 1, borderColor: colors.accent.gold + '50' }}>
                  <AureakText style={{ fontSize: 10, fontWeight: '700' as never, color: colors.accent.gold }}>Atelier {i + 1}</AureakText>
                </View>
                <AureakText variant="body" style={{ fontWeight: '600' as never }}>{w.title}</AureakText>
              </View>
              {w.pdfUrl && (
                <Pressable onPress={() => (window as never as Window & { open: (u: string, t: string) => void }).open(w.pdfUrl!, '_blank')}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold }}>📄 Voir PDF →</AureakText>
                </Pressable>
              )}
              {w.cardLabel && (
                <AureakText variant="caption" style={{ color: colors.text.muted }}>🃏 {w.cardLabel}</AureakText>
              )}
              {w.notes && (
                <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>{w.notes}</AureakText>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Story 54-7 — Bandeau alertes absence pattern */}
      {absenceAlerts.length > 0 && !alertsDismissed && (
        <View style={ab54.banner}>
          <View style={{ flex: 1 }}>
            <AureakText style={ab54.bannerTitle}>
              {`⚠️ ${absenceAlerts.length} joueur${absenceAlerts.length > 1 ? 's' : ''} absent${absenceAlerts.length > 1 ? 's' : ''} depuis 3+ séances consécutives`}
            </AureakText>
            <AureakText style={ab54.bannerNames} numberOfLines={2}>
              {absenceAlerts.map(a => `${a.childName} (${a.absenceCount} abs.)`).join(' · ')}
            </AureakText>
          </View>
          <Pressable style={ab54.dismissBtn} onPress={() => setAlertsDismissed(true)}>
            <AureakText style={ab54.dismissText}>Ignorer</AureakText>
          </Pressable>
        </View>
      )}

      {/* Story 58-8 — Structure de la séance (timeline 3 phases) */}
      {session.methodologySessionId && (
        <View style={styles.card}>
          <AureakText variant="label">Structure de la séance</AureakText>
          {loadingModules ? (
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement des phases…</AureakText>
          ) : (
            <>
              <SessionTimeline
                modules={sessionModules}
                totalDuration={session.durationMinutes ?? 0}
                onEditModule={type => setEditingModule(type)}
              />
              {/* Panel d'édition inline pour le module sélectionné */}
              {editingModule && (
                <View style={{ marginTop: space.md, padding: space.md, backgroundColor: colors.light.muted, borderRadius: 8, gap: space.sm }}>
                  <AureakText variant="label">{MODULE_LABELS[editingModule]}</AureakText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>Durée :</AureakText>
                    {/* Stepper +5/-5 */}
                    {[0, 5, 10, 15, 20, 25, 30].map(v => (
                      <Pressable
                        key={v}
                        style={{
                          paddingHorizontal: space.sm,
                          paddingVertical  : 4,
                          borderRadius     : 6,
                          borderWidth      : 1,
                          borderColor      : (moduleDurations[editingModule] ?? 0) === v ? colors.accent.gold : colors.border.light,
                          backgroundColor  : (moduleDurations[editingModule] ?? 0) === v ? colors.accent.gold + '20' : 'transparent',
                        }}
                        onPress={() => setModuleDurations(prev => ({ ...prev, [editingModule]: v }))}
                      >
                        <AureakText variant="caption" style={{ color: (moduleDurations[editingModule] ?? 0) === v ? colors.accent.gold : colors.text.muted }}>
                          {v} min
                        </AureakText>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xs }}>
                    <Pressable
                      style={{ paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: 6, backgroundColor: colors.accent.gold, opacity: savingModule ? 0.6 : 1 }}
                      onPress={() => handleSaveModule(editingModule, moduleDurations[editingModule] ?? 0)}
                      disabled={savingModule}
                    >
                      <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                        {savingModule ? 'Enregistrement…' : 'Enregistrer'}
                      </AureakText>
                    </Pressable>
                    <Pressable onPress={() => setEditingModule(null)}>
                      <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Story 58-3 — Drop zone exercices depuis bibliothèque méthodologie */}
      <View style={styles.card}>
        <AureakText variant="label">Exercices liés ({sessionSituations.length})</AureakText>

        {/* Situations déjà liées */}
        {sessionSituations.map(sit => (
          <View
            key={sit.id}
            style={{
              paddingVertical  : space.xs,
              paddingHorizontal: space.sm,
              borderRadius     : 6,
              borderWidth      : 1,
              borderColor      : highlightedSitId === sit.id ? colors.accent.gold : colors.border.light,
              backgroundColor  : highlightedSitId === sit.id ? colors.accent.gold + '18' : 'transparent',
              flexDirection    : 'row',
              alignItems       : 'center',
              gap              : space.xs,
            }}
          >
            {sit.method && (
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.border.light }}>
                <AureakText variant="caption" style={{ fontSize: 10 } as never}>{sit.method}</AureakText>
              </View>
            )}
            <AureakText variant="body" style={{ flex: 1 } as never} numberOfLines={1}>{sit.title}</AureakText>
          </View>
        ))}

        {/* Message erreur doublon */}
        {situationDropError && (
          <AureakText variant="caption" style={{ color: colors.accent.red, marginTop: space.xs } as never}>
            {situationDropError}
          </AureakText>
        )}

        {/* Zone de dépôt — div web pour onDragOver/onDrop */}
        {React.createElement('div', {
          onDragOver : handleSituationDragOver,
          onDragLeave: () => setIsDragOver(false),
          onDrop     : handleSituationDrop,
          style      : {
            height         : 80,
            border         : `2px dashed ${isDragOver ? colors.accent.gold : colors.border.goldSolid}`,
            borderRadius   : radius.card,
            backgroundColor: isDragOver ? colors.accent.gold + '10' : 'transparent',
            display        : 'flex',
            alignItems     : 'center',
            justifyContent : 'center',
            marginTop      : space.sm,
            cursor         : 'copy',
          },
        },
          React.createElement(AureakText as never, { variant: 'caption', style: { color: colors.text.muted } },
            addingSituation ? 'Ajout en cours...' : 'Déposer un exercice ici'
          )
        )}
      </View>

      {/* Présences — Stories 54-1/54-2/54-3/54-4 Squad Status Board + 54-5 Validation groupée */}
      <View style={styles.card}>
        {session.groupId ? (
          <>
            {/* Story 54-5 — Header avec compteur + bouton "Tous présents" */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative' as never }}>
              <AureakText variant="label">
                {`Présences (${Object.values(attendanceMap).filter(s => s === 'present').length}/${groupMembers.length} joueurs)`}
              </AureakText>
              {/* Confetti particles */}
              {showConfetti && (
                <View style={{ position: 'absolute' as never, right: 0, top: -10, zIndex: 20, flexDirection: 'row', gap: 4 }} pointerEvents="none">
                  {[colors.accent.gold, colors.status.success, colors.accent.red, colors.accent.gold, colors.status.success, colors.accent.red, colors.accent.gold, colors.status.success].map((c, i) => (
                    <View
                      key={i}
                      style={{
                        width: 8, height: 8, borderRadius: 4,
                        backgroundColor: c,
                        opacity: 0.85,
                        transform: [{ translateY: -(i % 3) * 10 - 5 }],
                      }}
                    />
                  ))}
                </View>
              )}
              {groupMembers.length > 0 && (
                <Pressable
                  style={[
                    ap54.allPresentBtn,
                    (notPresentMembers.length === 0 || allPresentSaving) && ap54.allPresentBtnDisabled,
                  ]}
                  onPress={handleMarkAllPresent}
                  disabled={notPresentMembers.length === 0 || allPresentSaving}
                >
                  <AureakText style={ap54.allPresentBtnText}>
                    {allPresentSaving ? 'En cours…' : notPresentMembers.length === 0 ? '✓ Tous présents ✓' : '✓ Tous présents'}
                  </AureakText>
                </Pressable>
              )}
            </View>

            {/* Story 54-5 — Toast succès */}
            {allPresentToast && (
              <View style={ap54.toast}>
                <AureakText variant="caption" style={ap54.toastText}>{allPresentToast}</AureakText>
              </View>
            )}

            {/* Message d'erreur rollback */}
            {attendanceError && (
              <View style={{
                backgroundColor: colors.status.warning + '25', borderRadius: 6, padding: space.sm,
                borderWidth: 1, borderColor: colors.status.warning + '60',
              }}>
                <AureakText variant="caption" style={{ color: colors.status.warning }}>
                  ⚠ {attendanceError}
                </AureakText>
              </View>
            )}

            {groupMembers.length === 0 ? (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Aucun joueur dans ce groupe
              </AureakText>
            ) : (
              // Story 54-1 — Squad Overview Grid + 54-4 — Zone Retardataires
              <SquadStatusGrid
                members       ={groupMembers}
                attendanceMap ={attendanceMap}
                memberStreaks  ={memberStreaks}
                onStatusChange={handleStatusChange}
                toggling      ={attendanceToggling}
                isMobile      ={isMobile}
              />
            )}
          </>
        ) : (
          <>
            {/* Séance ponctuelle : comportement original AC7 */}
            <AureakText variant="label">Présences ({attendances.length})</AureakText>
            {attendances.map(a => {
              const name = guestNameMap[a.childId] ?? childNameMap[a.childId] ?? a.childId.slice(0, 8) + '…'
              const statusLabel: Record<string, string> = {
                present: 'Présent', absent: 'Absent', late: 'En retard',
                trial: 'Essai', injured: 'Blessé', unconfirmed: 'Non confirmé',
              }
              return (
                <AureakText key={a.id} variant="body">
                  {name} → {statusLabel[a.status] ?? a.status}
                </AureakText>
              )
            })}
            {attendances.length === 0 && (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Aucune présence enregistrée
              </AureakText>
            )}
          </>
        )}
      </View>

      {/* Résultats Quiz — Story 8.6 — FR24 */}
      {session.groupId && (
        <View style={styles.card}>
          <AureakText variant="label">Résultats Quiz</AureakText>

          {loadingQuiz ? (
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              Chargement…
            </AureakText>
          ) : quizResults.length === 0 ? (
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              Aucun quiz complété pour cette séance
            </AureakText>
          ) : (
            <>
              {/* Tableau joueurs */}
              {quizResults.map((r, idx) => (
                <View
                  key={`${r.childId}-${r.themeId}`}
                  style={{
                    flexDirection    : 'row',
                    alignItems       : 'center',
                    justifyContent   : 'space-between',
                    paddingVertical  : space.xs,
                    borderBottomWidth: idx < quizResults.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border.light,
                  }}
                >
                  <AureakText variant="body" style={{ flex: 2 }}>{r.displayName}</AureakText>
                  <AureakText variant="caption" style={{ flex: 2, color: colors.text.muted }}>{r.themeName}</AureakText>
                  <AureakText variant="caption" style={{ flex: 1, textAlign: 'center' as never }}>
                    {r.correctCount}/{r.questionsAnswered}
                  </AureakText>
                  <AureakText variant="caption" style={{ flex: 1, textAlign: 'center' as never }}>
                    {r.masteryPercent != null ? `${r.masteryPercent}%` : '—'}
                  </AureakText>
                  <View style={{ flex: 1, alignItems: 'flex-end' as never }}>
                    <Badge
                      variant={r.masteryStatus === 'acquired' ? 'present' : 'attention'}
                      label={r.masteryStatus === 'acquired' ? 'Acquis' : 'En cours'}
                    />
                  </View>
                </View>
              ))}

              {/* Maîtrise par thème */}
              {(() => {
                const themeMap: Record<string, { name: string; total: number; acquired: number }> = {}
                for (const r of quizResults) {
                  if (!themeMap[r.themeId]) themeMap[r.themeId] = { name: r.themeName, total: 0, acquired: 0 }
                  themeMap[r.themeId].total++
                  if (r.masteryStatus === 'acquired') themeMap[r.themeId].acquired++
                }
                return (
                  <View style={{ marginTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border.divider, paddingTop: space.sm }}>
                    <AureakText variant="label" style={{ marginBottom: space.xs }}>Maîtrise par thème</AureakText>
                    {Object.values(themeMap).map(t => (
                      <View key={t.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                        <AureakText variant="caption">{t.name}</AureakText>
                        <AureakText variant="caption" style={{ color: colors.text.muted }}>
                          {t.acquired}/{t.total} ({Math.round((t.acquired / t.total) * 100)}%)
                        </AureakText>
                      </View>
                    ))}
                  </View>
                )
              })()}
            </>
          )}
        </View>
      )}

      {/* Actions rapides (Story 47.3 + 53-5) — accès direct présences & évaluations & duplication */}
      <View style={styles.card}>
        <AureakText variant="label">Actions rapides</AureakText>
        <View style={styles.row}>
          <Pressable
            style={actSt.quickBtn}
            onPress={() => router.push(`/(admin)/presences?sessionId=${sessionId}` as never)}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' as never }}>
              📋 Gérer les présences
            </AureakText>
          </Pressable>
          <Pressable
            style={actSt.quickBtn}
            onPress={() => router.push(`/(admin)/evaluations?sessionId=${sessionId}` as never)}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' as never }}>
              ⭐ Voir les évaluations
            </AureakText>
          </Pressable>
        </View>
        {/* Story 53-5 — Bouton Dupliquer (masqué si annulée) */}
        {session.status !== 'annulée' && (
          <Pressable
            style={[actSt.quickBtn, { marginTop: space.xs }]}
            onPress={() => {
              const prefill = buildDuplicatePrefill(session, coaches.map(c => c.coachId))
              if (prefill) router.push(`/seances/new?prefill=${prefill}` as never)
            }}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' as never }}>
              ↻ Dupliquer cette séance
            </AureakText>
          </Pressable>
        )}
      </View>

      {/* Actions (Story 13.2) */}
      {session.status === 'planifiée' && (
        <View style={styles.row}>
          <AureakButton
            label="→ Reporter"
            onPress={() => {
              setPostponeDate(session.scheduledAt.split('T')[0])
              setShowPostponeDialog(true)
            }}
            variant="secondary"
          />
          <AureakButton
            label="✕ Annuler la séance"
            onPress={() => setShowCancelDialog(true)}
            variant="danger"
          />
        </View>
      )}
      {session.status === 'en_cours' ? (
        <AureakButton
          label="Annuler la séance"
          onPress={() => setShowCancelDialog(true)}
          variant="danger"
        />
      ) : null}

      {/* Postpone dialog (Story 13.2) */}
      <Modal visible={showPostponeDialog} transparent animationType="fade">
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center', alignItems: 'center', padding: space.xl,
        }}>
          <View style={[styles.card, { width: '100%', maxWidth: 400 }]}>
            <AureakText variant="h3">Reporter la séance</AureakText>
            <AureakText variant="body" style={{ color: colors.text.muted }}>
              Le contenu pédagogique reste inchangé — seule la date change.
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
              Nouvelle date (YYYY-MM-DD) :
            </AureakText>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="2026-04-20"
                value={postponeDate}
                onChangeText={setPostponeDate}
              />
            </View>
            {postponeError ? (
              <AureakText variant="caption" style={{ color: colors.status.errorText }}>
                {postponeError}
              </AureakText>
            ) : null}
            <View style={styles.row}>
              <AureakButton label="Confirmer le report" onPress={handlePostpone} variant="primary" />
              <AureakButton
                label="Annuler"
                onPress={() => { setShowPostponeDialog(false); setPostponeDate(''); setPostponeError('') }}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel dialog */}
      <Modal visible={showCancelDialog} transparent animationType="fade">
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center', alignItems: 'center', padding: space.xl,
        }}>
          <View style={[styles.card, { width: '100%', maxWidth: 400 }]}>
            <AureakText variant="h3">Annuler la séance</AureakText>
            <AureakText variant="body" style={{ color: colors.text.muted }}>
              Le motif est obligatoire et sera communiqué aux parents.
            </AureakText>
            {session?.sessionType && ['goal_and_player','technique','situationnel'].includes(session.sessionType) && (
              <View style={{ backgroundColor: colors.status.warningBg, borderRadius: 6, padding: space.sm }}>
                <AureakText variant="caption" style={{ color: colors.status.warningText, fontWeight: '700' as never }}>
                  ⚠️ Séance avec contenu séquentiel
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.status.warningText }}>
                  Un log d'audit sera créé pour tracer la perte de contenu dans la séquence pédagogique.
                </AureakText>
              </View>
            )}
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="Motif d'annulation..."
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />
            </View>
            {cancelError ? (
              <AureakText variant="caption" style={{ color: colors.accent.red }}>
                {cancelError}
              </AureakText>
            ) : null}
            <View style={styles.row}>
              <AureakButton label="Confirmer" onPress={handleCancel} variant="primary" />
              <AureakButton
                label="Annuler"
                onPress={() => { setShowCancelDialog(false); setCancelReason(''); setCancelError('') }}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
