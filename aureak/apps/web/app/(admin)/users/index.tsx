'use client'
// Admin — Liste des utilisateurs avec accès fiche compte
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listUsers } from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'

type RoleFilter = 'all' | 'admin' | 'coach' | 'parent' | 'child' | 'club'

const PAGE_SIZE = 30

// ── Labels / couleurs ──────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin : 'Admin',
  coach : 'Coach',
  parent: 'Parent',
  child : 'Joueur',
  club  : 'Club',
}
const ROLE_VARIANTS: Record<string, 'gold' | 'zinc' | 'present' | 'attention' | 'goldOutline'> = {
  admin : 'gold',
  coach : 'present',
  parent: 'goldOutline',
  child : 'attention',
  club  : 'zinc',
}

const STATUS_LABELS: Record<string, string> = {
  active   : 'Actif',
  suspended: 'Suspendu',
  pending  : 'En attente',
  deleted  : 'Supprimé',
}
const STATUS_VARIANTS: Record<string, 'present' | 'attention' | 'zinc' | 'danger'> = {
  active   : 'present',
  suspended: 'attention',
  pending  : 'zinc',
  deleted  : 'danger',
}

const ROLE_TABS: { key: RoleFilter; label: string }[] = [
  { key: 'all',    label: 'Tous'    },
  { key: 'admin',  label: 'Admin'   },
  { key: 'coach',  label: 'Coachs'  },
  { key: 'parent', label: 'Parents' },
  { key: 'child',  label: 'Joueurs' },
  { key: 'club',   label: 'Clubs'   },
]

// ── Pagination ─────────────────────────────────────────────────────────────────

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

// ── Main ───────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter()

  const [users,       setUsers]       = useState<UserRow[]>([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter,  setRoleFilter]  = useState<RoleFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, total: count, error } = await listUsers({
        search  : search || undefined,
        role    : roleFilter,
        page,
        pageSize: PAGE_SIZE,
      })
      if (!error) {
        setUsers(data)
        setTotal(count)
      }
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [roleFilter, search])

  const handleSearch = () => setSearch(searchInput.trim())

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Utilisateurs</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {total} compte{total !== 1 ? 's' : ''}
            </AureakText>
          )}
        </View>
        <Pressable style={s.newBtn} onPress={() => router.push('/users/new' as never)}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            + Nouvel utilisateur
          </AureakText>
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          placeholder="Rechercher par nom ou email…"
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
        />
        <Pressable style={s.searchBtn} onPress={handleSearch}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>Chercher</AureakText>
        </Pressable>
        {search !== '' && (
          <Pressable style={s.clearBtn} onPress={() => { setSearch(''); setSearchInput('') }}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
          </Pressable>
        )}
      </View>

      {/* ── Role tabs ── */}
      <View style={s.tabRow}>
        {ROLE_TABS.map(tab => {
          const active = roleFilter === tab.key
          return (
            <Pressable
              key={tab.key}
              style={[s.tab, { borderColor: active ? colors.accent.gold : colors.border.light, backgroundColor: active ? colors.accent.gold + '18' : 'transparent' }]}
              onPress={() => setRoleFilter(tab.key)}
            >
              <AureakText
                variant="caption"
                style={{ color: active ? colors.text.dark : colors.text.muted, fontWeight: active ? '700' : '400' }}
              >
                {tab.label}
              </AureakText>
            </Pressable>
          )
        })}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={s.skeletonBox}>
          {[0,1,2,3,4,5].map(i => <View key={i} style={s.skeletonRow} />)}
        </View>
      ) : users.length === 0 ? (
        <View style={s.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucun utilisateur</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
            {search.trim() ? 'Modifiez votre recherche.' : 'Aucun compte ne correspond aux filtres.'}
          </AureakText>
        </View>
      ) : (
        <View style={s.table}>
          {/* Table header */}
          <View style={s.thead}>
            <AureakText variant="caption" style={[s.th, { flex: 2 }] as never}>Nom</AureakText>
            <AureakText variant="caption" style={[s.th, { flex: 3 }] as never}>Email</AureakText>
            <AureakText variant="caption" style={[s.th, { width: 80 }] as never}>Rôle</AureakText>
            <AureakText variant="caption" style={[s.th, { width: 90 }] as never}>Statut</AureakText>
            <AureakText variant="caption" style={[s.th, { width: 110, textAlign: 'right' as never }] as never}>Actions</AureakText>
          </View>

          {users.map((u, idx) => (
            <View key={u.userId} style={[s.tr, idx % 2 === 1 && s.trAlt]}>
              <AureakText variant="body" style={[s.td, { flex: 2, fontWeight: '600' }] as never} numberOfLines={1}>
                {u.displayName}
              </AureakText>
              <AureakText variant="caption" style={[s.td, { flex: 3, color: colors.text.muted }] as never} numberOfLines={1}>
                {u.email ?? '—'}
              </AureakText>
              <View style={[s.td, { width: 80 }]}>
                <Badge
                  label={ROLE_LABELS[u.userRole] ?? u.userRole}
                  variant={ROLE_VARIANTS[u.userRole] ?? 'zinc'}
                />
              </View>
              <View style={[s.td, { width: 90 }]}>
                <Badge
                  label={STATUS_LABELS[u.status] ?? u.status}
                  variant={STATUS_VARIANTS[u.status] ?? 'zinc'}
                />
              </View>
              <View style={[s.td, { width: 110, alignItems: 'flex-end' }]}>
                <Pressable
                  style={s.ficheBtn}
                  onPress={() => router.push(`/users/${u.userId}` as never)}
                >
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
                    Fiche compte
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

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.xl, gap: space.md },

  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  newBtn    : {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
  },

  searchRow  : { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  searchInput: {
    flex             : 1,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  searchBtn  : {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
  },
  clearBtn   : {
    width : 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.xs, borderWidth: 1,
    borderColor: colors.border.light, backgroundColor: colors.light.surface,
  },

  tabRow     : {
    flexDirection  : 'row',
    gap            : space.xs,
    flexWrap       : 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingBottom  : space.sm,
  },
  tab        : {
    paddingHorizontal: space.sm + 2,
    paddingVertical  : 5,
    borderRadius     : 20,
    borderWidth      : 1,
  },

  table      : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    boxShadow: shadows.sm,
  },
  thead      : {
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor: colors.light.muted,
  },
  th         : {
    color        : colors.text.muted,
    fontWeight   : '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontSize     : 10,
  },
  tr         : {
    flexDirection  : 'row',
    alignItems     : 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  trAlt      : { backgroundColor: colors.light.muted },
  td         : { paddingRight: space.sm },
  ficheBtn   : {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 5,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },

  skeletonBox: { gap: space.xs },
  skeletonRow: {
    height         : 52,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    opacity        : 0.5,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  emptyState : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow: shadows.sm,
  },
})
