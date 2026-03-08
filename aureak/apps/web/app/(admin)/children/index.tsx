'use client'
// Annuaire joueurs — child_directory (import Notion)
// Terminologie officielle : joueur = enfant = child
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listJoueurs, listAcademySeasons, type JoueurListItem } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { ACADEMY_STATUS_CONFIG } from '@aureak/business-logic'
import type { AcademyStatus } from '@aureak/types'

const PAGE_SIZE = 50

// ── Filter types ───────────────────────────────────────────────────────────────

type AcadStatusFilter = 'all' | AcademyStatus
type SeasonFilter     = 'all' | 'eq1' | 'eq2' | 'gte3'
type StageFilter      = 'all' | 'eq0' | 'eq1' | 'eq2' | 'gte3'

// Built dynamically in the component using currentSeasonLabel
const SEASON_TABS: { key: SeasonFilter; label: string }[] = [
  { key: 'all',  label: 'Toutes'    },
  { key: 'eq1',  label: '1 saison'  },
  { key: 'eq2',  label: '2 saisons' },
  { key: 'gte3', label: '3+'        },
]

const STAGE_TABS: { key: StageFilter; label: string }[] = [
  { key: 'all',  label: 'Tous'       },
  { key: 'eq0',  label: 'Aucun'      },
  { key: 'eq1',  label: '1 stage'    },
  { key: 'eq2',  label: '2 stages'   },
  { key: 'gte3', label: '3+'         },
]

// ── Status badge chip ──────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const cfg = ACADEMY_STATUS_CONFIG[status as AcademyStatus]
  if (!cfg) return null
  return (
    <View style={[chip.base, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
      <AureakText style={[chip.label, { color: cfg.color }] as never}>{cfg.label}</AureakText>
    </View>
  )
}

function InfoChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[chip.base, { backgroundColor: color + '14', borderColor: color + '30' }]}>
      <AureakText style={[chip.label, { color }] as never}>{label}</AureakText>
    </View>
  )
}

const chip = StyleSheet.create({
  base : {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 10, fontWeight: '600' as never, letterSpacing: 0.3 },
})

// ── Pagination ─────────────────────────────────────────────────────────────────

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
        <Pressable style={[pag.btn, page === 0 && pag.disabled]} onPress={onPrev} disabled={page === 0}>
          <AureakText variant="caption" style={{ color: page === 0 ? colors.text.secondary : colors.text.primary }}>←</AureakText>
        </Pressable>
        <AureakText variant="caption" style={{ color: colors.text.secondary, paddingHorizontal: space.sm }}>
          {page + 1} / {totalPages}
        </AureakText>
        <Pressable style={[pag.btn, end >= total && pag.disabled]} onPress={onNext} disabled={end >= total}>
          <AureakText variant="caption" style={{ color: end >= total ? colors.text.secondary : colors.text.primary }}>→</AureakText>
        </Pressable>
      </View>
    </View>
  )
}
const pag = StyleSheet.create({
  row    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.sm },
  btnRow : { flexDirection: 'row', alignItems: 'center' },
  btn    : { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: colors.accent.zinc, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.surface },
  disabled: { opacity: 0.35 },
})

// ── Player row ─────────────────────────────────────────────────────────────────

function JoueurRow({ item, onPress }: { item: JoueurListItem; onPress: () => void }) {
  const seasonColor = '#9E9E9E'
  const stageColor  = '#4FC3F7'

  return (
    <View style={row.container}>
      <View style={row.info}>
        <AureakText variant="body" style={row.name}>{item.displayName}</AureakText>
        <View style={row.meta}>
          {item.currentClub && (
            <AureakText variant="caption" style={row.metaText}>⚽ {item.currentClub}</AureakText>
          )}
          {item.niveauClub && (
            <AureakText variant="caption" style={[row.metaText, { color: colors.text.secondary }] as never}>
              {item.currentClub ? ' · ' : ''}{item.niveauClub}
            </AureakText>
          )}
        </View>
        <View style={row.badges}>
          {item.computedStatus && <StatusChip status={item.computedStatus} />}
          {item.totalAcademySeasons > 0 && (
            <InfoChip
              label={`${item.totalAcademySeasons} saison${item.totalAcademySeasons > 1 ? 's' : ''}`}
              color={seasonColor}
            />
          )}
          {item.totalStages > 0 && (
            <InfoChip
              label={`${item.totalStages} stage${item.totalStages > 1 ? 's' : ''}`}
              color={stageColor}
            />
          )}
        </View>
      </View>
      <Pressable style={row.btn} onPress={onPress}>
        <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
          Voir
        </AureakText>
      </Pressable>
    </View>
  )
}

const row = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.md, paddingVertical: space.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.accent.zinc,
  },
  info   : { flex: 1, gap: 3 },
  name   : { fontWeight: '600' as never, fontSize: 14 },
  meta   : { flexDirection: 'row', flexWrap: 'wrap' },
  metaText: { color: colors.text.primary, fontSize: 12 },
  badges : { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 2 },
  btn    : {
    paddingHorizontal: space.sm, paddingVertical: 4,
    borderRadius: 5, borderWidth: 1, borderColor: colors.accent.gold,
    marginLeft: space.sm,
  },
})

// ── Filter tab row ─────────────────────────────────────────────────────────────

function FilterRow<K extends string>({
  label, tabs, active, onSelect, getColor,
}: {
  label    : string
  tabs     : { key: K; label: string }[]
  active   : K
  onSelect : (key: K) => void
  getColor?: (key: K) => string
}) {
  return (
    <View style={fr.wrap}>
      <AureakText variant="caption" style={fr.label}>{label}</AureakText>
      <View style={fr.row}>
        {tabs.map(t => {
          const isActive = active === t.key
          const color = getColor ? getColor(t.key) : colors.accent.gold
          return (
            <Pressable key={t.key} style={[fr.tab, isActive && { borderColor: color + '60' }]} onPress={() => onSelect(t.key)}>
              <AureakText
                variant="caption"
                style={{ color: isActive ? color : colors.text.secondary, fontWeight: isActive ? '700' : '400' }}
              >
                {t.label}
              </AureakText>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const fr = StyleSheet.create({
  wrap  : { gap: 4 },
  label : { color: colors.text.secondary, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' as never, fontWeight: '700' as never },
  row   : { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
  tab   : { paddingHorizontal: space.sm + 2, paddingVertical: 5, borderRadius: 5, borderWidth: 1, borderColor: 'transparent' },
})

// ── Main ───────────────────────────────────────────────────────────────────────

export default function JoueursPage() {
  const router = useRouter()

  const [joueurs,            setJoueurs]            = useState<JoueurListItem[]>([])
  const [total,              setTotal]              = useState(0)
  const [page,               setPage]               = useState(0)
  const [loading,            setLoading]            = useState(true)
  const [currentSeasonLabel, setCurrentSeasonLabel] = useState<string | null>(null)

  const [searchInput,   setSearchInput]   = useState('')
  const [search,        setSearch]        = useState('')
  const [acadStatus,    setAcadStatus]    = useState<AcadStatusFilter>('all')
  const [seasonFilter,  setSeasonFilter]  = useState<SeasonFilter>('all')
  const [stageFilter,   setStageFilter]   = useState<StageFilter>('all')

  // Load current season label once (for the filter tab label)
  useEffect(() => {
    listAcademySeasons().then(({ data }) => {
      const current = data.find(s => s.isCurrent)
      setCurrentSeasonLabel(current?.label ?? null)
    }).catch(() => {/* non-critical */})
  }, [])

  // Dynamic tab list — "Académicien 2025-2026" uses real season label
  const acadStatusTabs = useMemo<{ key: AcadStatusFilter; label: string; color: string }[]>(() => [
    { key: 'all',               label: 'Tous',                                                       color: colors.text.secondary },
    { key: 'ACADÉMICIEN',       label: currentSeasonLabel ? `Acad. ${currentSeasonLabel}` : 'Académicien (saison actuelle)', color: ACADEMY_STATUS_CONFIG['ACADÉMICIEN'].color },
    { key: 'NOUVEAU_ACADÉMICIEN', label: 'Nouveau académicien',                                      color: ACADEMY_STATUS_CONFIG['NOUVEAU_ACADÉMICIEN'].color },
    { key: 'ANCIEN',            label: 'Ancien académicien',                                         color: ACADEMY_STATUS_CONFIG['ANCIEN'].color },
    { key: 'STAGE_UNIQUEMENT',  label: 'Stage uniquement',                                           color: ACADEMY_STATUS_CONFIG['STAGE_UNIQUEMENT'].color },
    { key: 'PROSPECT',          label: 'Non affilié',                                                color: ACADEMY_STATUS_CONFIG['PROSPECT'].color },
  ], [currentSeasonLabel])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await listJoueurs({
        search         : search || undefined,
        computedStatus : acadStatus !== 'all' ? acadStatus : undefined,
        totalSeasonsCmp: seasonFilter !== 'all' ? seasonFilter : undefined,
        totalStagesCmp : stageFilter  !== 'all' ? stageFilter  : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setJoueurs(data)
      setTotal(count)
    } catch (e) {
      console.error('[JoueursPage] load error', e)
    }
    setLoading(false)
  }, [search, acadStatus, seasonFilter, stageFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [search, acadStatus, seasonFilter, stageFilter])

  const handleSearch = () => setSearch(searchInput.trim())

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <AureakText variant="h2">Joueurs</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 2 }}>
              {total} joueur{total !== 1 ? 's' : ''} · annuaire Notion
            </AureakText>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          placeholder="Rechercher par nom…"
          placeholderTextColor={colors.text.secondary}
          returnKeyType="search"
        />
        <Pressable style={s.searchBtn} onPress={handleSearch}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
            Chercher
          </AureakText>
        </Pressable>
        {search !== '' && (
          <Pressable style={s.clearBtn} onPress={() => { setSearch(''); setSearchInput('') }}>
            <AureakText variant="caption" style={{ color: colors.text.secondary }}>✕</AureakText>
          </Pressable>
        )}
      </View>

      {/* Filters */}
      <View style={s.filters}>
        <FilterRow
          label="Statut académie"
          tabs={acadStatusTabs}
          active={acadStatus}
          onSelect={setAcadStatus}
          getColor={k => k === 'all' ? colors.accent.gold : ACADEMY_STATUS_CONFIG[k as AcademyStatus]?.color ?? colors.accent.gold}
        />
        <View style={s.filtersRow2}>
          <View style={s.filterHalf}>
            <FilterRow
              label="Expérience académie"
              tabs={SEASON_TABS}
              active={seasonFilter}
              onSelect={setSeasonFilter}
            />
          </View>
          <View style={s.filterHalf}>
            <FilterRow
              label="Expérience stage"
              tabs={STAGE_TABS}
              active={stageFilter}
              onSelect={setStageFilter}
            />
          </View>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={s.skeletonBox}>
          {[0,1,2,3,4,5].map(i => <View key={i} style={s.skeletonRow} />)}
        </View>
      ) : joueurs.length === 0 ? (
        <View style={s.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.secondary }}>Aucun joueur</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: 4 }}>
            {search.trim() ? 'Modifiez votre recherche.' : 'Aucun joueur ne correspond aux filtres.'}
          </AureakText>
        </View>
      ) : (
        <View style={s.list}>
          {joueurs.map(item => (
            <JoueurRow
              key={item.id}
              item={item}
              onPress={() => router.push(`/children/${item.id}` as never)}
            />
          ))}
        </View>
      )}

      {/* Pagination */}
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

const s = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.background.primary },
  content   : { padding: space.xl, gap: space.md },
  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  searchRow : { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
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
  },
  searchBtn: {
    backgroundColor  : colors.background.elevated,
    borderWidth      : 1,
    borderColor      : colors.accent.zinc,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
  },
  clearBtn: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, borderWidth: 1,
    borderColor: colors.accent.zinc,
    backgroundColor: colors.background.surface,
  },

  filters    : { gap: space.sm },
  filtersRow2: { flexDirection: 'row', gap: space.lg, flexWrap: 'wrap' },
  filterHalf : { flex: 1, minWidth: 200 },

  list : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10, borderWidth: 1,
    borderColor    : colors.accent.zinc, overflow: 'hidden',
  },

  skeletonBox: { gap: space.xs },
  skeletonRow: {
    height: 68, backgroundColor: colors.background.surface,
    borderRadius: 6, opacity: 0.5,
    borderWidth: 1, borderColor: colors.accent.zinc,
  },
  emptyState: {
    backgroundColor: colors.background.surface,
    borderRadius: 10, padding: space.xxl,
    alignItems: 'center', borderWidth: 1, borderColor: colors.accent.zinc,
  },
})
