'use client'
// Story 75.2 — Page Coachs redesignée dans le hub Académie
import { useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { listCoaches, getCoachCurrentGrade } from '@aureak/api-client'
import type { CoachListRow, CoachGrade, CoachGradeLevel } from '@aureak/api-client'
import { AureakText, UserCheckIcon } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'

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

// ── FilterChip ───────────────────────────────────────────────────────────────────
function FilterChip({ label, active, onPress }: {
  label  : string
  active : boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[chip.base, active && chip.active] as never}>
      <AureakText
        variant="label"
        style={[chip.label, active ? chip.labelActive : chip.labelInactive] as never}
      >
        {label}
      </AureakText>
    </Pressable>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────────
function StatCard({ label, value, variant }: {
  label  : string
  value  : string
  variant: 'default' | 'gold'
}) {
  const isGold = variant === 'gold'
  return (
    <View style={[stat.card, isGold && stat.cardGold] as never}>
      <AureakText variant="label" style={[stat.label, isGold && stat.labelGold] as never}>
        {label}
      </AureakText>
      <AureakText variant="h2" style={[stat.value, isGold && stat.valueGold] as never}>
        {value}
      </AureakText>
    </View>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────────
export default function AcademieCoachsPage() {
  const router = useRouter()

  const [coaches,  setCoaches]  = useState<CoachWithGrade[]>([])
  const [loading,  setLoading]  = useState(true)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [page, setPage] = useState(0)

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

        {/* Header */}
        <View style={s.header}>
          <AureakText variant="h2" style={s.title}>Coachs</AureakText>
          <Pressable
            onPress={() => router.push('/coaches/new' as never)}
            style={({ pressed }) => [s.btnNew, pressed && s.btnNewPressed] as never}
          >
            <AureakText variant="label" style={s.btnNewLabel}>+ Nouveau coach</AureakText>
          </Pressable>
        </View>

        {/* Stat cards */}
        <View style={s.cards}>
          <StatCard label="COACHS"         value={loading ? '—' : String(coaches.length)} variant="default" />
          <StatCard label="FORMATION"      value="—"                                       variant="default" />
          <StatCard label="DIPLÔMÉ"        value="—"                                       variant="default" />
          <StatCard label="SCORE ACADÉMIE" value={loading ? '—' : String(academyScore)}   variant="gold" />
        </View>

        {/* Filtres chips */}
        <View style={s.filtersRow}>
          <FilterChip label="COACH"     active={roleFilter === 'coach'}     onPress={() => handleRoleFilter('coach')} />
          <FilterChip label="ASSISTANT" active={roleFilter === 'assistant'} onPress={() => handleRoleFilter('assistant')} />
        </View>

        {/* Tableau */}
        {loading ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Chargement…</AureakText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Aucun entraîneur</AureakText>
          </View>
        ) : (
          <>
            {/* En-têtes */}
            <View style={s.rowHeader}>
              <View style={s.cellStatut} />
              <AureakText variant="label" style={[s.cellNom,      s.colHeader] as never}>NOM</AureakText>
              <AureakText variant="label" style={[s.cellPrenom,   s.colHeader] as never}>PRÉNOM</AureakText>
              <AureakText variant="label" style={[s.cellImplant,  s.colHeader] as never}>IMPLANTATION</AureakText>
              <AureakText variant="label" style={[s.cellGrade,    s.colHeader] as never}>GRADE</AureakText>
              <AureakText variant="label" style={[s.cellDiplome,  s.colHeader] as never}>DIPLÔMÉ</AureakText>
              <AureakText variant="label" style={[s.cellFormation,s.colHeader] as never}>FORMATION</AureakText>
            </View>

            {/* Lignes */}
            {paginated.map((coach, idx) => (
              <Pressable
                key={coach.userId}
                onPress={() => router.push(`/coaches/${coach.userId}` as never)}
                style={({ pressed }) => [
                  s.row,
                  idx % 2 === 0 ? s.rowEven : s.rowOdd,
                  pressed && s.rowPressed,
                ] as never}
              >
                <View style={[s.cellStatut, s.cellCenter]}>
                  <UserCheckIcon color={colors.text.muted} size={18} strokeWidth={1.5} />
                </View>
                <AureakText variant="body" style={[s.cellNom,       s.cellText]   as never} numberOfLines={1}>{coach.nom}</AureakText>
                <AureakText variant="body" style={[s.cellPrenom,    s.cellText]   as never} numberOfLines={1}>{coach.prenom}</AureakText>
                <AureakText variant="body" style={[s.cellImplant,   s.cellMuted]  as never} numberOfLines={1}>—</AureakText>
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
                <AureakText variant="body" style={[s.cellDiplome,  s.cellMuted]  as never}>—</AureakText>
                <AureakText variant="body" style={[s.cellFormation,s.cellMuted]  as never} numberOfLines={1}>—</AureakText>
              </Pressable>
            ))}

            {/* Pagination */}
            <View style={s.pagination}>
              <AureakText variant="caption" style={s.paginationInfo}>
                {filtered.length > 0
                  ? `Affichage de ${displayStart}–${displayEnd} / ${filtered.length} entraîneurs`
                  : 'Aucun entraîneur'}
              </AureakText>
              <View style={s.paginationBtns}>
                <Pressable onPress={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={[s.paginationBtn, page === 0 && s.paginationBtnDisabled] as never}>
                  <AureakText variant="caption" style={{ color: page === 0 ? colors.text.muted : colors.text.dark }}>←</AureakText>
                </Pressable>
                <AureakText variant="caption" style={s.paginationPage}>{page + 1} / {totalPages}</AureakText>
                <Pressable onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  style={[s.paginationBtn, page >= totalPages - 1 && s.paginationBtnDisabled] as never}>
                  <AureakText variant="caption" style={{ color: page >= totalPages - 1 ? colors.text.muted : colors.text.dark }}>→</AureakText>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg },
  title : { color: colors.text.dark },

  btnNew       : { backgroundColor: colors.text.dark, paddingVertical: space.xs, paddingHorizontal: space.md, borderRadius: radius.button },
  btnNewPressed: { opacity: 0.8 },
  btnNewLabel  : { color: colors.light.surface, letterSpacing: 0.5 },

  cards      : { flexDirection: 'row', gap: space.md, marginBottom: space.lg, flexWrap: 'wrap' },
  filtersRow : { flexDirection: 'row', gap: space.xs, marginBottom: space.md, flexWrap: 'wrap' },

  // Table rows
  row       : { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: space.sm },
  rowHeader : { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border.light, marginBottom: 2 },
  rowEven   : { backgroundColor: colors.light.surface },
  rowOdd    : { backgroundColor: colors.light.hover },
  rowPressed: { opacity: 0.75 },

  // Columns
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
  colHeader : { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  gradeBadge    : { borderWidth: 1, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  gradeBadgeText: { fontSize: 11, fontWeight: '700' },

  pagination        : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.md, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.border.light },
  paginationInfo    : { color: colors.text.muted, fontSize: 12 },
  paginationBtns    : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  paginationBtn     : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  paginationBtnDisabled: { opacity: 0.4 },
  paginationPage    : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },

  emptyState: { alignItems: 'center', paddingVertical: space.xl },
  emptyText : { color: colors.text.muted },
})

const chip = StyleSheet.create({
  base        : { paddingVertical: 6, paddingHorizontal: space.sm, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.hover },
  active      : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  label       : { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  labelActive : { color: colors.text.dark },
  labelInactive: { color: colors.text.muted },
})

const stat = StyleSheet.create({
  card     : { flex: 1, minWidth: 120, backgroundColor: colors.light.surface, borderRadius: radius.card, padding: space.md, boxShadow: shadows.sm } as never,
  cardGold : { backgroundColor: colors.accent.gold },
  label    : { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  labelGold: { color: colors.text.dark },
  value    : { color: colors.text.dark, fontSize: 28, fontWeight: '700' },
  valueGold: { color: colors.text.dark },
})
