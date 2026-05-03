'use client'
// Entraînements pédagogiques — bibliothèque de contenu réutilisable
import React, { useContext, useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologySessions, softDeleteMethodologySession, listMethodologyExercises } from '@aureak/api-client'
import { AureakText, ConfirmDialog } from '@aureak/ui'
import { colors, fonts, space, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS,
  type MethodologyMethod, type MethodologyContextType,
} from '@aureak/types'
import type { MethodologySession, MethodologyExercise } from '@aureak/types'
import { useToast } from '../../../../components/ToastContext'
import { MethodologieHeader } from '../../../../components/admin/methodologie/MethodologieHeader'
import { MethodologieCountsContext } from '../_layout'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
import {
  MetFiltersRow, MetSegmented, MetSelect, MetPagination, usePagination, PAGE_SIZE,
} from '../../../../components/admin/methodologie/methodologieFilters'

type FilterMethod = MethodologyMethod | 'all'
type ContentType  = 'entrainement' | 'exercice'
type ContextValue = MethodologyContextType | 'all'

const METHOD_PICTOS: Record<MethodologyMethod, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '📚',
  'Situationnel'    : '📐',
  'Perfectionnement': '🎯',
  'Performance'     : '💪',
  'Décisionnel'     : '🧠',
  'Intégration'     : '👥',
}

const COL_WIDTHS    = { method: 52, num: 90, title: 1, themes: 100, situations: 90, pdf: 50, status: 60 }
const COL_WIDTHS_EX = { method: 52, num: 90, title: 1, pdf: 50, status: 60 }

export default function SeancesPage() {
  const router = useRouter()
  const toast  = useToast()
  const counts = useContext(MethodologieCountsContext)

  const [sessions,        setSessions]        = useState<MethodologySession[]>([])
  const [exercises,       setExercises]       = useState<MethodologyExercise[]>([])
  const [loading,         setLoading]         = useState(true)
  const [methodFilter,    setMethodFilter]    = useState<FilterMethod>('all')
  const [contextFilter,   setContextFilter]   = useState<ContextValue>('all')
  const [contentType,     setContentType]     = useState<ContentType>('entrainement')
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

  return (
    <View style={st.root}>
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      <MethodologieHeader
        newLabel="+ Nouvel entraînement"
        newHref="/methodologie/entrainements/new"
        counts={counts ?? undefined}
      />

      <View style={st.bodyWrap}>
        <MetFiltersRow>
          <MetSegmented<ContentType>
            value={contentType}
            onChange={setContentType}
            options={[
              { value: 'entrainement', label: 'Entraînement' },
              { value: 'exercice',     label: 'Exercice' },
            ]}
          />
          <MetSelect
            label="Méthode"
            value={methodFilter}
            onChange={(v) => setMethodFilter(v as FilterMethod)}
            options={[
              { value: 'all', label: 'Toutes' },
              ...METHODOLOGY_METHODS.map(m => ({ value: m, label: `${METHOD_PICTOS[m]} ${m}` })),
            ]}
          />
          <MetSelect
            label="Contexte"
            value={contextFilter}
            onChange={(v) => setContextFilter(v as ContextValue)}
            options={[
              { value: 'all',      label: 'Tous' },
              { value: 'academie', label: 'Académie' },
              { value: 'stage',    label: 'Stage' },
            ]}
          />
        </MetFiltersRow>

        {loading ? (
          <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
        ) : contentType === 'entrainement' ? (
          <EntraînementsTable
            sessions={filteredSessions}
            totalSessions={sessions.length}
            deletingId={deletingId}
            methodColors={methodologyMethodColors}
            onPress={(id) => router.push(`/methodologie/entrainements/${id}` as never)}
            onDelete={(id) => setConfirmDeleteId(id)}
          />
        ) : (
          <ExercicesTable
            exercises={filteredExercises}
            totalExercises={exercises.length}
            methodColors={methodologyMethodColors}
          />
        )}
      </View>

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

      {/* Story 103.3 — FAB mobile cohérent avec pattern PrimaryAction */}
      <PrimaryAction
        label="Nouvel entraînement"
        onPress={() => router.push('/methodologie/entrainements/new' as never)}
      />
    </View>
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
  const { page, setPage, pageCount, paginated } = usePagination(sessions, PAGE_SIZE)
  const { width } = useWindowDimensions()
  const isMobile = width < 640

  if (sessions.length === 0) {
    return (
      <View style={st.tableWrapper}>
        <View style={st.empty}>
          <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
            {totalSessions === 0 ? 'Aucun entraînement pédagogique. Créez le premier.' : 'Aucun résultat pour ces filtres.'}
          </AureakText>
        </View>
      </View>
    )
  }

  // Story 103.9 — rendu mobile en stack de cards (pas de scroll horizontal)
  if (isMobile) {
    return (
      <View style={st.tableWrapper}>
        {paginated.map((session) => {
          const isDeleting  = deletingId === session.id
          const isLinked    = (session.sessionsCount ?? 0) > 0
          const methodColor = session.method ? methodColors[session.method] ?? colors.border.light : colors.border.light
          const picto = session.method ? METHOD_PICTOS[session.method] : '—'
          return (
            <Pressable
              key={session.id}
              onPress={() => onPress(session.id)}
              style={({ pressed }) => [st.mobileCard, pressed && { opacity: 0.8 }]}
            >
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AureakText style={st.titleText} numberOfLines={2}>{session.title}</AureakText>
                <AureakText style={st.numText}>
                  {session.trainingRef ? `#${session.trainingRef}` : '—'}
                  {session.method ? ` · ${session.method}` : ''}
                </AureakText>
              </View>
              <View style={[st.statusDot, {
                backgroundColor: session.isActive ? colors.status.present : colors.border.light,
              }]} />
              {!isLinked && (
                <Pressable
                  style={[st.deleteBtn, isDeleting && { opacity: 0.5 }]}
                  onPress={(e) => { e.stopPropagation?.(); onDelete(session.id) }}
                  disabled={isDeleting}
                >
                  <AureakText style={st.deleteBtnLabel}>{isDeleting ? '…' : '✕'}</AureakText>
                </Pressable>
              )}
            </Pressable>
          )
        })}
        <MetPagination
          page={page}
          pageCount={pageCount}
          total={sessions.length}
          pageSize={PAGE_SIZE}
          itemLabelPlural="entraînements"
          onPageChange={setPage}
        />
      </View>
    )
  }

  return (
    <View style={st.tableWrapper}>
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

      {paginated.map((session, idx) => {
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
            <View style={{ width: COL_WIDTHS.method, alignItems: 'center' }}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
            </View>

            <View style={{ width: COL_WIDTHS.num, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {session.trainingRef ? `#${session.trainingRef}` : '—'}
              </AureakText>
            </View>

            <View style={{ flex: COL_WIDTHS.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {session.title}
              </AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.themes, justifyContent: 'center' }}>
              <AureakText style={st.dashText}>—</AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.situations, justifyContent: 'center' }}>
              <AureakText style={st.dashText}>—</AureakText>
            </View>

            <View style={{ width: COL_WIDTHS.pdf, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: session.pdfUrl ? colors.status.present : colors.border.light,
              }]} />
            </View>

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

      <MetPagination
        page={page}
        pageCount={pageCount}
        total={sessions.length}
        pageSize={PAGE_SIZE}
        itemLabelPlural="entraînements"
        onPageChange={setPage}
      />
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
  const { page, setPage, pageCount, paginated } = usePagination(exercises, PAGE_SIZE)
  const { width } = useWindowDimensions()
  const isMobile = width < 640

  if (exercises.length === 0) {
    return (
      <View style={st.tableWrapper}>
        <View style={st.empty}>
          <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
            {totalExercises === 0 ? 'Aucun exercice. La table est vide.' : 'Aucun résultat pour ces filtres.'}
          </AureakText>
        </View>
      </View>
    )
  }

  // Story 103.9.b — rendu mobile en stack de cards
  if (isMobile) {
    return (
      <View style={st.tableWrapper}>
        {paginated.map((exercise) => {
          const methodColor = methodColors[exercise.method] ?? colors.border.light
          const picto = METHOD_PICTOS[exercise.method] ?? '—'
          return (
            <View key={exercise.id} style={st.mobileCard}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AureakText style={st.titleText} numberOfLines={2}>{exercise.title}</AureakText>
                <AureakText style={st.numText}>
                  {exercise.trainingRef ? `#${exercise.trainingRef}` : '—'} · {exercise.method}
                </AureakText>
              </View>
              <View style={[st.statusDot, {
                backgroundColor: exercise.isActive ? colors.status.present : colors.border.light,
              }]} />
            </View>
          )
        })}
        <MetPagination
          page={page}
          pageCount={pageCount}
          total={exercises.length}
          pageSize={PAGE_SIZE}
          itemLabelPlural="exercices"
          onPageChange={setPage}
        />
      </View>
    )
  }

  return (
    <View style={st.tableWrapper}>
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

      {paginated.map((exercise, idx) => {
        const rowBg       = idx % 2 === 0 ? colors.light.surface : colors.light.muted
        const methodColor = methodColors[exercise.method] ?? colors.border.light
        const picto       = METHOD_PICTOS[exercise.method] ?? '—'

        return (
          <View
            key={exercise.id}
            style={[st.tableRow, { backgroundColor: rowBg }]}
          >
            <View style={{ width: COL_WIDTHS_EX.method, alignItems: 'center' }}>
              <View style={[st.methodCircle, { backgroundColor: methodColor + '44', borderWidth: 1, borderColor: methodColor }]}>
                <AureakText style={st.methodPicto}>{picto}</AureakText>
              </View>
            </View>

            <View style={{ width: COL_WIDTHS_EX.num, justifyContent: 'center' }}>
              <AureakText style={st.numText}>
                {exercise.trainingRef ? `#${exercise.trainingRef}` : '—'}
              </AureakText>
            </View>

            <View style={{ flex: COL_WIDTHS_EX.title, justifyContent: 'center' }}>
              <AureakText style={st.titleText} numberOfLines={2}>
                {exercise.title}
              </AureakText>
            </View>

            <View style={{ width: COL_WIDTHS_EX.pdf, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: exercise.pdfUrl ? colors.status.present : colors.border.light,
              }]} />
            </View>

            <View style={{ width: COL_WIDTHS_EX.status, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[st.statusDot, {
                backgroundColor: exercise.isActive ? colors.status.present : colors.border.light,
              }]} />
            </View>
          </View>
        )
      })}

      <MetPagination
        page={page}
        pageCount={pageCount}
        total={exercises.length}
        pageSize={PAGE_SIZE}
        itemLabelPlural="exercices"
        onPageChange={setPage}
      />
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root     : { flex: 1, backgroundColor: colors.light.primary },
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { paddingBottom: space.xxl, gap: space.md },
  bodyWrap : { paddingHorizontal: space.lg, gap: space.md },

  empty: { padding: space.xl, alignItems: 'center', backgroundColor: colors.light.surface },

  tableWrapper: {
    borderRadius: 10,
    borderWidth : 1,
    borderColor : colors.border.divider,
    overflow    : 'hidden',
  },
  // Story 103.9 — card mobile (stack vertical, pas de scroll horizontal)
  mobileCard: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : space.md,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm + 2,
    backgroundColor  : colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
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
