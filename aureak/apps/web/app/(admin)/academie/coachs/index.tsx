'use client'
// Story 75.2 — Page Coachs redesignée dans le hub Académie
// Story 82.1 — Appliquer LayoutActivités (headerBlock + StatCards + FiltresRow + CoachsTable)
// Story 97.6 — AdminPageHeader v2 ("Coachs") + AcademieNavBar partagé
// Story 101.1 — DataCard responsive pilot (table → stack cards mobile-first)
// Story 101.2 — FilterSheet pilot (filtres inline desktop / bottom sheet mobile)
// Story 101.3 — PrimaryAction pilot (FAB mobile / header desktop)
import { useContext, useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, type TextStyle, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listCoaches, getCoachCurrentGrade } from '@aureak/api-client'
import type { CoachListRow, CoachGrade, CoachGradeLevel } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { DataCard, type DataCardColumn } from '../../../../components/admin/DataCard'
import { FilterSheet } from '../../../../components/admin/FilterSheet'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
import { AcademieCountsContext } from '../_layout'

// ── Types locaux ─────────────────────────────────────────────────────────────────
type CoachWithGrade = CoachListRow & {
  grade : CoachGrade | null
  nom   : string
  prenom: string
}

type RoleFilter = 'all' | 'coach' | 'assistant'

// ── Constantes ───────────────────────────────────────────────────────────────────
const GRADE_VALUES: Record<CoachGradeLevel, number> = {
  bronze  : 1,
  silver  : 2,
  gold    : 3,
  platinum: 4,
}

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

// ── Helper ───────────────────────────────────────────────────────────────────────
function splitName(displayName: string | null): { prenom: string; nom: string } {
  if (!displayName) return { prenom: '—', nom: '—' }
  const parts = displayName.trim().split(' ')
  if (parts.length === 1) return { prenom: parts[0], nom: '—' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}

// ── Page principale ──────────────────────────────────────────────────────────────
export default function AcademieCoachsPage() {
  const router         = useRouter()
  const academieCounts = useContext(AcademieCountsContext)
  const { width }      = useWindowDimensions()
  const isMobile       = width <= 640

  const [coaches,    setCoaches]    = useState<CoachWithGrade[]>([])
  const [loading,    setLoading]    = useState(true)
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

  // Note: filtrage par rôle Coach/Assistant non fonctionnel en l'état (aucun champ
  // coachRole dans profiles). Le filtre ASSISTANT retourne une liste vide jusqu'à
  // implémentation du champ coachRole dans une story future.
  const filtered = coaches.filter(() => roleFilter !== 'assistant')

  // ── Stats ──
  const goldPlusCount = coaches.filter(
    c => c.grade && (['gold', 'platinum'] as CoachGradeLevel[]).includes(c.grade.grade_level)
  ).length

  const academyScore = coaches.reduce(
    (sum, c) => sum + (c.grade ? (GRADE_VALUES[c.grade.grade_level] ?? 0) : 0), 0
  )

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated    = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const displayStart = page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, filtered.length)

  const handleRoleFilter = (role: RoleFilter) => {
    setRoleFilter(prev => prev === role ? 'all' : role)
    setPage(0)
  }

  const openNewCoach = () => router.push('/academie/coachs/new' as never)

  return (
    <View style={s.page}>
      {/* Story 97.6 — AdminPageHeader v2 + AcademieNavBar partagé */}
      {/* Desktop : bouton dans le header (visible ≥640). Mobile : AdminPageHeader passe en colonne
          et le bouton header reste affiché en dessous du titre. Story 101.3 : on ajoute en plus le
          FAB bas-droite pour que l'action reste atteignable en scrollant (approche B — non-duplication
          gérée par le fait que le FAB ne se rend que <640 et reste au-dessus du contenu). */}
      <AdminPageHeader
        title="Coachs"
        actionButton={{
          label  : '+ Nouveau coach',
          onPress: openNewCoach,
        }}
      />
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, isMobile && { paddingHorizontal: 16 }]}>

        {/* ── StatCards ── */}
        <View style={s.statCardsRow}>
          {/* 👤 COACHS */}
          <View style={s.statCard as never}>
            <AureakText style={s.statCardPicto as TextStyle}>👤</AureakText>
            <AureakText style={s.statCardLabel as TextStyle}>COACHS</AureakText>
            <AureakText style={{ ...s.statCardValue, color: colors.text.dark } as TextStyle}>
              {loading ? '—' : String(coaches.length)}
            </AureakText>
          </View>

          {/* 🏆 GRADE OR+ */}
          <View style={s.statCard as never}>
            <AureakText style={s.statCardPicto as TextStyle}>🏆</AureakText>
            <AureakText style={s.statCardLabel as TextStyle}>GRADE OR+</AureakText>
            <AureakText style={{ ...s.statCardValue, color: colors.accent.gold } as TextStyle}>
              {loading ? '—' : String(goldPlusCount)}
            </AureakText>
          </View>

          {/* 🎓 DIPLÔMÉS */}
          <View style={s.statCard as never}>
            <AureakText style={s.statCardPicto as TextStyle}>🎓</AureakText>
            <AureakText style={s.statCardLabel as TextStyle}>DIPLÔMÉS</AureakText>
            <AureakText style={{ ...s.statCardValue, color: colors.text.muted } as TextStyle}>—</AureakText>
          </View>

          {/* ⭐ SCORE ACADÉMIE */}
          <View style={s.statCard as never}>
            <AureakText style={s.statCardPicto as TextStyle}>⭐</AureakText>
            <AureakText style={s.statCardLabel as TextStyle}>SCORE ACADÉMIE</AureakText>
            <AureakText style={{ ...s.statCardValue, color: colors.accent.gold } as TextStyle}>
              {loading ? '—' : String(academyScore)}
            </AureakText>
          </View>
        </View>

        {/* ── FiltresRow : pill TOUS + SegmentedToggle COACH/ASSISTANT ── */}
        {/* Story 101.2 — Wrap dans FilterSheet : inline desktop ≥640 / bottom sheet mobile <640 */}
        <FilterSheet
          activeCount={roleFilter === 'all' ? 0 : 1}
          onReset={() => { setRoleFilter('all'); setPage(0) }}
          triggerLabel="Filtres coachs"
        >
          <View style={s.filtresRow}>
            {/* Gauche : pill TOUS */}
            <Pressable
              onPress={() => { setRoleFilter('all'); setPage(0) }}
              style={roleFilter === 'all' ? s.pillActive : s.pillInactive}
            >
              <AureakText style={(roleFilter === 'all' ? s.pillTextActive : s.pillTextInactive) as TextStyle}>
                TOUS
              </AureakText>
            </Pressable>

            {/* Droite : SegmentedToggle COACH / ASSISTANT */}
            <View style={s.toggleRow}>
              <Pressable
                style={[s.toggleBtn, roleFilter === 'coach' && s.toggleBtnActive] as never}
                onPress={() => handleRoleFilter('coach')}
              >
                <AureakText style={[s.toggleLabel, roleFilter === 'coach' && s.toggleLabelActive] as never}>
                  COACH
                </AureakText>
              </Pressable>
              <Pressable
                style={[s.toggleBtn, roleFilter === 'assistant' && s.toggleBtnActive] as never}
                onPress={() => handleRoleFilter('assistant')}
              >
                <AureakText style={[s.toggleLabel, roleFilter === 'assistant' && s.toggleLabelActive] as never}>
                  ASSISTANT
                </AureakText>
              </Pressable>
            </View>
          </View>
        </FilterSheet>

        {/* ── CoachsTable (Story 101.1 — via <DataCard /> responsive) ── */}
        <DataCard<CoachWithGrade>
          data={paginated}
          loading={loading}
          keyExtractor={(c) => c.userId}
          onRowPress={(c) => router.push(`/academie/coachs/${c.userId}` as never)}
          columns={[
            {
              key     : 'nom',
              label   : 'NOM',
              priority: 'primary',
              flex    : 1.2,
              render  : (c) => c.nom,
            },
            {
              key     : 'prenom',
              label   : 'PRÉNOM',
              priority: 'secondary',
              flex    : 1.2,
              render  : (c) => c.prenom,
            },
            {
              key     : 'implantation',
              label   : 'IMPLANTATION',
              priority: 'secondary',
              flex    : 1.5,
              render  : () => '—',
            },
            {
              key     : 'grade',
              label   : 'GRADE',
              priority: 'secondary',
              width   : 110,
              render  : (c) => c.grade ? (
                <View style={[cs.gradeBadge, { borderColor: GRADE_COLORS[c.grade.grade_level] }] as never}>
                  <AureakText
                    variant="label"
                    style={[cs.gradeBadgeText, { color: GRADE_COLORS[c.grade.grade_level] }] as never}
                  >
                    {GRADE_LABELS[c.grade.grade_level]}
                  </AureakText>
                </View>
              ) : '—',
            },
            {
              key     : 'diplome',
              label   : 'DIPLÔMÉ',
              priority: 'tertiary',
              width   : 80,
              render  : () => '—',
            },
            {
              key     : 'formation',
              label   : 'FORMATION',
              priority: 'tertiary',
              flex    : 1.5,
              render  : () => '—',
            },
          ] as DataCardColumn<CoachWithGrade>[]}
          emptyState={
            <View style={s.emptyState}>
              <AureakText variant="body" style={s.emptyText}>Aucun entraîneur</AureakText>
            </View>
          }
        />

        {/* Pagination — externe au DataCard (cf. 101.4) */}
        {!loading && filtered.length > 0 ? (
          <View style={s.paginationStandalone}>
            <AureakText variant="caption" style={s.paginationInfo}>
              {`Affichage de ${displayStart}–${displayEnd} / ${filtered.length} entraîneurs`}
            </AureakText>
            <View style={s.paginationBtns}>
              <Pressable
                onPress={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={[s.paginationBtn, page === 0 && s.paginationBtnDisabled] as never}
              >
                <AureakText variant="caption" style={{ color: page === 0 ? colors.text.muted : colors.text.dark }}>←</AureakText>
              </Pressable>
              <AureakText variant="caption" style={s.paginationPage}>{page + 1} / {totalPages}</AureakText>
              <Pressable
                onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={[s.paginationBtn, page >= totalPages - 1 && s.paginationBtnDisabled] as never}
              >
                <AureakText variant="caption" style={{ color: page >= totalPages - 1 ? colors.text.muted : colors.text.dark }}>→</AureakText>
              </Pressable>
            </View>
          </View>
        ) : null}

      </ScrollView>

      {/* Story 101.3 — FAB mobile (rend null ≥640) */}
      <PrimaryAction
        label="Nouveau coach"
        onPress={openNewCoach}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl, gap: space.md },

  // ── StatCards ──
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
    minWidth       : 160,
    alignItems     : 'center',
    gap            : 4,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  statCardPicto: { fontSize: 22, marginBottom: 2 },
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
  },

  // ── FiltresRow ──
  filtresRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
  },
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
  pillTextActive  : { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.dark },
  pillTextInactive: { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.muted },

  // ── SegmentedToggle ──
  toggleRow: {
    flexDirection: 'row',
    gap          : 0,
    alignSelf    : 'flex-start',
    borderRadius : radius.xs,
    overflow     : 'hidden',
    borderWidth  : 1,
    borderColor  : colors.border.light,
  },
  toggleBtn       : { paddingVertical: 8, paddingHorizontal: space.lg, backgroundColor: colors.light.surface },
  toggleBtnActive : { backgroundColor: colors.accent.gold },
  toggleLabel     : { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted },
  toggleLabelActive: { color: colors.text.dark },

  // ── Pagination (externe, conservée hors DataCard) ──
  paginationInfo    : { color: colors.text.muted, fontSize: 12 },
  paginationBtns    : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  paginationBtn     : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  paginationBtnDisabled: { opacity: 0.4 },
  paginationPage    : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },

  emptyState: { alignItems: 'center', paddingVertical: space.xl },
  emptyText : { color: colors.text.muted },

  // Story 101.1 — pagination standalone (externe au DataCard)
  paginationStandalone: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
})

// Story 101.1 — styles consommés par les renders de colonnes DataCard
const cs = StyleSheet.create({
  gradeBadge    : { borderWidth: 1, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  gradeBadgeText: { fontSize: 11, fontWeight: '700' },
})
