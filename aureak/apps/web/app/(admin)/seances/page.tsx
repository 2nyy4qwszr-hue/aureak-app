'use client'
// Page pilotage séances — vue par période + filtres implantation/groupe
// Vue en cartes organisées par buckets temporels (pas un calendrier classique)
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Modal, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import {
  supabase,
  listImplantations,
  listAllGroups,
  generateYearSessions,
  listSchoolCalendarExceptions,
} from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type { Implantation, SessionType, SchoolCalendarException } from '@aureak/types'
import type { GenerateYearSessionsResult } from '@aureak/api-client'

// ── Types ──────────────────────────────────────────────────────────────────────

type PeriodType = 'week' | '4weeks' | 'month' | 'year'

const PERIOD_OPTIONS: { key: PeriodType; label: string }[] = [
  { key: 'week',   label: 'Semaine'    },
  { key: '4weeks', label: '4 semaines' },
  { key: 'month',  label: 'Mois'       },
  { key: 'year',   label: 'Année'      },
]

const MONTHS_FR    = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

type SessionRow = {
  id                : string
  scheduledAt       : string
  durationMinutes   : number
  status            : string
  location          : string | null
  groupId           : string
  implantationId    : string
  sessionType       : SessionType | null
  cancellationReason: string | null
}

type GroupRef = { id: string; name: string; implantationId: string; tenantId: string }

type Bucket = { key: string; label: string; sessions: SessionRow[] }

const STATUS_LABEL: Record<string, string> = {
  planifiée: 'Planifiée', en_cours: 'En cours', terminée: 'Terminée', annulée: 'Annulée',
}
const STATUS_VARIANT: Record<string, 'gold' | 'present' | 'zinc' | 'attention'> = {
  planifiée: 'gold', en_cours: 'present', terminée: 'zinc', annulée: 'attention',
}
const TYPE_COLOR: Record<string, string> = {
  goal_and_player : methodologyMethodColors['Goal and Player'],
  technique       : methodologyMethodColors['Technique'],
  situationnel    : methodologyMethodColors['Situationnel'],
  decisionnel     : methodologyMethodColors['Décisionnel'],
  perfectionnement: methodologyMethodColors['Perfectionnement'],
  integration     : methodologyMethodColors['Intégration'],
  equipe          : '#94A3B8',
}

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
    case 'week': {
      const start = getWeekStart(ref)
      const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999)
      return { start, end, label: `Sem. du ${fmtDayMonth(start)} au ${fmtDayMonth(end)} ${start.getFullYear()}` }
    }
    case '4weeks': {
      const start = new Date(ref); start.setHours(0, 0, 0, 0)
      const end   = new Date(start); end.setDate(start.getDate() + 27); end.setHours(23, 59, 59, 999)
      return { start, end, label: `${fmtDayMonth(start)} – ${fmtDayMonth(end)} ${start.getFullYear()}` }
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
    case 'week':   d.setDate(d.getDate() + dir * 7);     break
    case '4weeks': d.setDate(d.getDate() + dir * 28);    break
    case 'month':  d.setMonth(d.getMonth() + dir);       break
    case 'year':   d.setFullYear(d.getFullYear() + dir); break
  }
  return d
}

function bucketize(sessions: SessionRow[], period: PeriodType, rangeStart: Date): Bucket[] {
  if (!sessions.length) return []
  switch (period) {
    case 'week': {
      const result: Bucket[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(rangeStart); d.setDate(rangeStart.getDate() + i)
        const key = toDateStr(d)
        const sl  = sessions.filter(s => s.scheduledAt.startsWith(key))
        if (!sl.length) continue
        const raw = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        result.push({ key, label: raw.charAt(0).toUpperCase() + raw.slice(1), sessions: sl })
      }
      return result
    }
    case '4weeks': {
      const result: Bucket[] = []
      for (let i = 0; i < 4; i++) {
        const ws = new Date(rangeStart); ws.setDate(rangeStart.getDate() + i * 7)
        const we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23, 59, 59, 999)
        const sl = sessions.filter(s => { const d = new Date(s.scheduledAt); return d >= ws && d <= we })
        if (!sl.length) continue
        result.push({ key: `w${i}`, label: `Semaine du ${fmtDayMonth(ws)} au ${fmtDayMonth(we)}`, sessions: sl })
      }
      return result
    }
    case 'month': {
      const weekMap = new Map<string, Bucket>()
      for (const s of sessions) {
        const ws  = getWeekStart(new Date(s.scheduledAt))
        const key = toDateStr(ws)
        if (!weekMap.has(key)) {
          const we = new Date(ws); we.setDate(ws.getDate() + 6)
          weekMap.set(key, { key, label: `Sem. du ${fmtDayMonth(ws)} au ${fmtDayMonth(we)}`, sessions: [] })
        }
        weekMap.get(key)!.sessions.push(s)
      }
      return [...weekMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, b]) => b)
    }
    case 'year': {
      const mm = new Map<string, Bucket>()
      for (const s of sessions) {
        const d = new Date(s.scheduledAt)
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!mm.has(k)) mm.set(k, { key: k, label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`, sessions: [] })
        mm.get(k)!.sessions.push(s)
      }
      return [...mm.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, b]) => b)
    }
  }
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
    if (visible) listSchoolCalendarExceptions().then(r => setExceptions(r.data))
  }, [visible])

  const previewCount = useMemo(() => {
    const start = new Date(seasonStart); const end = new Date(seasonEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return null
    const excSet = new Set(exceptions.filter(e => e.isNoSession).map(e => e.date))
    let count = 0; const cur = new Date(start)
    while (cur <= end) {
      if (!excSet.has(cur.toISOString().split('T')[0])) count++
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
  overlay  : { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: space.xl },
  modal    : { backgroundColor: colors.light.surface, borderRadius: 12, padding: space.xl, width: '100%', maxWidth: 480 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 0.8, textTransform: 'uppercase' as never, marginBottom: 4 },
  typeRow  : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.md },
  typeChip : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light },
  dateRow  : { flexDirection: 'row', gap: space.md, marginBottom: space.md },
  input    : { borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs, padding: space.sm, color: colors.text.dark, backgroundColor: colors.light.primary },
  preview  : { backgroundColor: colors.accent.gold + '12', borderRadius: 8, padding: space.sm, marginBottom: space.sm, borderWidth: 1, borderColor: colors.accent.gold + '40' },
  btnRow   : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
  btn      : { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 7, borderWidth: 1, borderColor: colors.border.light },
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
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState<string | null>(null)
  const [genGroup, setGenGroup] = useState<GroupRef | null>(null)

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    listImplantations().then(({ data }) => setImplantations(data ?? []))
    // listAllGroups returns GroupWithMeta[] directly (no wrapping object)
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

  // ── Fetch sessions ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, status, location, group_id, implantation_id, session_type, cancellation_reason')
      .gte('scheduled_at', range.start.toISOString())
      .lte('scheduled_at', range.end.toISOString())
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true })

    if (filterImplantId) query = query.eq('implantation_id', filterImplantId)
    if (filterGroupId)   query = query.eq('group_id', filterGroupId)

    const { data } = await query
    setSessions(((data ?? []) as Record<string, unknown>[]).map(r => ({
      id                : r['id']                  as string,
      scheduledAt       : r['scheduled_at']        as string,
      durationMinutes   : r['duration_minutes']    as number,
      status            : r['status']              as string,
      location          : r['location']            as string | null,
      groupId           : r['group_id']            as string,
      implantationId    : r['implantation_id']     as string,
      sessionType       : r['session_type']        as SessionType | null,
      cancellationReason: r['cancellation_reason'] as string | null,
    })))
    setLoading(false)
  }, [range.start, range.end, filterImplantId, filterGroupId])

  useEffect(() => { load() }, [load])

  // ── Name maps ────────────────────────────────────────────────────────────────
  const implantMap = useMemo(() => new Map(implantations.map(i => [i.id, i.name])), [implantations])
  const groupMap   = useMemo(() => new Map(allGroups.map(g => [g.id, g.name])), [allGroups])

  // ── Buckets ──────────────────────────────────────────────────────────────────
  const buckets = useMemo(() => bucketize(sessions, period, range.start), [sessions, period, range.start])

  // ── Nav helpers ──────────────────────────────────────────────────────────────
  const goPrev      = () => setRefDate(d => navigatePeriod(d, period, -1))
  const goNext      = () => setRefDate(d => navigatePeriod(d, period,  1))
  const goToday     = () => setRefDate(new Date())
  const changePeriod = (p: PeriodType) => { setPeriod(p); setRefDate(new Date()) }

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 4000)
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

        {/* Groupe (cascade — visible uniquement si implantation sélectionnée) */}
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

      ) : sessions.length === 0 ? (
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

      ) : (
        <View style={st.bucketsWrap}>
          {buckets.map(bucket => (
            <View key={bucket.key} style={st.bucket}>

              {/* Bucket header */}
              <View style={st.bucketHeader}>
                <AureakText style={st.bucketLabel}>{bucket.label}</AureakText>
                <View style={st.bucketBadge}>
                  <AureakText style={st.bucketCount}>
                    {bucket.sessions.length} séance{bucket.sessions.length > 1 ? 's' : ''}
                  </AureakText>
                </View>
              </View>

              {/* Session cards */}
              {bucket.sessions.map(s => {
                const d           = new Date(s.scheduledAt)
                const time        = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                const groupName   = groupMap.get(s.groupId)          ?? '—'
                const implantName = implantMap.get(s.implantationId) ?? '—'
                const isCancelled = s.status === 'annulée'
                const typeColor   = s.sessionType ? (TYPE_COLOR[s.sessionType] ?? colors.accent.gold) : colors.border.light

                return (
                  <Pressable
                    key={s.id}
                    style={[st.card, isCancelled && st.cardCancelled, { borderLeftColor: typeColor }]}
                    onPress={() => router.push(`/seances/${s.id}` as never)}
                  >
                    {/* Date block */}
                    <View style={[st.dateBlock, isCancelled && st.dateBlockMuted]}>
                      <AureakText style={[st.dateDay, isCancelled && { color: colors.text.muted }]}>
                        {String(d.getDate()).padStart(2, '0')}
                      </AureakText>
                      <AureakText style={st.dateMonth}>
                        {MONTHS_SHORT[d.getMonth()].toUpperCase()}
                      </AureakText>
                    </View>

                    {/* Main info */}
                    <View style={st.cardBody}>
                      <View style={st.cardRow}>
                        <AureakText style={st.timeText}>{time}</AureakText>
                        <AureakText style={st.durationText}>· {s.durationMinutes} min</AureakText>
                        {s.sessionType && (
                          <View style={[st.typeTag, { borderColor: typeColor + '80', backgroundColor: typeColor + '18' }]}>
                            <AureakText style={[st.typeTagText, { color: typeColor }]}>
                              {SESSION_TYPE_LABELS[s.sessionType]}
                            </AureakText>
                          </View>
                        )}
                      </View>
                      <AureakText style={st.groupText} numberOfLines={1}>{groupName}</AureakText>
                      <AureakText style={st.implantText} numberOfLines={1}>
                        {implantName}{s.location ? ` · ${s.location}` : ''}
                      </AureakText>
                      {isCancelled && s.cancellationReason && (
                        <AureakText style={st.cancelText} numberOfLines={1}>
                          Motif : {s.cancellationReason}
                        </AureakText>
                      )}
                    </View>

                    {/* Status */}
                    <View style={st.cardRight}>
                      <Badge
                        label={STATUS_LABEL[s.status] ?? s.status}
                        variant={STATUS_VARIANT[s.status] ?? 'zinc'}
                      />
                    </View>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </View>
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

  bucketsWrap  : { gap: space.lg },
  bucket       : { gap: space.sm },
  bucketHeader : { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: space.sm },
  bucketLabel  : { flex: 1, fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 0.4, textTransform: 'uppercase' as never },
  bucketBadge  : { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.light.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light },
  bucketCount  : { fontSize: 10, color: colors.text.muted },

  card         : { flexDirection: 'row', backgroundColor: colors.light.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light, borderLeftWidth: 4, overflow: 'hidden', ...shadows.sm },
  cardCancelled: { opacity: 0.65, borderColor: colors.border.divider },

  dateBlock    : { width: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: space.md, backgroundColor: colors.light.muted, gap: 2, borderRightWidth: 1, borderRightColor: colors.border.divider },
  dateBlockMuted: { backgroundColor: colors.light.primary },
  dateDay      : { fontSize: 22, fontWeight: '800' as never, color: colors.accent.gold, lineHeight: 24 },
  dateMonth    : { fontSize: 10, color: colors.text.muted, letterSpacing: 0.5 },

  cardBody     : { flex: 1, padding: space.sm, gap: 3 },
  cardRow      : { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  timeText     : { fontSize: 13, fontWeight: '700' as never, color: colors.text.dark },
  durationText : { fontSize: 11, color: colors.text.muted },
  typeTag      : { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  typeTagText  : { fontSize: 9, fontWeight: '700' as never, letterSpacing: 0.3 },
  groupText    : { fontSize: 13, color: colors.text.dark, fontWeight: '600' as never },
  implantText  : { fontSize: 11, color: colors.text.muted },
  cancelText   : { fontSize: 10, color: '#DC2626', fontStyle: 'italic' as never, marginTop: 2 },

  cardRight    : { paddingHorizontal: space.sm, paddingVertical: space.sm, alignItems: 'flex-end', justifyContent: 'center' },
})
