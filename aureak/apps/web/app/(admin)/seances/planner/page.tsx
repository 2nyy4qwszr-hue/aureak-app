'use client'
// Story 53-8 — Season Planner : vue mensuelle charge par groupe
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listImplantations, listAllGroups, listSessionsAdminView } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { Implantation } from '@aureak/types'
import type { SessionRowAdmin } from '@aureak/api-client'
import { TYPE_COLOR, MONTHS_FR } from '../_components/constants'

// ── Types ──────────────────────────────────────────────────────────────────────

type GroupRef = { id: string; name: string; implantationId: string; isTransient: boolean }

// ── Date helpers ───────────────────────────────────────────────────────────────

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Retourne 5 semaines (tableau de lundi) couvrant le mois */
function getMonthWeeks(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const firstMonday = getMondayOfWeek(firstDay)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(firstMonday)
    d.setDate(firstMonday.getDate() + i * 7)
    return d
  })
}

function fmtWeekLabel(monday: Date): string {
  return `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`
}

// ── PlannerCell ────────────────────────────────────────────────────────────────

function PlannerCell({
  sessions, onPress,
}: {
  sessions: SessionRowAdmin[]
  onPress : () => void
}) {
  const count = sessions.length
  if (count === 0) {
    return (
      <Pressable style={pc.cellEmpty} onPress={onPress}>
        <AureakText style={pc.emptydot}>·</AureakText>
      </Pressable>
    )
  }

  const barHeight = count === 1 ? 8 : count === 2 ? 16 : 24
  const bgColor   = count <= 2 ? colors.accent.gold : count === 3 ? '#F59E0B' : (colors.accent.red ?? '#E05252')

  return (
    <Pressable style={[pc.cell, { backgroundColor: bgColor + '18' }]} onPress={onPress}>
      {/* Segments colorés par sessionType */}
      <View style={[pc.barContainer, { height: barHeight }]}>
        {sessions.map((s, i) => {
          const color = (s.sessionType ? (TYPE_COLOR[s.sessionType] ?? colors.accent.gold) : colors.accent.gold)
          return (
            <View
              key={s.id}
              style={[
                pc.segment,
                {
                  backgroundColor: color,
                  flex: 1,
                  borderRightWidth: i < sessions.length - 1 ? 1 : 0,
                  borderRightColor: colors.light.primary,
                },
              ]}
            />
          )
        })}
      </View>
      <AureakText style={pc.countLabel}>{count}</AureakText>
    </Pressable>
  )
}

const pc = StyleSheet.create({
  cellEmpty    : {
    flex: 1, height: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.light.muted,
    borderRadius: 6, borderWidth: 1, borderColor: colors.border.light,
  },
  cell         : {
    flex: 1, height: 48, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light,
    overflow: 'hidden' as never,
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 2,
  },
  barContainer : {
    position: 'absolute' as never, top: 4, left: 4, right: 4,
    flexDirection: 'row', borderRadius: 3, overflow: 'hidden' as never,
  },
  segment      : { height: '100%' as never },
  emptydot     : { fontSize: 20, color: colors.text.muted },
  countLabel   : { fontSize: 10, fontWeight: '700' as never, color: colors.text.dark },
})

// ── Main ───────────────────────────────────────────────────────────────────────

export default function SeasonPlannerPage() {
  const router = useRouter()
  const today  = new Date()

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const [implantations,   setImplantations]   = useState<Implantation[]>([])
  const [allGroups,       setAllGroups]       = useState<GroupRef[]>([])
  const [filterImplantId, setFilterImplantId] = useState('')
  const [sessions,        setSessions]        = useState<SessionRowAdmin[]>([])
  const [loading,         setLoading]         = useState(true)

  // Bootstrap
  useEffect(() => {
    listImplantations().then(({ data }) => setImplantations(data ?? []))
    listAllGroups().then(groups =>
      setAllGroups((groups ?? []).map(g => ({
        id            : g.id,
        name          : g.name,
        implantationId: g.implantationId,
        isTransient   : g.isTransient ?? false,
      })))
    )
  }, [])

  const weeks = useMemo(() => getMonthWeeks(year, month), [year, month])

  // Charger séances du mois
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const monthStart = new Date(year, month, 1)
      const monthEnd   = new Date(year, month + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)
      // Étendre pour couvrir les 5 semaines (peut dépasser le mois)
      const startDate  = new Date(weeks[0])
      const endDate    = new Date(weeks[4])
      endDate.setDate(endDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)

      const { data } = await listSessionsAdminView({
        start          : startDate.toISOString(),
        end            : endDate.toISOString(),
        implantationId : filterImplantId || undefined,
        withCoaches    : false,
      })
      setSessions(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SeasonPlanner] load error:', err)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [year, month, filterImplantId, weeks])

  useEffect(() => { load() }, [load])

  // Groupes affichés (non transients, filtrés par implantation)
  const visibleGroups = useMemo(
    () => allGroups.filter(g =>
      !g.isTransient &&
      (filterImplantId ? g.implantationId === filterImplantId : true)
    ),
    [allGroups, filterImplantId]
  )

  // Index sessions par groupId + weekStart
  const sessionIndex = useMemo(() => {
    const idx: Record<string, Record<string, SessionRowAdmin[]>> = {}
    for (const s of sessions) {
      const sessionDate = new Date(s.scheduledAt)
      // Trouver la semaine (lundi)
      const mon = getMondayOfWeek(sessionDate)
      const key = toDateStr(mon)
      if (!idx[s.groupId]) idx[s.groupId] = {}
      if (!idx[s.groupId][key]) idx[s.groupId][key] = []
      idx[s.groupId][key].push(s)
    }
    return idx
  }, [sessions])

  const monthLabel = `${MONTHS_FR[month]} ${year}`

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const navigateToWeek = (groupId: string, weekMonday: Date) => {
    const weekStr = toDateStr(weekMonday)
    router.push(`/seances?weekStart=${weekStr}&groupId=${groupId}` as never)
  }

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* Header */}
      <View style={st.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Season Planner</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
            Vue mensuelle de la charge par groupe
          </AureakText>
        </View>
        <Pressable
          style={st.backBtn}
          onPress={() => router.push('/seances' as never)}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
            ← Retour aux séances
          </AureakText>
        </Pressable>
      </View>

      {/* Sélecteur implantation */}
      <View style={st.filterSection}>
        <AureakText style={st.filterLabel}>Implantation</AureakText>
        <View style={st.chipRow}>
          <Pressable
            style={[st.chip, !filterImplantId && st.chipActive]}
            onPress={() => setFilterImplantId('')}
          >
            <AureakText style={[st.chipText, !filterImplantId && st.chipTextActive] as never}>Toutes</AureakText>
          </Pressable>
          {implantations.map(i => (
            <Pressable
              key={i.id}
              style={[st.chip, filterImplantId === i.id && st.chipActive]}
              onPress={() => setFilterImplantId(i.id)}
            >
              <AureakText style={[st.chipText, filterImplantId === i.id && st.chipTextActive] as never}>
                {i.name}
              </AureakText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Nav mois */}
      <View style={st.navBar}>
        <Pressable style={st.navBtn} onPress={prevMonth}>
          <AureakText style={st.navArrow}>‹</AureakText>
        </Pressable>
        <AureakText variant="body" style={st.navLabel}>{monthLabel}</AureakText>
        <Pressable style={st.navBtn} onPress={nextMonth}>
          <AureakText style={st.navArrow}>›</AureakText>
        </Pressable>
      </View>

      {/* Légende densité */}
      <View style={st.legend}>
        {[
          { color: colors.accent.gold,        label: '1-2 séances' },
          { color: '#F59E0B',                  label: '3 séances' },
          { color: colors.accent.red ?? '#E05252', label: '4+ séances' },
        ].map(({ color, label }) => (
          <View key={label} style={st.legendItem}>
            <View style={[st.legendDot, { backgroundColor: color }]} />
            <AureakText style={st.legendText}>{label}</AureakText>
          </View>
        ))}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={st.skeletonWrap}>
          {[0, 1, 2, 3].map(i => <View key={i} style={st.skeletonRow} />)}
        </View>
      ) : (
        <View style={st.grid}>
          {/* Header colonnes */}
          <View style={st.gridRow}>
            <View style={st.groupNameCell}>
              <AureakText style={st.headerText}>Groupe</AureakText>
            </View>
            {weeks.map(mon => (
              <View key={toDateStr(mon)} style={st.weekCell}>
                <AureakText style={st.headerText}>Sem.{'\n'}{fmtWeekLabel(mon)}</AureakText>
              </View>
            ))}
          </View>

          {/* Lignes groupes */}
          {visibleGroups.length === 0 ? (
            <View style={st.emptyState}>
              <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center' as never }}>
                Aucun groupe disponible
              </AureakText>
            </View>
          ) : (
            visibleGroups.map(g => (
              <View key={g.id} style={[st.gridRow, st.gridRowData]}>
                <View style={st.groupNameCell}>
                  <AureakText style={st.groupName} numberOfLines={2}>{g.name}</AureakText>
                </View>
                {weeks.map(mon => {
                  const key  = toDateStr(mon)
                  const sArr = sessionIndex[g.id]?.[key] ?? []
                  return (
                    <View key={key} style={st.weekCell}>
                      <PlannerCell
                        sessions={sArr}
                        onPress ={() => navigateToWeek(g.id, mon)}
                      />
                    </View>
                  )
                })}
              </View>
            ))
          )}
        </View>
      )}

    </ScrollView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.light.primary },
  content     : { padding: space.xl, gap: space.md },

  header      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  backBtn     : { backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: 7, paddingHorizontal: space.md, paddingVertical: space.xs + 2 },

  filterSection: { gap: 4 },
  filterLabel  : { fontSize: 9, fontWeight: '700' as never, letterSpacing: 0.8, color: colors.text.muted, textTransform: 'uppercase' as never },
  chipRow      : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip         : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  chipActive   : { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '18' },
  chipText     : { fontSize: 11, color: colors.text.muted },
  chipTextActive: { color: colors.text.dark, fontWeight: '700' as never },

  navBar      : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light, padding: space.sm, boxShadow: shadows.sm } as never,
  navBtn      : { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light },
  navArrow    : { fontSize: 20, color: colors.text.dark, lineHeight: 22 },
  navLabel    : { flex: 1, fontWeight: '600' as never, color: colors.text.dark, textAlign: 'center' as never },

  legend      : { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  legendItem  : { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot   : { width: 10, height: 10, borderRadius: 5 },
  legendText  : { fontSize: 10, color: colors.text.muted },

  grid        : {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xs,
    borderWidth: 1, borderColor: colors.border.light,
    overflow: 'hidden' as never,
    boxShadow: shadows.sm,
  } as never,
  gridRow     : { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  gridRowData : { backgroundColor: colors.light.primary },
  groupNameCell: { width: 100, padding: space.xs, justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.border.divider, backgroundColor: colors.light.surface },
  weekCell    : { flex: 1, padding: 3, justifyContent: 'center' },
  headerText  : { fontSize: 9, fontWeight: '700' as never, color: colors.text.muted, textAlign: 'center' as never },
  groupName   : { fontSize: 11, fontWeight: '600' as never, color: colors.text.dark },

  skeletonWrap: { gap: space.sm },
  skeletonRow : { height: 56, backgroundColor: colors.light.surface, borderRadius: 8, opacity: 0.5, borderWidth: 1, borderColor: colors.border.light },
  emptyState  : { padding: space.lg, alignItems: 'center' },
})
