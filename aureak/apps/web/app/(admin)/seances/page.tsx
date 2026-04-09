'use client'
// Page pilotage séances — vues Jour / Semaine / Mois / Année
// Story 19.4 — Refonte UI/UX : cards visuelles, coaches sans N+1, calendrier mensuel
// Story 47.3 — Hub séances unifié : tabs Séances | Présences | Évaluations
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import {
  listImplantations,
  listAllGroups,
  generateYearSessions,
  listSchoolCalendarExceptions,
  listSessionsAdminView,
  batchResolveCoachNames,
  listAttendancesBySession,
  listChildDirectory,
} from '@aureak/api-client'
import { buildPresenceReportHTML, printReport } from './_utils/generatePresenceReport'
import type { PresenceReportData } from './_utils/generatePresenceReport'
import { useAuthStore } from '@aureak/business-logic'
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

// Story 53-9 — Présets filtres enregistrables
type SeancePreset = {
  id        : string
  label     : string
  period    : PeriodType
  implantId : string
  groupId   : string
  status    : string
  isDefault : boolean
}

const DEFAULT_PRESETS: SeancePreset[] = [
  { id: '__this_week__', label: 'Cette semaine', period: 'week', implantId: '', groupId: '', status: '', isDefault: true },
  { id: '__planifiees__', label: 'Planifiées', period: 'month', implantId: '', groupId: '', status: 'planifiée', isDefault: true },
]

const PRESETS_STORAGE_KEY = 'aureak_seances_presets'

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
    try {
      const result: GenerateYearSessionsResult = await generateYearSessions(
        group.id, group.implantationId, group.tenantId,
        sessionType as never, seasonStart, seasonEnd
      )
      if (result.error) {
        const err = result.error as { code?: string; existingCount?: number }
        setError(err?.code === 'SESSIONS_ALREADY_EXIST'
          ? `${err.existingCount} séances existent déjà. Changez la plage de dates.`
          : 'Erreur lors de la génération.')
      } else {
        onSuccess(result.created)
      }
    } finally {
      setLoading(false)
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
            {(['goal_and_player','technique','situationnel','performance','decisionnel','perfectionnement','integration','equipe'] as const).map(t => (
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

          {error ? (
            <View style={{ backgroundColor: colors.status.errorBg, borderRadius: 6, padding: space.sm, marginBottom: space.sm }}>
              <AureakText variant="caption" style={{ color: colors.status.errorText }}>{error}</AureakText>
            </View>
          ) : null}

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

// ── Hub tabs ────────────────────────────────────────────────────────────────────

const HUB_TABS = [
  { label: 'Séances',      route: '/(admin)/seances'     },
  { label: 'Présences',    route: '/(admin)/presences'   },
  { label: 'Évaluations',  route: '/(admin)/evaluations' },
] as const

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SeancesPage() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()

  // ── Period ──────────────────────────────────────────────────────────────────
  const [period,  setPeriod]  = useState<PeriodType>('month')
  const [refDate, setRefDate] = useState(() => new Date())

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [implantations,   setImplantations]   = useState<Implantation[]>([])
  const [allGroups,       setAllGroups]       = useState<GroupRef[]>([])
  const [filterImplantId, setFilterImplantId] = useState('')
  const [filterGroupId,   setFilterGroupId]   = useState('')
  const [filterStatus,    setFilterStatus]    = useState<string>('')

  // ── Data ────────────────────────────────────────────────────────────────────
  const [sessions,     setSessions]     = useState<SessionRowAdmin[]>([])
  const [coachNameMap, setCoachNameMap] = useState<Map<string, string>>(new Map())
  const [loading,      setLoading]      = useState(true)
  const [toast,        setToast]        = useState<string | null>(null)
  const [genGroup,     setGenGroup]     = useState<GroupRef | null>(null)

  // Story 53-9 — Présets filtres
  const [presets,          setPresets]          = useState<SeancePreset[]>([])
  const [showPresetSave,   setShowPresetSave]   = useState(false)
  const [presetNameInput,  setPresetNameInput]  = useState('')
  const [presetNameError,  setPresetNameError]  = useState<string | null>(null)
  // Story 54-8 — Export PDF hebdomadaire
  const [exportLoading,    setExportLoading]    = useState(false)
  // Story 69-6 — Filtre "Mes séances"
  const [mySessionsOnly,   setMySessionsOnly]   = useState(false)

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
    // Story 53-9 — Charger présets depuis localStorage
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as SeancePreset[]
        setPresets(parsed.filter(p => !p.isDefault))
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[seances/page] presets load error:', err)
    }
  }, [])

  // Story 53-9 — Sauvegarder présets utilisateurs dans localStorage
  useEffect(() => {
    try {
      const userPresets = presets.filter(p => !p.isDefault)
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(userPresets))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[seances/page] presets save error:', err)
    }
  }, [presets])

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

  // ── Client-side status filter ─────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    let result = filterStatus ? sessions.filter(s => s.status === filterStatus) : sessions
    if (mySessionsOnly && user?.id) {
      result = result.filter(s => Array.isArray(s.coaches) && s.coaches.some((c: { coachId: string }) => c.coachId === user.id))
    }
    return result
  }, [sessions, filterStatus, mySessionsOnly, user])

  // Story 53-9 — Détection préset actif
  const allPresets = useMemo(() => [...DEFAULT_PRESETS, ...presets], [presets])
  const activePresetId = useMemo(() => {
    const match = allPresets.find(p =>
      p.period    === period          &&
      p.implantId === filterImplantId &&
      p.groupId   === filterGroupId   &&
      p.status    === filterStatus
    )
    return match?.id ?? null
  }, [allPresets, period, filterImplantId, filterGroupId, filterStatus])

  const applyPreset = (preset: SeancePreset) => {
    setPeriod(preset.period)
    setFilterImplantId(preset.implantId)
    setFilterGroupId(preset.groupId)
    setFilterStatus(preset.status)
    if (preset.period === 'week') setRefDate(new Date())
  }

  const handleSavePreset = () => {
    if (!presetNameInput.trim()) {
      setPresetNameError('Le nom est requis')
      return
    }
    const newPreset: SeancePreset = {
      id       : Date.now().toString(),
      label    : presetNameInput.trim(),
      period   : period,
      implantId: filterImplantId,
      groupId  : filterGroupId,
      status   : filterStatus,
      isDefault: false,
    }
    setPresets(prev => [...prev, newPreset])
    setPresetNameInput('')
    setPresetNameError(null)
    setShowPresetSave(false)
  }

  const handleDeletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id))
  }

  // Story 54-8 — Export PDF présences hebdomadaires
  const handleExportPDF = async () => {
    if (exportLoading || filteredSessions.length === 0) return
    setExportLoading(true)
    try {
      // 1. Pour chaque séance, charger les présences
      const attendanceResults = await Promise.all(
        filteredSessions.map(s => listAttendancesBySession(s.id))
      )

      // 2. Collecter tous les child_ids uniques
      const allChildIds = [...new Set(
        attendanceResults.flatMap(r => (r.data ?? []).map(a => a.childId))
      )]

      // 3. Résoudre les noms depuis child_directory (batch)
      const childNameMap: Record<string, string> = {}
      if (allChildIds.length > 0) {
        const { data: dirEntries } = await listChildDirectory({ pageSize: allChildIds.length + 10 })
        dirEntries.forEach(e => { childNameMap[e.id] = e.displayName })
      }

      // 4. Construire les PresenceReportData
      const reportData: PresenceReportData[] = filteredSessions.map((s, i) => {
        const atts  = attendanceResults[i]?.data ?? []
        const grpId = s.groupId ?? ''
        const grpName = groupMap.get(grpId) ?? ''
        return {
          session    : s,
          groupName  : grpName,
          attendances: atts.map(a => ({
            name  : childNameMap[a.childId] ?? a.childId.slice(0, 8) + '…',
            status: a.status,
          })),
        }
      })

      // 5. Générer + imprimer
      const html = buildPresenceReportHTML(range.label, reportData)
      printReport(html)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[seances/page] handleExportPDF error:', err)
      showToast('Erreur lors du chargement du rapport')
    } finally {
      setExportLoading(false)
    }
  }

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
      {toast ? (
        <View style={st.toast}>
          <AureakText variant="caption" style={{ color: colors.status.successText, fontWeight: '700' }}>{toast}</AureakText>
        </View>
      ) : null}

      {/* ── Header ── */}
      <View style={st.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Séances</AureakText>
          {!loading ? (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {filteredSessions.length}{filterStatus ? `/${sessions.length}` : null} séance{filteredSessions.length !== 1 ? 's' : null} sur la période
            </AureakText>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          {/* Story 54-8 — Export PDF (visible uniquement en vue Semaine) */}
          {period === 'week' && (
            <Pressable
              style={[st.newBtn, {
                backgroundColor: colors.light.surface,
                borderWidth: 1,
                borderColor: colors.border.light,
                opacity: (exportLoading || filteredSessions.length === 0) ? 0.5 : 1,
              }]}
              onPress={handleExportPDF}
              disabled={exportLoading || filteredSessions.length === 0}
            >
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                {exportLoading ? 'Chargement…' : '⬇ Exporter PDF'}
              </AureakText>
            </Pressable>
          )}
          {/* Story 53-8 — Season Planner */}
          <Pressable
            style={[st.newBtn, { backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light }]}
            onPress={() => router.push('/seances/planner' as never)}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
              📅 Planner
            </AureakText>
          </Pressable>
          <Pressable style={st.newBtn} onPress={() => router.push('/seances/new' as never)}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
              + Nouvelle séance
            </AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Hub tabs : Séances | Présences | Évaluations ── */}
      <View style={st.hubTabsRow}>
        {HUB_TABS.map(tab => {
          const active = pathname === tab.route || (tab.route === '/(admin)/seances' && pathname.startsWith('/seances'))
          return (
            <Pressable
              key={tab.route}
              style={[st.hubTab, active && st.hubTabActive]}
              onPress={() => router.push(tab.route as never)}
            >
              <AureakText
                variant="caption"
                style={{ color: active ? colors.accent.gold : colors.text.muted, fontWeight: active ? '700' : '400' }}
              >
                {tab.label}
              </AureakText>
            </Pressable>
          )
        })}
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

      {/* ── Story 53-9 — Section Présets ── */}
      <View style={st.presetsSection}>
        <View style={st.presetsRow}>
          {allPresets.map(preset => {
            const isActive = preset.id === activePresetId
            return (
              <View key={preset.id} style={[st.presetPill, isActive && st.presetPillActive]}>
                <Pressable onPress={() => applyPreset(preset)}>
                  <AureakText style={[st.presetPillText, isActive && st.presetPillTextActive] as never}
                    numberOfLines={1}
                  >
                    {preset.label}
                  </AureakText>
                </Pressable>
                {!preset.isDefault && (
                  <Pressable onPress={() => handleDeletePreset(preset.id)} style={st.presetDeleteBtn}>
                    <AureakText style={st.presetDeleteText}>✕</AureakText>
                  </Pressable>
                )}
              </View>
            )
          })}
          <Pressable
            style={st.presetSaveBtn}
            onPress={() => { setPresetNameInput(''); setPresetNameError(null); setShowPresetSave(true) }}
          >
            <AureakText style={st.presetSaveBtnText}>+ Sauvegarder</AureakText>
          </Pressable>
        </View>

        {/* Modal sauvegarde préset */}
        <Modal visible={showPresetSave} transparent animationType="fade">
          <View style={st.presetOverlay}>
            <View style={st.presetModal}>
              <AureakText variant="body" style={{ fontWeight: '700', marginBottom: space.sm }}>
                Nommer ce préset
              </AureakText>
              <TextInput
                style={st.presetInput}
                value={presetNameInput}
                onChangeText={t => { setPresetNameInput(t); setPresetNameError(null) }}
                placeholder="Ex: U12 cette semaine…"
                placeholderTextColor={colors.text.muted}
                autoFocus
              />
              {presetNameError ? (
                <AureakText variant="caption" style={{ color: colors.accent.red, marginTop: 4 }}>
                  {presetNameError}
                </AureakText>
              ) : null}
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                <Pressable
                  style={[st.presetModalBtn, st.presetModalBtnPrimary]}
                  onPress={handleSavePreset}
                >
                  <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                    Sauvegarder
                  </AureakText>
                </Pressable>
                <Pressable
                  style={st.presetModalBtn}
                  onPress={() => setShowPresetSave(false)}
                >
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      {/* ── Story 69-6 — Toggle "Mes séances" ── */}
      <View style={{ flexDirection: 'row', gap: space.xs, marginBottom: space.sm }}>
        {[false, true].map(val => {
          const isActive = mySessionsOnly === val
          return (
            <Pressable
              key={String(val)}
              onPress={() => setMySessionsOnly(val)}
              style={[st.chip, isActive && st.chipActive]}
            >
              <AureakText style={[st.chipText, isActive && st.chipTextActive] as never}>
                {val ? 'Mes séances' : 'Toutes les séances'}
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
              <AureakText style={[st.chipText, !filterImplantId && st.chipTextActive] as never}>Toutes</AureakText>
            </Pressable>
            {implantations.map(i => (
              <Pressable
                key={i.id}
                style={[st.chip, filterImplantId === i.id && st.chipActive]}
                onPress={() => setFilterImplantId(i.id)}
              >
                <AureakText style={[st.chipText, filterImplantId === i.id && st.chipTextActive] as never}>{i.name}</AureakText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Groupe cascade */}
        {!!filterImplantId && filterGroups.length > 0 && (
          <View style={st.filterSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <AureakText style={st.filterLabel}>Groupe</AureakText>
              {!!filterGroupId && (
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
                <AureakText style={[st.chipText, !filterGroupId && st.chipTextActive] as never}>Tous</AureakText>
              </Pressable>
              {filterGroups.map(g => (
                <Pressable
                  key={g.id}
                  style={[st.chip, filterGroupId === g.id && st.chipActive]}
                  onPress={() => setFilterGroupId(g.id)}
                >
                  <AureakText style={[st.chipText, filterGroupId === g.id && st.chipTextActive] as never}>{g.name}</AureakText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Statut — filtre client */}
        <View style={st.filterSection}>
          <AureakText style={st.filterLabel}>Statut</AureakText>
          <View style={st.chipRow}>
            {[
              { key: '', label: 'Tous' },
              { key: 'planifiée', label: 'Planifiée' },
              { key: 'en_cours',  label: 'En cours' },
              { key: 'réalisée',  label: 'Réalisée' },
              { key: 'annulée',   label: 'Annulée' },
            ].map(({ key, label }) => (
              <Pressable
                key={key}
                style={[st.chip, filterStatus === key && st.chipActive]}
                onPress={() => setFilterStatus(key)}
              >
                <AureakText style={[st.chipText, filterStatus === key && st.chipTextActive] as never}>{label}</AureakText>
              </Pressable>
            ))}
          </View>
        </View>
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

      ) : filteredSessions.length === 0 ? (
        <View style={st.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucune séance</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4, textAlign: 'center' as never }}>
            {filterStatus
              ? `Aucune séance avec le statut "${filterStatus}" sur cette période.`
              : filterImplantId
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
          sessions    ={filteredSessions}
          coachNameMap={coachNameMap}
          groupMap    ={groupMap}
          implantMap  ={implantMap}
          onPress     ={(id) => router.push(`/seances/${id}` as never)}
          onEdit      ={(id) => router.push(`/seances/${id}/edit` as never)}
        />

      ) : period === 'week' ? (
        <WeekView
          sessions    ={filteredSessions}
          weekStart   ={range.start}
          coachNameMap={coachNameMap}
          groupMap    ={groupMap}
          implantMap  ={implantMap}
          onPress     ={(id) => router.push(`/seances/${id}` as never)}
          onEdit      ={(id) => router.push(`/seances/${id}/edit` as never)}
        />

      ) : period === 'month' ? (
        <MonthView
          sessions  ={filteredSessions}
          year      ={refDate.getFullYear()}
          month     ={refDate.getMonth()}
          groupMap  ={groupMap}
          onNavigate={(id) => router.push(`/seances/${id}` as never)}
        />

      ) : (
        <YearView
          sessions    ={filteredSessions}
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

  toast      : { backgroundColor: colors.status.successBg, borderWidth: 1, borderColor: colors.status.success, borderRadius: 8, padding: space.sm },

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

  navBar    : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light, padding: space.sm, boxShadow: shadows.sm },
  navBtn    : { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light },
  navArrow  : { fontSize: 20, color: colors.text.dark, lineHeight: 22 },
  navCenter : { flex: 1, alignItems: 'center', paddingHorizontal: space.sm },
  navLabel  : { fontWeight: '600', color: colors.text.dark, textAlign: 'center' as never },
  navHint   : { fontSize: 9, color: colors.text.muted, marginTop: 1 },

  skeletonWrap: { gap: space.sm },
  skeletonCard: { height: 80, backgroundColor: colors.light.surface, borderRadius: 10, opacity: 0.5, borderWidth: 1, borderColor: colors.border.light },

  emptyState : { backgroundColor: colors.light.surface, borderRadius: 12, padding: space.xxl, alignItems: 'center', borderWidth: 1, borderColor: colors.border.light, boxShadow: shadows.sm },

  hubTabsRow  : { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.border.divider, marginBottom: space.xs },
  hubTab      : { paddingHorizontal: space.md, paddingVertical: space.sm, marginBottom: -2 },
  hubTabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent.gold },

  // Story 53-9 — Présets
  presetsSection  : { gap: space.xs },
  presetsRow      : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' },
  presetPill      : {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.sm, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border.light,
    backgroundColor: colors.light.surface, gap: 4, maxWidth: 180,
  },
  presetPillActive: { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '20' },
  presetPillText  : { fontSize: 11, color: colors.text.muted, flexShrink: 1 },
  presetPillTextActive: { color: colors.text.dark, fontWeight: '700' as never },
  presetDeleteBtn : { padding: 2 },
  presetDeleteText: { fontSize: 9, color: colors.text.muted },
  presetSaveBtn   : {
    paddingHorizontal: space.sm, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border.light,
    backgroundColor: colors.light.surface,
  },
  presetSaveBtnText: { fontSize: 11, color: colors.accent.gold, fontWeight: '600' as never },
  presetOverlay   : { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: space.xl },
  presetModal     : { backgroundColor: colors.light.surface, borderRadius: 12, padding: space.lg, width: '100%', maxWidth: 360 },
  presetInput     : { borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, padding: space.sm, color: colors.text.dark, backgroundColor: colors.light.primary },
  presetModalBtn  : { flex: 1, paddingVertical: space.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center' },
  presetModalBtnPrimary: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
})
