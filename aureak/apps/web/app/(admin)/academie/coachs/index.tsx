'use client'
// Refonte alignée sur /activites/seances :
//  - Suppression des StatCards + segmented toggle COACH/ASSISTANT
//  - Filtres en <select> natif (Rôle) + recherche
//  - Tableau style TableauSeances (border + lignes alternées + pagination)
import { useContext, useEffect, useState, useMemo } from 'react'
import { View, ScrollView, Pressable, StyleSheet, TextInput, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listCoaches, getCoachCurrentGrade } from '@aureak/api-client'
import type { CoachListRow, CoachGrade, CoachGradeLevel } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
import { FilterSheet } from '../../../../components/admin/FilterSheet'
import { AcademieCountsContext } from '../_layout'

type CoachWithGrade = CoachListRow & {
  grade : CoachGrade | null
  nom   : string
  prenom: string
}

type RoleFilter = 'all' | 'coach' | 'assistant'

const GRADE_LABELS: Record<CoachGradeLevel, string> = {
  bronze  : 'Bronze',
  silver  : 'Argent',
  gold    : 'Or',
  platinum: 'Platine',
}

const GRADE_COLORS: Record<CoachGradeLevel, string> = {
  bronze  : colors.status.warning,
  silver  : colors.text.muted,
  gold    : colors.accent.gold,
  platinum: colors.status.present,
}

const PAGE_SIZE = 25

function splitName(displayName: string | null): { prenom: string; nom: string } {
  if (!displayName) return { prenom: '—', nom: '—' }
  const parts = displayName.trim().split(' ')
  if (parts.length === 1) return { prenom: parts[0], nom: '—' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}

export default function AcademieCoachsPage() {
  const router         = useRouter()
  const academieCounts = useContext(AcademieCountsContext)
  const { width }      = useWindowDimensions()
  const isMobile       = width <= 640

  const [coaches,    setCoaches]    = useState<CoachWithGrade[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [page,       setPage]       = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const { data: allRows } = await listCoaches({ page: 0, pageSize: 500 })
        if (cancelled) return

        const gradesResults = await Promise.all(
          allRows.map(c => getCoachCurrentGrade(c.userId))
        )
        if (cancelled) return

        const withGrades: CoachWithGrade[] = allRows.map((c, i) => {
          const { prenom, nom } = splitName(c.displayName)
          return { ...c, grade: gradesResults[i].data, nom, prenom }
        })

        setCoaches(withGrades)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieCoachsPage] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Note: filtrage Coach/Assistant non fonctionnel (pas de champ coachRole en DB).
  // Le filtre ASSISTANT retourne donc une liste vide jusqu'à story future.
  const filtered = useMemo(() => {
    return coaches.filter(c => {
      if (roleFilter === 'assistant') return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !(c.displayName ?? '').toLowerCase().includes(q) &&
          !c.nom.toLowerCase().includes(q) &&
          !c.prenom.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [coaches, roleFilter, search])

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const displayStart = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, filtered.length)

  const openNewCoach = () => router.push('/academie/coachs/new' as never)

  return (
    <View style={st.container}>
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <ScrollView style={st.scroll} contentContainerStyle={st.content}>
        <View style={st.controls}>
          <View style={st.searchWrap}>
            <TextInput
              value={search}
              onChangeText={(v) => { setSearch(v); setPage(0) }}
              placeholder="Rechercher un coach…"
              placeholderTextColor={colors.text.muted}
              style={st.searchInput as never}
            />
          </View>
          <FilterSheet
            activeCount={roleFilter !== 'all' ? 1 : 0}
            onReset={() => { setRoleFilter('all' as RoleFilter); setPage(0) }}
            triggerLabel="Filtrer les coachs"
          >
            <View style={st.selectField}>
              <AureakText style={st.selectLabel}>Rôle</AureakText>
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value as RoleFilter); setPage(0) }}
                style={selectNativeStyle}
              >
                <option value="all">Tous</option>
                <option value="coach">Coach</option>
                <option value="assistant">Assistant</option>
              </select>
            </View>
          </FilterSheet>
        </View>

        {loading ? (
          <View style={st.loadingState}>
            <AureakText style={st.loadingText}>Chargement des coachs…</AureakText>
          </View>
        ) : (
          <View style={[st.card, isMobile && st.cardMobile]}>
            {!isMobile && (
              <View style={st.tableHeader}>
                <AureakText style={[st.colHeader, { flex: 1.2, minWidth: 80 }] as never}>NOM</AureakText>
                <AureakText style={[st.colHeader, { flex: 1.2, minWidth: 80 }] as never}>PRÉNOM</AureakText>
                <AureakText style={[st.colHeader, { flex: 1.5, minWidth: 100 }] as never}>IMPLANTATION</AureakText>
                <AureakText style={[st.colHeader, { width: 110 }] as never}>GRADE</AureakText>
                <AureakText style={[st.colHeader, { width: 80 }] as never}>DIPLÔMÉ</AureakText>
                <AureakText style={[st.colHeader, { flex: 1.5, minWidth: 100 }] as never}>FORMATION</AureakText>
                <View style={{ width: 28 }} />
              </View>
            )}

            {filtered.length === 0 ? (
              <View style={st.emptyRow}>
                <AureakText style={st.emptyText}>Aucun coach pour ces filtres.</AureakText>
              </View>
            ) : paginated.map((c, idx) => {
              const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              return (
                <Pressable
                  key={c.userId}
                  onPress={() => router.push(`/academie/coachs/${c.userId}` as never)}
                  style={({ pressed }) => [st.tableRow, { backgroundColor: rowBg }, pressed && { opacity: 0.8 }] as never}
                >
                  <AureakText style={[st.cellText, { flex: 1.2, minWidth: 80 }] as never} numberOfLines={1}>
                    {c.nom}
                  </AureakText>
                  <AureakText style={[st.cellText, { flex: 1.2, minWidth: 80 }] as never} numberOfLines={1}>
                    {c.prenom}
                  </AureakText>
                  <AureakText style={[st.cellMuted, { flex: 1.5, minWidth: 100 }] as never} numberOfLines={1}>
                    —
                  </AureakText>
                  <View style={{ width: 110, justifyContent: 'center' }}>
                    {c.grade ? (
                      <View style={[cs.gradeBadge, { borderColor: GRADE_COLORS[c.grade.grade_level] }] as never}>
                        <AureakText
                          style={[cs.gradeBadgeText, { color: GRADE_COLORS[c.grade.grade_level] }] as never}
                        >
                          {GRADE_LABELS[c.grade.grade_level]}
                        </AureakText>
                      </View>
                    ) : (
                      <AureakText style={st.cellMuted}>—</AureakText>
                    )}
                  </View>
                  <AureakText style={[st.cellMuted, { width: 80 }] as never}>—</AureakText>
                  <AureakText style={[st.cellMuted, { flex: 1.5, minWidth: 100 }] as never} numberOfLines={1}>
                    —
                  </AureakText>
                  <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                    <AureakText style={{ color: colors.text.muted }}>›</AureakText>
                  </View>
                </Pressable>
              )
            })}

            <View style={st.pagination}>
              <AureakText style={st.paginationInfo}>
                {filtered.length > 0
                  ? `Affichage de ${displayStart}–${displayEnd} sur ${filtered.length} coachs`
                  : 'Aucun coach'}
              </AureakText>
              <View style={st.paginationActions}>
                <Pressable
                  onPress={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={[st.pageBtn, page === 0 && st.pageBtnDisabled] as never}
                >
                  <AureakText style={st.pageBtnText}>‹</AureakText>
                </Pressable>
                <AureakText style={st.pageNum}>{page + 1} / {totalPages}</AureakText>
                <Pressable
                  onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={[st.pageBtn, page >= totalPages - 1 && st.pageBtnDisabled] as never}
                >
                  <AureakText style={st.pageBtnText}>›</AureakText>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <PrimaryAction
        label="Nouveau coach"
        onPress={openNewCoach}
      />
    </View>
  )
}

const selectNativeStyle: React.CSSProperties = {
  width        : '100%',
  padding      : '7px 10px',
  fontSize     : 13,
  color        : colors.text.dark,
  background   : colors.light.muted,
  border       : `1px solid ${colors.border.divider}`,
  borderRadius : radius.xs,
  outline      : 'none',
  fontFamily   : fonts.body,
}

const cs = StyleSheet.create({
  gradeBadge    : { borderWidth: 1, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  gradeBadgeText: { fontSize: 11, fontWeight: '700' },
})

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  scroll   : { flex: 1, backgroundColor: colors.light.primary },
  content  : { paddingTop: space.md, paddingBottom: 64, gap: space.md },

  controls: {
    flexDirection    : 'row',
    flexWrap         : 'wrap',
    gap              : space.md,
    paddingHorizontal: space.lg,
    alignItems       : 'center',
  },

  selectField: {
    flexGrow : 1,
    flexBasis: 160,
    gap      : 4,
  },
  selectLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    fontFamily   : fonts.display,
  },

  searchWrap: { flex: 1, minWidth: 200 },
  searchInput: {
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    fontSize         : 13,
    color            : colors.text.dark,
  },

  card: {
    borderRadius    : 10,
    marginHorizontal: space.lg,
    marginBottom    : space.lg,
    overflow        : 'hidden',
    borderWidth     : 1,
    borderColor     : colors.border.divider,
  },
  cardMobile: { marginHorizontal: space.sm },

  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : colors.light.muted,
    paddingVertical  : 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  colHeader: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    letterSpacing: 1,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  cellText : { color: colors.text.dark,  fontSize: 13 },
  cellMuted: { color: colors.text.muted, fontSize: 13 },

  emptyRow: { padding: space.xl, alignItems: 'center', backgroundColor: colors.light.surface },
  emptyText: { color: colors.text.muted, fontSize: 14, fontFamily: fonts.body },

  loadingState: { padding: space.xl, alignItems: 'center' },
  loadingText : { color: colors.text.muted, fontSize: 14 },

  pagination: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  },
  paginationInfo   : { color: colors.text.muted, fontSize: 12 },
  paginationActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pageBtn: {
    width          : 28,
    height         : 28,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    justifyContent : 'center',
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText    : { fontSize: 16, color: colors.text.dark },
  pageNum        : { fontSize: 12, color: colors.text.muted },
})
