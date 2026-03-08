import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { listClubDirectory } from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { ClubDirectoryEntry, BelgianProvince } from '@aureak/types'
import { BELGIAN_PROVINCES } from '@aureak/types'

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

// ── Main page ───────────────────────────────────────────────────────────────

type FilterPartenaire = 'all' | 'partner' | 'common'
type FilterActif      = 'all' | 'actif' | 'inactif'

const PARTENAIRE_TABS: { key: FilterPartenaire; label: string }[] = [
  { key: 'all',     label: 'Tous'         },
  { key: 'partner', label: 'Partenaires'  },
  { key: 'common',  label: 'Non partenaires' },
]
const ACTIF_TABS: { key: FilterActif; label: string }[] = [
  { key: 'all',     label: 'Tous'    },
  { key: 'actif',   label: 'Actifs'  },
  { key: 'inactif', label: 'Inactifs'},
]

export default function ClubsPage() {
  const router = useRouter()

  const [clubs,            setClubs]            = useState<ClubDirectoryEntry[]>([])
  const [total,            setTotal]            = useState(0)
  const [page,             setPage]             = useState(0)
  const [loading,          setLoading]          = useState(true)

  const [search,           setSearch]           = useState('')
  const [searchInput,      setSearchInput]      = useState('')
  const [provinceFilter,   setProvinceFilter]   = useState<BelgianProvince | undefined>()
  const [partenaireFilter, setPartenaireFilter] = useState<FilterPartenaire>('all')
  const [actifFilter,      setActifFilter]      = useState<FilterActif>('actif')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, count } = await listClubDirectory({
      search    : search || undefined,
      province  : provinceFilter,
      partenaire: partenaireFilter === 'all' ? undefined : partenaireFilter === 'partner',
      actif     : actifFilter === 'all' ? undefined : actifFilter === 'actif',
      page,
      pageSize  : PAGE_SIZE,
    })
    setClubs(data)
    setTotal(count)
    setLoading(false)
  }, [search, provinceFilter, partenaireFilter, actifFilter, page])

  useEffect(() => { load() }, [load])

  // Reset page on filter change
  useEffect(() => { setPage(0) }, [search, provinceFilter, partenaireFilter, actifFilter])

  const handleSearch = () => setSearch(searchInput.trim())

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Header ── */}
      <View style={styles.pageHeader}>
        <View>
          <AureakText variant="h2">Clubs</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
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
          placeholderTextColor={colors.text.secondary}
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
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>✕</AureakText>
          </Pressable>
        )}
      </View>

      {/* ── Filters ── */}
      <View style={styles.filterRow}>
        {/* Partenaire filter */}
        <View style={styles.filterGroup}>
          {PARTENAIRE_TABS.map(t => (
            <Pressable
              key={t.key}
              style={[styles.tab, partenaireFilter === t.key && styles.tabActive]}
              onPress={() => setPartenaireFilter(t.key)}
            >
              <AureakText
                variant="caption"
                style={{
                  color     : partenaireFilter === t.key ? colors.accent.gold : colors.text.secondary,
                  fontWeight: partenaireFilter === t.key ? '700' : '400',
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
                  color     : actifFilter === t.key ? colors.accent.gold : colors.text.secondary,
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
            style={{ color: provinceFilter === undefined ? colors.accent.gold : colors.text.secondary, fontSize: 11 }}
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
              style={{ color: provinceFilter === p ? colors.accent.gold : colors.text.secondary, fontSize: 11 }}
            >
              {p}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* ── Table ── */}
      {loading ? (
        <View style={styles.skeletonBox}>
          {[0,1,2,3,4,5].map(i => <View key={i} style={styles.skeletonRow} />)}
        </View>
      ) : clubs.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.secondary }}>Aucun club</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 4 }}>
            Aucun club ne correspond aux critères sélectionnés.
          </AureakText>
        </View>
      ) : (
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.thead}>
            <AureakText variant="caption" style={[styles.th, { flex: 3 }]}>Nom</AureakText>
            <AureakText variant="caption" style={[styles.th, { width: 90 }]}>Matricule</AureakText>
            <AureakText variant="caption" style={[styles.th, { flex: 2 }]}>Ville / Province</AureakText>
            <AureakText variant="caption" style={[styles.th, { width: 100 }]}>Statut</AureakText>
            <AureakText variant="caption" style={[styles.th, { width: 80, textAlign: 'right' }]}>Actions</AureakText>
          </View>

          {clubs.map((club, idx) => (
            <View key={club.id} style={[styles.tr, idx % 2 === 1 && styles.trAlt]}>
              <View style={[{ flex: 3 }, styles.td]}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>{club.nom}</AureakText>
                {club.label && (
                  <AureakText variant="caption" style={{ color: colors.text.secondary, fontSize: 11 }}>
                    {club.label}
                  </AureakText>
                )}
              </View>
              <AureakText variant="caption" style={[styles.td, { width: 90, color: colors.text.secondary }]}>
                {club.matricule ?? '—'}
              </AureakText>
              <View style={[{ flex: 2 }, styles.td]}>
                <AureakText variant="caption" style={{ color: colors.text.secondary }}>
                  {[club.ville, club.province].filter(Boolean).join(' · ') || '—'}
                </AureakText>
              </View>
              <View style={[styles.td, { width: 100, gap: 4 }]}>
                {club.clubPartenaire && (
                  <Badge label="Partenaire" variant="gold" />
                )}
                <Badge label={club.actif ? 'Actif' : 'Inactif'} variant={club.actif ? 'present' : 'zinc'} />
              </View>
              <View style={[styles.td, { width: 80, alignItems: 'flex-end' }]}>
                <Pressable
                  style={styles.manageBtn}
                  onPress={() => router.push(`/clubs/${club.id}` as never)}
                >
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
                    Gérer
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
  container  : { flex: 1, backgroundColor: colors.background.primary },
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
    backgroundColor  : colors.background.surface,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.primary,
    fontSize         : 13,
    fontFamily       : 'System',
  },
  searchBtn  : {
    backgroundColor  : colors.background.elevated,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
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
    borderColor     : colors.accent.zinc,
    backgroundColor : colors.background.surface,
  },

  // Filters
  filterRow  : { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  filterGroup: {
    flexDirection    : 'row',
    gap              : space.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc,
    paddingBottom    : space.sm,
  },
  tab        : { paddingHorizontal: space.sm + 2, paddingVertical: 5, borderRadius: 5 },
  tabActive  : { backgroundColor: colors.background.elevated },

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
    borderColor      : colors.accent.zinc,
    backgroundColor  : colors.background.surface,
  },
  provincePillActive: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.background.elevated,
  },

  // Table
  table      : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    overflow       : 'hidden',
  },
  thead      : {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc,
    backgroundColor  : colors.background.elevated,
  },
  th         : {
    color        : colors.text.secondary,
    fontWeight   : '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontSize     : 10,
  },
  tr         : {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc,
  },
  trAlt      : { backgroundColor: colors.background.elevated },
  td         : { paddingRight: space.sm },
  manageBtn  : {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 5,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },

  // States
  skeletonBox : { gap: space.xs },
  skeletonRow : {
    height         : 52,
    backgroundColor: colors.background.surface,
    borderRadius   : 6,
    opacity        : 0.5,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
  },
  emptyState  : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
  },
})
