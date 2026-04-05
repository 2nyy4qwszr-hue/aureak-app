'use client'
// Planificateur de sessions — Nouvelle séance
// Terminologie : session = occurrence terrain d'un groupe (groupe + date(s) + coaches + contenu)
// À distinguer du "contenu d'entraînement" = thème pédagogique lié à la session
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  listImplantations, listGroupsByImplantation, listGroupStaff,
  listAvailableCoaches, createSession, assignCoach,
  prefillSessionAttendees, createTransientGroup, computeContentRef,
  addSessionThemeBlock, addSessionWorkshop, uploadWorkshopPdf, uploadWorkshopCard,
  getRecommendedSituations,
} from '@aureak/api-client'
import CoachDndBoard from './_components/CoachDndBoard'
import ThemeBlockPicker from './_components/ThemeBlockPicker'
import type { ThemeBlockDraft } from './_components/ThemeBlockPicker'
import WorkshopBlockEditor from './_components/WorkshopBlockEditor'
import type { SessionWorkshopDraft } from '@aureak/types'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { TYPE_COLOR } from './_components/constants'
import type { Implantation, Group, GroupStaffWithName, SessionType, SessionContentRef, GroupMethod, SituationalBlocCode, MethodologySituation } from '@aureak/types'
import { SESSION_TYPES, SESSION_TYPE_LABELS, SITUATIONAL_BLOC_LABELS, MODULE_LABELS, MODULE_TYPES } from '@aureak/types'
import { generateSessionLabel } from './_utils'
import { useToast } from '../../../components/ToastContext'

// SessionType → category filter pour listThemes (Story 21.2)
const SESSION_TYPE_TO_METHOD: Partial<Record<SessionType, string>> = {
  goal_and_player : 'goal_and_player',
  technique       : 'technique',
  situationnel    : 'situationnel',
  decisionnel     : 'decisionnel',
  perfectionnement: 'perfectionnement',
  integration     : 'integration',
}

// SessionType → GroupMethod DB label (pour createTransientGroup)
const SESSION_TYPE_TO_GROUP_METHOD: Partial<Record<SessionType, GroupMethod>> = {
  goal_and_player : 'Goal and Player',
  technique       : 'Technique',
  situationnel    : 'Situationnel',
  decisionnel     : 'Décisionnel',
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TERRAINS   = ['Terrain A', 'Terrain B', 'Terrain C', 'Terrain D', 'Extérieur', 'Salle', 'Autre…']
const HOURS      = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const MINUTES    = [0, 15, 30, 45]
const DURATIONS  = [45, 60, 75, 90, 105, 120]
const DAYS_FR    = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_LONG  = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS_FR  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

// Story 21.3 : 6 steps (ajout Step 4 Ateliers)
type Step = 1 | 2 | 3 | 4 | 5 | 6

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
    <View
      style={[ss.wrap, { zIndex: open ? zBase + 100 : zBase }]}
      {...(Platform.OS === 'web' ? { 'data-form-type': 'other' } as never : {})}
    >
      <Pressable
        style={[ss.trigger, disabled && ss.triggerDisabled]}
        onPress={() => { if (!disabled) { setOpen(v => !v); setQ('') } }}
      >
        <AureakText
          variant="body"
          style={{ flex: 1, color: selected ? colors.text.dark : colors.text.muted, fontSize: 13 }}
        >
          {selected?.label ?? placeholder}
        </AureakText>
        <AureakText style={{ color: open ? colors.accent.gold : colors.text.muted, fontSize: 11, marginLeft: space.xs }}>
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
            placeholderTextColor={colors.text.muted}
            autoFocus
            autoComplete={'off' as never}
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="none"
            spellCheck={false}
            enterKeyHint="search"
            {...(Platform.OS === 'web' ? { type: 'search', 'data-form-type': 'other' } as never : {})}
          />
          <ScrollView style={[{ maxHeight: 220 }, Platform.OS === 'web' ? { overflow: 'auto' as never } : {}]} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filtered.map(o => (
              <Pressable
                key={o.id}
                style={[ss.option, o.id === value && ss.optionActive]}
                onPress={() => { onSelect(o.id); setOpen(false); setQ('') }}
              >
                <AureakText variant="body" style={{ color: o.id === value ? colors.accent.gold : colors.text.dark, fontSize: 13 }}>
                  {o.label}
                </AureakText>
              </Pressable>
            ))}
            {filtered.length === 0 && (
              <View style={ss.option}>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>Aucun résultat</AureakText>
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
  trigger      : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: space.sm + 2, minHeight: 44 },
  triggerDisabled: { opacity: 0.45 },
  dropdown     : {
    position: 'absolute' as never, top: '105%' as never, left: 0, right: 0,
    backgroundColor: colors.light.muted,
    borderWidth: 1, borderColor: colors.accent.gold + '50',
    borderRadius: 8, marginTop: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.5)' } as never : {}),
  },
  searchInput  : { borderBottomWidth: 1, borderBottomColor: colors.border.light, paddingHorizontal: space.md, paddingVertical: space.sm, color: colors.text.dark, fontSize: 13 },
  option       : { paddingHorizontal: space.md, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  optionActive : { backgroundColor: colors.light.surface },
})

// ── MultiSearchableSelect ──────────────────────────────────────────────────────
// Variante multi-sélection avec chips, recherche et limite max.

type MultiSelectProps = {
  options    : SelectOption[]
  selected   : string[]
  onToggle   : (id: string) => void
  placeholder: string
  maxSelect? : number
  disabled?  : boolean
  zBase?     : number
}

function MultiSearchableSelect({
  options, selected, onToggle, placeholder, maxSelect, disabled = false, zBase = 10,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [q,    setQ]    = useState('')

  const filtered = options.filter(o => !q || o.label.toLowerCase().includes(q.toLowerCase()))
  const atMax    = maxSelect !== undefined && selected.length >= maxSelect
  const labelMap = useMemo(() => Object.fromEntries(options.map(o => [o.id, o.label])), [options])

  return (
    <View
      style={[mss.wrap, { zIndex: open ? zBase + 100 : zBase }]}
      {...(Platform.OS === 'web' ? { 'data-form-type': 'other' } as never : {})}
    >

      {/* Chips des éléments sélectionnés */}
      {selected.length > 0 && (
        <View style={mss.chipRow}>
          {selected.map(id => (
            <Pressable key={id} style={mss.chip} onPress={() => onToggle(id)}>
              <AureakText style={{ fontSize: 11, color: colors.text.dark, fontWeight: '600' as never }}>
                {labelMap[id] ?? id}
              </AureakText>
              <AureakText style={{ fontSize: 10, color: colors.text.dark, marginLeft: 3 }}>✕</AureakText>
            </Pressable>
          ))}
        </View>
      )}

      {/* Trigger d'ouverture */}
      <Pressable
        style={[mss.trigger, disabled && ss.triggerDisabled, atMax && mss.triggerAtMax]}
        onPress={() => { if (!disabled && !atMax) { setOpen(v => !v); setQ('') } }}
      >
        <AureakText variant="body" style={{ flex: 1, color: atMax ? colors.text.muted : colors.text.muted, fontSize: 13 }}>
          {atMax ? `Maximum atteint (${maxSelect})` : placeholder}
        </AureakText>
        {!atMax && (
          <AureakText style={{ color: open ? colors.accent.gold : colors.text.muted, fontSize: 11, marginLeft: space.xs }}>
            {open ? '▴' : '▾'}
          </AureakText>
        )}
      </Pressable>

      {/* Dropdown */}
      {open && (
        <View style={[ss.dropdown, { zIndex: zBase + 200 }]}>
          <TextInput
            style={ss.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Rechercher…"
            placeholderTextColor={colors.text.muted}
            autoFocus
            autoComplete={'off' as never}
            autoCorrect={false}
            autoCapitalize="none"
            textContentType="none"
            spellCheck={false}
            enterKeyHint="search"
            {...(Platform.OS === 'web' ? { type: 'search', 'data-form-type': 'other' } as never : {})}
          />
          <ScrollView style={[{ maxHeight: 220 }, Platform.OS === 'web' ? { overflow: 'auto' as never } : {}]} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filtered.map(o => {
              const isSel = selected.includes(o.id)
              return (
                <Pressable
                  key={o.id}
                  style={[ss.option, isSel && ss.optionActive]}
                  onPress={() => { onToggle(o.id); if (isSel) return; if (maxSelect && selected.length + 1 >= maxSelect) setOpen(false) }}
                >
                  <AureakText variant="body" style={{ flex: 1, color: isSel ? colors.accent.gold : colors.text.dark, fontSize: 13 }}>
                    {o.label}
                  </AureakText>
                  {isSel && <AureakText style={{ color: colors.accent.gold, fontSize: 12 }}>✓</AureakText>}
                </Pressable>
              )
            })}
            {filtered.length === 0 && (
              <View style={ss.option}>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>Aucun résultat</AureakText>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const mss = StyleSheet.create({
  wrap       : { position: 'relative' as never, gap: 6 },
  chipRow    : { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip       : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent.gold + '20', borderWidth: 1, borderColor: colors.accent.gold + '60', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, gap: 3 },
  trigger    : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: 40 },
  triggerAtMax: { opacity: 0.5 },
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
  const offset   = (first.getDay() + 6) % 7  // Lundi = 0 (convention française ISO)
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
          <AureakText style={{ color: colors.text.dark, fontSize: 20, lineHeight: 24 }}>‹</AureakText>
        </Pressable>
        <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
          {MONTHS_FR[viewMonth]} {viewYear}
        </AureakText>
        <Pressable style={mc.navBtn} onPress={nextM}>
          <AureakText style={{ color: colors.text.dark, fontSize: 20, lineHeight: 24 }}>›</AureakText>
        </Pressable>
      </View>

      {/* Day-of-week header */}
      <View style={mc.weekRow}>
        {DAYS_FR.map(d => (
          <View key={d} style={mc.dayLabel}>
            <AureakText style={{ fontSize: 10, color: colors.text.muted, fontWeight: '700' as never }}>{d}</AureakText>
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
            <AureakText variant="caption" style={{ color: colors.text.muted }}>✕ Effacer</AureakText>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const mc = StyleSheet.create({
  container: { backgroundColor: colors.light.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden' },
  header   : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border.light, backgroundColor: colors.light.muted },
  navBtn   : { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  weekRow  : { flexDirection: 'row', backgroundColor: colors.light.muted + 'AA', borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  dayLabel : { flex: 1, alignItems: 'center', paddingVertical: 6 },
  grid     : { flexDirection: 'row', flexWrap: 'wrap', padding: 4 },
  cell     : { width: `${100 / 7}%` as never, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellSel  : { backgroundColor: colors.accent.gold },
  cellToday: { borderWidth: 1.5, borderColor: colors.accent.gold },
  cellText : { fontSize: 13, color: colors.text.dark },
  footer   : { flexDirection: 'row', alignItems: 'center', padding: space.sm, borderTopWidth: 1, borderTopColor: colors.border.light, backgroundColor: colors.light.muted + '70', gap: space.sm },
  clearBtn : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: colors.border.light },
})

// ── Group method → SessionType mapping ────────────────────────────────────────

const GROUP_METHOD_TO_SESSION_TYPE: Record<string, SessionType> = {
  // snake_case values (DB enum)
  'goal_and_player'  : 'goal_and_player',
  'technique'        : 'technique',
  'situationnel'     : 'situationnel',
  'decisionnel'      : 'decisionnel',
  'perfectionnement' : 'perfectionnement',
  'integration'      : 'integration',
  'equipe'           : 'equipe',
  // Human-readable labels (GroupMethod — DB values)
  'Goal and Player'  : 'goal_and_player',  // fix: était 'Golden Player'
  'Technique'        : 'technique',
  'Situationnel'     : 'situationnel',
  'Décisionnel'      : 'decisionnel',
  'Perfectionnement' : 'perfectionnement',
  'Intégration'      : 'integration',
  'Équipe'           : 'equipe',
}

// Nombre d'entraînements par méthodologie (bornes affichées dans le sélecteur)
// Story 21.1 : GP passe à 15 ENT par module (3 modules indépendants = 45 au total)
const TRAINING_MAX: Record<string, number> = {
  goal_and_player : 15,  // 15 ENT par module (sélecteur Module + ENT indépendants)
  technique       : 32,  // 8 modules × 4 séances
  situationnel    : 30,
  decisionnel     : 20,
  perfectionnement: 20,
  integration     : 20,
  equipe          : 20,
}

// ── Step indicator ─────────────────────────────────────────────────────────────

// Story 21.3 : 6 steps
const STEP_LABELS: [string, string][] = [
  ['1', 'Contexte'],
  ['2', 'Détails'],
  ['3', 'Thèmes'],
  ['4', 'Ateliers'],
  ['5', 'Date'],
  ['6', 'Résumé'],
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
                <AureakText style={{ fontSize: 11, fontWeight: '700' as never, color: (done || active) ? colors.text.dark : colors.text.muted }}>
                  {done ? '✓' : n}
                </AureakText>
              </View>
              <AureakText style={{ fontSize: 10, color: active ? colors.accent.gold : done ? colors.text.dark : colors.text.muted, marginTop: 3 }}>
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
  dot     : { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  dotDone  : { backgroundColor: colors.accent.goldLight, borderColor: colors.accent.goldLight },
  line    : { flex: 1, height: 1, backgroundColor: colors.border.light, marginBottom: 14 },
  lineDone: { backgroundColor: colors.accent.gold + '70' },
})

// ── Chip group ─────────────────────────────────────────────────────────────────

function ChipPicker({ options, value, onSelect }: { options: string[]; value: string; onSelect: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
      {options.map(o => {
        const active = value === o
        return (
          <Pressable key={o} style={[cp.chip, active && cp.chipActive]} onPress={() => onSelect(o)}>
            <AureakText style={{ fontSize: 12, color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '600' as never : '400' as never }}>
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
            <AureakText style={{ fontSize: 12, color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '600' as never : '400' as never }}>
              {fmt(v)}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

const cp = StyleSheet.create({
  chip      : { paddingHorizontal: space.sm + 2, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.surface },
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
          <AureakText variant="body" style={{ fontWeight: '700' as never, color: colors.text.dark, fontSize: 14 }}>{group.name}</AureakText>
          {group.method && (
            <View style={gc.methodTag}>
              <AureakText style={{ fontSize: 10, color: colors.accent.gold, fontWeight: '600' as never }}>{group.method}</AureakText>
            </View>
          )}
        </View>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>{implantationName}</AureakText>
        <View style={gc.row}>
          {hour && <AureakText variant="caption" style={{ color: colors.text.muted }}>⏱ {hour}</AureakText>}
          {group.durationMinutes && <AureakText variant="caption" style={{ color: colors.text.muted, marginLeft: space.sm }}>· {group.durationMinutes} min</AureakText>}
        </View>
        {(lead || asst) && (
          <View style={gc.row}>
            {lead && <AureakText variant="caption" style={{ color: colors.text.muted }}>👤 {lead.coachName}</AureakText>}
            {asst && <AureakText variant="caption" style={{ color: colors.text.muted, marginLeft: space.sm }}>· Asst: {asst.coachName}</AureakText>}
          </View>
        )}
      </View>
    </View>
  )
}

const gc = StyleSheet.create({
  card     : { flexDirection: 'row', backgroundColor: colors.light.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden' },
  stripe   : { width: 3, backgroundColor: colors.accent.gold },
  body     : { flex: 1, padding: space.md, gap: 4 },
  row      : { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.xs },
  methodTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.accent.gold + '18', borderWidth: 1, borderColor: colors.accent.gold + '40' },
})

// ── Section label ──────────────────────────────────────────────────────────────

function SectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ marginBottom: space.xs }}>
      <AureakText style={{ fontSize: 10, fontWeight: '700' as never, letterSpacing: 0.8, color: colors.text.muted, textTransform: 'uppercase' as never }}>
        {title}
      </AureakText>
      {hint && <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 2 }}>{hint}</AureakText>}
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
  row  : { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  label: { width: 130, fontSize: 11, color: colors.text.muted, paddingTop: 1 },
  value: { flex: 1, fontSize: 13, color: colors.text.dark },
})

// ── Story 53-4 — MethodTileGrid ────────────────────────────────────────────────

const SESSION_TYPE_ICON_MAP: Partial<Record<string, string>> = {
  goal_and_player : '⚽',
  technique       : '🎯',
  situationnel    : '📐',
  decisionnel     : '🧠',
  perfectionnement: '💎',
  integration     : '🔗',
  equipe          : '👥',
}

const SESSION_TYPE_DESCRIPTIONS: Partial<Record<string, string>> = {
  goal_and_player : 'Travail combiné gardien + joueur de champ',
  technique       : 'Fondamentaux techniques du gardien',
  situationnel    : 'Situations de jeu réelles',
  decisionnel     : 'Prise de décision sous pression',
  perfectionnement: 'Affinement des habiletés avancées',
  integration     : 'Intégration équipe complète',
  equipe          : 'Entraînement collectif équipe',
}

function MethodTileGrid({
  value, onChange,
}: {
  value   : SessionType | ''
  onChange: (t: SessionType) => void
}) {
  return (
    <View style={mtg.grid}>
      {SESSION_TYPES.map(t => {
        const isActive = value === t
        const color    = TYPE_COLOR[t] ?? colors.accent.gold
        const icon     = SESSION_TYPE_ICON_MAP[t] ?? '📋'
        const label    = SESSION_TYPE_LABELS[t] ?? t
        const desc     = SESSION_TYPE_DESCRIPTIONS[t] ?? ''

        return (
          <Pressable
            key={t}
            style={[
              mtg.tile,
              isActive
                ? { backgroundColor: color + '25', borderColor: color, borderWidth: 2 }
                : { backgroundColor: colors.light.surface, borderColor: colors.border.light, borderWidth: 1 },
            ]}
            onPress={() => onChange(t)}
          >
            {isActive && (
              <View style={[mtg.checkmark, { backgroundColor: color }]}>
                <AureakText style={{ fontSize: 9, color: colors.text.dark, fontWeight: '700' as never }}>✓</AureakText>
              </View>
            )}
            <AureakText style={{ fontSize: 22 }}>{icon}</AureakText>
            <AureakText style={[mtg.tileLabel, { color: isActive ? color : colors.text.dark }] as never}>
              {label}
            </AureakText>
            <AureakText style={mtg.tileDesc} numberOfLines={2}>{desc}</AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

const mtg = StyleSheet.create({
  grid     : { flexDirection: 'row', flexWrap: 'wrap' as never, gap: space.sm },
  tile     : {
    width        : '31%' as never,
    minWidth     : 100,
    flexGrow     : 1,
    borderRadius : radius.xs ?? 8,
    padding      : space.md,
    gap          : 4,
    position     : 'relative' as never,
  },
  tileLabel: { fontSize: 12, fontWeight: '700' as never },
  tileDesc : { fontSize: 10, color: colors.text.muted, lineHeight: 14 },
  checkmark: {
    position    : 'absolute' as never,
    top         : 6,
    right       : 6,
    width       : 16,
    height      : 16,
    borderRadius: 8,
    alignItems  : 'center',
    justifyContent: 'center',
  },
})

// ── TitleField — Story 21.1 ────────────────────────────────────────────────────
// Composant auto-générant le titre de la séance à partir de la méthode + contexte + référence.
// Pré-rempli et éditable.

function TitleField({
  sessionType, contextType, gpModule, gpEntNumber,
  trainingNumber, techConcept, techStageSeq, deciBlocks,
  value, onChange,
}: {
  sessionType    : SessionType
  contextType    : 'academie' | 'stage'
  gpModule       : 1 | 2 | 3
  gpEntNumber    : number
  trainingNumber : number
  techConcept    : string
  techStageSeq   : number
  deciBlocks     : Array<{ id: string; title: string }>
  value          : string
  onChange       : (v: string) => void
}) {
  // Construire un contentRef partiel pour generateSessionLabel
  const draftRef = useMemo((): SessionContentRef | null => {
    switch (sessionType) {
      case 'goal_and_player':
        return { method: 'goal_and_player', module: gpModule, entNumber: gpEntNumber, globalNumber: (gpModule - 1) * 15 + gpEntNumber }
      case 'technique':
        if (contextType === 'stage') return { method: 'technique', context: 'stage', concept: techConcept, sequence: techStageSeq }
        return computeContentRef('technique', trainingNumber - 1) as SessionContentRef
      case 'situationnel':
        return computeContentRef('situationnel', trainingNumber - 1) as SessionContentRef
      case 'decisionnel':
        return { method: 'decisionnel', blocks: deciBlocks.map(b => ({ title: b.title })) }
      default:
        return null
    }
  }, [sessionType, contextType, gpModule, gpEntNumber, trainingNumber, techConcept, techStageSeq, deciBlocks])

  const autoLabel = useMemo(
    () => generateSessionLabel(sessionType, draftRef, contextType, trainingNumber),
    [sessionType, draftRef, contextType, trainingNumber]
  )

  // Pré-remplir quand le label auto change et que le champ est vide (ou correspond encore à l'ancien auto)
  const prevAutoRef = React.useRef('')
  const onChangeRef = React.useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!value || value === prevAutoRef.current) {
      onChangeRef.current(autoLabel)
    }
    prevAutoRef.current = autoLabel
  }, [autoLabel, value])

  return (
    <View style={p.card}>
      <SectionLabel title="Titre de la séance" hint="Auto-généré · modifiable avant création" />
      <TextInput
        style={p.textInput}
        value={value}
        onChangeText={onChange}
        placeholder="Titre de la séance…"
        placeholderTextColor={colors.text.muted}
        autoComplete={'off' as never}
        autoCorrect={false}
      />
      {autoLabel && value !== autoLabel && (
        <Pressable onPress={() => onChange(autoLabel)}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, marginTop: 4 }}>
            ↺ Restaurer : «{autoLabel}»
          </AureakText>
        </Pressable>
      )}
    </View>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function NewSessionPage() {
  const router    = useRouter()
  const toast     = useToast()
  const tenantId  = useAuthStore(s => s.tenantId) ?? ''
  const { prefill } = useLocalSearchParams<{ prefill?: string }>()

  // ── Step 1 — Contexte ────────────────────────────────────────
  const [step,                setStep]                = useState<Step>(1)
  const [implantations,       setImplantations]       = useState<Implantation[]>([])
  const [loadingImplantations,setLoadingImplantations]= useState(true)
  const [implantationsError,  setImplantationsError]  = useState<string | null>(null)
  const [implantationId,      setImplantationId]      = useState('')
  // contextMode : 'existing' = groupe réel hebdomadaire / 'ponctuel' = séance ad-hoc
  const [contextMode,         setContextMode]         = useState<'existing' | 'ponctuel'>('existing')
  // Story 21.1 — contexte pédagogique global (Académie | Stage)
  const [contextType,         setContextType]         = useState<'academie' | 'stage'>('academie')
  const [sessionLabel,        setSessionLabel]        = useState('')  // nom libre (mode ponctuel)
  const [groups,              setGroups]              = useState<Group[]>([])
  const [groupId,             setGroupId]             = useState('')
  const [selectedGroup,       setSelectedGroup]       = useState<Group | null>(null)
  const [groupStaff,          setGroupStaff]          = useState<GroupStaffWithName[]>([])
  const [loadingGroups,       setLoadingGroups]       = useState(false)

  // ── Session type (dérivé de la méthode du groupe) ────────────
  const [sessionType,   setSessionType]   = useState<SessionType | ''>('')

  // ── Step 2 — Dates ───────────────────────────────────────────
  const [singleMode,      setSingleMode]      = useState(true)
  const [selectedDates,   setSelectedDates]   = useState<string[]>([])
  const [startHour,       setStartHour]       = useState(9)
  const [startMinute,     setStartMinute]     = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(90)

  // ── Step 2 — Détails ─────────────────────────────────────────
  const [allCoaches,        setAllCoaches]        = useState<{ id: string; name: string }[]>([])
  const [coachLeads,        setCoachLeads]        = useState<string[]>([])
  const [coachAssistants,   setCoachAssistants]   = useState<string[]>([])
  const [coachReplacements, setCoachReplacements] = useState<string[]>([])
  const [terrain,           setTerrain]           = useState('')
  const [customTerrain,     setCustomTerrain]     = useState('')
  const [trainingNumber,    setTrainingNumber]    = useState(1)
  // ── ContentRef specific states (Story 13.1 — AC7) ────────────
  // Story 21.1 : techniqueCtx supprimé — remplacé par contextType global du Step 1
  const [techConcept,   setTechConcept]   = useState('')
  const [techStageSeq,  setTechStageSeq]  = useState(1)
  const [deciBlocks,    setDeciBlocks]    = useState<Array<{ id: string; title: string }>>([{ id: crypto.randomUUID(), title: '' }])
  // Story 21.1 — Goal & Player : sélecteurs Module (1-3) + ENT (1-15)
  const [gpModule,      setGpModule]      = useState<1 | 2 | 3>(1)
  const [gpEntNumber,   setGpEntNumber]   = useState(1)
  // Story 21.1 — Titre de la séance auto-généré + éditable
  const [sessionTitle,  setSessionTitle]  = useState('')
  // Story 21.2 — Blocs thème/séquence/ressource (Step 3)
  const [themeBlocks,   setThemeBlocks]   = useState<ThemeBlockDraft[]>([])
  // Story 21.3 — Ateliers (Step 4)
  const [workshops,     setWorkshops]     = useState<SessionWorkshopDraft[]>([])

  // Story 58-7 — Recommandations exercices pour un groupe (cache par groupId)
  const [recommendations,        setRecommendations]        = useState<Record<string, (MethodologySituation & { isRecommended: boolean })[]>>({})
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  // Story 58-8 — Durées des 3 phases pour le wizard (en minutes, éditables)
  const [phaseDurations, setPhaseDurations] = useState<Record<string, number>>({
    activation : 0,
    development: 0,
    conclusion : 0,
  })

  // ── Result ───────────────────────────────────────────────────
  const [creating,       setCreating]       = useState(false)
  const [result,         setResult]         = useState<{ created: number; failed: number; linkWarnings?: number } | null>(null)
  // Story 53-5 — Toast duplication
  const [duplicateToast, setDuplicateToast] = useState(false)

  // ── Load on mount — le layout admin garantit que l'auth est résolue ───────
  // La Supabase client a déjà le JWT depuis le localStorage avant ce montage.
  useEffect(() => {
    setLoadingImplantations(true)
    setImplantationsError(null)

    listImplantations().then(({ data, error }) => {
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[NewSession] listImplantations error:', error)
        setImplantationsError('Impossible de charger les implantations. Vérifiez votre connexion.')
      } else {
        const list = data ?? []
        setImplantations(list)
        // Auto-sélection si une seule implantation existe
        if (list.length === 1) setImplantationId(list[0].id)
      }
    }).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[NewSession] listImplantations unexpected error:', err)
      setImplantationsError('Impossible de charger les implantations. Vérifiez votre connexion.')
    }).finally(() => {
      setLoadingImplantations(false)
    })

    listAvailableCoaches().then(coaches => setAllCoaches(coaches)).catch(err => { if (process.env.NODE_ENV !== 'production') console.error('[NewSession] listAvailableCoaches error:', err) })
  }, [])

  // ── Load groups when implantation changes ──────────────────────────────────
  useEffect(() => {
    if (!implantationId) { setGroups([]); setGroupId(''); setSelectedGroup(null); return }
    setLoadingGroups(true)
    setGroups([])
    listGroupsByImplantation(implantationId)
      .then(({ data, error }) => {
        if (error && process.env.NODE_ENV !== 'production') console.error('[NewSession] listGroupsByImplantation error:', error)
        setGroups(data ?? [])
      })
      .catch(() => { setGroups([]) })
      .finally(() => { setLoadingGroups(false) })
  }, [implantationId])

  // ── Inherit group defaults when group is selected ──────────────────────────
  useEffect(() => {
    if (!groupId) {
      setSelectedGroup(null)
      setGroupStaff([])
      setSessionType('')
      return
    }
    const g = groups.find(g => g.id === groupId) ?? null
    setSelectedGroup(g)
    if (g) {
      // Horaire et durée hérités du groupe
      if (g.startHour       !== null) setStartHour(g.startHour)
      if (g.startMinute     !== null) setStartMinute(g.startMinute)
      if (g.durationMinutes !== null) setDurationMinutes(g.durationMinutes)
      // Auto-dériver le type pédagogique depuis la méthode du groupe
      const derivedType = g.method ? (GROUP_METHOD_TO_SESSION_TYPE[g.method] ?? '') : ''
      setSessionType(derivedType as SessionType | '')
    }
    listGroupStaff(groupId)
      .then(staff => {
        setGroupStaff(staff)
        // DB one_lead_per_session → max 1 lead; prendre le premier coach principal du groupe
        const leads = staff.filter(s => s.role === 'principal').map(s => s.coachId).slice(0, 1)
        const assts = staff.filter(s => s.role === 'assistant').map(s => s.coachId).slice(0, 2)
        if (leads.length) setCoachLeads(leads)
        if (assts.length) setCoachAssistants(assts)
      })
      .catch(() => { setGroupStaff([]) })
  }, [groupId, groups])

  // ── Story 53-5 — Pré-remplissage depuis param ?prefill ──────────────────────
  useEffect(() => {
    if (!prefill) return
    try {
      const data = JSON.parse(atob(prefill as string))
      if (data.groupId)        setGroupId(data.groupId)
      if (data.implantationId) setImplantationId(data.implantationId)
      if (data.sessionType)    setSessionType(data.sessionType as SessionType)
      if (data.duration)       setDurationMinutes(data.duration as number)
      if (data.terrain)        setTerrain(data.terrain as string)
      setDuplicateToast(true)
      setTimeout(() => setDuplicateToast(false), 6000)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[seances/new] prefill decode error:', err)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Reset contentRef states when session type changes ──────────────────────
  // Story 21.1 : techniqueCtx supprimé — le contexte vient de contextType global
  useEffect(() => {
    setTechConcept('')
    setTechStageSeq(1)
    setDeciBlocks([{ id: crypto.randomUUID(), title: '' }])
    setGpModule(1)
    setGpEntNumber(1)
    setSessionTitle('')
  }, [sessionType])

  // Story 58-7 — Charger les recommandations quand groupId change (cache par groupId)
  useEffect(() => {
    if (!groupId || recommendations[groupId]) return
    setLoadingRecommendations(true)
    getRecommendedSituations(groupId)
      .then(res => {
        if (res.data.length > 0)
          setRecommendations(prev => ({ ...prev, [groupId]: res.data }))
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production')
          console.error('[SeancesNew] recommendations error:', err)
      })
      .finally(() => setLoadingRecommendations(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

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
    const isPonctuel = contextMode === 'ponctuel'
    if (!implantationId || selectedDates.length === 0) return
    if (isPonctuel ? !sessionLabel.trim() : !groupId) return
    if (!tenantId) {
      setResult({ created: 0, failed: selectedDates.length })
      return
    }
    setCreating(true)
    try {

    // Mode ponctuel : créer un groupe transient partagé par toutes les dates du batch
    let effectiveGroupId = groupId
    if (isPonctuel) {
      const groupMethod = sessionType
        ? (SESSION_TYPE_TO_GROUP_METHOD[sessionType as SessionType] ?? undefined)
        : undefined
      const { data: transientGroup, error: tErr } = await createTransientGroup({
        tenantId,
        implantationId,
        name  : sessionLabel.trim(),
        method: groupMethod,
      })
      if (tErr || !transientGroup) {
        if (process.env.NODE_ENV !== 'production') console.error('[NewSession] createTransientGroup error:', tErr)
        setResult({ created: 0, failed: selectedDates.length })
        return
      }
      effectiveGroupId = transientGroup.id
    }

    const finalTerrain = terrain === 'Autre…' ? customTerrain.trim() : terrain
    let created = 0, failed = 0
    // DB contrainte : one_lead_per_session → max 1 lead autorisé
    const leadCoachId = coachLeads[0] ?? null

    const sortedDates = [...selectedDates].sort()
    let linkWarnings = 0
    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr     = sortedDates[i]
      const [sy, sm, sd] = dateStr.split('-').map(Number)
      const scheduledAt = new Date(sy, sm - 1, sd, startHour, startMinute, 0).toISOString()
      // Build contentRef per session type (AC7 — structure correcte selon la méthode)
      // Story 21.1 : techniqueCtx remplacé par contextType global ; GP utilise gpModule + gpEntNumber
      const st = sessionType as SessionType
      let sessionContentRef: SessionContentRef
      if (st === 'decisionnel') {
        sessionContentRef = { method: 'decisionnel', blocks: deciBlocks.filter(b => b.title.trim() !== '').map(b => ({ title: b.title })) }
      } else if (st === 'technique' && contextType === 'stage') {
        sessionContentRef = { method: 'technique', context: 'stage', concept: techConcept.trim(), sequence: techStageSeq + i }
      } else if (st === 'goal_and_player') {
        // Nouveau format Story 21.1 : module + entNumber + globalNumber
        // Rollover automatique si entNumber dépasse 15 (passage au module suivant)
        const globalOffset = (gpModule - 1) * 15 + gpEntNumber - 1 + i  // 0-indexed global position
        const mod = (Math.floor(globalOffset / 15) + 1) as 1 | 2 | 3
        const ent = (globalOffset % 15) + 1
        const globalNum = globalOffset + 1
        sessionContentRef = { method: 'goal_and_player', module: mod, entNumber: ent, globalNumber: globalNum }
      } else if (st === 'technique' || st === 'situationnel') {
        sessionContentRef = computeContentRef(st, trainingNumber - 1 + i)
      } else {
        // perfectionnement | integration | equipe (ou vide si type non défini)
        sessionContentRef = { method: (st || 'perfectionnement') as 'perfectionnement' | 'integration' | 'equipe' }
      }

      const { data: session, error } = await createSession({
        tenantId,
        implantationId,
        groupId    : effectiveGroupId,
        scheduledAt,
        durationMinutes,
        location   : finalTerrain || undefined,
        sessionType: sessionType as SessionType || undefined,
        contentRef : sessionContentRef,
        // Story 21.1 — contexte global + titre auto-généré
        contextType,
        label      : sessionTitle.trim() || undefined,
      })

      if (error || !session) { failed++; continue }

      // Coach principal (1 seul — contrainte DB one_lead_per_session)
      if (leadCoachId) await assignCoach(session.id, leadCoachId, session.tenantId, 'lead')
      // Coachs assistants
      for (const id of coachAssistants) await assignCoach(session.id, id, session.tenantId, 'assistant')
      // Coachs remplaçants : stockés en mémoire uniquement (rôle 'replacement' non supporté en DB)
      // → à implémenter via une table dédiée si nécessaire (MVP : ignoré)

      // Pre-fill attendance roster from group members (seulement pour groupes réels)
      if (!isPonctuel) await prefillSessionAttendees(session.id).catch(err => { if (process.env.NODE_ENV !== 'production') console.error('[NewSession] prefillSessionAttendees error:', err) })

      // Story 21.2 — Lier les blocs thème (best-effort : erreurs loggées mais non-bloquantes)
      for (let j = 0; j < themeBlocks.length; j++) {
        const b = themeBlocks[j]
        if (!b.themeId) continue
        const { error: linkErr } = await addSessionThemeBlock({
          sessionId : session.id,
          tenantId  : session.tenantId,
          themeId   : b.themeId,
          sequenceId: b.sequenceId ?? undefined,
          resourceId: b.resourceId ?? undefined,
          sortOrder : j,
        })
        if (linkErr) { if (process.env.NODE_ENV !== 'production') console.warn(`[NewSession] addSessionThemeBlock[${j}] error:`, linkErr); linkWarnings++ }
      }

      // Story 21.3 — Persister les ateliers (best-effort)
      for (let k = 0; k < workshops.length; k++) {
        const w = workshops[k]
        if (w.pdfUploading || w.cardUploading) continue  // skip si upload en cours

        // Mode création : les fichiers sont stockés localement avec une blob: URL.
        // Maintenant que session.id est connu, on peut faire le vrai upload.
        let pdfUrl: string | undefined
        if (w.pdfUrl?.startsWith('blob:') && w.pdfFile) {
          const { url } = await uploadWorkshopPdf(w.pdfFile, session.tenantId, session.id)
          pdfUrl = url ?? undefined
        } else if (w.pdfUrl && !w.pdfUrl.startsWith('blob:')) {
          pdfUrl = w.pdfUrl
        }

        let cardUrl: string | undefined
        if (w.cardUrl?.startsWith('blob:') && w.cardFile) {
          const { url } = await uploadWorkshopCard(w.cardFile, session.tenantId, session.id)
          cardUrl = url ?? undefined
        } else if (w.cardUrl && !w.cardUrl.startsWith('blob:')) {
          cardUrl = w.cardUrl
        }

        const { error: wErr } = await addSessionWorkshop({
          sessionId : session.id,
          tenantId  : session.tenantId,
          title     : w.title.trim() || `Atelier ${k + 1}`,
          sortOrder : k,
          pdfUrl,
          cardLabel : w.cardLabel ?? undefined,
          cardUrl,
          notes     : w.notes.trim() || undefined,
        })
        if (wErr) { if (process.env.NODE_ENV !== 'production') console.warn(`[NewSession] addSessionWorkshop[${k}] error:`, wErr); linkWarnings++ }
      }

      created++
    }

    if (created > 0) toast.success(`${created} séance${created !== 1 ? 's' : ''} créée${created !== 1 ? 's' : ''}.`)
    setResult({ created, failed, linkWarnings: linkWarnings > 0 ? linkWarnings : undefined })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[NewSession] handleCreate unexpected error:', err)
      setResult({ created: 0, failed: selectedDates.length })
    } finally {
      setCreating(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const implantName    = implantations.find(i => i.id === implantationId)?.name ?? ''
  const implantOpts    = useMemo(() => implantations.map(i => ({ id: i.id, label: i.name })), [implantations])
  const groupOpts      = useMemo(() => groups.map(g => ({ id: g.id, label: g.name })),         [groups])
  const coachOpts      = useMemo(() => allCoaches.map(c => ({ id: c.id, label: c.name })),     [allCoaches])

  // Options coachs filtrées par rôle (depuis groupStaff, fallback tous coachs)
  const coachLeadOpts  = useMemo(() => {
    const ids = new Set(groupStaff.filter(s => s.role === 'principal').map(s => s.coachId))
    const filtered = allCoaches.filter(c => ids.has(c.id))
    return (filtered.length > 0 ? filtered : allCoaches).map(c => ({ id: c.id, label: c.name }))
  }, [groupStaff, allCoaches])

  const coachAssistantOpts = useMemo(() => {
    const ids = new Set(groupStaff.filter(s => s.role === 'assistant').map(s => s.coachId))
    return allCoaches.filter(c => ids.has(c.id)).map(c => ({ id: c.id, label: c.name }))
  }, [groupStaff, allCoaches])

  // Toggles multi-select avec limite max
  // DB contrainte : one_lead_per_session → max 1 lead
  const toggleCoachLead        = useCallback((id: string) => setCoachLeads(p =>
    p.includes(id) ? p.filter(x => x !== id) : p.length < 1 ? [...p, id] : p), [])
  const toggleCoachAssistant   = useCallback((id: string) => setCoachAssistants(p =>
    p.includes(id) ? p.filter(x => x !== id) : p.length < 2 ? [...p, id] : p), [])
  const toggleCoachReplacement = useCallback((id: string) => setCoachReplacements(p =>
    p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])

  // Libellés pour le résumé
  const coachLeadNames        = coachLeads.map(id => allCoaches.find(c => c.id === id)?.name ?? id).join(', ')
  const coachAssistantNames   = coachAssistants.map(id => allCoaches.find(c => c.id === id)?.name ?? id).join(', ')
  const coachReplacementNames = coachReplacements.map(id => allCoaches.find(c => c.id === id)?.name ?? id).join(', ')
  const finalTerrainLabel     = terrain === 'Autre…' ? customTerrain : terrain

  // Step 1 (Contexte) : implantation + (groupe existant OU nom de séance ponctuelle)
  const step1Valid = !!implantationId && (
    contextMode === 'existing' ? !!groupId : !!sessionLabel.trim()
  )
  // contentRefValid : bloque si le sous-formulaire obligatoire n'est pas rempli (AC7)
  // Story 21.1 : techniqueCtx → contextType global
  const contentRefValid = (() => {
    const st = sessionType as SessionType
    if (st === 'decisionnel') return deciBlocks.some(b => b.title.trim() !== '')
    if (st === 'technique' && contextType === 'stage') return techConcept.trim() !== ''
    return true // GP, Technique académie, Situationnel, types vides — toujours valide
  })()
  // Step 2 (Détails) : bloqué si contentRef invalide ou coach principal manquant
  const step2Valid = contentRefValid && coachLeads.length > 0
  // Step 3 (Thèmes) : toujours valide — 0 blocs autorisé (Story 21.2)
  const step3Valid = true
  // Step 4 (Ateliers) : toujours valide — 0 ateliers autorisé (Story 21.3)
  const step4Valid = true
  // Step 5 (Date) : au moins une date + séquence multi-date dans les bornes
  // Story 21.1 : techniqueCtx → contextType global
  const step5Valid = (() => {
    if (selectedDates.length === 0) return false
    if (!singleMode && selectedDates.length > 1) {
      const st = sessionType as SessionType
      if (st === 'technique' && contextType === 'stage') {
        if (techStageSeq + selectedDates.length - 1 > 8) return false
      } else if (st === 'goal_and_player') {
        // Rollover inter-modules supporté — limite globale 45 ENTs (3 modules × 15)
        const globalStart = (gpModule - 1) * 15 + gpEntNumber
        if (globalStart + selectedDates.length - 1 > 45) return false
      } else if (st === 'situationnel' || st === 'technique') {
        const max = TRAINING_MAX[st] ?? 20
        if (trainingNumber + selectedDates.length - 1 > max) return false
      }
    }
    return true
  })()

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <ScrollView style={p.container} contentContainerStyle={p.content}>
        <View style={p.resultCard}>
          <AureakText style={{ fontSize: 44, textAlign: 'center' as never }}>
            {result.failed === 0 ? '✅' : result.created > 0 ? '⚠️' : '❌'}
          </AureakText>
          <AureakText variant="h2" style={{ textAlign: 'center' as never, color: colors.text.dark, marginTop: space.md }}>
            {result.created} séance{result.created !== 1 ? 's' : ''} créée{result.created !== 1 ? 's' : ''}
          </AureakText>
          {result.failed > 0 && (
            <AureakText variant="caption" style={{ color: colors.accent.red, textAlign: 'center' as never, marginTop: space.xs }}>
              {result.failed} échec{result.failed !== 1 ? 's' : ''}
            </AureakText>
          )}
          {result.linkWarnings && result.linkWarnings > 0 && (
            <AureakText variant="caption" style={{ color: colors.status.warning, textAlign: 'center' as never, marginTop: space.xs }}>
              ⚠️ {result.linkWarnings} bloc{result.linkWarnings !== 1 ? 's' : ''} thème non lié{result.linkWarnings !== 1 ? 's' : ''} (contenu dupliqué possible)
            </AureakText>
          )}
          <AureakText variant="caption" style={{ color: colors.text.muted, textAlign: 'center' as never, marginTop: space.sm }}>
            {contextMode === 'ponctuel' ? sessionLabel : selectedGroup?.name} · {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''}
          </AureakText>
          <View style={p.resultActions}>
            <Pressable
              style={[p.btn, p.btnSecondary]}
              onPress={() => {
                // Reset complet de tous les champs du formulaire
                setResult(null); setStep(1)
                setImplantationId(''); setContextMode('existing'); setSessionLabel('')
                setContextType('academie')
                setGroupId(''); setSelectedGroup(null); setGroupStaff([])
                setSessionType('')
                setSingleMode(true); setSelectedDates([])
                setStartHour(9); setStartMinute(0); setDurationMinutes(90)
                setCoachLeads([]); setCoachAssistants([]); setCoachReplacements([])
                setTerrain(''); setCustomTerrain('')
                setTrainingNumber(1)
                setTechConcept(''); setTechStageSeq(1)
                setDeciBlocks([{ id: crypto.randomUUID(), title: '' }])
                setGpModule(1); setGpEntNumber(1)
                setSessionTitle('')
                setThemeBlocks([])
                setWorkshops([])
              }}
            >
              <AureakText variant="body" style={{ color: colors.text.dark }}>Nouvelle séance</AureakText>
            </Pressable>
            <Pressable style={[p.btn, p.btnPrimary]} onPress={() => router.push('/seances' as never)}>
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>Voir les séances →</AureakText>
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
          <AureakText variant="caption" style={{ color: colors.text.muted }}>← Retour</AureakText>
        </Pressable>
        <AureakText variant="h2">Nouvelle séance</AureakText>
      </View>

      {/* Story 53-5 — Toast duplication */}
      {duplicateToast && (
        <View style={{ backgroundColor: colors.status.warningBg, borderWidth: 1, borderColor: colors.accent.goldLight, borderRadius: 8, padding: space.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AureakText variant="caption" style={{ color: colors.status.warningText, fontWeight: '700' as never, flex: 1 }}>
            ↻ Séance pré-remplie — choisissez la date pour confirmer
          </AureakText>
          <Pressable onPress={() => setDuplicateToast(false)}>
            <AureakText variant="caption" style={{ color: colors.status.warningText }}>×</AureakText>
          </Pressable>
        </View>
      )}

      {/* Step indicator */}
      <StepBar current={step} />

      {/* ═══════════════════════════════════════════════════════════
          STEP 1 — Contexte (Implantation + Groupe existant | Séance ponctuelle)
          ═══════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <View style={p.stepWrap}>

          {/* Implantation */}
          <View style={[p.card, p.cardWithDropdown, { zIndex: 20 }]}>
            <SectionLabel title="Implantation" hint="Site physique de la séance" />
            {implantationsError ? (
              <View style={p.errorBox}>
                <AureakText variant="caption" style={{ color: colors.accent.red }}>{implantationsError}</AureakText>
                <Pressable onPress={() => {
                  setImplantationsError(null)
                  setLoadingImplantations(true)
                  listImplantations().then(({ data, error }) => {
                    if (error) setImplantationsError('Impossible de charger les implantations.')
                    else setImplantations(data ?? [])
                  }).catch(err => {
                    if (process.env.NODE_ENV !== 'production') console.error('[NewSession] retry listImplantations error:', err)
                    setImplantationsError('Impossible de charger les implantations.')
                  }).finally(() => {
                    setLoadingImplantations(false)
                  })
                }}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, marginTop: 4 }}>↺ Réessayer</AureakText>
                </Pressable>
              </View>
            ) : (
              <>
                <SearchableSelect
                  options={implantOpts}
                  value={implantationId}
                  onSelect={id => { setImplantationId(id); setGroupId('') }}
                  placeholder={loadingImplantations ? 'Chargement…' : implantOpts.length === 0 ? 'Aucune implantation trouvée' : 'Sélectionner une implantation…'}
                  disabled={loadingImplantations}
                  zBase={15}
                />
                {!loadingImplantations && implantOpts.length === 0 && (
                  <View style={p.infoNote}>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      Aucune implantation configurée.{' '}
                      <Pressable onPress={() => router.push('/implantations' as never)}>
                        <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                          Créer une implantation →
                        </AureakText>
                      </Pressable>
                    </AureakText>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Toggle Contexte pédagogique — Story 21.1 */}
          <View style={p.card}>
            <SectionLabel title="Contexte pédagogique" hint="Académie = entraînement hebdomadaire · Stage = intensif ponctuel" />
            <View style={p.modeRow}>
              {(['academie', 'stage'] as const).map(ctx => (
                <Pressable
                  key={ctx}
                  style={[p.modeBtn, contextType === ctx && p.modeBtnActive]}
                  onPress={() => setContextType(ctx)}
                >
                  <AureakText style={{ textAlign: 'center' as never, fontSize: 13, color: contextType === ctx ? colors.text.dark : colors.text.muted, fontWeight: contextType === ctx ? '700' as never : '400' as never }}>
                    {ctx === 'academie' ? '🏫  Académie' : '🏕️  Stage'}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Toggle type de séance (groupe existant / ponctuel) */}
          <View style={p.card}>
            <SectionLabel title="Type de séance" hint="Une séance ponctuelle ne crée pas de groupe permanent" />
            <View style={p.modeRow}>
              {(['existing', 'ponctuel'] as const).map(mode => (
                <Pressable
                  key={mode}
                  style={[p.modeBtn, contextMode === mode && p.modeBtnActive]}
                  onPress={() => {
                    setContextMode(mode)
                    setGroupId('')
                    setSelectedGroup(null)
                    setGroupStaff([])
                    setSessionType('')
                    setSessionLabel('')
                  }}
                >
                  <AureakText style={{ textAlign: 'center' as never, fontSize: 13, color: contextMode === mode ? colors.text.dark : colors.text.muted, fontWeight: contextMode === mode ? '700' as never : '400' as never }}>
                    {mode === 'existing' ? '👥  Groupe existant' : '⚡  Séance ponctuelle'}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Mode Groupe existant */}
          {contextMode === 'existing' && (
            <>
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
                    groups.length === 0 ? 'Aucun groupe configuré pour cette implantation' :
                    'Sélectionner un groupe…'
                  }
                  disabled={!implantationId || loadingGroups}
                  zBase={5}
                />
              </View>

              {/* Aperçu du groupe sélectionné */}
              {selectedGroup && (
                <GroupCard group={selectedGroup} implantationName={implantName} staff={groupStaff} />
              )}

              {/* Info : méthode auto-dérivée depuis le groupe */}
              {selectedGroup && sessionType && (
                <View style={[p.infoNote, { borderColor: colors.accent.gold + '60', backgroundColor: colors.accent.gold + '10' }]}>
                  <AureakText style={{ fontSize: 11, color: colors.text.muted }}>
                    ✓ Méthode déduite du groupe :{' '}
                    <AureakText style={{ fontWeight: '700' as never, color: colors.accent.gold }}>
                      {SESSION_TYPE_LABELS[sessionType as SessionType]}
                    </AureakText>
                  </AureakText>
                </View>
              )}
            </>
          )}

          {/* Mode Séance ponctuelle */}
          {contextMode === 'ponctuel' && (
            <View style={p.card}>
              <SectionLabel
                title="Nom de la séance"
                hint="Identifiant libre — ex: Stage Pâques U12, Tournoi Décisionnel"
              />
              <TextInput
                style={p.textInput}
                value={sessionLabel}
                onChangeText={setSessionLabel}
                placeholder="Ex: Stage Pâques U12 — Décisionnel"
                placeholderTextColor={colors.text.muted}
                autoFocus
                autoComplete={'off' as never}
                autoCorrect={false}
                autoCapitalize="words"
              />
              <View style={[p.infoNote, { marginTop: space.xs }]}>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  Un groupe technique temporaire sera créé automatiquement et n'apparaîtra pas dans la liste des groupes.
                </AureakText>
              </View>
            </View>
          )}



          <View style={p.navRow}>
            <View />
            <Pressable
              style={[p.btn, p.btnPrimary, !step1Valid && p.btnDisabled]}
              onPress={() => step1Valid && setStep(2)}
              disabled={!step1Valid}
            >
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                Détails →
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STEP 2 — Détails (Entraînement + Coaches + Terrain + Thème)
          ═══════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <View style={p.stepWrap}>

          {selectedGroup && <GroupCard group={selectedGroup} implantationName={implantName} staff={groupStaff} />}

          {/* ── Méthodologie ── */}
          <View style={p.card}>
            <SectionLabel title="Méthodologie d'entraînement" />
            {sessionType && selectedGroup?.method ? (
              // Méthodologie dérivée du groupe → affichage read-only
              <View style={ss2.methodBadge}>
                <AureakText style={{ fontSize: 13, fontWeight: '700' as never, color: colors.accent.gold }}>
                  {SESSION_TYPE_LABELS[sessionType as SessionType]}
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted, marginLeft: 6 }}>
                  · héritée du groupe
                </AureakText>
              </View>
            ) : (
              // Pas de méthode sur le groupe → sélection par grandes tuiles (Story 53-4)
              <MethodTileGrid value={sessionType} onChange={setSessionType} />
            )}
          </View>

          {/* ── Entraînement N° (types séquentiels, hors GP qui a ses propres sélecteurs) ── */}
          {/* Story 21.1 : goal_and_player géré via Module+ENT — exclure du sélecteur générique */}
          {(sessionType === 'situationnel' ||
            (sessionType === 'technique' && contextType === 'academie')) && (
            <View style={p.card}>
              <SectionLabel
                title="Entraînement"
                hint={sessionType
                  ? `${SESSION_TYPE_LABELS[sessionType as SessionType]} — ${TRAINING_MAX[sessionType] ?? 20} entraînements dans le cycle`
                  : 'Sélectionnez une méthodologie pour voir les entraînements disponibles'
                }
              />
              {/* Grille de chips numérotés */}
              <View style={ss2.trainingGrid}>
                {Array.from({ length: TRAINING_MAX[sessionType] ?? 20 }, (_, i) => i + 1).map(n => (
                  <Pressable
                    key={n}
                    style={[ss2.trainingChip, trainingNumber === n && ss2.trainingChipActive]}
                    onPress={() => setTrainingNumber(n)}
                  >
                    <AureakText style={{
                      fontSize: 12,
                      fontWeight: trainingNumber === n ? '700' as never : '400' as never,
                      color: trainingNumber === n ? colors.text.dark : colors.text.muted,
                    }}>
                      {n}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
              {!singleMode && (() => {
                const last = trainingNumber + selectedDates.length - 1
                const max  = TRAINING_MAX[sessionType] ?? 20
                const over = selectedDates.length > 1 && last > max
                return (
                  <View style={[p.infoNote, { marginTop: space.xs, borderColor: over ? colors.accent.red + '60' : undefined, backgroundColor: over ? colors.accent.red + '10' : undefined }]}>
                    <AureakText variant="caption" style={{ color: over ? colors.accent.red : colors.accent.gold }}>
                      {selectedDates.length > 1
                        ? over
                          ? `⚠ Séquence ${trainingNumber} → ${last} dépasse le maximum (${max}) — choisissez un numéro de départ ≤ ${max - selectedDates.length + 1}`
                          : `Séquence : Entraînement ${trainingNumber} → ${last}`
                        : `Mode multi-dates : séances numérotées à partir de ${trainingNumber}`
                      }
                    </AureakText>
                  </View>
                )
              })()}
            </View>
          )}

          {/* ── Contenu pédagogique (sous-formulaire par type — AC7) ── */}
          {sessionType && !['perfectionnement', 'integration', 'equipe'].includes(sessionType) && (
            <View style={p.card}>
              <SectionLabel title="Contenu pédagogique" hint="Référence précise dans le cycle pédagogique" />

              {/* Technique : contexte dérivé du Step 1 (contextType global — Story 21.1) */}
              {sessionType === 'technique' && (
                <View style={{ gap: space.sm }}>
                  <View style={[p.infoNote, { borderColor: colors.accent.gold + '30', backgroundColor: colors.accent.gold + '08' }]}>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      Contexte :{' '}
                      <AureakText style={{ fontWeight: '700' as never, color: colors.accent.gold }}>
                        {contextType === 'academie' ? '🏫 Académie' : '🏕️ Stage'}
                      </AureakText>
                      {' · '}défini en Step 1
                    </AureakText>
                  </View>
                  {contextType === 'stage' && (
                    <View style={{ gap: space.sm }}>
                      <SectionLabel title="Concept" hint="Requis — ex: Prise en main, Relance courte…" />
                      <TextInput
                        style={[p.textInput, !techConcept.trim() && { borderColor: colors.accent.red }]}
                        value={techConcept}
                        onChangeText={setTechConcept}
                        placeholder="Concept du stage…"
                        placeholderTextColor={colors.text.muted}
                        autoComplete={'off' as never}
                        autoCorrect={false}
                      />
                      {!techConcept.trim() && (
                        <AureakText variant="caption" style={{ color: colors.accent.red }}>Le concept est requis pour les séances stage</AureakText>
                      )}
                      <SectionLabel title="Séquence dans ce concept" hint="1-8" />
                      <NumChips values={[1,2,3,4,5,6,7,8]} selected={techStageSeq} onSelect={setTechStageSeq} fmt={v => `Séq. ${v}`} />
                    </View>
                  )}
                  {contextType === 'academie' && (
                    <View style={[p.infoNote, { borderColor: colors.accent.gold + '60', backgroundColor: colors.accent.gold + '10' }]}>
                      {(() => {
                        const ref = computeContentRef('technique', trainingNumber - 1)
                        const r = ref as { module: number; sequence: number; globalNumber: number }
                        return (
                          <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                            Module <AureakText style={{ fontWeight: '700' as never }}>{r.module}</AureakText>
                            {' · '}Séq. <AureakText style={{ fontWeight: '700' as never }}>{r.sequence}</AureakText>
                            {' · '}Technique #<AureakText style={{ fontWeight: '700' as never }}>{r.globalNumber}</AureakText>
                          </AureakText>
                        )
                      })()}
                    </View>
                  )}
                </View>
              )}

              {/* Décisionnel : liste de blocs libres */}
              {sessionType === 'decisionnel' && (
                <View style={{ gap: space.sm }}>
                  {deciBlocks.map((b, i) => (
                    <View key={b.id} style={{ flexDirection: 'row' as never, alignItems: 'center' as never, gap: space.xs }}>
                      <TextInput
                        style={[p.textInput, { flex: 1 }]}
                        value={b.title}
                        onChangeText={t => setDeciBlocks(prev => prev.map(x => x.id === b.id ? { ...x, title: t } : x))}
                        placeholder={`Bloc ${i + 1} — titre…`}
                        placeholderTextColor={colors.text.muted}
                        autoComplete={'off' as never}
                        autoCorrect={false}
                      />
                      {deciBlocks.length > 1 && (
                        <Pressable
                          style={{ padding: space.xs, borderRadius: 4, backgroundColor: colors.accent.red + '18' }}
                          onPress={() => setDeciBlocks(prev => prev.filter(x => x.id !== b.id))}
                        >
                          <AureakText style={{ fontSize: 12, color: colors.accent.red }}>✕</AureakText>
                        </Pressable>
                      )}
                    </View>
                  ))}
                  <Pressable
                    style={{ flexDirection: 'row' as never, alignItems: 'center' as never, gap: space.xs, paddingVertical: space.xs }}
                    onPress={() => setDeciBlocks(prev => [...prev, { id: crypto.randomUUID(), title: '' }])}
                  >
                    <AureakText style={{ fontSize: 12, color: colors.accent.gold }}>+ Ajouter un bloc</AureakText>
                  </Pressable>
                  {!deciBlocks.some(b => b.title.trim()) && (
                    <AureakText variant="caption" style={{ color: colors.accent.red }}>Au moins un bloc avec un titre est requis</AureakText>
                  )}
                </View>
              )}

              {/* Situationnel : aperçu du bloc code calculé depuis trainingNumber */}
              {sessionType === 'situationnel' && (
                <View style={[p.infoNote, { borderColor: colors.accent.gold + '60', backgroundColor: colors.accent.gold + '10' }]}>
                  {(() => {
                    const ref = computeContentRef('situationnel', trainingNumber - 1)
                    const r = ref as { blocCode: SituationalBlocCode; sequence: number; label: string }
                    return (
                      <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                        Bloc <AureakText style={{ fontWeight: '700' as never }}>{SITUATIONAL_BLOC_LABELS[r.blocCode] ?? r.blocCode}</AureakText>
                        {' · '}Séquence <AureakText style={{ fontWeight: '700' as never }}>{r.label}</AureakText>
                      </AureakText>
                    )
                  })()}
                </View>
              )}

              {/* Goal & Player : sélecteurs Module (1-3) + ENT (1-15) — Story 21.1 */}
              {sessionType === 'goal_and_player' && (
                <View style={{ gap: space.sm }}>
                  <SectionLabel title="Module" hint="Module 1, 2 ou 3" />
                  <View style={{ flexDirection: 'row' as never, gap: space.xs }}>
                    {([1, 2, 3] as const).map(mod => (
                      <Pressable
                        key={mod}
                        style={[ss2.trainingChip, { minWidth: 80 }, gpModule === mod && ss2.trainingChipActive]}
                        onPress={() => setGpModule(mod)}
                      >
                        <AureakText style={{ fontSize: 12, fontWeight: gpModule === mod ? '700' as never : '400' as never, color: gpModule === mod ? colors.text.dark : colors.text.muted }}>
                          Module {mod}
                        </AureakText>
                      </Pressable>
                    ))}
                  </View>
                  <SectionLabel title="ENT" hint="Entraînement 1 à 15 dans ce module" />
                  <View style={ss2.trainingGrid}>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
                      <Pressable
                        key={n}
                        style={[ss2.trainingChip, gpEntNumber === n && ss2.trainingChipActive]}
                        onPress={() => setGpEntNumber(n)}
                      >
                        <AureakText style={{ fontSize: 12, fontWeight: gpEntNumber === n ? '700' as never : '400' as never, color: gpEntNumber === n ? colors.text.dark : colors.text.muted }}>
                          {n}
                        </AureakText>
                      </Pressable>
                    ))}
                  </View>
                  <View style={[p.infoNote, { borderColor: colors.accent.gold + '60', backgroundColor: colors.accent.gold + '10' }]}>
                    <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                      Référence : <AureakText style={{ fontWeight: '700' as never }}>Goal & Player – Module {gpModule} – ENT {gpEntNumber}</AureakText>
                      {' · '}Global #<AureakText style={{ fontWeight: '700' as never }}>{(gpModule - 1) * 15 + gpEntNumber}</AureakText>
                    </AureakText>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ── Coaches — Story 53-10 : DnD board ──────────────────── */}
          <View style={p.card}>
            <SectionLabel
              title="Coaches"
              hint={contextMode === 'ponctuel' ? 'Coaches pour cette séance' : 'Hérités du groupe — modifiables pour cette séance uniquement'}
            />

            {coachLeads.length === 0 && (
              <View style={p.coachValidation}>
                <AureakText variant="caption" style={{ fontSize: 10, color: colors.accent.red }}>
                  Minimum 1 coach principal requis (premier assigné = principal)
                </AureakText>
              </View>
            )}

            {/* DnD Board principal + assistants */}
            <CoachDndBoard
              availableCoaches={allCoaches}
              assignedCoachIds={[...coachLeads, ...coachAssistants]}
              onAssign={(id) => {
                // Premier assigné = lead, suivants = assistants
                if (coachLeads.length === 0) {
                  if (!coachLeads.includes(id)) setCoachLeads([id])
                } else {
                  if (!coachAssistants.includes(id) && coachAssistants.length < 2)
                    setCoachAssistants(prev => [...prev, id])
                }
              }}
              onUnassign={(id) => {
                if (coachLeads.includes(id)) {
                  setCoachLeads([])
                } else {
                  setCoachAssistants(prev => prev.filter(c => c !== id))
                }
              }}
            />

            {/* Coachs remplaçants (0-n) — conservé en liste */}
            <View style={[p.coachSection, { zIndex: 6, marginTop: space.xs }]}>
              <View style={p.coachSectionHeader}>
                <AureakText style={p.fieldLabel}>Coachs remplaçants</AureakText>
                <AureakText variant="caption" style={{ fontSize: 10, color: colors.text.muted }}>à contacter en cas d'absence</AureakText>
              </View>
              <MultiSearchableSelect
                options={coachOpts}
                selected={coachReplacements}
                onToggle={toggleCoachReplacement}
                placeholder="Ajouter un remplaçant…"
                zBase={6}
              />
            </View>
          </View>

          {/* ── Terrain ─────────────────────────────────────────────── */}
          <View style={p.card}>
            <SectionLabel title="Terrain" hint="Lieu physique de la séance" />
            <ChipPicker options={TERRAINS} value={terrain} onSelect={setTerrain} />
            {terrain === 'Autre…' && (
              <TextInput
                style={[p.textInput, { marginTop: space.sm }]}
                value={customTerrain}
                onChangeText={setCustomTerrain}
                placeholder="Nom du terrain ou lieu…"
                placeholderTextColor={colors.text.muted}
              />
            )}
          </View>

          {/* ── Titre de la séance (Story 21.1) ─────────────────────── */}
          {sessionType && (
            <TitleField
              sessionType={sessionType as SessionType}
              contextType={contextType}
              gpModule={gpModule}
              gpEntNumber={gpEntNumber}
              trainingNumber={trainingNumber}
              techConcept={techConcept}
              techStageSeq={techStageSeq}
              deciBlocks={deciBlocks}
              value={sessionTitle}
              onChange={setSessionTitle}
            />
          )}

          <View style={p.navRow}>
            <Pressable style={[p.btn, p.btnSecondary]} onPress={() => setStep(1)}>
              <AureakText variant="body" style={{ color: colors.text.dark }}>← Retour</AureakText>
            </Pressable>
            <Pressable
              style={[p.btn, p.btnPrimary, !step2Valid && p.btnDisabled]}
              onPress={() => step2Valid && setStep(3)}
              disabled={!step2Valid}
            >
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                Thèmes →
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STEP 3 — Thèmes pédagogiques
          ═══════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <View style={p.stepWrap}>

          {/* Story 58-7 — Section recommandations exercices pour ce groupe */}
          {(() => {
            const groupRecs = groupId ? (recommendations[groupId] ?? []) : []
            const recommended = groupRecs.filter(s => s.isRecommended).slice(0, 6)
            const others      = groupRecs.filter(s => !s.isRecommended)
            if (groupId && (loadingRecommendations || recommended.length > 0)) {
              return (
                <View style={p.card}>
                  <SectionLabel title="Recommandés pour ce groupe" hint="Basé sur le niveau moyen des joueurs (90 jours)" />
                  {loadingRecommendations ? (
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>Analyse du groupe en cours…</AureakText>
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                        {recommended.map(s => (
                          <View
                            key={s.id}
                            style={{
                              paddingHorizontal: space.sm,
                              paddingVertical: space.xs,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: colors.accent.gold,
                              backgroundColor: colors.accent.gold + '15',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: space.xs,
                            }}
                          >
                            <AureakText style={{ fontSize: 10, color: colors.accent.gold, fontWeight: '700' as never }}>✦</AureakText>
                            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' as never }}>
                              {s.title}
                            </AureakText>
                            <AureakText variant="caption" style={{ color: colors.text.muted }}>
                              {'★'.repeat(s.difficultyLevel ?? 3)}
                            </AureakText>
                          </View>
                        ))}
                      </View>
                      {others.length > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
                          <View style={{ flex: 1, height: 1, backgroundColor: colors.border.divider }} />
                          <AureakText variant="caption" style={{ color: colors.text.muted }}>Autres exercices</AureakText>
                          <View style={{ flex: 1, height: 1, backgroundColor: colors.border.divider }} />
                        </View>
                      )}
                    </>
                  )}
                </View>
              )
            }
            return null
          })()}

          {/* Story 58-8 — Durées des 3 phases (timeline éditable) */}
          <View style={p.card}>
            <SectionLabel
              title="Structure de la séance"
              hint="Répartissez les phases — Activation · Développement · Conclusion"
            />
            {(() => {
              const totalPhases = MODULE_TYPES.reduce((sum, t) => sum + (phaseDurations[t] ?? 0), 0)
              const isOver      = durationMinutes > 0 && totalPhases > durationMinutes
              return (
                <View style={{ gap: space.sm }}>
                  {/* Indicateur total */}
                  <AureakText variant="caption" style={{ color: isOver ? colors.accent.red : colors.text.muted }}>
                    {isOver
                      ? `⚠ Total dépassé : ${totalPhases} min / ${durationMinutes} min prévus`
                      : `${totalPhases} min / ${durationMinutes} min`
                    }
                  </AureakText>
                  {MODULE_TYPES.map(type => {
                    const label = MODULE_LABELS[type]
                    const val   = phaseDurations[type] ?? 0
                    return (
                      <View key={type} style={{ gap: space.xs }}>
                        <AureakText variant="label" style={{ fontSize: 10, color: colors.text.muted }}>{label.toUpperCase()}</AureakText>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
                          {[0, 5, 10, 15, 20, 25, 30].map(v => (
                            <Pressable
                              key={v}
                              style={[cp.chip, val === v && cp.chipActive]}
                              onPress={() => setPhaseDurations(prev => ({ ...prev, [type]: v }))}
                            >
                              <AureakText style={{ fontSize: 11, color: val === v ? colors.text.dark : colors.text.muted, fontWeight: val === v ? '600' as never : '400' as never }}>
                                {v} min
                              </AureakText>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )
                  })}
                </View>
              )
            })()}
          </View>

          <View style={[p.card, p.cardWithDropdown]}>
            <SectionLabel title="Thèmes pédagogiques" hint="Optionnel — 0 à N thèmes par séance" />
            <ThemeBlockPicker
              methodFilter={sessionType ? (SESSION_TYPE_TO_METHOD[sessionType as SessionType] ?? null) : null}
              blocks={themeBlocks}
              onAdd={() => setThemeBlocks(prev => [...prev, { themeId: '', themeName: '', sequenceId: null, sequenceName: null, resourceId: null, resourceLabel: null }])}
              onRemove={i => setThemeBlocks(prev => prev.filter((_, idx) => idx !== i))}
              onUpdate={(i, patch) => setThemeBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, ...patch } : b))}
              onReorder={(i, dir) => {
                setThemeBlocks(prev => {
                  const next = [...prev]
                  const j = dir === 'up' ? i - 1 : i + 1
                  if (j < 0 || j >= next.length) return prev
                  ;[next[i], next[j]] = [next[j], next[i]]
                  return next
                })
              }}
            />
          </View>
          <View style={p.navRow}>
            <Pressable style={[p.btn, p.btnSecondary]} onPress={() => setStep(2)}>
              <AureakText variant="body" style={{ color: colors.text.dark }}>← Retour</AureakText>
            </Pressable>
            <Pressable style={[p.btn, p.btnPrimary]} onPress={() => setStep(4)}>
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>Ateliers →</AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STEP 4 — Ateliers
          ═══════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <View style={p.stepWrap}>
          <View style={p.card}>
            <SectionLabel title="Ateliers" hint="Optionnel — 0 à 4 ateliers par séance (PDF, carte, notes)" />
            <WorkshopBlockEditor
              workshops={workshops}
              onAdd={() => setWorkshops(prev => [...prev, {
                title: '', pdfUrl: null, pdfFile: null, pdfUploading: false,
                cardLabel: null, cardUrl: null, cardFile: null, cardUploading: false, notes: '',
              }])}
              onRemove={i => setWorkshops(prev => prev.filter((_, idx) => idx !== i))}
              onUpdate={(i, patch) => setWorkshops(prev => prev.map((w, idx) => idx === i ? { ...w, ...patch } : w))}
              onReorder={(i, dir) => {
                setWorkshops(prev => {
                  const next = [...prev]
                  const j = dir === 'up' ? i - 1 : i + 1
                  if (j < 0 || j >= next.length) return prev
                  ;[next[i], next[j]] = [next[j], next[i]]
                  return next
                })
              }}
              tenantId={tenantId}
            />
          </View>
          <View style={p.navRow}>
            <Pressable style={[p.btn, p.btnSecondary]} onPress={() => setStep(3)}>
              <AureakText variant="body" style={{ color: colors.text.dark }}>← Retour</AureakText>
            </Pressable>
            <Pressable style={[p.btn, p.btnPrimary]} onPress={() => setStep(5)}>
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>Date →</AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STEP 5 — Date & Horaire
          ═══════════════════════════════════════════════════════════ */}
      {step === 5 && (
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
                  <AureakText style={{ textAlign: 'center' as never, fontSize: 13, color: singleMode === single ? colors.text.dark : colors.text.muted, fontWeight: singleMode === single ? '700' as never : '400' as never }}>
                    {single ? '📅  Séance unique' : '📆  Plusieurs dates'}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Calendar */}
          <View style={p.card}>
            <SectionLabel
              title={singleMode ? 'Date de la séance' : 'Dates — cliquez pour sélectionner'}
              hint={singleMode ? undefined : 'Chaque date sélectionnée créera une séance indépendante'}
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
            <Pressable style={[p.btn, p.btnSecondary]} onPress={() => setStep(4)}>
              <AureakText variant="body" style={{ color: colors.text.dark }}>← Retour</AureakText>
            </Pressable>
            <Pressable
              style={[p.btn, p.btnPrimary, !step5Valid && p.btnDisabled]}
              onPress={() => step5Valid && setStep(6)}
              disabled={!step5Valid}
            >
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                Réviser →
              </AureakText>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════
          STEP 6 — Résumé & Création
          ═══════════════════════════════════════════════════════════ */}
      {step === 6 && (
        <View style={p.stepWrap}>

          {/* Summary card */}
          <View style={p.card}>
            <SectionLabel title={`${selectedDates.length} séance${selectedDates.length !== 1 ? 's' : ''} à créer`} />
            {contextMode === 'ponctuel'
              ? <SummaryRow label="Séance ponctuelle" value={sessionLabel} />
              : <SummaryRow label="Groupe"            value={selectedGroup?.name ?? ''} />
            }
            <SummaryRow label="Implantation"    value={implantName} />
            <SummaryRow label="Contexte"         value={contextType === 'academie' ? '🏫 Académie' : '🏕️ Stage'} />
            <SummaryRow label="Méthode"           value={sessionType ? SESSION_TYPE_LABELS[sessionType as SessionType] : ''} />
            {sessionTitle ? <SummaryRow label="Titre" value={sessionTitle} /> : null}
            {sessionType === 'decisionnel' ? (
              <SummaryRow label="Contenu" value={`Décisionnel · ${deciBlocks.filter(b => b.title.trim()).length} bloc(s)`} />
            ) : sessionType === 'technique' && contextType === 'stage' ? (
              <SummaryRow label="Contenu" value={`Stage — ${techConcept} · Séq. ${techStageSeq}`} />
            ) : (
              <SummaryRow label="Entraînement n°" value={selectedDates.length > 1 ? `${trainingNumber} → ${trainingNumber + selectedDates.length - 1}` : String(trainingNumber)} />
            )}
            <SummaryRow label="Horaire"           value={`${String(startHour).padStart(2, '0')}h${String(startMinute).padStart(2, '0')} · ${durationMinutes} min`} />
            <SummaryRow label="Coach principal"   value={coachLeadNames} />
            <SummaryRow label="Coachs assistants" value={coachAssistantNames} />
            {coachReplacementNames ? <SummaryRow label="Remplaçants (mémo)" value={`${coachReplacementNames} · non enregistré`} /> : null}
            <SummaryRow label="Terrain"           value={finalTerrainLabel} />
            {themeBlocks.filter(b => b.themeId).length > 0 && (
              <SummaryRow label="Thèmes" value={`${themeBlocks.filter(b => b.themeId).length} thème(s) sélectionné(s)`} />
            )}
            {workshops.length > 0 && (
              <SummaryRow label="Ateliers" value={`${workshops.length} atelier(s)`} />
            )}
          </View>

          {/* Date list */}
          <View style={p.card}>
            <SectionLabel title="Dates planifiées" />
            {[...selectedDates].sort().map((d, i) => (
              <View key={d} style={[p.dateRow, i % 2 === 1 && { backgroundColor: colors.light.muted }]}>
                <AureakText style={{ fontSize: 11, color: colors.text.muted, width: 24 }}>{i + 1}.</AureakText>
                <AureakText style={{ flex: 1, fontSize: 13, color: colors.text.dark }}>{formatDateFull(d)}</AureakText>
                <AureakText style={{ fontSize: 12, color: colors.text.muted }}>
                  {String(startHour).padStart(2, '0')}h{String(startMinute).padStart(2, '0')}
                </AureakText>
              </View>
            ))}
          </View>

          <View style={p.navRow}>
            <Pressable style={[p.btn, p.btnSecondary]} onPress={() => setStep(5)}>
              <AureakText variant="body" style={{ color: colors.text.dark }}>← Modifier</AureakText>
            </Pressable>
            {(() => {
              const uploading = workshops.some(w => w.pdfUploading || w.cardUploading)
              const blocked   = creating || uploading
              return (
                <Pressable
                  style={[p.btn, p.btnCreate, blocked && p.btnDisabled]}
                  onPress={handleCreate}
                  disabled={blocked}
                >
                  <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
                    {uploading
                      ? '⏳ Upload en cours…'
                      : creating
                        ? '⟳ Création en cours…'
                        : `✦ Créer ${selectedDates.length} séance${selectedDates.length !== 1 ? 's' : ''}`
                    }
                  </AureakText>
                </Pressable>
              )
            })()}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

// ── Styles Story 13.1 ─────────────────────────────────────────────────────────

const ss2 = StyleSheet.create({
  typeChip       : { paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  typeChipActive : { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '20' },
  // Méthodologie badge (read-only)
  methodBadge    : { flexDirection: 'row' as never, alignItems: 'center' as never, backgroundColor: colors.accent.gold + '12', borderRadius: 8, paddingHorizontal: space.md, paddingVertical: space.sm, borderWidth: 1, borderColor: colors.accent.gold + '40' },
  // Grille d'entraînements
  trainingGrid   : { flexDirection: 'row' as never, flexWrap: 'wrap' as never, gap: 6, marginTop: space.xs },
  trainingChip   : { minWidth: 38, height: 38, alignItems: 'center' as never, justifyContent: 'center' as never, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  trainingChipActive: { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold, minWidth: 38, height: 38, alignItems: 'center' as never, justifyContent: 'center' as never, borderRadius: 8 },
})

// ── Styles ─────────────────────────────────────────────────────────────────────

const p = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.light.primary },
  content     : { padding: space.xl, gap: space.md, paddingBottom: space.xxxl },

  titleRow    : { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingBottom: space.xs },
  backBtn     : { paddingRight: space.xs },

  stepWrap    : { gap: space.md },
  card        : { backgroundColor: colors.light.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, padding: space.md, gap: space.sm },
  // Cards containing SearchableSelect dropdowns need overflow visible so the dropdown
  // is not clipped by the card's border-radius on React Native web
  cardWithDropdown: { overflow: 'visible' as never },
  errorBox    : { padding: space.sm, borderRadius: 6, backgroundColor: colors.status.errorBg, borderWidth: 1, borderColor: colors.status.errorBorder },
  fieldLabel  : { fontSize: 10, fontWeight: '600' as never, letterSpacing: 0.5, color: colors.text.muted, textTransform: 'uppercase' as never, marginBottom: 4 },
  textInput   : { backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light, borderRadius: 8, paddingHorizontal: space.md, paddingVertical: space.sm, color: colors.text.dark, fontSize: 13 },
  infoNote    : { backgroundColor: colors.light.muted, borderRadius: 6, padding: space.sm, borderWidth: 1, borderColor: colors.border.light, marginTop: space.xs },

  modeRow     : { flexDirection: 'row', gap: space.sm },
  modeBtn     : { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', backgroundColor: colors.light.muted },
  modeBtnActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },

  navRow      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.xs },
  btn         : { paddingHorizontal: space.lg, paddingVertical: space.sm + 4, borderRadius: 8, minWidth: 110, alignItems: 'center' },
  btnPrimary  : { backgroundColor: colors.accent.gold },
  btnSecondary: { backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  btnCreate   : { backgroundColor: colors.accent.gold, paddingHorizontal: space.xl },
  btnDisabled : { opacity: 0.4 },

  dateRow     : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xs, paddingVertical: 9, borderRadius: 6, gap: space.xs },

  resultCard   : { backgroundColor: colors.light.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border.light, padding: space.xxl, alignItems: 'center', marginTop: space.xl },
  resultActions: { flexDirection: 'row', gap: space.md, marginTop: space.lg },

  // Sous-sections coaches / thèmes
  coachSection      : { gap: 6, position: 'relative' as never },
  coachSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  coachCountBadge   : { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light },
  coachValidation   : { paddingHorizontal: space.xs, paddingVertical: 2 },
})
