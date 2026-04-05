import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { listClubDirectory, updateClubDirectoryEntry } from '@aureak/api-client'
import { AureakText, EmptyStateIllustrated } from '@aureak/ui'
import { colors, space, shadows } from '@aureak/theme'
import type { ClubDirectoryEntry, BelgianProvince, ClubRelationType } from '@aureak/types'
import { BELGIAN_PROVINCES } from '@aureak/types'
import { ClubCard, ClubCardSkeleton } from './_components'
import { usePersistedFilters } from '../../../hooks/usePersistedFilters'
import { useAuthStore } from '@aureak/business-logic'

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
  const params = useLocalSearchParams<{ search?: string; province?: string; relation?: string; actif?: string }>()
  const { width } = useWindowDimensions()
  const columns = width >= 1600 ? 5 : width >= 1280 ? 4 : width >= 900 ? 3 : width >= 600 ? 2 : 1

  const tenantId  = useAuthStore((s) => s.tenantId)
  const user      = useAuthStore((s) => s.user)

  const [clubs,            setClubs]            = useState<ClubDirectoryEntry[]>([])
  const [total,            setTotal]            = useState(0)
  const [page,             setPage]             = useState(0)
  const [loading,          setLoading]          = useState(true)

  // ── Bulk selection ──────────────────────────────────────────────────────────
  const [selected,       setSelected]       = useState<Set<string>>(new Set())
  const [bulkDisabling,  setBulkDisabling]  = useState(false)

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const [search,          setSearch]          = useState(params.search ?? '')
  const [provinceFilter,  setProvinceFilter]  = usePersistedFilters<BelgianProvince | undefined>(
    'clubs-filter-province',
    (params.province as BelgianProvince | undefined) ?? undefined,
  )
  const [relationFilter,  setRelationFilter]  = usePersistedFilters<FilterRelation>(
    'clubs-filter-relation',
    (params.relation as FilterRelation | undefined) ?? 'all',
  )
  const [actifFilter,     setActifFilter]     = usePersistedFilters<FilterActif>(
    'clubs-filter-actif',
    (params.actif as FilterActif | undefined) ?? 'actif',
  )

  // Sync filters to URL so the browser Back button restores state
  useEffect(() => {
    router.setParams({
      search  : search || undefined,
      province: provinceFilter ?? undefined,
      relation: relationFilter !== 'all' ? relationFilter : undefined,
      actif   : actifFilter !== 'actif' ? actifFilter : undefined,
    } as never)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, provinceFilter, relationFilter, actifFilter])

  const [sortKey, setSortKey] = useState<'nom' | 'ville' | 'province'>('nom')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: 'nom' | 'ville' | 'province') => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortedClubs = useMemo(() => {
    return [...clubs].sort((a, b) => {
      const va = (a[sortKey] ?? '').toLowerCase()
      const vb = (b[sortKey] ?? '').toLowerCase()
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [clubs, sortKey, sortDir])

  const load = useCallback(async () => {
    setLoading(true)
    try {
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
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/list] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [search, provinceFilter, relationFilter, actifFilter, page])

  useEffect(() => { load() }, [load])

  // Reset page on filter change
  useEffect(() => { setPage(0) }, [search, provinceFilter, relationFilter, actifFilter])

  // ── Bulk handlers ───────────────────────────────────────────────────────────
  const handleBulkExport = () => {
    Alert.alert('Export en cours', `Export en cours pour ${selected.size} club${selected.size > 1 ? 's' : ''}`)
  }

  const handleBulkDisable = async () => {
    if (!tenantId || !user?.id) return
    setBulkDisabling(true)
    try {
      const ids = Array.from(selected)
      for (const clubId of ids) {
        const club = clubs.find(c => c.id === clubId)
        if (!club) continue
        await updateClubDirectoryEntry({
          clubId,
          tenantId,
          updatedBy: user.id,
          nom      : club.nom,
          actif    : false,
        })
      }
      setSelected(new Set())
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[clubs/bulk-disable] error:', err)
    } finally {
      setBulkDisabling(false)
    }
  }


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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={styles.rbfaBtn} onPress={() => router.push('/clubs/rbfa-sync' as never)}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
              Import RBFA
            </AureakText>
          </Pressable>
          <Pressable style={styles.newBtn} onPress={() => router.push('/clubs/new' as never)}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
              + Nouveau club
            </AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Search — temps-réel ── */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={(text) => { setSearch(text); setPage(0) }}
          placeholder="Rechercher par nom, matricule, ville…"
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
        />
        {search !== '' && (
          <Pressable
            style={styles.clearBtn}
            onPress={() => { setSearch(''); setPage(0) }}
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

      {/* ── Sort chips ── */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
        {(['nom', 'ville', 'province'] as const).map(k => (
          <Pressable key={k} onPress={() => toggleSort(k)} style={[sortChip.base, sortKey === k && sortChip.active]}>
            <AureakText variant="caption" style={{ color: sortKey === k ? colors.accent.gold : colors.text.muted, fontSize: 11 }}>
              {k === 'nom' ? 'Nom' : k === 'ville' ? 'Ville' : 'Province'}
              {sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
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
      ) : sortedClubs.length === 0 ? (
        /* Story 62.2 — EmptyState illustré */
        <EmptyStateIllustrated
          variant="no-clubs"
          subtitle="Aucun club ne correspond aux critères sélectionnés."
          ctaLabel="+ Ajouter un club"
          onCta={() => router.push('/clubs/new' as never)}
        />
      ) : (
        <View style={styles.grid}>
          {sortedClubs.map(club => (
            <View key={club.id} style={[styles.cell, { width: `${Math.floor(100 / columns)}%` as never }]}>
              <View>
                {/* Checkbox overlay */}
                <Pressable
                  style={[bulk.checkbox, selected.has(club.id) && bulk.checkboxChecked]}
                  onPress={() => toggleSelect(club.id)}
                  accessibilityLabel={selected.has(club.id) ? 'Désélectionner' : 'Sélectionner'}
                >
                  {selected.has(club.id) && (
                    <AureakText variant="caption" style={{ color: colors.text.dark, fontSize: 10, lineHeight: 14 }}>✓</AureakText>
                  )}
                </Pressable>
                <ClubCard
                  club={club}
                  onPress={() => router.push(`/clubs/${club.id}` as never)}
                />
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

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <View style={bulk.bar} pointerEvents="box-none">
          <View style={bulk.barInner}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' }}>
              {selected.size} club{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
            </AureakText>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Pressable style={bulk.btnSecondary} onPress={handleBulkExport}>
                <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' }}>
                  Exporter
                </AureakText>
              </Pressable>
              <Pressable
                style={[bulk.btnDanger, bulkDisabling && bulk.btnDisabled]}
                onPress={handleBulkDisable}
                disabled={bulkDisabling}
              >
                <AureakText variant="caption" style={{ color: colors.text.primary, fontWeight: '600' }}>
                  {bulkDisabling ? 'En cours…' : 'Désactiver tous'}
                </AureakText>
              </Pressable>
              <Pressable style={bulk.btnGhost} onPress={clearSelection}>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.md },
  pageHeader : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rbfaBtn    : {
    backgroundColor  : colors.light.surface,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
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

const sortChip = StyleSheet.create({
  base  : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  active: { borderColor: colors.accent.gold, backgroundColor: colors.light.surface },
})

const bulk = StyleSheet.create({
  // Checkbox positioned top-left of each card
  checkbox: {
    position       : 'absolute',
    top            : space.xs,
    left           : space.xs + space.xs,
    zIndex         : 10,
    width          : 20,
    height         : 20,
    borderRadius   : 4,
    borderWidth    : 2,
    borderColor    : colors.border.light,
    backgroundColor: colors.light.surface,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  checkboxChecked: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.accent.gold,
  },
  // Fixed action bar at the bottom of the scroll
  bar: {
    marginTop: space.lg,
  },
  barInner: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.gold,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    boxShadow: shadows.sm as never,
  },
  btnSecondary: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : 7,
  },
  btnDanger: {
    backgroundColor  : colors.accent.red,
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : 7,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnGhost: {
    width          : 30,
    height         : 30,
    alignItems     : 'center',
    justifyContent : 'center',
    borderRadius   : 6,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    backgroundColor: colors.light.surface,
  },
})
