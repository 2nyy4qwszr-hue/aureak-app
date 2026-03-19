import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listClubDirectory } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { ClubDirectoryEntry, BelgianProvince, ClubRelationType } from '@aureak/types'
import { BELGIAN_PROVINCES } from '@aureak/types'
import { ClubCard, ClubCardSkeleton } from './_components'

const PAGE_SIZE = 50

// ── Pagination ──────────────────────────────────────────────────────────────

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
  btn       : { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.surface },
  btnDisabled: { opacity: 0.35 },
})

// ── Main page ───────────────────────────────────────────────────────────────

type FilterRelation = 'all' | ClubRelationType
type FilterActif    = 'all' | 'actif' | 'inactif'

const RELATION_TABS: { key: FilterRelation; label: string }[] = [
  { key: 'all',        label: 'Tous'         },
  { key: 'partenaire', label: 'Partenaires'  },
  { key: 'associe',    label: 'Associés'     },
  { key: 'normal',     label: 'Normaux'      },
]
const ACTIF_TABS: { key: FilterActif; label: string }[] = [
  { key: 'all',     label: 'Tous'    },
  { key: 'actif',   label: 'Actifs'  },
  { key: 'inactif', label: 'Inactifs'},
]

export default function ClubsPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const columns = width >= 1600 ? 5 : width >= 1280 ? 4 : width >= 900 ? 3 : width >= 600 ? 2 : 1

  const [clubs,            setClubs]            = useState<ClubDirectoryEntry[]>([])
  const [total,            setTotal]            = useState(0)
  const [page,             setPage]             = useState(0)
  const [loading,          setLoading]          = useState(true)

  const [search,          setSearch]          = useState('')
  const [searchInput,     setSearchInput]     = useState('')
  const [provinceFilter,  setProvinceFilter]  = useState<BelgianProvince | undefined>()
  const [relationFilter,  setRelationFilter]  = useState<FilterRelation>('all')
  const [actifFilter,     setActifFilter]     = useState<FilterActif>('actif')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, count } = await listClubDirectory({
      search      : search || undefined,
      province    : provinceFilter,
      relationTypes: relationFilter === 'all' ? undefined : [relationFilter as ClubRelationType],
      actif       : actifFilter === 'all' ? undefined : actifFilter === 'actif',
      page,
      pageSize    : PAGE_SIZE,
    })
    setClubs(data)
    setTotal(count)
    setLoading(false)
  }, [search, provinceFilter, relationFilter, actifFilter, page])

  useEffect(() => { load() }, [load])

  // Reset page on filter change
  useEffect(() => { setPage(0) }, [search, provinceFilter, relationFilter, actifFilter])

  const handleSearch = () => setSearch(searchInput.trim())

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Header ── */}
      <View style={styles.pageHeader}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Clubs</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {total} club{total !== 1 ? 's' : ''}
            </AureakText>
          )}
        </View>
        <Pressable style={styles.newBtn} onPress={() => router.push('/clubs/new' as never)}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            + Nouveau club
          </AureakText>
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          placeholder="Rechercher par nom, matricule, ville…"
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
        />
        <Pressable style={styles.searchBtn} onPress={handleSearch}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            Chercher
          </AureakText>
        </Pressable>
        {search !== '' && (
          <Pressable
            style={styles.clearBtn}
            onPress={() => { setSearch(''); setSearchInput('') }}
          >
            <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
          </Pressable>
        )}
      </View>

      {/* ── Filters ── */}
      <View style={styles.filterRow}>
        {/* Relation filter */}
        <View style={styles.filterGroup}>
          {RELATION_TABS.map(t => (
            <Pressable
              key={t.key}
              style={[styles.tab, relationFilter === t.key && styles.tabActive]}
              onPress={() => setRelationFilter(t.key)}
            >
              <AureakText
                variant="caption"
                style={{
                  color     : relationFilter === t.key ? colors.accent.gold : colors.text.muted,
                  fontWeight: relationFilter === t.key ? '700' : '400',
                }}
              >
                {t.label}
              </AureakText>
            </Pressable>
          ))}
        </View>

        {/* Actif filter */}
        <View style={styles.filterGroup}>
          {ACTIF_TABS.map(t => (
            <Pressable
              key={t.key}
              style={[styles.tab, actifFilter === t.key && styles.tabActive]}
              onPress={() => setActifFilter(t.key)}
            >
              <AureakText
                variant="caption"
                style={{
                  color     : actifFilter === t.key ? colors.accent.gold : colors.text.muted,
                  fontWeight: actifFilter === t.key ? '700' : '400',
                }}
              >
                {t.label}
              </AureakText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Province filter ── */}
      <View style={styles.provinceRow}>
        <Pressable
          style={[styles.provincePill, provinceFilter === undefined && styles.provincePillActive]}
          onPress={() => setProvinceFilter(undefined)}
        >
          <AureakText
            variant="caption"
            style={{ color: provinceFilter === undefined ? colors.accent.gold : colors.text.muted, fontSize: 11 }}
          >
            Toutes provinces
          </AureakText>
        </Pressable>
        {BELGIAN_PROVINCES.map(p => (
          <Pressable
            key={p}
            style={[styles.provincePill, provinceFilter === p && styles.provincePillActive]}
            onPress={() => setProvinceFilter(prev => prev === p ? undefined : p)}
          >
            <AureakText
              variant="caption"
              style={{ color: provinceFilter === p ? colors.accent.gold : colors.text.muted, fontSize: 11 }}
            >
              {p}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* ── Grille ── */}
      {loading ? (
        <View style={styles.grid}>
          {Array.from({ length: Math.max(columns * 2, 6) }).map((_, i) => (
            <View key={i} style={[styles.cell, { width: `${Math.floor(100 / columns)}%` as never }]}>
              <ClubCardSkeleton />
            </View>
          ))}
        </View>
      ) : clubs.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucun club</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
            Aucun club ne correspond aux critères sélectionnés.
          </AureakText>
        </View>
      ) : (
        <View style={styles.grid}>
          {clubs.map(club => (
            <View key={club.id} style={[styles.cell, { width: `${Math.floor(100 / columns)}%` as never }]}>
              <ClubCard
                club={club}
                onPress={() => router.push(`/clubs/${club.id}` as never)}
              />
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
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.md },
  pageHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  newBtn     : {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
  },

  // Search
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
    fontFamily       : 'System',
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
    width           : 32,
    height          : 32,
    alignItems      : 'center',
    justifyContent  : 'center',
    borderRadius    : 6,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    backgroundColor : colors.light.surface,
  },

  // Filters
  filterRow  : { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  filterGroup: {
    flexDirection    : 'row',
    gap              : space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingBottom    : space.sm,
  },
  tab        : { paddingHorizontal: space.sm + 2, paddingVertical: 5, borderRadius: 5 },
  tabActive  : { backgroundColor: colors.light.muted },

  // Province pills
  provinceRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
  },
  provincePill: {
    paddingHorizontal: 10,
    paddingVertical  : 4,
    borderRadius     : 20,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  provincePillActive: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.light.muted,
  },

  // States
  emptyState  : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },

  // Grid
  grid: {
    flexDirection   : 'row',
    flexWrap        : 'wrap',
    marginHorizontal: -space.xs,
  },
  cell: {
    paddingHorizontal: space.xs,
    paddingBottom    : space.sm,
  },
})
