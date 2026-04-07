'use client'
// Entraînements pédagogiques — bibliothèque de contenu réutilisable
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listMethodologySessions, softDeleteMethodologySession } from '@aureak/api-client'
import { AureakText, ConfirmDialog } from '@aureak/ui'
import { colors, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import {
  METHODOLOGY_METHODS, METHODOLOGY_CONTEXT_TYPES,
  METHODOLOGY_CONTEXT_LABELS,
  type MethodologyMethod, type MethodologyContextType,
} from '@aureak/types'
import type { MethodologySession } from '@aureak/types'
import { useToast } from '../../../../components/ToastContext'

type FilterMethod  = MethodologyMethod | 'all'
type FilterContext = MethodologyContextType | 'all'

const METHOD_PICTOS: Record<MethodologyMethod, string> = {
  'Goal and Player' : '⚽',
  'Technique'       : '📚',
  'Situationnel'    : '📐',
  'Perfectionnement': '🎯',
  'Performance'     : '💪',
  'Décisionnel'     : '🧠',
  'Intégration'     : '👥',
}

const TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances' },
  { label: 'THÈMES',        href: '/methodologie/themes' },
  { label: 'SITUATIONS',    href: '/methodologie/situations' },
]

const COL_WIDTHS = { method: 52, num: 52, title: 1, themes: 120, situations: 80, pdf: 40, status: 40 }

export default function SeancesPage() {
  const router = useRouter()
  const toast  = useToast()

  const [sessions,        setSessions]        = useState<MethodologySession[]>([])
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [methodFilter,    setMethodFilter]    = useState<FilterMethod>('all')
  const [contextFilter,   setContextFilter]   = useState<FilterContext>('all')
  const [deletingId,      setDeletingId]      = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listMethodologySessions({ activeOnly: false })
      setSessions(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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

  const filtered = sessions.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    if (methodFilter  !== 'all' && s.method      !== methodFilter)  return false
    if (contextFilter !== 'all' && s.contextType !== contextFilter) return false
    return true
  })

  const methodCounts = METHODOLOGY_METHODS.map(m => ({
    method: m,
    count : sessions.filter(s => s.method === m).length,
  }))

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* ── Header : titre + onglets + bouton ── */}
      <View style={st.headerBlock}>
        <View style={st.headerTopRow}>
          <AureakText style={st.pageTitle}>MÉTHODOLOGIE</AureakText>
          <Pressable style={st.newBtn} onPress={() => router.push('/methodologie/seances/new' as never)}>
            <AureakText style={st.newBtnLabel}>+ Nouvel entraînement</AureakText>
          </Pressable>
        </View>
        <View style={st.tabsRow}>
          {TABS.map(tab => {
            const active = tab.href === '/methodologie/seances'
            return (
              <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
                <AureakText style={{ ...st.tabLabel, ...(active ? st.tabLabelActive : {}) }}>
                  {tab.label}
                </AureakText>
                {active && <View style={st.tabUnderline} />}
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* ── Stat cards méthodes ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.statCardsScroll}>
        <View style={st.statCardsRow}>
          {methodCounts.map(({ method, count }) => {
            const accentColor = methodologyMethodColors[method]
            return (
              <View
                key={method}
                style={[st.statCard, { borderLeftColor: accentColor } as object]}
              >
                <AureakText style={st.statPicto}>{METHOD_PICTOS[method]}</AureakText>
                <AureakText style={st.statCount}>{count}</AureakText>
                <AureakText style={st.statLabel}>{method}</AureakText>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* ── Filtres ── */}
      <TextInput
        style={st.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher par titre…"
        placeholderTextColor={colors.text.muted}
      />

      <View style={st.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['all', ...METHODOLOGY_METHODS] as FilterMethod[]).map(m => {
              const active = methodFilter === m
              return (
                <Pressable
                  key={m}
                  onPress={() => setMethodFilter(m)}
                  style={[st.chip, {
                    borderColor    : active ? colors.accent.gold : colors.border.light,
                    backgroundColor: active ? colors.accent.gold + '18' : 'transparent',
                  }]}
                >
                  <AureakText style={{ color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>
                    {m === 'all' ? 'Toutes méthodes' : m}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>

      <View style={st.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['all', ...METHODOLOGY_CONTEXT_TYPES] as FilterContext[]).map(c => {
              const active = contextFilter === c
              return (
                <Pressable
                  key={c}
                  onPress={() => setContextFilter(c)}
                  style={[st.chip, {
                    borderColor    : active ? colors.accent.gold : colors.border.light,
                    backgroundColor: active ? colors.accent.gold + '18' : 'transparent',
                  }]}
                >
                  <AureakText style={{ color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '700' : '400', fontSize: 12 }}>
                    {c === 'all' ? 'Tous contextes' : METHODOLOGY_CONTEXT_LABELS[c as MethodologyContextType]}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* ── Tableau ── */}
      {loading ? (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
      ) : filtered.length === 0 ? (
        <View style={st.empty}>
          <AureakText style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 13 }}>
            {sessions.length === 0 ? 'Aucun entraînement pédagogique. Créez le premier.' : 'Aucun résultat pour ces filtres.'}
          </AureakText>
        </View>
      ) : (
        <View style={st.tableWrapper}>
          {/* Table header */}
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

          {/* Table rows */}
          {filtered.map((session, idx) => {
            const isDeleting  = deletingId === session.id
            const isLinked    = (session.sessionsCount ?? 0) > 0
            const rowBg       = idx % 2 === 0 ? colors.light.surface : colors.light.muted
            const methodColor = session.method
              ? methodologyMethodColors[session.method] ?? colors.border.light
              : colors.border.light
            const picto = session.method ? METHOD_PICTOS[session.method] : '—'

            return (
              <Pressable
                key={session.id}
                onPress={() => router.push(`/methodologie/seances/${session.id}` as never)}
                style={({ pressed }) => [
                  st.tableRow,
                  { backgroundColor: rowBg },
                  pressed && { opacity: 0.8 },
                ]}
              >
                {/* METHODE */}
                <View style={{ width: COL_WIDTHS.method, alignItems: 'center' }}>
                  <View style={[st.methodCircle, { backgroundColor: methodColor + '22' }]}>
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
                          setConfirmDeleteId(session.id)
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

const st = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.lg, gap: space.md, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  // Header block
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: 'Montserrat', color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },
  tabsRow      : {
    flexDirection   : 'row',
    gap             : 24,
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

  // Stat cards
  statCardsScroll: { flexGrow: 0 },
  statCardsRow   : { flexDirection: 'row', gap: space.sm, paddingVertical: 2 },
  statCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderLeftWidth: 3,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    minWidth         : 110,
    alignItems       : 'center',
    gap              : 4,
  },
  statPicto: { fontSize: 28 },
  statCount: {
    fontSize   : 22,
    fontWeight : '900',
    fontFamily : 'Montserrat',
    color      : colors.text.dark,
  },
  statLabel: {
    fontSize     : 9,
    fontWeight   : '700',
    color        : colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign    : 'center',
  },

  // Search + filters
  searchInput: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 8,
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  filterRow: { flexDirection: 'row' },
  chip     : { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  empty    : { padding: space.lg, alignItems: 'center' },

  // Table
  tableWrapper: {
    borderRadius : 10,
    borderWidth  : 1,
    borderColor  : colors.border.divider,
    overflow     : 'hidden',
  },
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
    fontFamily   : 'Montserrat',
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },

  // Row cells
  methodCircle: {
    width        : 32,
    height       : 32,
    borderRadius : 16,
    alignItems   : 'center',
    justifyContent: 'center',
  },
  methodPicto: { fontSize: 16 },
  numText    : { fontSize: 13, fontWeight: '700', color: colors.accent.gold },
  titleText  : { fontSize: 13, fontWeight: '600', color: colors.text.dark },
  dashText   : { fontSize: 12, color: colors.text.muted },
  statusDot  : { width: 8, height: 8, borderRadius: 4 },

  // Delete button in row
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
