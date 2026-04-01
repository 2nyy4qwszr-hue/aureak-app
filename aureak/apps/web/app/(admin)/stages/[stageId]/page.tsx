'use client'
// Vue détail d'un stage — planning visuel jour par jour
// Structure : Stage → StageDays (onglets) → StageBlocks (timeline)
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getStage, updateStage,
  listStageDays, createStageDay, deleteStageDay,
  listStageBlocks, createStageBlock, updateStageBlock, deleteStageBlock,
  listAvailableCoaches,
} from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { METHOD_COLOR } from '@aureak/business-logic'
import type {
  StageWithMeta, StageDay, StageBlock, StageStatus, StageSessionType, GroupMethod,
} from '@aureak/types'

// ============================================================
// Constants
// ============================================================

const STATUS_COLORS: Record<StageStatus, string> = {
  planifié : colors.accent.gold,
  en_cours : '#4ade80',
  terminé  : colors.text.muted,
  annulé   : '#f87171',
}

const STATUSES: StageStatus[] = ['planifié', 'en_cours', 'terminé', 'annulé']

const METHODS: GroupMethod[] = ['Goal and Player', 'Technique', 'Situationnel', 'Décisionnel']

const SESSION_TYPES: { value: StageSessionType; label: string }[] = [
  { value: 'entrainement', label: 'Entraînement' },
  { value: 'match',        label: 'Match'         },
  { value: 'théorie',      label: 'Théorie'       },
  { value: 'autre',        label: 'Autre'         },
]

const HOURS  = Array.from({ length: 24 }, (_, i) => i)
const MINS   = [0, 15, 30, 45]
const DURATIONS = [30, 45, 60, 75, 90, 105, 120]

// ============================================================
// Helpers
// ============================================================

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-BE', { weekday: 'short', day: '2-digit', month: 'short' })
}

function fmtTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

// ============================================================
// Block card in the planning view
// ============================================================

function BlockCard({
  block,
  coachNames,
  onEdit,
  onDelete,
}: {
  block      : StageBlock
  coachNames : Map<string, string>
  onEdit     : (b: StageBlock) => void
  onDelete   : (id: string) => void
}) {
  const method = block.method
  const color  = method ? METHOD_COLOR[method] : colors.border.light

  return (
    <View style={[bc.card, { borderLeftColor: color }]}>
      {/* Time + duration */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AureakText variant="caption" style={{ color, fontWeight: '700', fontSize: 12 }}>
          {fmtTime(block.startHour, block.startMinute)} · {fmtDuration(block.durationMinutes)}
        </AureakText>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable onPress={() => onEdit(block)} style={bc.actionBtn}>
            <AureakText variant="caption" style={{ fontSize: 10, color: colors.text.muted }}>Éditer</AureakText>
          </Pressable>
          <Pressable onPress={() => onDelete(block.id)} style={bc.actionBtn}>
            <AureakText variant="caption" style={{ fontSize: 10, color: '#f87171' }}>Suppr.</AureakText>
          </Pressable>
        </View>
      </View>

      {/* Method + type */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        {method && (
          <View style={{ backgroundColor: color + '18', borderColor: color, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
            <AureakText variant="caption" style={{ color, fontSize: 10, fontWeight: '700' }}>{method}</AureakText>
          </View>
        )}
        <View style={{ backgroundColor: colors.light.muted, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
          <AureakText variant="caption" style={{ fontSize: 10, color: colors.text.muted }}>
            {SESSION_TYPES.find(t => t.value === block.sessionType)?.label ?? block.sessionType}
          </AureakText>
        </View>
      </View>

      {/* Theme */}
      {block.theme && (
        <AureakText variant="caption" style={{ color: colors.text.dark, marginTop: 4, fontSize: 12, fontWeight: '600' }}>
          {block.theme}
        </AureakText>
      )}

      {/* Terrain */}
      {block.terrain && (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
          📍 {block.terrain}
        </AureakText>
      )}

      {/* Coaches */}
      {(block.coachPrincipalId || block.coachAssistantId) && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {block.coachPrincipalId && (
            <AureakText variant="caption" style={{ fontSize: 11, color: colors.text.muted }}>
              👤 {coachNames.get(block.coachPrincipalId) ?? '…'}
            </AureakText>
          )}
          {block.coachAssistantId && (
            <AureakText variant="caption" style={{ fontSize: 11, color: colors.text.muted }}>
              · {coachNames.get(block.coachAssistantId) ?? '…'}
            </AureakText>
          )}
        </View>
      )}

      {/* Notes */}
      {block.notes && (
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
          {block.notes}
        </AureakText>
      )}
    </View>
  )
}

const bc = StyleSheet.create({
  card: {
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    padding        : space.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.border.light,
    gap            : 2,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : 5,
    backgroundColor  : colors.light.surface,
  },
})

// ============================================================
// Block modal (create/edit)
// ============================================================

type BlockDraft = {
  startHour          : number
  startMinute        : number
  durationMinutes    : number
  method             : GroupMethod | null
  sessionType        : StageSessionType
  terrain            : string
  theme              : string
  coachPrincipalId   : string
  coachAssistantId   : string
  coachReplacementId : string
  notes              : string
}

function defaultDraft(): BlockDraft {
  return {
    startHour          : 9,
    startMinute        : 0,
    durationMinutes    : 60,
    method             : null,
    sessionType        : 'entrainement',
    terrain            : '',
    theme              : '',
    coachPrincipalId   : '',
    coachAssistantId   : '',
    coachReplacementId : '',
    notes              : '',
  }
}

function BlockModal({
  visible,
  initial,
  coaches,
  saving,
  onSave,
  onClose,
}: {
  visible : boolean
  initial : BlockDraft
  coaches : { id: string; name: string }[]
  saving? : boolean
  onSave  : (d: BlockDraft) => void
  onClose : () => void
}) {
  const [d, setD] = useState<BlockDraft>(initial)
  useEffect(() => { setD(initial) }, [initial, visible])

  function ChipRow<T extends string>({
    values, selected, label, getLabel, getColor, onSelect,
  }: {
    values  : T[]
    selected: T | null | ''
    label   : string
    getLabel: (v: T) => string
    getColor: (v: T) => string
    onSelect: (v: T | null) => void
  }) {
    return (
      <View style={m.field}>
        <AureakText variant="caption" style={m.label}>{label}</AureakText>
        <View style={m.chipRow}>
          {values.map(v => {
            const active = selected === v
            const color  = getColor(v)
            return (
              <Pressable
                key={v}
                style={[m.chip, active && { borderColor: color, backgroundColor: color + '18' }]}
                onPress={() => onSelect(active ? null : v)}
              >
                <AureakText variant="caption" style={{ color: active ? color : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 11 }}>
                  {getLabel(v)}
                </AureakText>
              </Pressable>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={m.overlay}>
        <ScrollView style={m.sheet} contentContainerStyle={{ gap: space.md, paddingBottom: 40 }}>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AureakText variant="h3">Bloc d'entraînement</AureakText>
            <Pressable onPress={onClose}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
            </Pressable>
          </View>

          {/* Horaire */}
          <View style={m.field}>
            <AureakText variant="caption" style={m.label}>Heure de début</AureakText>
            <View style={m.chipRow}>
              {HOURS.map(h => (
                <Pressable
                  key={h}
                  style={[m.chip, d.startHour === h && m.chipActive]}
                  onPress={() => setD(prev => ({ ...prev, startHour: h }))}
                >
                  <AureakText variant="caption" style={{ color: d.startHour === h ? colors.accent.gold : colors.text.muted, fontSize: 11 }}>
                    {String(h).padStart(2, '0')}h
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={m.field}>
            <AureakText variant="caption" style={m.label}>Minutes</AureakText>
            <View style={m.chipRow}>
              {MINS.map(min => (
                <Pressable
                  key={min}
                  style={[m.chip, d.startMinute === min && m.chipActive]}
                  onPress={() => setD(prev => ({ ...prev, startMinute: min }))}
                >
                  <AureakText variant="caption" style={{ color: d.startMinute === min ? colors.accent.gold : colors.text.muted, fontSize: 11 }}>
                    :{String(min).padStart(2, '0')}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={m.field}>
            <AureakText variant="caption" style={m.label}>Durée</AureakText>
            <View style={m.chipRow}>
              {DURATIONS.map(dur => (
                <Pressable
                  key={dur}
                  style={[m.chip, d.durationMinutes === dur && m.chipActive]}
                  onPress={() => setD(prev => ({ ...prev, durationMinutes: dur }))}
                >
                  <AureakText variant="caption" style={{ color: d.durationMinutes === dur ? colors.accent.gold : colors.text.muted, fontSize: 11 }}>
                    {fmtDuration(dur)}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Méthode */}
          <ChipRow
            label="Méthode"
            values={METHODS}
            selected={d.method}
            getLabel={v => v}
            getColor={v => METHOD_COLOR[v]}
            onSelect={v => setD(prev => ({ ...prev, method: v }))}
          />

          {/* Type de séance */}
          <ChipRow
            label="Type de séance"
            values={SESSION_TYPES.map(t => t.value)}
            selected={d.sessionType}
            getLabel={v => SESSION_TYPES.find(t => t.value === v)?.label ?? v}
            getColor={() => colors.accent.gold}
            onSelect={v => v && setD(prev => ({ ...prev, sessionType: v }))}
          />

          {/* Thème */}
          <View style={m.field}>
            <AureakText variant="caption" style={m.label}>Thème / objectif</AureakText>
            <TextInput
              style={m.input}
              value={d.theme}
              onChangeText={v => setD(prev => ({ ...prev, theme: v }))}
              placeholder="Ex : Sortie au sol, Jeu aérien…"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          {/* Terrain */}
          <View style={m.field}>
            <AureakText variant="caption" style={m.label}>Terrain</AureakText>
            <TextInput
              style={m.input}
              value={d.terrain}
              onChangeText={v => setD(prev => ({ ...prev, terrain: v }))}
              placeholder="Terrain 1, Hall B…"
              placeholderTextColor={colors.text.muted}
            />
          </View>

          {/* Coaches */}
          <View style={m.field}>
            <AureakText variant="caption" style={m.label}>Coach principal</AureakText>
            <View style={m.chipRow}>
              <Pressable style={[m.chip, d.coachPrincipalId === '' && m.chipActive]} onPress={() => setD(prev => ({ ...prev, coachPrincipalId: '' }))}>
                <AureakText variant="caption" style={{ fontSize: 11, color: d.coachPrincipalId === '' ? colors.accent.gold : colors.text.muted }}>Aucun</AureakText>
              </Pressable>
              {coaches.map(c => (
                <Pressable
                  key={c.id}
                  style={[m.chip, d.coachPrincipalId === c.id && m.chipActive]}
                  onPress={() => setD(prev => ({ ...prev, coachPrincipalId: prev.coachPrincipalId === c.id ? '' : c.id }))}
                >
                  <AureakText variant="caption" style={{ fontSize: 11, color: d.coachPrincipalId === c.id ? colors.accent.gold : colors.text.muted }}>
                    {c.name}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={m.field}>
            <AureakText variant="caption" style={m.label}>Coach assistant</AureakText>
            <View style={m.chipRow}>
              <Pressable style={[m.chip, d.coachAssistantId === '' && m.chipActive]} onPress={() => setD(prev => ({ ...prev, coachAssistantId: '' }))}>
                <AureakText variant="caption" style={{ fontSize: 11, color: d.coachAssistantId === '' ? colors.accent.gold : colors.text.muted }}>Aucun</AureakText>
              </Pressable>
              {coaches.map(c => (
                <Pressable
                  key={c.id}
                  style={[m.chip, d.coachAssistantId === c.id && m.chipActive]}
                  onPress={() => setD(prev => ({ ...prev, coachAssistantId: prev.coachAssistantId === c.id ? '' : c.id }))}
                >
                  <AureakText variant="caption" style={{ fontSize: 11, color: d.coachAssistantId === c.id ? colors.accent.gold : colors.text.muted }}>
                    {c.name}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={m.field}>
            <AureakText variant="caption" style={m.label}>Notes</AureakText>
            <TextInput
              style={[m.input, { height: 70, textAlignVertical: 'top' as never }]}
              value={d.notes}
              onChangeText={v => setD(prev => ({ ...prev, notes: v }))}
              placeholder="Consignes, matériel…"
              placeholderTextColor={colors.text.muted}
              multiline
            />
          </View>

          <Pressable
            style={[m.saveBtn, saving ? { opacity: 0.5 } : undefined]}
            onPress={() => { if (!saving) onSave(d) }}
          >
            <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' }}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </AureakText>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  )
}

const m = StyleSheet.create({
  overlay : { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet   : {
    backgroundColor: colors.light.surface,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: space.lg,
    maxHeight: '90%' as never,
  },
  field   : { gap: 6 },
  label   : { color: colors.text.muted, fontSize: 11, textTransform: 'uppercase' as never, letterSpacing: 0.8, fontWeight: '600' },
  input   : {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1, borderColor: colors.border.light,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  chipRow  : { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip     : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  chipActive: { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '18' },
  saveBtn  : { backgroundColor: colors.accent.gold, borderRadius: 8, paddingVertical: space.sm + 2, alignItems: 'center' },
})

// ============================================================
// Main page
// ============================================================

export default function StageDetailPage() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>()
  const router = useRouter()

  const [stage,   setStage]   = useState<StageWithMeta | null>(null)
  const [days,    setDays]    = useState<StageDay[]>([])
  const [blocks,  setBlocks]  = useState<Record<string, StageBlock[]>>({}) // dayId → blocks
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Active day tab
  const [activeDayId, setActiveDayId] = useState<string | null>(null)

  // New day
  const [addingDay,   setAddingDay]   = useState(false)
  const [newDayDate,  setNewDayDate]  = useState('')
  const [dayError,    setDayError]    = useState<string | null>(null)

  // Block modal
  const [blockModalVisible, setBlockModalVisible] = useState(false)
  const [editingBlock,      setEditingBlock]      = useState<StageBlock | null>(null)
  const [blockDraft,        setBlockDraft]        = useState<BlockDraft>(defaultDraft())

  // Inline edit for stage status
  const [editingStatus, setEditingStatus] = useState(false)

  // Mutation error + block saving
  const [mutError,    setMutError]    = useState<string | null>(null)
  const [blockSaving, setBlockSaving] = useState(false)

  // Coach name map for display
  const coachNames = new Map(coaches.map(c => [c.id, c.name]))

  const load = useCallback(async () => {
    if (!stageId) return
    setLoading(true)
    const [s, cs] = await Promise.all([
      getStage(stageId),
      listAvailableCoaches(),
    ])
    setStage(s)
    setCoaches(cs)
    if (s) {
      const d = await listStageDays(s.id)
      setDays(d)
      if (d.length > 0) setActiveDayId(prev => prev ?? d[0].id)
      // Load blocks for all days
      const blockMap: Record<string, StageBlock[]> = {}
      await Promise.all(d.map(async day => {
        blockMap[day.id] = await listStageBlocks(day.id)
      }))
      setBlocks(blockMap)
    }
    setLoading(false)
  }, [stageId])

  useEffect(() => { load() }, [load])

  // ── Add day ──────────────────────────────────────────────────

  const handleAddDay = async () => {
    if (!stage || !newDayDate) return
    setDayError(null)
    try {
      const day = await createStageDay({ stageId: stage.id, date: newDayDate, sortOrder: days.length })
      setDays(prev => [...prev, day])
      setBlocks(prev => ({ ...prev, [day.id]: [] }))
      setActiveDayId(day.id)
      setNewDayDate('')
      setAddingDay(false)
    } catch {
      setDayError('Date déjà existante ou invalide.')
    }
  }

  const handleDeleteDay = async (dayId: string) => {
    setMutError(null)
    try {
      await deleteStageDay(dayId)
      setDays(prev => prev.filter(d => d.id !== dayId))
      setBlocks(prev => { const next = { ...prev }; delete next[dayId]; return next })
      if (activeDayId === dayId) {
        const remaining = days.filter(d => d.id !== dayId)
        setActiveDayId(remaining.length > 0 ? remaining[0].id : null)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stageDetail] deleteDay error:', err)
      setMutError('Erreur lors de la suppression de la journée.')
    }
  }

  // ── Block modal open ─────────────────────────────────────────

  const openCreateBlock = () => {
    setEditingBlock(null)
    setBlockDraft(defaultDraft())
    setBlockModalVisible(true)
  }

  const openEditBlock = (block: StageBlock) => {
    setEditingBlock(block)
    setBlockDraft({
      startHour          : block.startHour,
      startMinute        : block.startMinute,
      durationMinutes    : block.durationMinutes,
      method             : block.method,
      sessionType        : block.sessionType,
      terrain            : block.terrain      ?? '',
      theme              : block.theme        ?? '',
      coachPrincipalId   : block.coachPrincipalId   ?? '',
      coachAssistantId   : block.coachAssistantId   ?? '',
      coachReplacementId : block.coachReplacementId ?? '',
      notes              : block.notes        ?? '',
    })
    setBlockModalVisible(true)
  }

  // ── Save block ───────────────────────────────────────────────

  const handleSaveBlock = async (d: BlockDraft) => {
    if (!activeDayId) return
    setMutError(null)
    setBlockSaving(true)
    const params = {
      startHour          : d.startHour,
      startMinute        : d.startMinute,
      durationMinutes    : d.durationMinutes,
      method             : d.method,
      sessionType        : d.sessionType,
      terrain            : d.terrain            || null,
      theme              : d.theme              || null,
      coachPrincipalId   : d.coachPrincipalId   || null,
      coachAssistantId   : d.coachAssistantId   || null,
      coachReplacementId : d.coachReplacementId || null,
      notes              : d.notes              || null,
    }
    try {
      if (editingBlock) {
        await updateStageBlock(editingBlock.id, params)
        setBlocks(prev => ({
          ...prev,
          [activeDayId]: prev[activeDayId].map(b =>
            b.id === editingBlock.id ? { ...b, ...params } : b
          ),
        }))
      } else {
        const block = await createStageBlock({ stageDayId: activeDayId, ...params })
        setBlocks(prev => ({
          ...prev,
          [activeDayId]: [...(prev[activeDayId] ?? []), block].sort((a, b) =>
            a.startHour !== b.startHour ? a.startHour - b.startHour : a.startMinute - b.startMinute
          ),
        }))
      }
      setBlockModalVisible(false)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stageDetail] saveBlock error:', err)
      setMutError('Erreur lors de la sauvegarde du bloc.')
    } finally {
      setBlockSaving(false)
    }
  }

  // ── Delete block ─────────────────────────────────────────────

  const handleDeleteBlock = async (blockId: string) => {
    if (!activeDayId) return
    setMutError(null)
    try {
      await deleteStageBlock(blockId)
      setBlocks(prev => ({
        ...prev,
        [activeDayId]: prev[activeDayId].filter(b => b.id !== blockId),
      }))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stageDetail] deleteBlock error:', err)
      setMutError('Erreur lors de la suppression du bloc.')
    }
  }

  // ── Status update ────────────────────────────────────────────

  const handleStatusChange = async (status: StageStatus) => {
    if (!stage) return
    setMutError(null)
    try {
      await updateStage(stage.id, { status })
      setStage(prev => prev ? { ...prev, status } : prev)
      setEditingStatus(false)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stageDetail] statusChange error:', err)
      setMutError('Erreur lors de la mise à jour du statut.')
    }
  }

  // ── Render ───────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.light.primary, padding: space.xl }}>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      </View>
    )
  }

  if (!stage) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.light.primary, padding: space.xl }}>
        <AureakText variant="caption" style={{ color: '#f87171' }}>Stage introuvable.</AureakText>
        <Pressable onPress={() => router.back()} style={{ marginTop: space.md }}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>← Retour</AureakText>
        </Pressable>
      </View>
    )
  }

  const activeDay    = days.find(d => d.id === activeDayId)
  const activeBlocks = activeDayId ? (blocks[activeDayId] ?? []) : []
  const statusColor  = STATUS_COLORS[stage.status]

  return (
    <>
      <ScrollView style={p.container} contentContainerStyle={p.content}>

        {/* ── Back ── */}
        <Pressable onPress={() => router.push('/stages' as never)}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>← Stages</AureakText>
        </Pressable>

        {/* ── Mutation error banner ── */}
        {mutError && (
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: 7, padding: space.sm, borderWidth: 1, borderColor: '#f87171' }}>
            <AureakText variant="caption" style={{ color: '#f87171' }}>{mutError}</AureakText>
          </View>
        )}

        {/* ── Hero ── */}
        <View style={[p.hero, { borderTopColor: statusColor }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.sm }}>
            <AureakText variant="h2" style={{ flex: 1 }}>{stage.name}</AureakText>

            {/* Status badge / picker */}
            <Pressable onPress={() => setEditingStatus(!editingStatus)}>
              <View style={{ backgroundColor: statusColor + '20', borderColor: statusColor, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <AureakText variant="caption" style={{ color: statusColor, fontWeight: '700', fontSize: 11 }}>
                  {stage.status.toUpperCase()} ▾
                </AureakText>
              </View>
            </Pressable>
          </View>

          {/* Status picker dropdown */}
          {editingStatus && (
            <View style={p.statusPicker}>
              {STATUSES.map(st => (
                <Pressable key={st} style={p.statusOption} onPress={() => handleStatusChange(st)}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLORS[st], marginRight: 8 }} />
                  <AureakText variant="caption" style={{ color: colors.text.dark }}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          )}

          {/* Meta chips */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: space.sm }}>
            {stage.implantationName && (
              <View style={p.metaChip}>
                <AureakText variant="caption" style={{ fontSize: 11 }}>📍 {stage.implantationName}</AureakText>
              </View>
            )}
            {stage.location && (
              <View style={p.metaChip}>
                <AureakText variant="caption" style={{ fontSize: 11 }}>🏟 {stage.location}</AureakText>
              </View>
            )}
            <View style={p.metaChip}>
              <AureakText variant="caption" style={{ fontSize: 11 }}>
                {new Date(stage.startDate).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })}
                {' → '}
                {new Date(stage.endDate).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </AureakText>
            </View>
            <View style={p.metaChip}>
              <AureakText variant="caption" style={{ fontSize: 11 }}>
                {stage.dayCount} j · {stage.participantCount} joueurs
              </AureakText>
            </View>
            {stage.maxParticipants && (
              <View style={p.metaChip}>
                <AureakText variant="caption" style={{ fontSize: 11 }}>Max {stage.maxParticipants}</AureakText>
              </View>
            )}
          </View>

          {stage.notes && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: space.xs, fontStyle: 'italic' }}>
              {stage.notes}
            </AureakText>
          )}
        </View>

        {/* ── PLANNING : Day tabs ── */}
        <View style={p.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
            <AureakText variant="h3">Planning</AureakText>
            <Pressable
              style={p.addDayBtn}
              onPress={() => setAddingDay(!addingDay)}
            >
              <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
                {addingDay ? 'Annuler' : '+ Ajouter une journée'}
              </AureakText>
            </Pressable>
          </View>

          {/* Add day form */}
          {addingDay && (
            <View style={p.addDayForm}>
              <TextInput
                style={p.input}
                value={newDayDate}
                onChangeText={setNewDayDate}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={colors.text.muted}
              />
              {dayError && (
                <AureakText variant="caption" style={{ color: '#f87171' }}>{dayError}</AureakText>
              )}
              <Pressable
                style={[p.addDayConfirmBtn, !newDayDate && { opacity: 0.4 }]}
                onPress={handleAddDay}
                disabled={!newDayDate}
              >
                <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>Ajouter</AureakText>
              </Pressable>
            </View>
          )}

          {/* Day tabs */}
          {days.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.sm }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {days.map(day => {
                    const isActive = activeDayId === day.id
                    const dayBlocks = blocks[day.id] ?? []
                    return (
                      <Pressable
                        key={day.id}
                        style={[p.dayTab, isActive && p.dayTabActive]}
                        onPress={() => setActiveDayId(day.id)}
                      >
                        <AureakText variant="caption" style={{ color: isActive ? colors.accent.gold : colors.text.muted, fontWeight: isActive ? '700' : '400', fontSize: 11 }}>
                          {fmtDate(day.date)}
                        </AureakText>
                        {dayBlocks.length > 0 && (
                          <View style={{ flexDirection: 'row', gap: 2, marginTop: 3 }}>
                            {dayBlocks.map(b => (
                              <View
                                key={b.id}
                                style={{
                                  width : 8,
                                  height: 4,
                                  borderRadius   : 2,
                                  backgroundColor: b.method ? METHOD_COLOR[b.method] : colors.border.light,
                                }}
                              />
                            ))}
                          </View>
                        )}
                      </Pressable>
                    )
                  })}
                </View>
              </ScrollView>

              {/* Active day blocks */}
              {activeDay && (
                <View style={p.dayContent}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
                    <AureakText variant="body" style={{ fontWeight: '700' }}>
                      {fmtDate(activeDay.date)}
                    </AureakText>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable style={p.addBlockBtn} onPress={openCreateBlock}>
                        <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>+ Bloc</AureakText>
                      </Pressable>
                      <Pressable onPress={() => handleDeleteDay(activeDay.id)}>
                        <AureakText variant="caption" style={{ color: '#f87171', fontSize: 11 }}>Suppr. journée</AureakText>
                      </Pressable>
                    </View>
                  </View>

                  {/* Method legend for this day */}
                  {activeBlocks.length > 0 && (() => {
                    const usedMethods = [...new Set(activeBlocks.map(b => b.method).filter(Boolean))] as GroupMethod[]
                    return usedMethods.length > 0 ? (
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: space.sm }}>
                        {usedMethods.map(method => (
                          <View key={method} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: METHOD_COLOR[method] }} />
                            <AureakText variant="caption" style={{ fontSize: 10, color: colors.text.muted }}>{method}</AureakText>
                          </View>
                        ))}
                      </View>
                    ) : null
                  })()}

                  {/* Block timeline */}
                  {activeBlocks.length === 0 ? (
                    <View style={p.emptyDay}>
                      <AureakText variant="caption" style={{ color: colors.text.muted }}>Aucun bloc.</AureakText>
                      <Pressable onPress={openCreateBlock} style={{ marginTop: space.xs }}>
                        <AureakText variant="caption" style={{ color: colors.accent.gold }}>+ Ajouter un bloc d'entraînement</AureakText>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{ gap: space.sm }}>
                      {activeBlocks.map(block => (
                        <BlockCard
                          key={block.id}
                          block={block}
                          coachNames={coachNames}
                          onEdit={openEditBlock}
                          onDelete={handleDeleteBlock}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={p.emptyDays}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Aucune journée planifiée. Ajoutez la première journée.
              </AureakText>
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Block modal ── */}
      <BlockModal
        visible={blockModalVisible}
        initial={blockDraft}
        coaches={coaches}
        saving={blockSaving}
        onSave={handleSaveBlock}
        onClose={() => setBlockModalVisible(false)}
      />
    </>
  )
}

const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.lg },

  hero: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderTopWidth : 3,
    borderTopColor : colors.accent.gold,
    padding        : space.lg,
    gap            : 4,
  },

  statusPicker: {
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.xs,
    marginTop      : 4,
    alignSelf      : 'flex-end',
  },
  statusOption: {
    flexDirection : 'row',
    alignItems    : 'center',
    paddingVertical  : 6,
    paddingHorizontal: 10,
  },

  metaChip: {
    backgroundColor  : colors.light.muted,
    borderRadius     : 12,
    paddingHorizontal: 10,
    paddingVertical  : 3,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },

  section: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
  },

  addDayBtn: { paddingHorizontal: space.sm, paddingVertical: 4 },
  addDayForm: { flexDirection: 'row', gap: space.sm, alignItems: 'center', marginBottom: space.sm },
  input: {
    flex             : 1,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  addDayConfirmBtn: {
    backgroundColor  : colors.accent.gold,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
  },

  dayTab: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.muted,
    alignItems       : 'center',
  },
  dayTabActive: {
    borderColor     : colors.accent.gold,
    backgroundColor : colors.accent.gold + '12',
  },

  dayContent: {
    backgroundColor: colors.light.muted,
    borderRadius   : 10,
    padding        : space.md,
    gap            : 4,
  },

  addBlockBtn: {
    paddingHorizontal: 12,
    paddingVertical  : 4,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },

  emptyDay: {
    alignItems     : 'center',
    padding        : space.lg,
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderStyle    : 'dashed' as never,
  },

  emptyDays: {
    alignItems  : 'center',
    paddingVertical: space.xl,
  },
})
