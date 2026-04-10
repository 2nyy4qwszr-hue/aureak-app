'use client'
// Détail programme pédagogique — entraînements liés, reorder, dates inline, duplication/suppression
// Story 34.5
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, type TextStyle } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getMethodologyProgramme,
  softDeleteMethodologyProgramme,
  addProgrammeSession,
  removeProgrammeSession,
  updateProgrammeSessionDate,
  updateProgrammeSessionPosition,
  duplicateMethodologyProgramme,
  listMethodologySessions,
} from '@aureak/api-client'
import { AureakText, ConfirmDialog } from '@aureak/ui'
import { colors, fonts, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import type { MethodologyProgrammeWithSessions, MethodologyProgrammeSessionWithEntrainement, MethodologySession, MethodologyMethod } from '@aureak/types'

// ── Pictos méthode ────────────────────────────────────────────────────────────

const METHOD_PICTOS: Record<string, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '📚',
  'Situationnel'    : '📐',
  'Perfectionnement': '🎯',
  'Performance'     : '💪',
  'Décisionnel'     : '🧠',
  'Intégration'     : '👥',
}

// ── Nav tabs ──────────────────────────────────────────────────────────────────

const NAV_TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances',    active: false },
  { label: 'PROGRAMMES',    href: '/methodologie/programmes', active: true  },
  { label: 'THÈMES',        href: '/methodologie/themes',     active: false },
  { label: 'SITUATIONS',    href: '/methodologie/situations', active: false },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations',active: false },
]

// ── Composant méthode badge ───────────────────────────────────────────────────

function MethodCircle({ method }: { method: string }) {
  const color = methodologyMethodColors[method as MethodologyMethod] ?? colors.accent.gold
  return (
    <View style={[st.methodCircle, { backgroundColor: color + '30', borderColor: color }]}>
      <AureakText style={{ fontSize: 18 }}>{METHOD_PICTOS[method] ?? '—'}</AureakText>
    </View>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProgrammeDetailPage() {
  const router = useRouter()
  const { programmeId } = useLocalSearchParams<{ programmeId: string }>()

  const [programme,    setProgramme]    = useState<MethodologyProgrammeWithSessions | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [duplicating,  setDuplicating]  = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [allSessions,  setAllSessions]  = useState<MethodologySession[]>([])
  const [loadingPicker,setLoadingPicker]= useState(false)

  // Local dates state pour édition inline
  const [localDates, setLocalDates] = useState<Record<string, string>>({})

  const loadProgramme = useCallback(async () => {
    if (!programmeId) return
    setLoading(true)
    try {
      const { data, error } = await getMethodologyProgramme(programmeId)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[programme-detail] load error:', error)
        return
      }
      if (data) {
        setProgramme(data)
        // Init local dates
        const dates: Record<string, string> = {}
        for (const s of data.sessions) {
          dates[s.id] = s.scheduledDate ?? ''
        }
        setLocalDates(dates)
      }
    } finally {
      setLoading(false)
    }
  }, [programmeId])

  useEffect(() => { loadProgramme() }, [loadProgramme])

  // ── Picker : charger les entraînements ─────────────────────────────────────

  const openPicker = useCallback(async () => {
    setPickerOpen(true)
    setPickerSearch('')
    if (allSessions.length === 0) {
      setLoadingPicker(true)
      try {
        const data = await listMethodologySessions({ activeOnly: false })
        setAllSessions(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[programme-detail] load sessions error:', err)
      } finally {
        setLoadingPicker(false)
      }
    }
  }, [allSessions.length])

  // Entraînements disponibles : filtrés par recherche + exclut déjà dans le programme
  const alreadyInProgramme = new Set(programme?.sessions.map(s => s.sessionId) ?? [])
  const filteredSessions = allSessions.filter(s => {
    if (alreadyInProgramme.has(s.id)) return false
    if (pickerSearch.trim()) return s.title.toLowerCase().includes(pickerSearch.toLowerCase())
    return true
  })

  // ── Ajouter un entraînement ────────────────────────────────────────────────

  const handleAddSession = async (session: MethodologySession) => {
    if (!programme) return
    setSaving(true)
    try {
      const { error } = await addProgrammeSession(programme.id, session.id)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[programme-detail] addProgrammeSession error:', error)
        return
      }
      setPickerOpen(false)
      await loadProgramme()
    } finally {
      setSaving(false)
    }
  }

  // ── Retirer un entraînement ────────────────────────────────────────────────

  const handleRemoveSession = async (sessionId: string) => {
    if (!programme) return
    setSaving(true)
    try {
      const { error } = await removeProgrammeSession(programme.id, sessionId)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[programme-detail] removeProgrammeSession error:', error)
        return
      }
      await loadProgramme()
    } finally {
      setSaving(false)
    }
  }

  // ── Date inline ────────────────────────────────────────────────────────────

  const handleSaveDate = async (session: MethodologyProgrammeSessionWithEntrainement) => {
    if (!programme) return
    const dateVal = (localDates[session.id] ?? '').trim() || null
    const { error } = await updateProgrammeSessionDate(programme.id, session.sessionId, dateVal)
    if (error && process.env.NODE_ENV !== 'production')
      console.error('[programme-detail] updateProgrammeSessionDate error:', error)
    // Recharger silencieusement pour mettre à jour l'accomplishment
    await loadProgramme()
  }

  // ── Reorder ▲▼ ────────────────────────────────────────────────────────────

  const handleMove = async (idx: number, direction: 'up' | 'down') => {
    if (!programme) return
    const sessions = [...programme.sessions].sort((a, b) => a.position - b.position)
    const swapIdx  = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sessions.length) return

    const current = sessions[idx]
    const target  = sessions[swapIdx]

    // Optimistic update
    const newSessions = sessions.map((s, i) => {
      if (i === idx)    return { ...s, position: target.position }
      if (i === swapIdx) return { ...s, position: current.position }
      return s
    }).sort((a, b) => a.position - b.position)

    setProgramme(prev => prev ? { ...prev, sessions: newSessions } : prev)

    // API en background
    await Promise.all([
      updateProgrammeSessionPosition(programme.id, current.sessionId, target.position),
      updateProgrammeSessionPosition(programme.id, target.sessionId, current.position),
    ])
  }

  // ── Dupliquer ──────────────────────────────────────────────────────────────

  const handleDuplicate = async () => {
    if (!programme) return
    setDuplicating(true)
    try {
      const { data, error } = await duplicateMethodologyProgramme(programme.id)
      if (error || !data) {
        if (process.env.NODE_ENV !== 'production') console.error('[programme-detail] duplicateMethodologyProgramme error:', error)
        return
      }
      router.replace(`/methodologie/programmes/${data.id}` as never)
    } finally {
      setDuplicating(false)
    }
  }

  // ── Supprimer ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!programme) return
    setDeleting(true)
    try {
      const { error } = await softDeleteMethodologyProgramme(programme.id)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[programme-detail] softDeleteMethodologyProgramme error:', error)
        return
      }
      router.replace('/methodologie/programmes' as never)
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary }}>
        <ActivityIndicator color={colors.accent.gold} />
      </View>
    )
  }

  if (!programme) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary }}>
        <AureakText style={{ color: colors.text.muted }}>Programme introuvable.</AureakText>
      </View>
    )
  }

  const methodColor = methodologyMethodColors[programme.method as MethodologyMethod] ?? colors.accent.gold
  const sessions    = [...programme.sessions].sort((a, b) => a.position - b.position)

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* ── Header nav ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>MÉTHODOLOGIE</AureakText>
        </View>
        <View style={st.tabsRow}>
          {NAV_TABS.map(tab => (
            <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
              <AureakText style={{ ...st.tabLabel, ...(tab.active ? st.tabLabelActive : {}) } as TextStyle}>
                {tab.label}
              </AureakText>
              {tab.active && <View style={st.tabUnderline} />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Breadcrumb ── */}
      <Pressable onPress={() => router.push('/methodologie/programmes' as never)}>
        <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Programmes</AureakText>
      </Pressable>

      {/* ── Programme header card ── */}
      <View style={st.programmeCard}>
        <View style={st.programmeCardHeader}>
          <MethodCircle method={programme.method} />
          <View style={{ flex: 1 }}>
            <AureakText style={st.programmeTitle}>{programme.title}</AureakText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <View style={[st.badge, { backgroundColor: methodColor + '20', borderColor: methodColor }]}>
                <AureakText style={{ ...st.badgeText, color: methodColor } as TextStyle}>{programme.method}</AureakText>
              </View>
              {programme.seasonLabel && (
                <View style={[st.badge, { backgroundColor: colors.light.muted, borderColor: colors.border.light }]}>
                  <AureakText style={{ ...st.badgeText, color: colors.text.muted } as TextStyle}>{programme.seasonLabel}</AureakText>
                </View>
              )}
              <View style={[st.badge, { backgroundColor: colors.accent.gold + '20', borderColor: colors.accent.gold }]}>
                <AureakText style={{ ...st.badgeText, color: colors.accent.gold } as TextStyle}>
                  {programme.accomplishment.done}/{programme.accomplishment.total} entraînements
                </AureakText>
              </View>
            </View>
            {programme.description ? (
              <AureakText style={{ fontSize: 12, color: colors.text.muted, marginTop: 8 }}>{programme.description}</AureakText>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={st.programmeActions}>
          <Pressable
            style={[st.actionBtn, st.actionBtnSecondary]}
            onPress={handleDuplicate}
            disabled={duplicating}
          >
            <AureakText style={st.actionBtnSecondaryText}>
              {duplicating ? 'Duplication…' : 'Dupliquer'}
            </AureakText>
          </Pressable>
          <Pressable
            style={[st.actionBtn, st.actionBtnDanger]}
            onPress={() => setShowDelete(true)}
            disabled={deleting}
          >
            <AureakText style={st.actionBtnDangerText}>Supprimer</AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Tableau entraînements ── */}
      <View style={st.tableCard}>
        <View style={st.tableCardHeader}>
          <AureakText style={st.tableCardTitle}>Entraînements liés</AureakText>
          <Pressable style={st.addBtn} onPress={openPicker}>
            <AureakText style={st.addBtnText}>+ Ajouter un entraînement</AureakText>
          </Pressable>
        </View>

        {/* Table header */}
        <View style={st.tableHeader}>
          <View style={{ width: 40 }}>
            <AureakText style={st.thText}>POS</AureakText>
          </View>
          <View style={{ width: 52, alignItems: 'center' }}>
            <AureakText style={st.thText}>MÉT.</AureakText>
          </View>
          <View style={{ flex: 1 }}>
            <AureakText style={st.thText}>TITRE</AureakText>
          </View>
          <View style={{ width: 140 }}>
            <AureakText style={st.thText}>DATE</AureakText>
          </View>
          <View style={{ width: 60 }}>
            <AureakText style={st.thText}>▲▼</AureakText>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Rows */}
        {sessions.length === 0 ? (
          <View style={st.emptyState}>
            <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
              Aucun entraînement lié. Cliquez "+ Ajouter" pour commencer.
            </AureakText>
          </View>
        ) : (
          sessions.map((session, idx) => {
            const rowBg    = idx % 2 === 0 ? colors.light.surface : colors.light.muted
            const mColor   = methodologyMethodColors[session.entrainement.method] ?? colors.accent.gold
            return (
              <View key={session.id} style={[st.tableRow, { backgroundColor: rowBg }]}>
                {/* POS */}
                <View style={{ width: 40, justifyContent: 'center' }}>
                  <AureakText style={{ fontSize: 12, fontWeight: '700', color: colors.text.subtle }}>{idx + 1}</AureakText>
                </View>

                {/* MÉTHODE */}
                <View style={{ width: 52, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[st.miniCircle, { backgroundColor: mColor + '30', borderColor: mColor }]}>
                    <AureakText style={{ fontSize: 13 }}>{METHOD_PICTOS[session.entrainement.method] ?? '—'}</AureakText>
                  </View>
                </View>

                {/* TITRE */}
                <View style={{ flex: 1, justifyContent: 'center', paddingRight: 8 }}>
                  <AureakText style={{ fontSize: 13, fontWeight: '600', color: colors.text.dark }} numberOfLines={2}>
                    {session.entrainement.title}
                  </AureakText>
                </View>

                {/* DATE inline */}
                <View style={{ width: 140, justifyContent: 'center' }}>
                  <TextInput
                    style={st.dateInput}
                    value={localDates[session.id] ?? ''}
                    onChangeText={v => setLocalDates(prev => ({ ...prev, [session.id]: v }))}
                    onBlur={() => handleSaveDate(session)}
                    placeholder="AAAA-MM-JJ"
                    placeholderTextColor={colors.text.subtle}
                  />
                </View>

                {/* ▲▼ */}
                <View style={{ width: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Pressable
                    onPress={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    style={[st.reorderBtn, idx === 0 && { opacity: 0.2 }]}
                  >
                    <AureakText style={st.reorderBtnText}>▲</AureakText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleMove(idx, 'down')}
                    disabled={idx === sessions.length - 1}
                    style={[st.reorderBtn, idx === sessions.length - 1 && { opacity: 0.2 }]}
                  >
                    <AureakText style={st.reorderBtnText}>▼</AureakText>
                  </Pressable>
                </View>

                {/* ✕ retirer */}
                <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Pressable
                    onPress={() => handleRemoveSession(session.sessionId)}
                    style={st.removeBtn}
                    disabled={saving}
                  >
                    <AureakText style={st.removeBtnText}>✕</AureakText>
                  </Pressable>
                </View>
              </View>
            )
          })
        )}
      </View>

      {/* ── Picker ajout entraînement ── */}
      {pickerOpen && (
        <View style={st.pickerCard}>
          <View style={st.pickerHeader}>
            <AureakText style={st.pickerTitle}>Choisir un entraînement</AureakText>
            <Pressable onPress={() => setPickerOpen(false)}>
              <AureakText style={{ color: colors.text.muted, fontSize: 14 }}>✕</AureakText>
            </Pressable>
          </View>

          <TextInput
            style={st.pickerSearch}
            value={pickerSearch}
            onChangeText={setPickerSearch}
            placeholder="Rechercher par titre…"
            placeholderTextColor={colors.text.subtle}
            autoFocus
          />

          {loadingPicker ? (
            <ActivityIndicator color={colors.accent.gold} style={{ padding: space.md }} />
          ) : filteredSessions.length === 0 ? (
            <AureakText style={{ color: colors.text.muted, fontSize: 12, padding: space.md }}>
              {pickerSearch.trim() ? 'Aucun résultat.' : 'Tous les entraînements sont déjà dans ce programme.'}
            </AureakText>
          ) : (
            filteredSessions.slice(0, 20).map(s => {
              const mColor = methodologyMethodColors[s.method as MethodologyMethod] ?? colors.accent.gold
              return (
                <Pressable
                  key={s.id}
                  style={({ pressed }) => [st.pickerRow, pressed && { opacity: 0.7 }]}
                  onPress={() => handleAddSession(s)}
                >
                  <View style={[st.miniCircle, { backgroundColor: mColor + '30', borderColor: mColor }]}>
                    <AureakText style={{ fontSize: 12 }}>{METHOD_PICTOS[s.method ?? ''] ?? '—'}</AureakText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AureakText style={{ fontSize: 13, color: colors.text.dark, fontWeight: '600' }} numberOfLines={1}>
                      {s.title}
                    </AureakText>
                    {s.method && (
                      <AureakText style={{ fontSize: 10, color: mColor, fontWeight: '700' }}>{s.method}</AureakText>
                    )}
                  </View>
                  <AureakText style={{ color: colors.accent.gold, fontSize: 18 }}>+</AureakText>
                </Pressable>
              )
            })
          )}
          {filteredSessions.length > 20 && (
            <AureakText style={{ color: colors.text.subtle, fontSize: 11, padding: space.sm, textAlign: 'center' }}>
              {filteredSessions.length - 20} autres résultats — affinez la recherche
            </AureakText>
          )}
        </View>
      )}

      {/* ── Confirm Dialog suppression ── */}
      <ConfirmDialog
        visible={showDelete}
        title="Supprimer ce programme ?"
        message={`"${programme.title}" sera archivé et ne sera plus visible. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        danger
      />

    </ScrollView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.lg, gap: space.md, maxWidth: 1100, alignSelf: 'center', width: '100%' },

  // Header nav (réutilisé depuis programmes/index.tsx)
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: colors.accent.gold },
  tabUnderline  : {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },

  // Programme header card
  programmeCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    gap            : space.md,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  programmeCardHeader: {
    flexDirection: 'row',
    gap          : space.md,
    alignItems   : 'flex-start',
  },
  methodCircle: {
    width         : 52,
    height        : 52,
    borderRadius  : 26,
    borderWidth   : 1,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  programmeTitle: {
    fontSize  : 18,
    fontWeight: '700',
    color     : colors.text.dark,
    fontFamily: fonts.display,
  },
  badge: {
    borderRadius     : 20,
    borderWidth      : 1,
    paddingHorizontal: 10,
    paddingVertical  : 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  programmeActions: { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
  actionBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : 8,
    borderWidth      : 1,
  },
  actionBtnSecondary    : { borderColor: colors.border.light, backgroundColor: 'transparent' },
  actionBtnSecondaryText: { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  actionBtnDanger       : { borderColor: colors.status.errorStrong, backgroundColor: colors.status.errorStrong + '10' },
  actionBtnDangerText   : { fontSize: 13, fontWeight: '600', color: colors.status.errorStrong },

  // Table
  tableCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
  },
  tableCardHeader: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    padding          : space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tableCardTitle: { fontSize: 14, fontWeight: '700', color: colors.text.dark },
  addBtn        : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 8 },
  addBtnText    : { fontSize: 12, fontWeight: '700', color: colors.text.dark },

  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  thText: {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily   : fonts.display,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  emptyState: { padding: space.lg, alignItems: 'center' },

  miniCircle: {
    width         : 28,
    height        : 28,
    borderRadius  : 14,
    borderWidth   : 1,
    alignItems    : 'center',
    justifyContent: 'center',
  },

  // Date inline input
  dateInput: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 6,
    paddingHorizontal: 8,
    paddingVertical  : 5,
    fontSize         : 12,
    color            : colors.text.dark,
    // @ts-ignore web
    fontFamily       : 'monospace',
  },

  // Reorder buttons
  reorderBtn    : { padding: 3, borderRadius: 4, backgroundColor: colors.light.muted },
  reorderBtnText: { fontSize: 10, color: colors.text.muted },

  // Remove button
  removeBtn    : { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.status.errorStrong + '15', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 11, fontWeight: '700', color: colors.status.errorStrong },

  // Picker
  pickerCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    // @ts-ignore web
    boxShadow      : shadows.lg,
  },
  pickerHeader: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    padding          : space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  pickerTitle : { fontSize: 14, fontWeight: '700', color: colors.text.dark },
  pickerSearch: {
    margin           : space.sm,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 8,
    paddingHorizontal: 12,
    paddingVertical  : 8,
    fontSize         : 13,
    color            : colors.text.dark,
  },
  pickerRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 10,
    paddingHorizontal: 16,
    paddingVertical  : 10,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  },
})
