'use client'
// Entraînements pédagogiques — bibliothèque de contenu réutilisable
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologySessions, softDeleteMethodologySession, listMethodologyExercises } from '@aureak/api-client'
import { AureakText, ConfirmDialog } from '@aureak/ui'
import { colors, fonts, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod, type MethodologyContextType,
} from '@aureak/types'
import type { MethodologySession, MethodologyExercise } from '@aureak/types'
import { useToast } from '../../../../components/ToastContext'

type FilterMethod  = MethodologyMethod | 'all'
type ContentType   = 'entrainement' | 'exercice'

const METHOD_PICTOS: Record<MethodologyMethod, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '📚',
  'Situationnel'    : '📐',
  'Perfectionnement': '🎯',
  'Performance'     : '💪',
  'Décisionnel'     : '🧠',
  'Intégration'     : '👥',
}

const NAV_TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances',    active: true  },
  { label: 'PROGRAMMES',    href: '/methodologie/programmes', active: false },
  { label: 'THÈMES',        href: '/methodologie/themes',     active: false },
  { label: 'SITUATIONS',    href: '/methodologie/situations', active: false },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations',active: false },
]

const COL_WIDTHS = { method: 52, num: 90, title: 1, themes: 100, situations: 90, pdf: 50, status: 60 }
const COL_WIDTHS_EX = { method: 52, num: 90, title: 1, pdf: 50, status: 60 }

export default function SeancesPage() {
  const router = useRouter()
  const toast  = useToast()

  const [sessions,        setSessions]        = useState<MethodologySession[]>([])
  const [exercises,       setExercises]       = useState<MethodologyExercise[]>([])
  const [loading,         setLoading]         = useState(true)
  const [methodFilter,    setMethodFilter]    = useState<FilterMethod>('all')
  const [contextFilter,   setContextFilter]   = useState<MethodologyContextType | 'all'>('all')
  const [contentType,     setContentType]     = useState<ContentType>('entrainement')
  const [methodDropOpen,  setMethodDropOpen]  = useState(false)
  const [deletingId,      setDeletingId]      = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMethodologySessions({ activeOnly: false })
      setSessions(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadExercises = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMethodologyExercises({ activeOnly: false })
      setExercises(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (contentType === 'entrainement') {
      loadSessions()
    } else {
      loadExercises()
    }
  }, [contentType, loadSessions, loadExercises])

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      await softDeleteMethodologySession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success('Entraînement supprimé')
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[seances] delete error:', err)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSessions = sessions.filter(s => {
    if (methodFilter  !== 'all' && s.method      !== methodFilter)  return false
    if (contextFilter !== 'all' && s.contextType !== contextFilter) return false
    return true
  })

  const filteredExercises = exercises.filter(e => {
    if (methodFilter  !== 'all' && e.method      !== methodFilter)  return false
    if (contextFilter !== 'all' && e.contextType !== contextFilter) return false
    return true
  })

  // Stats counts — based on sessions (entrainements)
  const methodCounts = METHODOLOGY_METHODS.map(m => ({
    method: m,
    count : sessions.filter(s => s.method === m).length,
  }))

  const isGlobal = methodFilter === 'all' && contextFilter === 'all'

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* ── Header : titre + nav tabs + bouton ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>MÉTHODOLOGIE</AureakText>
          <Pressable style={st.newBtn} onPress={() => router.push('/methodologie/seances/new' as never)}>
            <AureakText style={st.newBtnLabel}>+ Nouvel entraînement</AureakText>
          </Pressable>
        </View>

        {/* Nav tabs : 5 onglets */}
        <View style={st.tabsRow}>
          {NAV_TABS.map(tab => (
            <Pressable key={tab.href} style={st.tabItem} onPress={() => router.push(tab.href as never)}>
              <AureakText style={{ ...st.tabLabel, ...(tab.active ? st.tabLabelActive : {}) } as TextStyle}>
                {tab.label}
              </AureakText>
              {tab.active && <View style={st.tabUnderline} />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── StatCards — 7 cards méthodes horizontales ── */}
      <View style={st.statCardsRow}>
        {methodCounts.map(({ method, count }) => {
          const color = methodologyMethodColors[method] ?? colors.accent.gold
          return (
            <View key={method} style={st.statCard}>
              <AureakText style={st.statCardPicto}>{METHOD_PICTOS[method]}</AureakText>
              <AureakText style={st.statCardLabel}>{method}</AureakText>
              <AureakText style={{ ...st.statCardValue, color } as TextStyle}>{count}</AureakText>
            </View>
          )
        })}
      </View>

      {/* ── FiltresRow — gauche | centre | droite ── */}
      <View style={st.filtresRow}>
        {/* Gauche : GLOBAL pill + MÉTHODE pill */}
        <View style={st.filtresLeft}>
          <Pressable
            style={isGlobal ? st.pillActive : st.pillInactive}
            onPress={() => { setMethodFilter('all'); setContextFilter('all'); setContentType('entrainement'); setMethodDropOpen(false) }}
          >
            <AureakText style={isGlobal ? st.pillTextActive : st.pillTextInactive}>GLOBAL</AureakText>
          </Pressable>

          <View style={st.dropdownWrapper}>
            <Pressable
              style={methodFilter !== 'all' ? st.pillActive : st.pillInactive}
              onPress={() => setMethodDropOpen(o => !o)}
            >
              <AureakText style={methodFilter !== 'all' ? st.pillTextActive : st.pillTextInactive}>
                {methodFilter === 'all' ? 'MÉTHODE ▾' : `${methodFilter} ▾`}
              </AureakText>
            </Pressable>

            {methodDropOpen && (
              <View style={st.methodDropdown}>
                {(['all', ...METHODOLOGY_METHODS] as FilterMethod[]).map(m => (
                  <Pressable
                    key={m}
                    style={[st.methodDropdownItem, methodFilter === m && st.methodDropdownItemActive]}
                    onPress={() => { setMethodFilter(m); setMethodDropOpen(false) }}
                  >
                    <AureakText style={{ fontSize: 12, fontWeight: methodFilter === m ? '700' : '400', color: methodFilter === m ? colors.text.dark : colors.text.muted }}>
                      {m === 'all' ? 'Toutes les méthodes' : `${METHOD_PICTOS[m as MethodologyMethod]} ${m}`}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Centre : Toggle ENTRAÎNEMENT / EXERCICE */}
        <View style={st.filtresCenter}>
          <View style={st.toggleRow}>
            <Pressable
              style={[st.toggleBtn, contentType === 'entrainement' && st.toggleBtnActive] as never}
              onPress={() => { setContentType('entrainement'); setMethodDropOpen(false) }}
            >
              <AureakText style={[st.toggleLabel, contentType === 'entrainement' && st.toggleLabelActive] as never}>
                ENTRAÎNEMENT
              </AureakText>
            </Pressable>
            <Pressable
              style={[st.toggleBtn, contentType === 'exercice' && st.toggleBtnActive] as never}
              onPress={() => { setContentType('exercice'); setMethodDropOpen(false) }}
            >
              <AureakText style={[st.toggleLabel, contentType === 'exercice' && st.toggleLabelActive] as never}>
                EXERCICE
              </AureakText>
            </Pressable>
          </View>
        </View>

        {/* Droite : Toggle ACADÉMIE / STAGE */}
        <View style={st.filtresRight}>
          <View style={st.toggleRow}>
            <Pressable
              style={[st.toggleBtn, contextFilter === 'academie' && st.toggleBtnActive] as never}
              onPress={() => { setContextFilter(contextFilter === 'academie' ? 'all' : 'academie'); setMethodDropOpen(false) }}
            >
              <AureakText style={[st.toggleLabel, contextFilter === 'academie' && st.toggleLabelActive] as never}>
                ACADÉMIE
              </AureakText>
            </Pressable>
            <Pressable
              style={[st.toggleBtn, contextFilter === 'stage' && st.toggleBtnActive] as never}
              onPress={() => { setContextFilter(contextFilter === 'stage' ? 'all' : 'stage'); setMethodDropOpen(false) }}
            >
              <AureakText style={[st.toggleLabel, contextFilter === 'stage' && st.toggleLabelActive] as never}>
                STAGE
              </AureakText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Contenu : table entraînements ou exercices ── */}
      {loading ? (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
      ) : contentType === 'entrainement' ? (
        <EntraînementsTable
          sessions={filteredSessions}
          totalSessions={sessions.length}
          deletingId={deletingId}
          methodColors={methodologyMethodColors}
          onPress={(id) => router.push(`/methodologie/seances/${id}` as never)}
          onDelete={(id) => setConfirmDeleteId(id)}
        />
      ) : (
        <ExercicesTable
          exercises={filteredExercises}
          totalExercises={exercises.length}
          methodColors={methodologyMethodColors}
        />
      )}

      {/* ── ConfirmDialog ── */}
      <ConfirmDialog
        visible={confirmDeleteId !== null}
        title="Supprimer cet entraînement ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

    </ScrollView>
  )
}

// ── Sous-composant table entraînements ───────────────────────────────────────

type EntraînementsTableProps = {
  sessions     : MethodologySession[]
  totalSessions: number
  deletingId   : string | null
  methodColors : Record<string, string>
  onPress      : (id: string) => void
  onDelete     : (id: string) => void
}

function EntraînementsTable({ sessions, totalSessions, deletingId, methodColors, onPress, onDelete }: EntraînementsTableProps) {
  if (sessions.length === 0) {
    return (
      <View style={st.empty}>
        <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
          {totalSessions === 0 ? 'Aucun entraînement pédagogique. Créez le premier.' : 'Aucun résultat pour ces filtres.'}
        </AureakText>
      </View>
    )
  }

  return (
    <View style={st.tableWrapper}>
      {/* Header */}
      <View style={st.tableHeader}>
        <View style={{ width: COL_WIDTHS.method }}>
          <AureakText style={st.thText}>MÉTHODE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.num }}>
          <AureakText style={st.thText}>NUM</AureakText>
        </View>
        <View style={{ flex: COL_WIDTHS.title }}>
          <AureakText style={st.thText}>TITRE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.themes }}>
          <AureakText style={st.thText}>THÈMES</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.situations }}>
          <AureakText style={st.thText}>SITUATIONS</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.pdf }}>
          <AureakText style={st.thText}>PDF</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS.status }}>
          <AureakText style={st.thText}>STATUT</AureakText>
        </View>
      </View>

      {/* Rows */}
      {sessions.map((session, idx) => {
        const isDeleting  = deletingId === session.id
        const isLinked    = (session.sessionsCount ?? 0) > 0
        const rowBg       = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        const methodColor = session.method
          ? methodColors[session.method] ?? colors.border.light
          : colors.border.light
        const picto = session.method ? METHOD_PICTOS[session.method] : '—'

        return (
          <Pressable
            key={session.id}
            onPress={() => onPress(session.id)}
            style={({ pressed }) => [
              st.tableRow,
              { backgroundColor: rowBg },
              pressed && { opacity: 0.8 },
            ]}
          >
            {/* MÉTHODE */}
            <View style={{ width: COL_WIDTHS.method, alignItems: 'center' }}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
            </View>

            {/* NUM */}
            <View style={{ width: COL_WIDTHS.num, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {session.trainingRef ? `#${session.trainingRef}` : '—'}
              </AureakText>
            </View>

            {/* TITRE */}
            <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {session.title}
              </AureakText>
            </View>

            {/* THÈMES */}
            <View style={{ width: COL_WIDTHS.themes, justifyContent: 'center' }}>
              <AureakText style={st.dashText}>—</AureakText>
            </View>

            {/* SITUATIONS */}
            <View style={{ width: COL_WIDTHS.situations, justifyContent: 'center' }}>
              <AureakText style={st.dashText}>—</AureakText>
            </View>

            {/* PDF */}
            <View style={{ width: COL_WIDTHS.pdf, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: session.pdfUrl ? colors.status.present : colors.border.light,
              }]} />
            </View>

            {/* STATUT */}
            <View style={{ width: COL_WIDTHS.status, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[st.statusDot, {
                  backgroundColor: session.isActive ? colors.status.present : colors.border.light,
                }]} />
                {!isLinked && (
                  <Pressable
                    style={[st.deleteBtn, isDeleting && { opacity: 0.5 }]}
                    onPress={(e) => {
                      e.stopPropagation?.()
                      onDelete(session.id)
                    }}
                    disabled={isDeleting}
                  >
                    <AureakText style={st.deleteBtnLabel}>
                      {isDeleting ? '…' : '✕'}
                    </AureakText>
                  </Pressable>
                )}
              </View>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Sous-composant table exercices ───────────────────────────────────────────

type ExercicesTableProps = {
  exercises     : MethodologyExercise[]
  totalExercises: number
  methodColors  : Record<string, string>
}

function ExercicesTable({ exercises, totalExercises, methodColors }: ExercicesTableProps) {
  if (exercises.length === 0) {
    return (
      <View style={st.empty}>
        <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
          {totalExercises === 0 ? 'Aucun exercice. La table est vide.' : 'Aucun résultat pour ces filtres.'}
        </AureakText>
      </View>
    )
  }

  return (
    <View style={st.tableWrapper}>
      {/* Header */}
      <View style={st.tableHeader}>
        <View style={{ width: COL_WIDTHS_EX.method }}>
          <AureakText style={st.thText}>MÉTHODE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS_EX.num }}>
          <AureakText style={st.thText}>REF</AureakText>
        </View>
        <View style={{ flex: COL_WIDTHS_EX.title }}>
          <AureakText style={st.thText}>TITRE</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS_EX.pdf }}>
          <AureakText style={st.thText}>PDF</AureakText>
        </View>
        <View style={{ width: COL_WIDTHS_EX.status }}>
          <AureakText style={st.thText}>STATUT</AureakText>
        </View>
      </View>

      {/* Rows */}
      {exercises.map((exercise, idx) => {
        const rowBg       = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        const methodColor = methodColors[exercise.method] ?? colors.border.light
        const picto       = METHOD_PICTOS[exercise.method] ?? '—'

        return (
          <View
            key={exercise.id}
            style={[st.tableRow, { backgroundColor: rowBg }]}
          >
            {/* MÉTHODE */}
            <View style={{ width: COL_WIDTHS_EX.method, alignItems: 'center' }}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
            </View>

            {/* REF */}
            <View style={{ width: COL_WIDTHS_EX.num, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {exercise.trainingRef ? `#${exercise.trainingRef}` : '—'}
              </AureakText>
            </View>

            {/* TITRE */}
            <View style={{ flex: COL_WIDTHS_EX.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {exercise.title}
              </AureakText>
            </View>

            {/* PDF */}
            <View style={{ width: COL_WIDTHS_EX.pdf, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: exercise.pdfUrl ? colors.status.present : colors.border.light,
              }]} />
            </View>

            {/* STATUT */}
            <View style={{ width: COL_WIDTHS_EX.status, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: exercise.isActive ? colors.status.present : colors.border.light,
              }]} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.lg, gap: space.md, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  // Header block
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },

  // Nav tabs (5 onglets navigation)
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabItem: {
    position     : 'relative',
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
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

  // StatCards — 7 cards méthodes horizontales
  statCardsRow: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
    flexWrap         : 'wrap',
  },
  statCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    minWidth       : 130,
    alignItems     : 'center',
    gap            : 4,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  statCardPicto: {
    fontSize    : 22,
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize     : 10,
    fontFamily   : fonts.display,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign    : 'center',
  },
  statCardValue: {
    fontSize  : 28,
    fontFamily: fonts.display,
    fontWeight: '900',
    color     : colors.text.dark,
  },

  // FiltresRow — gauche | centre | droite
  filtresRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    flexWrap      : 'wrap',
    gap           : space.sm,
    zIndex        : 9999,
  },
  filtresLeft: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  filtresCenter: {
    flexDirection: 'row',
    alignItems   : 'center',
    justifyContent: 'center',
  },
  filtresRight: {
    flexDirection: 'row',
    alignItems   : 'center',
  },

  // Pills FiltresScope design (hauteur alignée sur toggles : paddingVertical 8)
  pillActive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.accent.gold,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
  pillInactive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  pillTextActive: {
    fontSize  : 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    color     : colors.text.dark,
  },
  pillTextInactive: {
    fontSize  : 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },

  // Dropdown wrapper (for pill + dropdown positioning)
  dropdownWrapper: {
    position: 'relative',
    zIndex  : 9999,
  },

  // SegmentedToggle (pattern exact de academie/joueurs)
  toggleRow: {
    flexDirection: 'row',
    gap          : 0,
    alignSelf    : 'flex-start',
    borderRadius : radius.xs,
    overflow     : 'hidden',
    borderWidth  : 1,
    borderColor  : colors.border.light,
  },
  toggleBtn: {
    paddingVertical  : 8,
    paddingHorizontal: space.lg,
    backgroundColor  : colors.light.surface,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  toggleLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.text.muted,
  },
  toggleLabelActive: {
    color: colors.text.dark,
  },

  // Méthode dropdown
  methodDropdown: {
    position       : 'absolute',
    top            : 38,
    left           : 0,
    zIndex         : 9999,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : 6,
    minWidth       : 220,
    // @ts-ignore web
    boxShadow      : shadows.lg,
  },
  methodDropdownItem    : { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  methodDropdownItemActive: { backgroundColor: colors.accent.gold + '18' },

  // Table
  empty: { padding: space.lg, alignItems: 'center' },
  tableWrapper: {
    borderRadius: 10,
    borderWidth : 1,
    borderColor : colors.border.divider,
    overflow    : 'hidden',
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    gap              : 12,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  thText: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 12,
    gap              : 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },

  // Row cells
  methodCircle: {
    width         : 32,
    height        : 32,
    borderRadius  : 16,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  methodPicto: { fontSize: 16 },
  numText    : { fontSize: 13, fontWeight: '700', color: colors.accent.gold },
  titleText  : { fontSize: 13, fontWeight: '600', color: colors.text.dark },
  dashText   : { fontSize: 12, color: colors.text.muted },
  statusDot  : { width: 8, height: 8, borderRadius: 4 },

  // Delete button
  deleteBtn: {
    paddingHorizontal: 4,
    paddingVertical  : 2,
    borderRadius     : 4,
    borderWidth      : 1,
    borderColor      : colors.accent.red + '50',
    backgroundColor  : colors.accent.red + '0D',
  },
  deleteBtnLabel: {
    fontSize  : 10,
    fontWeight: '600',
    color     : colors.accent.red,
  },
})
