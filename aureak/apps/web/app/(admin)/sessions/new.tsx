'use client'
// Planificateur de sessions — Nouvelle séance
// Terminologie : session = occurrence terrain d'un groupe (groupe + date(s) + coaches + contenu)
// À distinguer du "contenu d'entraînement" = thème pédagogique lié à la session
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listImplantations, listGroupsByImplantation, listGroupStaff,
  listAvailableCoaches, createSession, assignCoach,
  addSessionTheme, listThemes,
  prefillSessionAttendees,
  supabase,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Implantation, Group, GroupStaffWithName, Theme } from '@aureak/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const TERRAINS   = ['Terrain A', 'Terrain B', 'Terrain C', 'Terrain D', 'Extérieur', 'Salle', 'Autre…']
const HOURS      = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const MINUTES    = [0, 15, 30, 45]
const DURATIONS  = [45, 60, 75, 90, 105, 120]
const DAYS_FR    = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAYS_LONG  = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS_FR  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

type Step = 1 | 2 | 3 | 4

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateFull(str: string): string {
  const [y, m, d] = str.split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return `${DAYS_LONG[day]} ${d} ${MONTHS_FR[m - 1]} ${y}`
}

function formatDateShort(str: string): string {
  const [, m, d] = str.split('-').map(Number)
  return `${d} ${MONTHS_FR[m - 1].slice(0, 4)}.`
}

// ── SearchableSelect ───────────────────────────────────────────────────────────

type SelectOption = { id: string; label: string }

function SearchableSelect({
  options, value, onSelect, placeholder, disabled = false, zBase = 10,
}: {
  options    : SelectOption[]
  value      : string
  onSelect   : (id: string) => void
  placeholder: string
  disabled?  : boolean
  zBase?     : number
}) {
  const [open, setOpen] = useState(false)
  const [q,    setQ]    = useState('')

  const filtered = options.filter(o => !q || o.label.toLowerCase().includes(q.toLowerCase()))
  const selected = options.find(o => o.id === value)

  return (
    <View style={[ss.wrap, { zIndex: open ? zBase + 100 : zBase }]}>
      <Pressable
        style={[ss.trigger, disabled && ss.triggerDisabled]}
        onPress={() => { if (!disabled) { setOpen(v => !v); setQ('') } }}
      >
        <AureakText
          variant="body"
          style={{ flex: 1, color: selected ? colors.text.primary : colors.text.secondary, fontSize: 13 }}
        >
          {selected?.label ?? placeholder}
        </AureakText>
        <AureakText style={{ color: open ? colors.accent.gold : colors.text.secondary, fontSize: 11, marginLeft: space.xs }}>
          {open ? '▴' : '▾'}
        </AureakText>
      </Pressable>

      {open && (
        <View style={[ss.dropdown, { zIndex: zBase + 200 }]}>
          <TextInput
            style={ss.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher…"
            placeholderTextColor={colors.text.secondary}
            autoFocus
          />
          <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filtered.map(o => (
              <Pressable
                key={o.id}
                style={[ss.option, o.id === value && ss.optionActive]}
                onPress={() => { onSelect(o.id); setOpen(false); setQ('') }}
              >
                <AureakText variant="body" style={{ color: o.id === value ? colors.accent.gold : colors.text.primary, fontSize: 13 }}>
                  {o.label}
                </AureakText>
              </Pressable>
            ))}
            {filtered.length === 0 && (
              <View style={ss.option}>
                <AureakText variant="caption" style={{ color: colors.text.secondary }}>Aucun résultat</AureakText>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const ss = StyleSheet.create({
  wrap         : { position: 'relative' as never },
  trigger      : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.surface, borderWidth: 1, borderColor: colors.accent.zinc, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: space.sm + 2, minHeight: 44 },
  triggerDisabled: { opacity: 0.45 },
  dropdown     : {
    position: 'absolute' as never, top: '105%' as never, left: 0, right: 0,
    backgroundColor: colors.background.elevated,
    borderWidth: 1, borderColor: colors.accent.gold + '50',
    borderRadius: 8, marginTop: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.5)' } as never : {}),
  },
  searchInput  : { borderBottomWidth: 1, borderBottomColor: colors.accent.zinc, paddingHorizontal: space.md, paddingVertical: space.sm, color: colors.text.primary, fontSize: 13 },
  option       : { paddingHorizontal: space.md, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.accent.zinc + '25' },
  optionActive : { backgroundColor: colors.background.surface },
})

// ── MiniCalendar ───────────────────────────────────────────────────────────────

function MiniCalendar({
  selected, onToggle, onClear, singleMode,
}: {
  selected  : string[]
  onToggle  : (d: string) => void
  onClear   : () => void
  singleMode: boolean
}) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const todayStr = toDateStr(today)
  const first    = new Date(viewYear, viewMonth, 1)
  const last     = new Date(viewYear, viewMonth + 1, 0)
  const offset   = first.getDay()
  const cells    : (Date | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(viewYear, viewMonth, d))

  const prevM = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextM = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  return (
    <View style={mc.container}>
      {/* Month nav */}
      <View style={mc.header}>
        <Pressable style={mc.navBtn} onPress={prevM}>
          <AureakText style={{ color: colors.text.primary, fontSize: 20, lineHeight: 24 }}>‹</AureakText>
        </Pressable>
        <AureakText variant="body" style={{ color: colors.text.primary, fontWeight: '700' as never }}>
          {MONTHS_FR[viewMonth]} {viewYear}
        </AureakText>
        <Pressable style={mc.navBtn} onPress={nextM}>
          <AureakText style={{ color: colors.text.primary, fontSize: 20, lineHeight: 24 }}>›</AureakText>
        </Pressable>
      </View>

      {/* Day-of-week header */}
      <View style={mc.weekRow}>
        {DAYS_FR.map(d => (
          <View key={d} style={mc.dayLabel}>
            <AureakText style={{ fontSize: 10, color: colors.text.secondary, fontWeight: '700' as never }}>{d}</AureakText>
          </View>
        ))}
      </View>

      {/* Date grid */}
      <View style={mc.grid}>
        {cells.map((date, idx) => {
          if (!date) return <View key={`e${idx}`} style={mc.cell} />
          const str     = toDateStr(date)
          const isSel   = selected.includes(str)
          const isToday = str === todayStr
          return (
            <Pressable
              key={str}
              style={[mc.cell, isSel && mc.cellSel, isToday && !isSel && mc.cellToday]}
              onPress={() => onToggle(str)}
            >
              <AureakText style={[
                mc.cellText,
                isSel   && { color: colors.text.dark, fontWeight: '700' as never },
                isToday && !isSel && { color: colors.accent.gold },
              ] as never}>
                {date.getDate()}
              </AureakText>
            </Pressable>
          )
        })}
      </View>

      {/* Selected summary */}
      {selected.length > 0 && (
        <View style={mc.footer}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, flex: 1 }}>
            {singleMode
              ? `📅 ${formatDateFull(selected[0])}`
              : `📅 ${selected.length} date${selected.length > 1 ? 's' : ''} · ${[...selected].sort().map(formatDateShort).join(', ')}`
            }
          </AureakText>
          <Pressable onPress={onClear} style={mc.clearBtn}>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>✕ Effacer</AureakText>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const mc = StyleSheet.create({
  container: { backgroundColor: colors.background.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.accent.zinc, overflow: 'hidden' },
  header   : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.accent.zinc, backgroundColor: colors.background.elevated },
  navBtn   : { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  weekRow  : { flexDirection: 'row', backgroundColor: colors.background.elevated + 'AA', borderBottomWidth: 1, borderBottomColor: colors.accent.zinc + '40' },
  dayLabel : { flex: 1, alignItems: 'center', paddingVertical: 6 },
  grid     : { flexDirection: 'row', flexWrap: 'wrap', padding: 4 },
  cell     : { width: `${100 / 7}%` as never, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellSel  : { backgroundColor: colors.accent.gold },
  cellToday: { borderWidth: 1.5, borderColor: colors.accent.gold },
  cellText : { fontSize: 13, color: colors.text.primary },
  footer   : { flexDirection: 'row', alignItems: 'center', padding: space.sm, borderTopWidth: 1, borderTopColor: colors.accent.zinc, backgroundColor: colors.background.elevated + '70', gap: space.sm },
  clearBtn : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: colors.accent.zinc },
})

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEP_LABELS: [string, string][] = [
  ['1', 'Groupe'],
  ['2', 'Dates'],
  ['3', 'Détails'],
  ['4', 'Résumé'],
]

function StepBar({ current }: { current: Step }) {
  return (
    <View style={sb.row}>
      {STEP_LABELS.map(([n, label], i) => {
        const num    = (i + 1) as Step
        const done   = num < current
        const active = num === current
        return (
          <React.Fragment key={n}>
            <View style={sb.item}>
              <View style={[sb.dot, done && sb.dotDone, active && sb.dotActive]}>
                <AureakText style={{ fontSize: 11, fontWeight: '700' as never, color: (done || active) ? colors.text.dark : colors.text.secondary }}>
                  {done ? '✓' : n}
                </AureakText>
              </View>
              <AureakText style={{ fontSize: 10, color: active ? colors.accent.gold : done ? colors.text.primary : colors.text.secondary, marginTop: 3 }}>
                {label}
              </AureakText>
            </View>
            {i < STEP_LABELS.length - 1 && (
              <View style={[sb.line, done && sb.lineDone]} />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

const sb = StyleSheet.create({
  row     : { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  item    : { alignItems: 'center', gap: 2 },
  dot     : { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background.surface, borderWidth: 1, borderColor: colors.accent.zinc, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  dotDone  : { backgroundColor: colors.text.primary, borderColor: colors.text.primary },
  line    : { flex: 1, height: 1, backgroundColor: colors.accent.zinc, marginBottom: 14 },
  lineDone: { backgroundColor: colors.text.primary },
})

// ── Chip group ─────────────────────────────────────────────────────────────────

function ChipPicker({ options, value, onSelect }: { options: string[]; value: string; onSelect: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
      {options.map(o => {
        const active = value === o
        return (
          <Pressable key={o} style={[cp.chip, active && cp.chipActive]} onPress={() => onSelect(o)}>
            <AureakText style={{ fontSize: 12, color: active ? colors.text.dark : colors.text.secondary, fontWeight: active ? '600' as never : '400' as never }}>
              {o}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

function NumChips({ values, selected, onSelect, fmt }: { values: number[]; selected: number; onSelect: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
      {values.map(v => {
        const active = selected === v
        return (
          <Pressable key={v} style={[cp.chip, active && cp.chipActive]} onPress={() => onSelect(v)}>
            <AureakText style={{ fontSize: 12, color: active ? colors.text.dark : colors.text.secondary, fontWeight: active ? '600' as never : '400' as never }}>
              {fmt(v)}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

const cp = StyleSheet.create({
  chip      : { paddingHorizontal: space.sm + 2, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.accent.zinc, backgroundColor: colors.background.surface },
  chipActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
})

// ── Group summary card ─────────────────────────────────────────────────────────

function GroupCard({
  group, implantationName, staff,
}: { group: Group; implantationName: string; staff: GroupStaffWithName[] }) {
  const lead = staff.find(s => s.role === 'principal')
  const asst = staff.find(s => s.role === 'assistant')
  const hour = group.startHour !== null
    ? `${String(group.startHour).padStart(2, '0')}h${String(group.startMinute ?? 0).padStart(2, '0')}`
    : null

  return (
    <View style={gc.card}>
      <View style={gc.stripe} />
      <View style={gc.body}>
        <View style={gc.row}>
          <AureakText variant="body" style={{ fontWeight: '700' as never, color: colors.text.primary, fontSize: 14 }}>{group.name}</AureakText>
          {group.method && (
            <View style={gc.methodTag}>
              <AureakText style={{ fontSize: 10, color: colors.accent.gold, fontWeight: '600' as never }}>{group.method}</AureakText>
            </View>
          )}
        </View>
        <AureakText variant="caption" style={{ color: colors.text.secondary }}>{implantationName}</AureakText>
        <View style={gc.row}>
          {hour && <AureakText variant="caption" style={{ color: colors.text.secondary }}>⏱ {hour}</AureakText>}
          {group.durationMinutes && <AureakText variant="caption" style={{ color: colors.text.secondary, marginLeft: space.sm }}>· {group.durationMinutes} min</AureakText>}
        </View>
        {(lead || asst) && (
          <View style={gc.row}>
            {lead && <AureakText variant="caption" style={{ color: colors.text.secondary }}>👤 {lead.coachName}</AureakText>}
            {asst && <AureakText variant="caption" style={{ color: colors.text.secondary, marginLeft: space.sm }}>· Asst: {asst.coachName}</AureakText>}
          </View>
        )}
      </View>
    </View>
  )
}

const gc = StyleSheet.create({
  card     : { flexDirection: 'row', backgroundColor: colors.background.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.accent.zinc, overflow: 'hidden' },
  stripe   : { width: 3, backgroundColor: colors.accent.gold },
  body     : { flex: 1, padding: space.md, gap: 4 },
  row      : { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.xs },
  methodTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.accent.gold + '18', borderWidth: 1, borderColor: colors.accent.gold + '40' },
})

// ── Section label ──────────────────────────────────────────────────────────────

function SectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ marginBottom: space.xs }}>
      <AureakText style={{ fontSize: 10, fontWeight: '700' as never, letterSpacing: 0.8, color: colors.text.secondary, textTransform: 'uppercase' as never }}>
        {title}
      </AureakText>
      {hint && <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11, marginTop: 2 }}>{hint}</AureakText>}
    </View>
  )
}

// ── Summary row ────────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <View style={sr.row}>
      <AureakText style={sr.label}>{label}</AureakText>
      <AureakText style={sr.value}>{value}</AureakText>
    </View>
  )
}
const sr = StyleSheet.create({
  row  : { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.accent.zinc + '25' },
  label: { width: 130, fontSize: 11, color: colors.text.secondary, paddingTop: 1 },
  value: { flex: 1, fontSize: 13, color: colors.text.primary },
})

// ── Main page ──────────────────────────────────────────────────────────────────

export default function NewSessionPage() {
  const router = useRouter()
  const { session } = useAuthStore()

  // ── Step 1 — Groupe ──────────────────────────────────────────
  const [step,                setStep]                = useState<Step>(1)
  const [implantations,       setImplantations]       = useState<Implantation[]>([])
  const [loadingImplantations,setLoadingImplantations]= useState(true)
  const [implantationsError,  setImplantationsError]  = useState<string | null>(null)
  const [implantationId,      setImplantationId]      = useState('')
  const [groups,              setGroups]              = useState<Group[]>([])
  const [groupId,             setGroupId]             = useState('')
  const [selectedGroup,       setSelectedGroup]       = useState<Group | null>(null)
  const [groupStaff,          setGroupStaff]          = useState<GroupStaffWithName[]>([])
  const [loadingGroups,       setLoadingGroups]       = useState(false)

  // ── Step 2 — Dates ───────────────────────────────────────────
  const [singleMode,      setSingleMode]      = useState(true)
  const [selectedDates,   setSelectedDates]   = useState<string[]>([])
  const [startHour,       setStartHour]       = useState(9)
  const [startMinute,     setStartMinute]     = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(90)

  // ── Step 3 — Détails ─────────────────────────────────────────
  const [allCoaches,       setAllCoaches]       = useState<{ id: string; name: string }[]>([])
  const [leadCoachId,      setLeadCoachId]      = useState('')
  const [assistantCoachId, setAssistantCoachId] = useState('')
  const [terrain,          setTerrain]          = useState('')
  const [customTerrain,    setCustomTerrain]    = useState('')
  const [themes,           setThemes]           = useState<Theme[]>([])
  const [linkedThemeId,    setLinkedThemeId]    = useState('')

  // ── Result ───────────────────────────────────────────────────
  const [creating,  setCreating]  = useState(false)
  const [result,    setResult]    = useState<{ created: number; failed: number } | null>(null)

  // ── Load on mount — gated on session so auth token is ready ──────────────
  useEffect(() => {
    if (!session) return  // wait until auth session is confirmed

    setLoadingImplantations(true)
    setImplantationsError(null)

    // Refresh token first so the JWT definitely has the hook-injected claims
    supabase.auth.refreshSession().then(() => {
      listImplantations().then(({ data, error }) => {
        if (error) {
          console.error('[NewSession] listImplantations error:', error)
          setImplantationsError('Impossible de charger les implantations. Vérifiez votre connexion.')
        } else {
          setImplantations(data)
        }
        setLoadingImplantations(false)
      })
    })

    listAvailableCoaches().then(coaches => setAllCoaches(coaches))
    listThemes().then(({ data }) => setThemes(data)).catch(() => {})
  }, [session])

  // ── Load groups when implantation changes ──────────────────────────────────
  useEffect(() => {
    if (!implantationId) { setGroups([]); setGroupId(''); setSelectedGroup(null); return }
    setLoadingGroups(true)
    listGroupsByImplantation(implantationId).then(({ data, error }) => {
      if (!error) setGroups(data)
      setLoadingGroups(false)
    })
  }, [implantationId])

  // ── Inherit group defaults when group is selected ──────────────────────────
  useEffect(() => {
    if (!groupId) { setSelectedGroup(null); setGroupStaff([]); return }
    const g = groups.find(g => g.id === groupId) ?? null
    setSelectedGroup(g)
    if (g) {
      if (g.startHour       !== null) setStartHour(g.startHour)
      if (g.startMinute     !== null) setStartMinute(g.startMinute)
      if (g.durationMinutes !== null) setDurationMinutes(g.durationMinutes)
    }
    listGroupStaff(groupId).then(staff => {
      setGroupStaff(staff)
      const lead = staff.find(s => s.role === 'principal')
      const asst = staff.find(s => s.role === 'assistant')
      if (lead) setLeadCoachId(lead.coachId)
      if (asst) setAssistantCoachId(asst.coachId)
    })
  }, [groupId, groups])

  // ── Date toggle ────────────────────────────────────────────────────────────
  const toggleDate = useCallback((dateStr: string) => {
    if (singleMode) {
      setSelectedDates(prev => prev[0] === dateStr ? [] : [dateStr])
    } else {
      setSelectedDates(prev =>
        prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
      )
    }
  }, [singleMode])

  // ── Create all sessions ────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!groupId || !implantationId || selectedDates.length === 0) return
    setCreating(true)

    const finalTerrain = terrain === 'Autre…' ? customTerrain.trim() : terrain
    let created = 0, failed = 0

    for (const dateStr of [...selectedDates].sort()) {
      const scheduledAt = `${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`

      const { data: session, error } = await createSession({
        tenantId       : '',   // filled server-side via current_tenant_id()
        implantationId,
        groupId,
        scheduledAt,
        durationMinutes,
        location: finalTerrain || undefined,
      })

      if (error || !session) { failed++; continue }

      // Coaches (role mapping: principal→lead, assistant→assistant)
      if (leadCoachId)      await assignCoach(session.id, leadCoachId,      session.tenantId, 'lead')
      if (assistantCoachId) await assignCoach(session.id, assistantCoachId, session.tenantId, 'assistant')

      // Link pedagogical theme
      if (linkedThemeId)    await addSessionTheme(session.id, linkedThemeId, session.tenantId)

      // Pre-fill attendance roster from group members
      await prefillSessionAttendees(session.id).catch(() => {})

      created++
    }

    setResult({ created, failed })
    setCreating(false)
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const implantName    = implantations.find(i => i.id === implantationId)?.name ?? ''
  const implantOpts    = useMemo(() => implantations.map(i => ({ id: i.id, label: i.name })), [implantations])
  const groupOpts      = useMemo(() => groups.map(g => ({ id: g.id, label: g.name })),         [groups])
  const coachOpts      = useMemo(() => allCoaches.map(c => ({ id: c.id, label: c.name })),     [allCoaches])
  const themeOpts      = useMemo(() => themes.map(t => ({ id: t.id, label: `${t.name}` })),    [themes])
  const leadCoachName  = allCoaches.find(c => c.id === leadCoachId)?.name   ?? ''
  const assistName     = allCoaches.find(c => c.id === assistantCoachId)?.name ?? ''
  const themeName      = themes.find(t => t.id === linkedThemeId)?.name ?? ''
  const finalTerrainLabel = terrain === 'Autre…' ? customTerrain : terrain

  const step1Valid = !!implantationId && !!groupId
  const step2Valid = selectedDates.length > 0

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <ScrollView style={p.container} contentContainerStyle={p.content}>
        <View style={p.resultCard}>
          <AureakText style={{ fontSize: 44, textAlign: 'center' as never }}>
            {result.failed === 0 ? '✅' : result.created > 0 ? '⚠️' : '❌'}
          </AureakText>
          <AureakText variant="h2" style={{ textAlign: 'center' as never, color: colors.text.primary, marginTop: space.md }}>
            {result.created} session{result.created !== 1 ? 's' : ''} créée{result.created !== 1 ? 's' : ''}
          </AureakText>
          {result.failed > 0 && (
            <AureakText variant="caption" style={{ color: '#ef4444', textAlign: 'center' as never, marginTop: space.xs }}>
              {result.failed} échec{result.failed !== 1 ? 's' : ''}
            </AureakText>
          )}
          <AureakText variant="caption" style={{ color: colors.text.secondary, textAlign: 'center' as never, marginTop: space.sm }}>
            {selectedGroup?.name} · {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''}
          </AureakText>
          <View style={p.resultActions}>
            <Pressable
              style={[p.btn, p.btnSecondary]}
              onPress={() => { setResult(null); setStep(1); setGroupId(''); setImplantationId(''); setSelectedDates([]) }}
            >
              <AureakText variant="body" style={{ color: colors.text.primary }}>Nouvelle séance</AureakText>
            </Pressable>
            <Pressable style={[p.btn, p.btnPrimary]} onPress={() => router.push('/(admin)/sessions' as never)}>
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>Voir les sessions →</AureakText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={p.container} contentContainerStyle={p.content} keyboardShouldPersistTaps="handled">

      {/* Title bar */}
      <View style={p.titleRow}>
        <Pressable onPress={() => router.back()} style={p.backBtn}>
          <AureakText variant="caption" style={{ color: colors.text.secondary }}>← Retour</AureakText>
        </Pressable>
        <AureakText variant="h2">Nouvelle séance</AureakText>
      </View>

      {/* Step indicator */}
      <StepBar current={step} />

      {/* ═══════════════════════════════════════════════════════════
          STEP 1 — Lieu & Groupe
          ═══════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <View style={p.stepWrap}>

          {/* Implantation */}
          <View style={[p.card, p.cardWithDropdown, { zIndex: 20 }]}>
            <SectionLabel title="Implantation" hint="Site physique de la session" />
            {implantationsError ? (
              <View style={p.errorBox}>
                <AureakText variant="caption" style={{ color: '#ef4444' }}>{implantationsError}</AureakText>
                <Pressable onPress={() => {
                  setImplantationsError(null)
                  setLoadingImplantations(true)
                  supabase.auth.refreshSession().then(() =>
                    listImplantations().then(({ data, error }) => {
                      if (error) setImplantationsError('Impossible de charger les implantations.')
                      else setImplantations(data)
                      setLoadingImplantations(false)
                    })
                  )
                }}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, marginTop: 4 }}>↺ Réessayer</AureakText>
                </Pressable>
              </View>
            ) : (
              <SearchableSelect
                options={implantOpts}
                value={implantationId}
                onSelect={id => { setImplantationId(id); setGroupId('') }}
                placeholder={loadingImplantations ? 'Chargement…' : implantOpts.length === 0 ? 'Aucune implantation disponible' : 'Sélectionner une implantation…'}
                disabled={loadingImplantations}
                zBase={15}
              />
            )}
          </View>

          {/* Groupe */}
          <View style={[p.card, p.cardWithDropdown, { zIndex: 10 }]}>
            <SectionLabel
              title="Groupe"
              hint={implantationId ? `Groupes de ${implantName}` : 'Sélectionnez d\'abord une implantation'}
            />
            <SearchableSelect
              options={groupOpts}
              value={groupId}
              onSelect={setGroupId}
              placeholder={
                loadingGroups ? 'Chargement…' :
                !implantationId ? '— Choisissez une implantation d\'abord —' :
                groups.length === 0 ? 'Aucun groupe pour cette implantation' :
                'Sélectionner un groupe…'
              }
              disabled={!implantationId || loadingGroups}
              zBase={5}
            />
          </View>

          {/* Inherited group preview */}
          {selectedGroup && (
            <GroupCard group={selectedGroup} implantationName={implantName} staff={groupStaff} />
          )}

          <View style={p.navRow}>
            <View />
            <Pressable
              style={[p.btn, p.btnPrimary, !step1Valid && p.btnDisabled]}
              onPress={() => step1Valid && setStep(2)}
              disabled={!step1Valid}
            >
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                Choisir les dates →
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STEP 2 — Dates & Horaire
          ═══════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <View style={p.stepWrap}>

          {selectedGroup && <GroupCard group={selectedGroup} implantationName={implantName} staff={groupStaff} />}

          {/* Mode toggle */}
          <View style={p.card}>
            <SectionLabel title="Mode de planification" />
            <View style={p.modeRow}>
              {([true, false] as const).map(single => (
                <Pressable
                  key={String(single)}
                  style={[p.modeBtn, singleMode === single && p.modeBtnActive]}
                  onPress={() => {
                    setSingleMode(single)
                    if (single && selectedDates.length > 1) setSelectedDates(d => [d[0]])
                  }}
                >
                  <AureakText style={{ textAlign: 'center' as never, fontSize: 13, color: singleMode === single ? colors.text.dark : colors.text.secondary, fontWeight: singleMode === single ? '700' as never : '400' as never }}>
                    {single ? '📅  Séance unique' : '📆  Plusieurs dates'}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Calendar */}
          <View style={p.card}>
            <SectionLabel
              title={singleMode ? 'Date de la session' : 'Dates — cliquez pour sélectionner'}
              hint={singleMode ? undefined : 'Chaque date sélectionnée créera une session indépendante'}
            />
            <MiniCalendar
              selected={selectedDates}
              onToggle={toggleDate}
              onClear={() => setSelectedDates([])}
              singleMode={singleMode}
            />
          </View>

          {/* Time & duration */}
          <View style={p.card}>
            <SectionLabel title="Horaire" hint="Hérité du groupe · modifiable ici pour toutes les dates" />

            <AureakText style={p.fieldLabel}>Heure de début</AureakText>
            <NumChips values={HOURS} selected={startHour} onSelect={setStartHour} fmt={v => `${v}h`} />

            <AureakText style={[p.fieldLabel, { marginTop: space.sm }] as never}>Minutes</AureakText>
            <NumChips values={MINUTES} selected={startMinute} onSelect={setStartMinute} fmt={v => `:${String(v).padStart(2, '0')}`} />

            <AureakText style={[p.fieldLabel, { marginTop: space.sm }] as never}>Durée</AureakText>
            <NumChips values={DURATIONS} selected={durationMinutes} onSelect={setDurationMinutes} fmt={v => `${v} min`} />
          </View>

          <View style={p.navRow}>
            <Pressable style={[p.btn, p.btnSecondary]} onPress={() => setStep(1)}>
              <AureakText variant="body" style={{ color: colors.text.primary }}>← Retour</AureakText>
            </Pressable>
            <Pressable
              style={[p.btn, p.btnPrimary, !step2Valid && p.btnDisabled]}
              onPress={() => step2Valid && setStep(3)}
              disabled={!step2Valid}
            >
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                Détails →
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STEP 3 — Coaches, Terrain, Contenu
          ═══════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <View style={p.stepWrap}>

          {selectedGroup && <GroupCard group={selectedGroup} implantationName={implantName} staff={groupStaff} />}

          {/* Coaches */}
          <View style={[p.card, p.cardWithDropdown, { zIndex: 20 }]}>
            <SectionLabel
              title="Coaches"
              hint="Hérités du groupe — modifiables pour cette session uniquement"
            />

            <AureakText style={p.fieldLabel}>Coach principal</AureakText>
            <SearchableSelect
              options={coachOpts}
              value={leadCoachId}
              onSelect={setLeadCoachId}
              placeholder="Sélectionner le coach principal…"
              zBase={12}
            />

            <AureakText style={[p.fieldLabel, { marginTop: space.sm }] as never}>Coach assistant</AureakText>
            <SearchableSelect
              options={coachOpts}
              value={assistantCoachId}
              onSelect={setAssistantCoachId}
              placeholder="Sélectionner le coach assistant… (optionnel)"
              zBase={8}
            />

            {/* Remplacement — future workflow anchor */}
            <View style={p.infoNote}>
              <AureakText style={{ fontSize: 11, color: colors.text.secondary }}>
                💡 <AureakText style={{ fontWeight: '600' as never }}>Remplacement coach</AureakText> — si un coach est indisponible, le déclenchement du remplacement sera accessible depuis la fiche session.
              </AureakText>
            </View>
          </View>

          {/* Terrain */}
          <View style={p.card}>
            <SectionLabel title="Terrain" hint="Lieu physique de la session" />
            <ChipPicker options={TERRAINS} value={terrain} onSelect={setTerrain} />
            {terrain === 'Autre…' && (
              <TextInput
                style={[p.textInput, { marginTop: space.sm }]}
                value={customTerrain}
                onChangeText={setCustomTerrain}
                placeholder="Nom du terrain ou lieu…"
                placeholderTextColor={colors.text.secondary}
              />
            )}
          </View>

          {/* Contenu pédagogique */}
          <View style={[p.card, p.cardWithDropdown, { zIndex: 5 }]}>
            <SectionLabel
              title="Contenu d'entraînement"
              hint="Lier un thème pédagogique à cette session (optionnel)"
            />
            <SearchableSelect
              options={[{ id: '', label: '— Aucun (à définir plus tard) —' }, ...themeOpts]}
              value={linkedThemeId}
              onSelect={setLinkedThemeId}
              placeholder="Sélectionner un thème pédagogique…"
              zBase={3}
            />
          </View>

          <View style={p.navRow}>
            <Pressable style={[p.btn, p.btnSecondary]} onPress={() => setStep(2)}>
              <AureakText variant="body" style={{ color: colors.text.primary }}>← Retour</AureakText>
            </Pressable>
            <Pressable style={[p.btn, p.btnPrimary]} onPress={() => setStep(4)}>
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                Réviser →
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STEP 4 — Résumé & Création
          ═══════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <View style={p.stepWrap}>

          {/* Summary card */}
          <View style={p.card}>
            <SectionLabel title={`${selectedDates.length} session${selectedDates.length !== 1 ? 's' : ''} à créer`} />
            <SummaryRow label="Groupe"          value={selectedGroup?.name ?? ''} />
            <SummaryRow label="Implantation"    value={implantName} />
            <SummaryRow label="Horaire"         value={`${String(startHour).padStart(2, '0')}h${String(startMinute).padStart(2, '0')} · ${durationMinutes} min`} />
            <SummaryRow label="Coach principal" value={leadCoachName} />
            <SummaryRow label="Coach assistant" value={assistName} />
            <SummaryRow label="Terrain"         value={finalTerrainLabel} />
            <SummaryRow label="Thème péda."     value={themeName} />
          </View>

          {/* Date list */}
          <View style={p.card}>
            <SectionLabel title="Dates planifiées" />
            {[...selectedDates].sort().map((d, i) => (
              <View key={d} style={[p.dateRow, i % 2 === 1 && { backgroundColor: colors.background.elevated }]}>
                <AureakText style={{ fontSize: 11, color: colors.text.secondary, width: 24 }}>{i + 1}.</AureakText>
                <AureakText style={{ flex: 1, fontSize: 13, color: colors.text.primary }}>{formatDateFull(d)}</AureakText>
                <AureakText style={{ fontSize: 12, color: colors.text.secondary }}>
                  {String(startHour).padStart(2, '0')}h{String(startMinute).padStart(2, '0')}
                </AureakText>
              </View>
            ))}
          </View>

          <View style={p.navRow}>
            <Pressable style={[p.btn, p.btnSecondary]} onPress={() => setStep(3)}>
              <AureakText variant="body" style={{ color: colors.text.primary }}>← Modifier</AureakText>
            </Pressable>
            <Pressable
              style={[p.btn, p.btnCreate, creating && p.btnDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                {creating
                  ? '⟳ Création en cours…'
                  : `✦ Créer ${selectedDates.length} session${selectedDates.length !== 1 ? 's' : ''}`
                }
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const p = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.background.primary },
  content     : { padding: space.xl, gap: space.md, paddingBottom: space.xxxl },

  titleRow    : { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingBottom: space.xs },
  backBtn     : { paddingRight: space.xs },

  stepWrap    : { gap: space.md },
  card        : { backgroundColor: colors.background.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.accent.zinc, padding: space.md, gap: space.sm },
  // Cards containing SearchableSelect dropdowns need overflow visible so the dropdown
  // is not clipped by the card's border-radius on React Native web
  cardWithDropdown: { overflow: 'visible' as never },
  errorBox    : { padding: space.sm, borderRadius: 6, backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef444440' },
  fieldLabel  : { fontSize: 10, fontWeight: '600' as never, letterSpacing: 0.5, color: colors.text.secondary, textTransform: 'uppercase' as never, marginBottom: 4 },
  textInput   : { backgroundColor: colors.background.elevated, borderWidth: 1, borderColor: colors.accent.zinc, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: space.sm, color: colors.text.primary, fontSize: 13 },
  infoNote    : { backgroundColor: colors.background.elevated, borderRadius: 6, padding: space.sm, borderWidth: 1, borderColor: colors.accent.zinc + '60', marginTop: space.xs },

  modeRow     : { flexDirection: 'row', gap: space.sm },
  modeBtn     : { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.accent.zinc, alignItems: 'center', backgroundColor: colors.background.elevated },
  modeBtnActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },

  navRow      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.xs },
  btn         : { paddingHorizontal: space.lg, paddingVertical: space.sm + 4, borderRadius: 8, minWidth: 110, alignItems: 'center' },
  btnPrimary  : { backgroundColor: colors.accent.gold },
  btnSecondary: { backgroundColor: colors.background.surface, borderWidth: 1, borderColor: colors.accent.zinc },
  btnCreate   : { backgroundColor: colors.accent.gold, paddingHorizontal: space.xl },
  btnDisabled : { opacity: 0.4 },

  dateRow     : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xs, paddingVertical: 9, borderRadius: 6, gap: space.xs },

  resultCard   : { backgroundColor: colors.background.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.accent.zinc, padding: space.xxl, alignItems: 'center', marginTop: space.xl },
  resultActions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
})
