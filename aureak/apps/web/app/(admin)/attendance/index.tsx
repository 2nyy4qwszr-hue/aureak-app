'use client'
// Story 5.5 — Timeline admin : vue agrégée des présences par séance (Light Premium DA)
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import {
  listSessionsWithAttendance, listImplantations, listAllGroups,
} from '@aureak/api-client'
import type { SessionAttendanceSummary } from '@aureak/api-client'
import type { Implantation, GroupWithMeta } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, transitions } from '@aureak/theme'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()
}

const COMPLETION_CONFIG = {
  complete   : { label: 'Complet',      color: '#66BB6A', bg: '#66BB6A14' },
  partial    : { label: 'En cours',     color: '#4FC3F7', bg: '#4FC3F714' },
  not_started: { label: 'Non démarré',  color: colors.text.muted, bg: colors.light.muted },
}

const SESSION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planifiée: { label: 'Planifiée',  color: colors.text.muted },
  en_cours : { label: 'En cours',   color: '#4FC3F7' },
  fermée   : { label: 'Fermée',     color: '#66BB6A' },
  annulée  : { label: 'Annulée',    color: '#EF5350' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={sc.kpiCard}>
      <AureakText variant="h2" style={{ color: color ?? colors.accent.gold, fontSize: 28, fontWeight: '800' }}>
        {value}
      </AureakText>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, textAlign: 'center' }}>
        {label}
      </AureakText>
    </View>
  )
}

function AttendancePill({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null
  return (
    <View style={[sc.pill, { backgroundColor: color + '14', borderColor: color + '30' }]}>
      <AureakText variant="caption" style={{ color, fontSize: 11, fontWeight: '700' }}>
        {count} {label}
      </AureakText>
    </View>
  )
}

function ProgressBar({ present, total }: { present: number; total: number }) {
  const pct = total > 0 ? (present / total) * 100 : 0
  const barColor = pct >= 80 ? '#66BB6A' : pct >= 50 ? '#4FC3F7' : '#EF5350'
  return (
    <View style={sc.progressTrack}>
      <View style={[sc.progressFill, { width: `${pct}%` as never, backgroundColor: barColor }]} />
    </View>
  )
}

function SessionCard({ s }: { s: SessionAttendanceSummary }) {
  const completion = COMPLETION_CONFIG[s.completionStatus]
  const sessionStatus = SESSION_STATUS_CONFIG[s.status] ?? { label: s.status, color: colors.text.muted }
  const rate = s.totalAttendance > 0 ? Math.round((s.presentCount / s.totalAttendance) * 100) : null

  return (
    <View style={sc.card}>
      {/* Top row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        {/* Date block */}
        <View style={sc.dateBadge}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
            {fmtDay(s.scheduledAt)}
          </AureakText>
          <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 15 }}>
            {new Date(s.scheduledAt).getDate().toString().padStart(2, '0')}
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 9 }}>
            {new Date(s.scheduledAt).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
          </AureakText>
        </View>

        {/* Session info */}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {s.groupName && (
              <AureakText variant="body" style={{ fontWeight: '700', fontSize: 14, color: colors.text.dark }}>
                {s.groupName}
              </AureakText>
            )}
            {s.implantationName && (
              <View style={sc.implantBadge}>
                <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 10 }}>
                  {s.implantationName}
                </AureakText>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
              {fmtTime(s.scheduledAt)} · {s.durationMinutes} min
            </AureakText>
            {s.location && (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
                📍 {s.location}
              </AureakText>
            )}
          </View>
        </View>

        {/* Badges right */}
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          {/* Completion */}
          <View style={[sc.completionBadge, { backgroundColor: completion.bg, borderColor: completion.color + '40' }]}>
            <AureakText variant="caption" style={{ color: completion.color, fontSize: 10, fontWeight: '700' }}>
              {completion.label}
            </AureakText>
          </View>
          {/* Session status (only show if not planifiée) */}
          {s.status !== 'planifiée' && (
            <View style={[sc.statusBadge, { borderColor: sessionStatus.color + '30' }]}>
              <AureakText variant="caption" style={{ color: sessionStatus.color, fontSize: 10 }}>
                {sessionStatus.label}
              </AureakText>
            </View>
          )}
        </View>
      </View>

      {/* Attendance row */}
      {s.totalAttendance > 0 && (
        <View style={{ gap: 6, marginTop: 8 }}>
          {/* Pills */}
          <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <AttendancePill count={s.presentCount}  label="présents"  color="#66BB6A" />
            <AttendancePill count={s.absentCount}   label="absents"   color="#EF5350" />
            <AttendancePill count={s.lateCount}     label="retards"   color="#FFA726" />
            <AttendancePill count={s.injuredCount}  label="blessés"   color="#CE93D8" />
            <AttendancePill count={s.trialCount}    label="essai"     color="#4FC3F7" />
            <AttendancePill count={s.excusedCount}  label="excusés"   color={colors.text.muted} />
            {rate !== null && (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, marginLeft: 'auto' as never }}>
                {rate}% présence
              </AureakText>
            )}
          </View>
          {/* Progress bar */}
          <ProgressBar present={s.presentCount} total={s.totalAttendance} />
        </View>
      )}

      {s.totalAttendance === 0 && s.status !== 'annulée' && (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
          Aucune présence enregistrée
        </AureakText>
      )}
    </View>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [sessions,       setSessions]       = useState<SessionAttendanceSummary[]>([])
  const [implantations,  setImplantations]  = useState<Implantation[]>([])
  const [groups,         setGroups]         = useState<GroupWithMeta[]>([])
  const [loading,        setLoading]        = useState(true)

  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0] as string
  })
  const [to, setTo]     = useState(() => new Date().toISOString().split('T')[0] as string)
  const [implantFilter, setImplantFilter] = useState<string>('all')
  const [groupFilter,   setGroupFilter]   = useState<string>('all')

  // Load filter options once
  useEffect(() => {
    listImplantations().then(r => setImplantations(r.data ?? []))
    listAllGroups().then(r => setGroups(r ?? []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listSessionsWithAttendance({
      from,
      to,
      implantationId: implantFilter !== 'all' ? implantFilter : undefined,
      groupId       : groupFilter   !== 'all' ? groupFilter   : undefined,
    })
    setSessions(data)
    setLoading(false)
  }, [from, to, implantFilter, groupFilter])

  useEffect(() => { load() }, [load])

  // ── Computed KPIs ──
  const totalSessions  = sessions.length
  const totalPresent   = sessions.reduce((acc, s) => acc + s.presentCount, 0)
  const totalAbsent    = sessions.reduce((acc, s) => acc + s.absentCount,  0)
  const totalRecorded  = sessions.reduce((acc, s) => acc + s.totalAttendance, 0)
  const avgRate        = totalRecorded > 0 ? Math.round((totalPresent / totalRecorded) * 100) : 0
  const completeSessions = sessions.filter(s => s.completionStatus === 'complete').length

  // Groups filtered by selected implantation
  const filteredGroups = implantFilter === 'all'
    ? groups
    : groups.filter(g => g.implantationId === implantFilter)

  return (
    <ScrollView style={sc.container} contentContainerStyle={sc.content}>

      {/* ── Header ── */}
      <View style={sc.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Présences</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {totalSessions} séance{totalSessions !== 1 ? 's' : ''} sur la période
            </AureakText>
          )}
        </View>
      </View>

      {/* ── Date filters ── */}
      <View style={sc.filterBlock}>
        <View style={{ flexDirection: 'row', gap: space.md, flexWrap: 'wrap' as never, alignItems: 'flex-end' }}>
          <View style={{ gap: 4 }}>
            <AureakText variant="caption" style={sc.filterLabel}>Du</AureakText>
            <input
              type="date"
              value={from}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
              style={webInputStyle}
            />
          </View>
          <View style={{ gap: 4 }}>
            <AureakText variant="caption" style={sc.filterLabel}>Au</AureakText>
            <input
              type="date"
              value={to}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
              style={webInputStyle}
            />
          </View>
        </View>

        {/* Implantation chips */}
        {implantations.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['all', ...implantations.map(i => i.id)] as string[]).map(id => {
                const active = implantFilter === id
                const label  = id === 'all' ? 'Toutes implantations' : (implantations.find(i => i.id === id)?.name ?? id)
                return (
                  <Pressable
                    key={id}
                    onPress={() => { setImplantFilter(id); setGroupFilter('all') }}
                    style={[sc.chip, { borderColor: active ? colors.accent.gold : colors.border.light, backgroundColor: active ? colors.accent.gold + '18' : 'transparent' }]}
                  >
                    <AureakText variant="caption" style={{ color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>
                      {label}
                    </AureakText>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        )}

        {/* Group chips */}
        {filteredGroups.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['all', ...filteredGroups.map(g => g.id)] as string[]).map(id => {
                const active = groupFilter === id
                const label  = id === 'all' ? 'Tous groupes' : (filteredGroups.find(g => g.id === id)?.name ?? id)
                return (
                  <Pressable
                    key={id}
                    onPress={() => setGroupFilter(id)}
                    style={[sc.chip, { borderColor: active ? colors.accent.gold : colors.border.light, backgroundColor: active ? colors.accent.gold + '18' : 'transparent' }]}
                  >
                    <AureakText variant="caption" style={{ color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>
                      {label}
                    </AureakText>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {/* ── KPIs ── */}
      {!loading && totalSessions > 0 && (
        <View style={sc.kpiRow}>
          <KpiCard value={totalSessions}  label="Séances"       color={colors.accent.gold} />
          <KpiCard value={`${avgRate}%`}  label="Taux présence" color={avgRate >= 75 ? '#66BB6A' : avgRate >= 50 ? '#FFA726' : '#EF5350'} />
          <KpiCard value={totalPresent}   label="Présences"     color="#66BB6A" />
          <KpiCard value={totalAbsent}    label="Absences"      color="#EF5350" />
          <KpiCard value={completeSessions} label="Complètes"   color="#4FC3F7" />
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : sessions.length === 0 ? (
        <View style={sc.empty}>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' }}>
            Aucune séance trouvée sur cette période.
          </AureakText>
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          {sessions.map(s => <SessionCard key={s.sessionId} s={s} />)}
        </View>
      )}

    </ScrollView>
  )
}

// ─── Styles (Light Premium DA) ────────────────────────────────────────────────

const webInputStyle = {
  padding        : '7px 11px',
  borderRadius   : `${radius.xs}px`,
  border         : `1px solid ${colors.border.light}`,
  backgroundColor: colors.light.surface,
  color          : colors.text.dark,
  fontSize       : '13px',
  fontFamily     : 'Geist, sans-serif',
  outline        : 'none',
  transition     : `border-color ${transitions.fast}`,
} as React.CSSProperties

const sc = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.lg, gap: space.md, maxWidth: 900, alignSelf: 'center', width: '100%' },
  header     : { gap: 4 },
  filterBlock: { gap: 10 },
  filterLabel: { color: colors.text.muted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' as never, fontSize: 10 },
  chip       : { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  kpiRow     : {
    flexDirection  : 'row',
    gap            : space.sm,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    flexWrap       : 'wrap' as never,
  },
  kpiCard    : {
    flex          : 1,
    minWidth      : 70,
    alignItems    : 'center',
    gap           : 3,
    paddingVertical: 4,
  },
  card       : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : 0,
  },
  dateBadge  : {
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth       : 46,
    gap            : 1,
    flexShrink     : 0,
  },
  implantBadge: {
    backgroundColor : colors.accent.gold + '12',
    borderRadius    : 6,
    paddingHorizontal: 6,
    paddingVertical : 2,
    borderWidth     : 1,
    borderColor     : colors.accent.gold + '30',
  },
  completionBadge: {
    borderWidth      : 1,
    borderRadius     : 6,
    paddingHorizontal: 7,
    paddingVertical  : 3,
  },
  statusBadge: {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 6,
    paddingHorizontal: 7,
    paddingVertical  : 3,
  },
  pill       : {
    borderWidth      : 1,
    borderRadius     : 20,
    paddingHorizontal: 8,
    paddingVertical  : 3,
  },
  progressTrack: {
    height         : 4,
    backgroundColor: colors.border.divider,
    borderRadius   : 2,
    overflow       : 'hidden' as never,
  },
  progressFill: {
    height        : 4,
    borderRadius  : 2,
  },
  empty      : { padding: space.lg, alignItems: 'center' },
})
