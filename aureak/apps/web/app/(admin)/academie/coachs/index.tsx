'use client'
// Story 75.2 — Page Coachs redesignée dans le hub Académie
// Story 82.1 — Appliquer LayoutActivités (headerBlock + StatCards + FiltresRow + CoachsTable)
import { useContext, useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { listCoaches, getCoachCurrentGrade } from '@aureak/api-client'
import type { CoachListRow, CoachGrade, CoachGradeLevel } from '@aureak/api-client'
import { AureakText, UserCheckIcon } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { SubtabCount } from '../../../../components/admin/SubtabCount'
import { AcademieCountsContext } from '../_layout'

// ── Types locaux ─────────────────────────────────────────────────────────────────
type CoachWithGrade = CoachListRow & {
  grade : CoachGrade | null
  nom   : string
  prenom: string
}

type RoleFilter = 'all' | 'coach' | 'assistant'

// ── Navigation Académie ───────────────────────────────────────────────────────────
// Story 93.2 — ajout des `key` pour indexer les counts via AcademieCountsContext
const ACADEMIE_TABS = [
  { key: 'joueurs',       label: 'JOUEURS',       href: '/academie/joueurs'       },
  { key: 'coachs',        label: 'COACHS',        href: '/academie/coachs'        },
  { key: 'scouts',        label: 'SCOUTS',        href: '/academie/scouts'        },
  { key: 'managers',      label: 'MANAGERS',      href: '/academie/managers'      },
  { key: 'commerciaux',   label: 'COMMERCIAUX',   href: '/academie/commerciaux'   },
  { key: 'marketeurs',    label: 'MARKETEURS',    href: '/academie/marketeurs'    },
  { key: 'clubs',         label: 'CLUBS',         href: '/academie/clubs'         },
  { key: 'implantations', label: 'IMPLANTATIONS', href: '/academie/implantations' },
] as const

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
  const pathname       = usePathname()
  const academieCounts = useContext(AcademieCountsContext)

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

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* ── headerBlock ── */}
        <View style={s.headerBlock}>
          <View style={s.headerTopRow}>
            <AureakText style={s.pageTitle as TextStyle}>ACADÉMIE</AureakText>
            <Pressable
              onPress={() => router.push('/coaches/new' as never)}
              style={({ pressed }) => [s.newBtn, pressed && s.newBtnPressed] as never}
            >
              <AureakText style={s.newBtnLabel as TextStyle}>+ Nouveau coach</AureakText>
            </Pressable>
          </View>
          <View style={s.tabsRow}>
            {ACADEMIE_TABS.map(tab => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
              const count    = academieCounts?.[tab.key] ?? null
              return (
                <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
                  <View style={s.tabLabelRow}>
                    <AureakText style={[s.tabLabel, isActive && s.tabLabelActive] as never}>
                      {tab.label}
                    </AureakText>
                    <SubtabCount value={count} active={isActive} />
                  </View>
                  {isActive && <View style={s.tabUnderline} />}
                </Pressable>
              )
            })}
          </View>
        </View>

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

        {/* ── CoachsTable ── */}
        {loading ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Chargement…</AureakText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Aucun entraîneur</AureakText>
          </View>
        ) : (
          <View style={s.tableWrapper}>
            {/* En-têtes */}
            <View style={s.tableHeader}>
              <View style={s.cellStatut} />
              <AureakText style={[s.thText, s.cellNom]      as never}>NOM</AureakText>
              <AureakText style={[s.thText, s.cellPrenom]   as never}>PRÉNOM</AureakText>
              <AureakText style={[s.thText, s.cellImplant]  as never}>IMPLANTATION</AureakText>
              <AureakText style={[s.thText, s.cellGrade]    as never}>GRADE</AureakText>
              <AureakText style={[s.thText, s.cellDiplome]  as never}>DIPLÔMÉ</AureakText>
              <AureakText style={[s.thText, s.cellFormation]as never}>FORMATION</AureakText>
            </View>

            {/* Lignes */}
            {paginated.map((coach, idx) => {
              const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              return (
                <Pressable
                  key={coach.userId}
                  onPress={() => router.push(`/coaches/${coach.userId}` as never)}
                  style={({ pressed }) => [
                    s.tableRow,
                    { backgroundColor: rowBg },
                    pressed && s.rowPressed,
                  ] as never}
                >
                  <View style={[s.cellStatut, s.cellCenter]}>
                    <UserCheckIcon color={colors.text.muted} size={18} strokeWidth={1.5} />
                  </View>
                  <AureakText variant="body" style={[s.cellNom,      s.cellText]  as never} numberOfLines={1}>{coach.nom}</AureakText>
                  <AureakText variant="body" style={[s.cellPrenom,   s.cellText]  as never} numberOfLines={1}>{coach.prenom}</AureakText>
                  <AureakText variant="body" style={[s.cellImplant,  s.cellMuted] as never} numberOfLines={1}>—</AureakText>
                  <View style={s.cellGrade}>
                    {coach.grade ? (
                      <View style={[s.gradeBadge, { borderColor: GRADE_COLORS[coach.grade.grade_level] }]}>
                        <AureakText variant="label" style={[s.gradeBadgeText, { color: GRADE_COLORS[coach.grade.grade_level] }] as never}>
                          {GRADE_LABELS[coach.grade.grade_level]}
                        </AureakText>
                      </View>
                    ) : (
                      <AureakText variant="body" style={s.cellMuted}>—</AureakText>
                    )}
                  </View>
                  <AureakText variant="body" style={[s.cellDiplome,  s.cellMuted] as never}>—</AureakText>
                  <AureakText variant="body" style={[s.cellFormation,s.cellMuted] as never} numberOfLines={1}>—</AureakText>
                </Pressable>
              )
            })}

            {/* Pagination */}
            <View style={s.pagination}>
              <AureakText variant="caption" style={s.paginationInfo}>
                {filtered.length > 0
                  ? `Affichage de ${displayStart}–${displayEnd} / ${filtered.length} entraîneurs`
                  : 'Aucun entraîneur'}
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
          </View>
        )}

      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl, gap: space.md },

  // ── headerBlock ──
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnPressed: { opacity: 0.8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },
  // Nav tabs (pattern exact séances)
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.xs,
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

  // ── CoachsTable ──
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
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  rowPressed: { opacity: 0.75 },

  // ── Columns ──
  cellStatut  : { width: 40 },
  cellNom     : { flex: 1.2, minWidth: 80 },
  cellPrenom  : { flex: 1.2, minWidth: 80 },
  cellImplant : { flex: 1.5, minWidth: 100 },
  cellGrade   : { width: 90 },
  cellDiplome : { width: 80 },
  cellFormation: { flex: 1.5, minWidth: 100 },

  cellCenter: { alignItems: 'center', justifyContent: 'center' },
  cellText  : { color: colors.text.dark, fontSize: 13 },
  cellMuted : { color: colors.text.muted, fontSize: 13 },

  gradeBadge    : { borderWidth: 1, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  gradeBadgeText: { fontSize: 11, fontWeight: '700' },

  // ── Pagination ──
  pagination: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  },
  paginationInfo    : { color: colors.text.muted, fontSize: 12 },
  paginationBtns    : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  paginationBtn     : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  paginationBtnDisabled: { opacity: 0.4 },
  paginationPage    : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },

  emptyState: { alignItems: 'center', paddingVertical: space.xl },
  emptyText : { color: colors.text.muted },
})
