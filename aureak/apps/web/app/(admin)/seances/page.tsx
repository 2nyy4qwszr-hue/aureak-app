'use client'
// Page pilotage séances — vues Jour / Semaine / Mois / Année
// Story 19.4 — Refonte UI/UX : cards visuelles, coaches sans N+1, calendrier mensuel
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listImplantations,
  listAllGroups,
  generateYearSessions,
  listSchoolCalendarExceptions,
  listSessionsAdminView,
  batchResolveCoachNames,
} from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type { Implantation, SessionType, SchoolCalendarException } from '@aureak/types'
import type { GenerateYearSessionsResult, SessionRowAdmin } from '@aureak/api-client'

import { TYPE_COLOR, MONTHS_FR } from './_components/constants'
import DayView   from './_components/DayView'
import WeekView  from './_components/WeekView'
import MonthView from './_components/MonthView'
import YearView  from './_components/YearView'

// ── Types ──────────────────────────────────────────────────────────────────────

type PeriodType = 'day' | 'week' | 'month' | 'year'

const PERIOD_OPTIONS: { key: PeriodType; label: string }[] = [
  { key: 'day',   label: 'Jour'    },
  { key: 'week',  label: 'Semaine' },
  { key: 'month', label: 'Mois'    },
  { key: 'year',  label: 'Année'   },
]

const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

type GroupRef = { id: string; name: string; implantationId: string; tenantId: string }

// ── Date helpers ───────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtDayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}
function getWeekStart(d: Date): Date {
  const w = new Date(d); const day = w.getDay()
  w.setDate(w.getDate() - (day === 0 ? 6 : day - 1)); w.setHours(0, 0, 0, 0)
  return w
}

type DateRange = { start: Date; end: Date; label: string }

function computeRange(period: PeriodType, ref: Date): DateRange {
  switch (period) {
    case 'day': {
      const start = new Date(ref); start.setHours(0, 0, 0, 0)
      const end   = new Date(ref); end.setHours(23, 59, 59, 999)
      const raw   = ref.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      return { start, end, label: raw.charAt(0).toUpperCase() + raw.slice(1) }
    }
    case 'week': {
      const start = getWeekStart(ref)
      const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999)
      return { start, end, label: `Sem. du ${fmtDayMonth(start)} au ${fmtDayMonth(end)} ${start.getFullYear()}` }
    }
    case 'month': {
      const start = new Date(ref); start.setDate(1); start.setHours(0, 0, 0, 0)
      const end   = new Date(start.getFullYear(), start.getMonth() + 1, 0); end.setHours(23, 59, 59, 999)
      return { start, end, label: `${MONTHS_FR[start.getMonth()]} ${start.getFullYear()}` }
    }
    case 'year': {
      const start = new Date(ref.getFullYear(), 0, 1)
      const end   = new Date(ref.getFullYear(), 11, 31); end.setHours(23, 59, 59, 999)
      return { start, end, label: String(ref.getFullYear()) }
    }
  }
}

function navigatePeriod(ref: Date, period: PeriodType, dir: -1 | 1): Date {
  const d = new Date(ref)
  switch (period) {
    case 'day':   d.setDate(d.getDate() + dir);           break
    case 'week':  d.setDate(d.getDate() + dir * 7);       break
    case 'month': d.setMonth(d.getMonth() + dir);         break
    case 'year':  d.setFullYear(d.getFullYear() + dir);   break
  }
  return d
}

// ── Modal génération annuelle ──────────────────────────────────────────────────

function GenerateModal({
  group, visible, onClose, onSuccess,
}: {
  group    : GroupRef
  visible  : boolean
  onClose  : () => void
  onSuccess: (count: number) => void
}) {
  const currentYear = new Date().getFullYear()
  const [seasonStart,  setSeasonStart ] = useState(`${currentYear}-09-01`)
  const [seasonEnd,    setSeasonEnd   ] = useState(`${currentYear + 1}-06-30`)
  const [sessionType,  setSessionType ] = useState('goal_and_player')
  const [exceptions,   setExceptions  ] = useState<SchoolCalendarException[]>([])
  const [loading,      setLoading     ] = useState(false)
  const [error,        setError       ] = useState<string | null>(null)

  useEffect(() => {
    if (visible) listSchoolCalendarExceptions().then(r => setExceptions(r.data ?? [])).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[seances] listSchoolCalendarExceptions error:', err)
    })
  }, [visible])

  const previewCount = useMemo(() => {
    const start = new Date(seasonStart); const end = new Date(seasonEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return null
    const excSet = new Set(exceptions.filter(e => e.isNoSession).map(e => e.date))
    let count = 0; const cur = new Date(start)
    while (cur <= end) {
      if (!excSet.has(toDateStr(cur))) count++
      cur.setDate(cur.getDate() + 7)
    }
    return count
  }, [seasonStart, seasonEnd, exceptions])

  const handleGenerate = async () => {
    setLoading(true); setError(null)
    const result: GenerateYearSessionsResult = await generateYearSessions(
      group.id, group.implantationId, group.tenantId,
      sessionType as never, seasonStart, seasonEnd
    )
    setLoading(false)
    if (result.error) {
      const err = result.error as { code?: string; existingCount?: number }
      setError(err?.code === 'SESSIONS_ALREADY_EXIST'
        ? `${err.existingCount} séances existent déjà. Changez la plage de dates.`
        : 'Erreur lors de la génération.')
    } else {
      onSuccess(result.created)
    }
  }

  if (!visible) return null

  return (
    <Modal visible transparent animationType="fade">
      <View style={gn.overlay}>
        <View style={gn.modal}>
          <AureakText variant="h3" style={{ marginBottom: 4 }}>Générer les séances</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: space.md }}>
            Groupe : {group.name}
          </AureakText>

          <AureakText style={gn.fieldLabel}>Type pédagogique</AureakText>
          <View style={gn.typeRow}>
            {(['goal_and_player','technique','situationnel','decisionnel','perfectionnement','integration','equipe'] as const).map(t => (
              <Pressable
                key={t}
                style={[gn.typeChip, sessionType === t && { borderColor: TYPE_COLOR[t] ?? colors.accent.gold, backgroundColor: (TYPE_COLOR[t] ?? colors.accent.gold) + '20' }]}
                onPress={() => setSessionType(t)}
              >
                <AureakText style={{ fontSize: 10, color: sessionType === t ? (TYPE_COLOR[t] ?? colors.accent.gold) : colors.text.muted }}>
                  {SESSION_TYPE_LABELS[t]}
                </AureakText>
              </Pressable>
            ))}
          </View>

          <View style={gn.dateRow}>
            <View style={{ flex: 1 }}>
              <AureakText style={gn.fieldLabel}>Début</AureakText>
              <TextInput style={gn.input} value={seasonStart} onChangeText={setSeasonStart} placeholder="YYYY-MM-DD" />
            </View>
            <View style={{ flex: 1 }}>
              <AureakText style={gn.fieldLabel}>Fin</AureakText>
              <TextInput style={gn.input} value={seasonEnd} onChangeText={setSeasonEnd} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          {previewCount !== null && (
            <View style={gn.preview}>
              <AureakText variant="body" style={{ color: colors.accent.gold, fontWeight: '700' }}>
                ≈ {previewCount} séances seront créées
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {exceptions.filter(e => e.isNoSession).length} jours exclus (vacances scolaires)
              </AureakText>
            </View>
          )}

          {error && (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 6, padding: space.sm, marginBottom: space.sm }}>
              <AureakText variant="caption" style={{ color: '#DC2626' }}>{error}</AureakText>
            </View>
          )}

          <View style={gn.btnRow}>
            <Pressable
              style={[gn.btn, gn.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={handleGenerate}
              disabled={loading}
            >
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                {loading ? 'Génération…' : 'Confirmer'}
              </AureakText>
            </Pressable>
            <Pressable style={gn.btn} onPress={onClose}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const gn = StyleSheet.create({
  overlay   : { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: space.xl },
  modal     : { backgroundColor: colors.light.surface, borderRadius: 12, padding: space.xl, width: '100%', maxWidth: 480 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 0.8, textTransform: 'uppercase' as never, marginBottom: 4 },
  typeRow   : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.md },
  typeChip  : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light },
  dateRow   : { flexDirection: 'row', gap: space.md, marginBottom: space.md },
  input     : { borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, padding: space.sm, color: colors.text.dark, backgroundColor: colors.light.primary },
  preview   : { backgroundColor: colors.accent.gold + '12', borderRadius: 8, padding: space.sm, marginBottom: space.sm, borderWidth: 1, borderColor: colors.accent.gold + '40' },
  btnRow    : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
  btn       : { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 7, borderWidth: 1, borderColor: colors.border.light },
  btnPrimary: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
})

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SeancesPage() {
  const router = useRouter()

  // ── Period ──────────────────────────────────────────────────────────────────
  const [period,  setPeriod]  = useState<PeriodType>('month')
  const [refDate, setRefDate] = useState(() => new Date())

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [implantations,   setImplantations]   = useState<Implantation[]>([])
  const [allGroups,       setAllGroups]       = useState<GroupRef[]>([])
  const [filterImplantId, setFilterImplantId] = useState('')
  const [filterGroupId,   setFilterGroupId]   = useState('')

  // ── Data ────────────────────────────────────────────────────────────────────
  const [sessions,     setSessions]     = useState<SessionRowAdmin[]>([])
  const [coachNameMap, setCoachNameMap] = useState<Map<string, string>>(new Map())
  const [loading,      setLoading]      = useState(true)
  const [toast,        setToast]        = useState<string | null>(null)
  const [genGroup,     setGenGroup]     = useState<GroupRef | null>(null)

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    listImplantations().then(({ data }) => setImplantations(data ?? []))
    listAllGroups().then(groups =>
      setAllGroups((groups ?? []).map(g => ({
        id            : g.id,
        name          : g.name,
        implantationId: g.implantationId,
        tenantId      : g.tenantId,
      })))
    )
  }, [])

  // ── Groups for filter cascade ────────────────────────────────────────────────
  const filterGroups = useMemo(
    () => filterImplantId ? allGroups.filter(g => g.implantationId === filterImplantId) : [],
    [filterImplantId, allGroups]
  )

  // Reset group filter when implantation changes
  useEffect(() => { setFilterGroupId('') }, [filterImplantId])

  // ── Date range ───────────────────────────────────────────────────────────────
  const range = useMemo(() => computeRange(period, refDate), [period, refDate])

  // ── Fetch sessions (sans N+1) ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const withCoaches = period === 'day' || period === 'week'

      const { data } = await listSessionsAdminView({
        start          : range.start.toISOString(),
        end            : range.end.toISOString(),
        implantationId : filterImplantId || undefined,
        groupId        : filterGroupId   || undefined,
        withCoaches,
      })

      setSessions(data)

      // Résolution des noms de coaches en une seule requête batch
      if (withCoaches && data.length > 0) {
        const allCoachIds = [...new Set(data.flatMap(s => s.coaches.map(c => c.coachId)))]
        if (allCoachIds.length > 0) {
          const map = await batchResolveCoachNames(allCoachIds)
          setCoachNameMap(map)
        } else {
          setCoachNameMap(new Map())
        }
      } else {
        setCoachNameMap(new Map())
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[seances/page] load error:', err)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [range.start, range.end, filterImplantId, filterGroupId, period])

  useEffect(() => { load() }, [load])

  // ── Name maps ────────────────────────────────────────────────────────────────
  const implantMap = useMemo(() => new Map(implantations.map(i => [i.id, i.name])), [implantations])
  const groupMap   = useMemo(() => new Map(allGroups.map(g => [g.id, g.name])), [allGroups])

  // ── Nav helpers ──────────────────────────────────────────────────────────────
  const goPrev      = () => setRefDate(d => navigatePeriod(d, period, -1))
  const goNext      = () => setRefDate(d => navigatePeriod(d, period,  1))
  const goToday     = () => setRefDate(new Date())

  const changePeriod = (p: PeriodType) => {
    setPeriod(p)
    setRefDate(new Date())
  }

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 4000)
  }

  // YearView → MonthView
  const handleMonthClick = (monthIndex: number) => {
    const d = new Date(refDate.getFullYear(), monthIndex, 1)
    setPeriod('month')
    setRefDate(d)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* Toast */}
      {toast && (
        <View style={st.toast}>
          <AureakText variant="caption" style={{ color: '#065F46', fontWeight: '700' }}>{toast}</AureakText>
        </View>
      )}

      {/* ── Header ── */}
      <View style={st.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Séances</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {sessions.length} séance{sessions.length !== 1 ? 's' : ''} sur la période
            </AureakText>
          )}
        </View>
        <Pressable style={st.newBtn} onPress={() => router.push('/seances/new' as never)}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            + Nouvelle séance
          </AureakText>
        </Pressable>
      </View>

      {/* ── Period selector ── */}
      <View style={st.periodRow}>
        {PERIOD_OPTIONS.map(({ key, label }) => {
          const active = period === key
          return (
            <Pressable
              key={key}
              style={[st.periodTab, active && st.periodTabActive]}
              onPress={() => changePeriod(key)}
            >
              <AureakText
                variant="caption"
                style={{ color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '700' : '400' }}
              >
                {label}
              </AureakText>
            </Pressable>
          )
        })}
      </View>

      {/* ── Filters ── */}
      <View style={st.filtersWrap}>
        {/* Implantation */}
        <View style={st.filterSection}>
          <AureakText style={st.filterLabel}>Implantation</AureakText>
          <View style={st.chipRow}>
            <Pressable
              style={[st.chip, !filterImplantId && st.chipActive]}
              onPress={() => { setFilterImplantId(''); setFilterGroupId('') }}
            >
              <AureakText style={[st.chipText, !filterImplantId && st.chipTextActive]}>Toutes</AureakText>
            </Pressable>
            {implantations.map(i => (
              <Pressable
                key={i.id}
                style={[st.chip, filterImplantId === i.id && st.chipActive]}
                onPress={() => setFilterImplantId(i.id)}
              >
                <AureakText style={[st.chipText, filterImplantId === i.id && st.chipTextActive]}>{i.name}</AureakText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Groupe cascade */}
        {filterImplantId && filterGroups.length > 0 && (
          <View style={st.filterSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <AureakText style={st.filterLabel}>Groupe</AureakText>
              {filterGroupId && (
                <Pressable
                  style={st.generateBtn}
                  onPress={() => {
                    const g = allGroups.find(g => g.id === filterGroupId)
                    if (g) setGenGroup(g)
                  }}
                >
                  <AureakText style={{ fontSize: 10, color: colors.text.dark, fontWeight: '700' }}>
                    ⚡ Générer les séances
                  </AureakText>
                </Pressable>
              )}
            </View>
            <View style={st.chipRow}>
              <Pressable
                style={[st.chip, !filterGroupId && st.chipActive]}
                onPress={() => setFilterGroupId('')}
              >
                <AureakText style={[st.chipText, !filterGroupId && st.chipTextActive]}>Tous</AureakText>
              </Pressable>
              {filterGroups.map(g => (
                <Pressable
                  key={g.id}
                  style={[st.chip, filterGroupId === g.id && st.chipActive]}
                  onPress={() => setFilterGroupId(g.id)}
                >
                  <AureakText style={[st.chipText, filterGroupId === g.id && st.chipTextActive]}>{g.name}</AureakText>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ── Period navigation ── */}
      <View style={st.navBar}>
        <Pressable style={st.navBtn} onPress={goPrev}>
          <AureakText style={st.navArrow}>‹</AureakText>
        </Pressable>
        <Pressable style={st.navCenter} onPress={goToday}>
          <AureakText variant="body" style={st.navLabel}>{range.label}</AureakText>
          <AureakText style={st.navHint}>Appuyer pour revenir à aujourd'hui</AureakText>
        </Pressable>
        <Pressable style={st.navBtn} onPress={goNext}>
          <AureakText style={st.navArrow}>›</AureakText>
        </Pressable>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={st.skeletonWrap}>
          {[0,1,2,3].map(i => <View key={i} style={st.skeletonCard} />)}
        </View>

      ) : sessions.length === 0 && period !== 'month' && period !== 'year' ? (
        <View style={st.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucune séance</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4, textAlign: 'center' as never }}>
            {filterImplantId
              ? 'Aucune séance pour cette sélection sur la période.'
              : 'Aucune séance sur cette période.'}
          </AureakText>
          <Pressable
            style={[st.newBtn, { marginTop: space.md }]}
            onPress={() => router.push('/seances/new' as never)}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
              + Créer une séance
            </AureakText>
          </Pressable>
        </View>

      ) : period === 'day' ? (
        <DayView
          sessions    ={sessions}
          coachNameMap={coachNameMap}
          groupMap    ={groupMap}
          implantMap  ={implantMap}
          onPress     ={(id) => router.push(`/seances/${id}` as never)}
          onEdit      ={(id) => router.push(`/seances/${id}/edit` as never)}
        />

      ) : period === 'week' ? (
        <WeekView
          sessions    ={sessions}
          weekStart   ={range.start}
          coachNameMap={coachNameMap}
          groupMap    ={groupMap}
          implantMap  ={implantMap}
          onPress     ={(id) => router.push(`/seances/${id}` as never)}
          onEdit      ={(id) => router.push(`/seances/${id}/edit` as never)}
        />

      ) : period === 'month' ? (
        <MonthView
          sessions  ={sessions}
          year      ={refDate.getFullYear()}
          month     ={refDate.getMonth()}
          groupMap  ={groupMap}
          onNavigate={(id) => router.push(`/seances/${id}` as never)}
        />

      ) : (
        <YearView
          sessions    ={sessions}
          year        ={refDate.getFullYear()}
          onMonthClick={handleMonthClick}
        />
      )}

      {/* ── Modal génération année ── */}
      {genGroup && (
        <GenerateModal
          group={genGroup}
          visible
          onClose={() => setGenGroup(null)}
          onSuccess={(count) => {
            setGenGroup(null)
            showToast(`✅ ${count} séances créées avec succès !`)
            load()
          }}
        />
      )}

    </ScrollView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.md },

  toast      : { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 8, padding: space.sm },

  header     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  newBtn     : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 7 },

  periodRow      : { flexDirection: 'row', gap: space.xs, paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  periodTab      : { paddingHorizontal: space.sm + 2, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light },
  periodTabActive: { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '18' },

  filtersWrap  : { gap: space.sm },
  filterSection: { gap: 4 },
  filterLabel  : { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted, textTransform: 'uppercase' as never },
  generateBtn  : { backgroundColor: colors.accent.gold + '20', borderWidth: 1, borderColor: colors.accent.gold, paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: 6 },
  chipRow      : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip         : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
  chipActive   : { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '18' },
  chipText     : { fontSize: 11, color: colors.text.muted },
  chipTextActive: { color: colors.text.dark, fontWeight: '700' as never },

  navBar    : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light, padding: space.sm, ...shadows.sm },
  navBtn    : { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light },
  navArrow  : { fontSize: 20, color: colors.text.dark, lineHeight: 22 },
  navCenter : { flex: 1, alignItems: 'center', paddingHorizontal: space.sm },
  navLabel  : { fontWeight: '600', color: colors.text.dark, textAlign: 'center' as never },
  navHint   : { fontSize: 9, color: colors.text.muted, marginTop: 1 },

  skeletonWrap: { gap: space.sm },
  skeletonCard: { height: 80, backgroundColor: colors.light.surface, borderRadius: 10, opacity: 0.5, borderWidth: 1, borderColor: colors.border.light },

  emptyState : { backgroundColor: colors.light.surface, borderRadius: 12, padding: space.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border.light, ...shadows.sm },
})
