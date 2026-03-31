'use client'
// Story 9.4 + 11.1 — Liste des coachs avec grade courant
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listCoaches, getCoachCurrentGrade } from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { CoachGrade, CoachGradeLevel } from '@aureak/api-client'

const PAGE_SIZE = 25

type CoachProfile = {
  userId     : string
  displayName: string | null
  grade      : CoachGrade | null
}

const GRADE_VARIANTS: Record<CoachGradeLevel, 'gold' | 'zinc' | 'present' | 'attention'> = {
  bronze  : 'attention',
  silver  : 'zinc',
  gold    : 'gold',
  platinum: 'present',
}
const GRADE_LABELS: Record<CoachGradeLevel, string> = {
  bronze  : '🥉 Bronze',
  silver  : '🥈 Argent',
  gold    : '🥇 Or',
  platinum: '💎 Platine',
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({
  page, total, onPrev, onNext,
}: { page: number; total: number; onPrev: () => void; onNext: () => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const start = page * PAGE_SIZE + 1
  const end   = Math.min((page + 1) * PAGE_SIZE, total)
  return (
    <View style={pag.row}>
      <AureakText variant="caption" style={{ color: colors.text.muted }}>
        {total > 0 ? `${start}–${end} sur ${total}` : '0 résultat'}
      </AureakText>
      <View style={pag.btnRow}>
        <Pressable style={[pag.btn, page === 0 && pag.btnDisabled]} onPress={onPrev} disabled={page === 0}>
          <AureakText variant="caption" style={{ color: page === 0 ? colors.text.muted : colors.text.dark }}>←</AureakText>
        </Pressable>
        <AureakText variant="caption" style={{ color: colors.text.muted, paddingHorizontal: space.sm }}>
          {page + 1} / {totalPages}
        </AureakText>
        <Pressable style={[pag.btn, end >= total && pag.btnDisabled]} onPress={onNext} disabled={end >= total}>
          <AureakText variant="caption" style={{ color: end >= total ? colors.text.muted : colors.text.dark }}>→</AureakText>
        </Pressable>
      </View>
    </View>
  )
}
const pag = StyleSheet.create({
  row       : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.sm },
  btnRow    : { flexDirection: 'row', alignItems: 'center' },
  btn       : { width: 30, height: 30, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.surface },
  btnDisabled: { opacity: 0.35 },
})

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CoachesPage() {
  const router  = useRouter()
  const [coaches, setCoaches] = useState<CoachProfile[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: coachRows, count, error } = await listCoaches({ page, pageSize: PAGE_SIZE })

      if (error || !coachRows.length && count === 0) { setLoading(false); return }

      setTotal(count)

      const withGrades = await Promise.all(
        coachRows.map(async p => {
          const { data: grade } = await getCoachCurrentGrade(p.userId)
          return { userId: p.userId, displayName: p.displayName, grade }
        })
      )

      setCoaches(withGrades)
      setLoading(false)
    }
    load()
  }, [page])

  // Grade distribution summary
  const gradeCounts = coaches.reduce<Record<string, number>>((acc, c) => {
    const key = c.grade?.grade_level ?? 'none'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Coachs</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {total} coach{total !== 1 ? 's' : ''}
              {gradeCounts['platinum'] ? ` · ${gradeCounts['platinum']} 💎` : ''}
              {gradeCounts['gold']     ? ` · ${gradeCounts['gold']} 🥇`     : ''}
            </AureakText>
          )}
        </View>
        <Pressable
          style={styles.inviteBtn}
          onPress={() => router.push('/(admin)/users/new' as never)}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            + Inviter un coach
          </AureakText>
        </Pressable>
      </View>

      {/* ── Table ── */}
      {loading ? (
        <View style={styles.loadingRows}>
          {[0,1,2,3].map(i => <View key={i} style={styles.skeletonRow} />)}
        </View>
      ) : coaches.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucun coach</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
            Invitez le premier coach de l'académie.
          </AureakText>
        </View>
      ) : (
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <AureakText variant="caption" style={[styles.thLabel, { flex: 2 }]}>Nom</AureakText>
            <AureakText variant="caption" style={[styles.thLabel, { flex: 1 }]}>Grade</AureakText>
            <AureakText variant="caption" style={[styles.thLabel, { width: 170, textAlign: 'right' }]}>Actions</AureakText>
          </View>

          {coaches.map((coach, idx) => (
            <View key={coach.userId} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <View style={{ flex: 2 }}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>
                  {coach.displayName ?? coach.userId.slice(0, 8)}
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
                  {coach.userId.slice(0, 8)}…
                </AureakText>
              </View>

              <View style={{ flex: 1 }}>
                {coach.grade ? (
                  <Badge
                    label={GRADE_LABELS[coach.grade.grade_level]}
                    variant={GRADE_VARIANTS[coach.grade.grade_level]}
                  />
                ) : (
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>—</AureakText>
                )}
              </View>

              <View style={{ width: 170, flexDirection: 'row', justifyContent: 'flex-end', gap: space.xs }}>
                <Pressable
                  style={styles.actionBtnGold}
                  onPress={() => router.push(`/(admin)/coaches/${coach.userId}/grade` as never)}
                >
                  <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700', fontSize: 11 }}>
                    Grade
                  </AureakText>
                </Pressable>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => router.push(`/(admin)/coaches/${coach.userId}/contact` as never)}
                >
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '600', fontSize: 11 }}>
                    Contact
                  </AureakText>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Pagination ── */}
      {!loading && total > PAGE_SIZE && (
        <Pagination
          page={page}
          total={total}
          onPrev={() => setPage(p => Math.max(0, p - 1))}
          onNext={() => setPage(p => p + 1)}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: colors.light.primary },
  content         : { padding: space.xl, gap: space.md },
  pageHeader      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  inviteBtn       : {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
  },
  table           : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    ...shadows.sm,
  },
  tableHeader     : {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor  : colors.light.muted,
  },
  thLabel         : {
    color          : colors.text.muted,
    fontWeight     : '700',
    letterSpacing  : 0.8,
    textTransform  : 'uppercase',
    fontSize       : 10,
  },
  tableRow        : {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
  },
  tableRowAlt     : { backgroundColor: colors.light.muted },
  actionBtn       : {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 5,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : 'transparent',
  },
  actionBtnGold   : {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 5,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
    backgroundColor  : colors.accent.gold,
  },
  loadingRows     : { gap: space.xs },
  skeletonRow     : {
    height         : 52,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    opacity        : 0.5,
  },
  emptyState      : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
    ...shadows.sm,
  },
})
