'use client'
// Story 10.1 — Gestion des enfants (admin)
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase, suspendUser, reactivateUser } from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const PAGE_SIZE = 25

type ChildProfile = {
  userId     : string
  displayName: string | null
  status     : 'active' | 'suspended' | 'deletion_requested'
  createdAt  : string
}

const STATUS_VARIANT = (s: ChildProfile['status']): 'present' | 'attention' | 'zinc' => {
  if (s === 'active')    return 'present'
  if (s === 'suspended') return 'attention'
  return 'zinc'
}
const STATUS_LABEL = (s: ChildProfile['status']): string => {
  if (s === 'active')    return 'Actif'
  if (s === 'suspended') return 'Suspendu'
  return 'Suppression demandée'
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
      <AureakText variant="caption" style={{ color: colors.text.secondary }}>
        {total > 0 ? `${start}–${end} sur ${total}` : '0 résultat'}
      </AureakText>
      <View style={pag.btnRow}>
        <Pressable style={[pag.btn, page === 0 && pag.btnDisabled]} onPress={onPrev} disabled={page === 0}>
          <AureakText variant="caption" style={{ color: page === 0 ? colors.text.secondary : colors.text.primary }}>←</AureakText>
        </Pressable>
        <AureakText variant="caption" style={{ color: colors.text.secondary, paddingHorizontal: space.sm }}>
          {page + 1} / {totalPages}
        </AureakText>
        <Pressable style={[pag.btn, end >= total && pag.btnDisabled]} onPress={onNext} disabled={end >= total}>
          <AureakText variant="caption" style={{ color: end >= total ? colors.text.secondary : colors.text.primary }}>→</AureakText>
        </Pressable>
      </View>
    </View>
  )
}
const pag = StyleSheet.create({
  row       : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.sm },
  btnRow    : { flexDirection: 'row', alignItems: 'center' },
  btn       : { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: colors.accent.zinc, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.surface },
  btnDisabled: { opacity: 0.35 },
})

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ChildrenPage() {
  const router   = useRouter()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(0)
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [working,  setWorking]  = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('user_id, display_name, lifecycle_status, created_at', { count: 'exact' })
      .eq('user_role', 'child')
      .is('deleted_at', null)
      .order('display_name', { ascending: true })

    if (search.trim()) {
      query = query.ilike('display_name', `%${search.trim()}%`)
    }

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    const { data, count } = await query

    const list: ChildProfile[] = ((data ?? []) as {
      user_id: string; display_name: string | null; lifecycle_status: string; created_at: string
    }[]).map(p => ({
      userId     : p.user_id,
      displayName: p.display_name,
      status     : (p.lifecycle_status ?? 'active') as ChildProfile['status'],
      createdAt  : p.created_at,
    }))

    setChildren(list)
    setTotal(count ?? 0)
    setLoading(false)
  }

  // Reset to page 0 when search changes
  useEffect(() => { setPage(0) }, [search])
  useEffect(() => { load() }, [page, search])

  const handleSuspend = async (userId: string) => {
    setWorking(userId); await suspendUser(userId); setWorking(null); await load()
  }
  const handleReactivate = async (userId: string) => {
    setWorking(userId); await reactivateUser(userId); setWorking(null); await load()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <View>
          <AureakText variant="h2">Enfants</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
              {total} inscrit{total !== 1 ? 's' : ''}
              {search.trim() ? ` · recherche « ${search.trim()} »` : ''}
            </AureakText>
          )}
        </View>
        <Pressable
          style={styles.inviteBtn}
          onPress={() => router.push('/(admin)/users/new' as never)}
        >
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            + Inviter
          </AureakText>
        </Pressable>
      </View>

      {/* ── Search ── */}
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher par nom…"
        placeholderTextColor={colors.text.secondary}
        value={search}
        onChangeText={setSearch}
      />

      {/* ── Table ── */}
      {loading ? (
        <View style={styles.loadingRows}>
          {[0,1,2,3,4].map(i => <View key={i} style={styles.skeletonRow} />)}
        </View>
      ) : children.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.secondary }}>
            {search.trim() ? 'Aucun résultat' : 'Aucun enfant inscrit'}
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 4 }}>
            {search.trim() ? 'Modifiez votre recherche.' : 'Invitez le premier enfant.'}
          </AureakText>
        </View>
      ) : (
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <AureakText variant="caption" style={[styles.thLabel, { flex: 2 }]}>Nom</AureakText>
            <AureakText variant="caption" style={[styles.thLabel, { flex: 1 }]}>Statut</AureakText>
            <AureakText variant="caption" style={[styles.thLabel, { flex: 1 }]}>Inscrit le</AureakText>
            <AureakText variant="caption" style={[styles.thLabel, { width: 130, textAlign: 'right' }]}>Actions</AureakText>
          </View>

          {children.map((child, idx) => (
            <View key={child.userId} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <View style={{ flex: 2 }}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>
                  {child.displayName ?? '—'}
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 10 }}>
                  {child.userId.slice(0, 8)}…
                </AureakText>
              </View>

              <View style={{ flex: 1 }}>
                <Badge label={STATUS_LABEL(child.status)} variant={STATUS_VARIANT(child.status)} />
              </View>

              <AureakText variant="caption" style={{ flex: 1, color: colors.text.secondary }}>
                {new Date(child.createdAt).toLocaleDateString('fr-FR')}
              </AureakText>

              <View style={{ width: 130, flexDirection: 'row', justifyContent: 'flex-end', gap: space.xs }}>
                {child.status === 'active' ? (
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnWarning]}
                    onPress={() => handleSuspend(child.userId)}
                    disabled={working === child.userId}
                  >
                    <AureakText variant="caption" style={{ color: colors.status.attention, fontWeight: '600', fontSize: 11 }}>
                      {working === child.userId ? '...' : 'Suspendre'}
                    </AureakText>
                  </Pressable>
                ) : child.status === 'suspended' ? (
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnSuccess]}
                    onPress={() => handleReactivate(child.userId)}
                    disabled={working === child.userId}
                  >
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600', fontSize: 11 }}>
                      {working === child.userId ? '...' : 'Réactiver'}
                    </AureakText>
                  </Pressable>
                ) : null}
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
  container       : { flex: 1, backgroundColor: colors.background.primary },
  content         : { padding: space.xl, gap: space.md },
  pageHeader      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  inviteBtn       : {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
  },
  searchInput     : {
    backgroundColor: colors.background.surface,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    borderRadius   : 8,
    color          : colors.text.primary,
    padding        : space.sm,
    fontSize       : 14,
  },
  table           : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    overflow       : 'hidden',
  },
  tableHeader     : {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc,
    backgroundColor  : colors.background.elevated,
  },
  thLabel         : {
    color          : colors.text.secondary,
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
    borderBottomColor: colors.accent.zinc,
    gap              : space.sm,
  },
  tableRowAlt     : { backgroundColor: colors.background.elevated },
  actionBtn       : {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 5,
    borderWidth      : 1,
  },
  actionBtnSuccess: { backgroundColor: colors.status.present, borderColor: colors.status.present },
  actionBtnWarning: { backgroundColor: 'transparent', borderColor: colors.status.attention },
  loadingRows     : { gap: space.xs },
  skeletonRow     : {
    height         : 52,
    backgroundColor: colors.background.surface,
    borderRadius   : 6,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    opacity        : 0.5,
  },
  emptyState      : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
  },
})
