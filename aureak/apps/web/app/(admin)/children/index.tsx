'use client'
// Annuaire joueurs — child_directory (import Notion)
// Terminologie officielle : joueur = enfant = child
// Story 18.2 : refonte UI cards + grille responsive + photos + filtres améliorés
// UI v2 : infos gauche · avatar droite · filtres avancés repliables
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Image, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { listJoueurs, type JoueurListItem } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { ACADEMY_STATUS_CONFIG } from '@aureak/business-logic'
import type { AcademyStatus } from '@aureak/types'

const PAGE_SIZE = 50

// ── Filter types ───────────────────────────────────────────────────────────────

type AcadStatusFilter = 'all' | AcademyStatus
type SeasonFilter     = 'all' | 'eq1' | 'eq2' | 'gte3'
type StageFilter      = 'all' | 'eq0' | 'eq1' | 'eq2' | 'gte3'

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

// Années de naissance dynamiques : 2004 → 2018
const BIRTH_YEAR_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  ...Array.from({ length: 15 }, (_, i) => {
    const y = (2018 - i).toString()
    return { key: y, label: y }
  }),
]

// ── PhotoAvatar — cercle photo ou initiales en fallback ────────────────────────

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function avatarBgColor(id: string): string {
  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4']
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function PhotoAvatar({ photoUrl, displayName, id, size = 52 }: {
  photoUrl   : string | null
  displayName: string
  id         : string
  size?      : number
}) {
  const [imgError, setImgError] = useState(false)
  const showPhoto = photoUrl && !imgError
  const bg = avatarBgColor(id)
  const initials = getInitials(displayName)

  return (
    <View style={[av.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: showPhoto ? 'transparent' : bg }]}>
      {showPhoto ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
      ) : (
        <AureakText style={[av.initials, { fontSize: size * 0.32 }] as never}>
          {initials}
        </AureakText>
      )}
    </View>
  )
}

const av = StyleSheet.create({
  circle  : { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: '#fff', fontWeight: '700' as never, letterSpacing: 0.5 },
})

// ── Chips ──────────────────────────────────────────────────────────────────────

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
  base : { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1, alignSelf: 'flex-start' },
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
      <AureakText variant="caption" style={{ color: colors.text.muted }}>
        {total > 0 ? `${start}–${end} sur ${total}` : '0 résultat'}
      </AureakText>
      <View style={pag.btnRow}>
        <Pressable style={[pag.btn, page === 0 && pag.disabled]} onPress={onPrev} disabled={page === 0}>
          <AureakText variant="caption" style={{ color: page === 0 ? colors.text.muted : colors.text.dark }}>←</AureakText>
        </Pressable>
        <AureakText variant="caption" style={{ color: colors.text.muted, paddingHorizontal: space.sm }}>
          {page + 1} / {totalPages}
        </AureakText>
        <Pressable style={[pag.btn, end >= total && pag.disabled]} onPress={onNext} disabled={end >= total}>
          <AureakText variant="caption" style={{ color: end >= total ? colors.text.muted : colors.text.dark }}>→</AureakText>
        </Pressable>
      </View>
    </View>
  )
}
const pag = StyleSheet.create({
  row    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.sm },
  btnRow : { flexDirection: 'row', alignItems: 'center' },
  btn    : { width: 30, height: 30, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.surface },
  disabled: { opacity: 0.35 },
})

// ── JoueurCard — infos gauche · avatar droite ─────────────────────────────────

function formatBirthDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return null }
}

function JoueurCard({ item, onPress }: { item: JoueurListItem; onPress: () => void }) {
  const dob     = formatBirthDate(item.birthDate)
  const metaParts = [dob, item.currentClub, item.niveauClub].filter(Boolean)

  return (
    <Pressable style={({ pressed }) => [card.container, pressed && card.pressed]} onPress={onPress}>

      {/* ── Gauche : toutes les infos joueur ── */}
      <View style={card.info}>
        <AureakText variant="body" style={card.name} numberOfLines={1}>
          {item.displayName}
        </AureakText>

        {metaParts.length > 0 && (
          <AureakText variant="caption" style={card.meta} numberOfLines={2}>
            {metaParts.join('  ·  ')}
          </AureakText>
        )}

        <View style={card.chips}>
          {item.computedStatus && <StatusChip status={item.computedStatus} />}
          {item.totalAcademySeasons > 0 && (
            <InfoChip
              label={`${item.totalAcademySeasons} saison${item.totalAcademySeasons > 1 ? 's' : ''}`}
              color="#9E9E9E"
            />
          )}
          {item.totalStages > 0 && (
            <InfoChip
              label={`${item.totalStages} stage${item.totalStages > 1 ? 's' : ''}`}
              color="#4FC3F7"
            />
          )}
        </View>
      </View>

      {/* ── Droite : avatar + label ── */}
      <View style={card.aside}>
        <PhotoAvatar
          photoUrl={item.currentPhotoUrl}
          displayName={item.displayName}
          id={item.id}
          size={52}
        />
        <AureakText style={card.voirLabel}>Voir →</AureakText>
      </View>

    </Pressable>
  )
}

const card = StyleSheet.create({
  container: {
    flexDirection  : 'row',
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : 14,
    gap            : 14,
    alignItems     : 'center',
    ...shadows.sm,
  },
  pressed: {
    backgroundColor: colors.light.hover ?? colors.light.muted,
    transform      : [{ scale: 0.99 }],
  },
  info: {
    flex: 1,
    gap : 5,
  },
  name: {
    fontWeight   : '700' as never,
    fontSize     : 14,
    color        : colors.text.dark,
    letterSpacing: 0.1,
  },
  meta: {
    color     : colors.text.muted,
    fontSize  : 11,
    lineHeight: 17,
  },
  chips: {
    flexDirection: 'row',
    gap          : 4,
    flexWrap     : 'wrap',
    marginTop    : 2,
  },
  aside: {
    alignItems: 'center',
    gap       : 7,
    width     : 68,
  },
  voirLabel: {
    color     : colors.accent.gold,
    fontSize  : 10,
    fontWeight: '700' as never,
  },
})

// ── Skeleton card — miroir de la nouvelle structure ────────────────────────────

function SkeletonCard() {
  return (
    <View style={[card.container, sk.root]}>
      {/* Info gauche */}
      <View style={card.info}>
        <View style={[sk.line, { width: '65%', height: 14 }]} />
        <View style={[sk.line, { width: '85%', height: 11, marginTop: 2 }]} />
        <View style={sk.chipsRow}>
          <View style={sk.chipSm} />
          <View style={sk.chipSm} />
        </View>
      </View>
      {/* Avatar droite */}
      <View style={card.aside}>
        <View style={sk.circle} />
        <View style={sk.voirPh} />
      </View>
    </View>
  )
}

const sk = StyleSheet.create({
  root    : { opacity: 0.55 },
  circle  : { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.border.divider },
  voirPh  : { width: 36, height: 10, borderRadius: 4, backgroundColor: colors.border.divider },
  line    : { backgroundColor: colors.border.divider, borderRadius: 4 },
  chipsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  chipSm  : { width: 52, height: 17, borderRadius: 4, backgroundColor: colors.border.divider },
})

// ── FilterRow ─────────────────────────────────────────────────────────────────

function FilterRow<K extends string>({
  label, tabs, active, onSelect,
}: {
  label   : string
  tabs    : { key: K; label: string }[]
  active  : K
  onSelect: (key: K) => void
}) {
  return (
    <View style={fr.wrap}>
      <AureakText variant="caption" style={fr.label}>{label}</AureakText>
      <View style={fr.row}>
        {tabs.map(t => {
          const isActive = active === t.key
          return (
            <Pressable
              key={t.key}
              style={[fr.tab, isActive && fr.tabActive]}
              onPress={() => onSelect(t.key)}
            >
              <AureakText
                variant="caption"
                style={{ color: isActive ? colors.text.dark : colors.text.muted, fontWeight: isActive ? '700' : '400' } as never}
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
  wrap    : { gap: 5 },
  label   : { color: colors.text.muted, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' as never, fontWeight: '700' as never },
  row     : { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tab     : { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, borderWidth: 1, borderColor: colors.border.light, backgroundColor: 'transparent' },
  tabActive: { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '18' },
})

// ── Main ───────────────────────────────────────────────────────────────────────

export default function JoueursPage() {
  const router = useRouter()

  const [joueurs,            setJoueurs]            = useState<JoueurListItem[]>([])
  const [total,              setTotal]              = useState(0)
  const [page,               setPage]               = useState(0)
  const [loading,            setLoading]            = useState(true)
  const [showAdvFilters,     setShowAdvFilters]     = useState(false)

  const [searchInput,  setSearchInput]  = useState('')
  const [search,       setSearch]       = useState('')
  const [acadStatus,   setAcadStatus]   = useState<AcadStatusFilter>('all')
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('all')
  const [stageFilter,  setStageFilter]  = useState<StageFilter>('all')
  const [birthYear,    setBirthYear]    = useState<string>('all')

  // Nombre total de filtres actifs (hors recherche)
  const activeFilterCount = useMemo(() => {
    let n = 0
    if (acadStatus   !== 'all') n++
    if (seasonFilter !== 'all') n++
    if (stageFilter  !== 'all') n++
    if (birthYear    !== 'all') n++
    return n
  }, [acadStatus, seasonFilter, stageFilter, birthYear])

  // Filtres avancés actifs uniquement (pour le badge sur le toggle)
  const advFilterCount = useMemo(() => {
    let n = 0
    if (seasonFilter !== 'all') n++
    if (stageFilter  !== 'all') n++
    if (birthYear    !== 'all') n++
    return n
  }, [seasonFilter, stageFilter, birthYear])

  // Saison effective — lue directement depuis les données déjà chargées (v_child_academy_status).
  // Tous les joueurs du même tenant partagent le même current_season_label calculé par la vue SQL.
  // Zéro appel supplémentaire, zéro logique de priorité côté JS.
  const currentSeasonLabel = useMemo(
    () => joueurs.find(j => j.currentSeasonLabel != null)?.currentSeasonLabel ?? null,
    [joueurs]
  )

  const acadStatusTabs = useMemo<{ key: AcadStatusFilter; label: string }[]>(() => [
    { key: 'all',               label: 'Tous'                                                        },
    { key: 'ACADÉMICIEN',       label: currentSeasonLabel ? `Acad. ${currentSeasonLabel}` : 'Académicien' },
    { key: 'NOUVEAU_ACADÉMICIEN', label: 'Nouveau'                                                   },
    { key: 'ANCIEN',            label: 'Ancien'                                                      },
    { key: 'STAGE_UNIQUEMENT',  label: 'Stage seul'                                                  },
    { key: 'PROSPECT',          label: 'Non affilié'                                                 },
  ], [currentSeasonLabel])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await listJoueurs({
        search         : search || undefined,
        computedStatus : acadStatus !== 'all' ? acadStatus : undefined,
        totalSeasonsCmp: seasonFilter !== 'all' ? seasonFilter : undefined,
        totalStagesCmp : stageFilter  !== 'all' ? stageFilter  : undefined,
        birthYear      : birthYear !== 'all' ? birthYear : undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setJoueurs(data)
      setTotal(count)
    } catch (e) {
      console.error('[JoueursPage] load error', e)
    }
    setLoading(false)
  }, [search, acadStatus, seasonFilter, stageFilter, birthYear, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [search, acadStatus, seasonFilter, stageFilter, birthYear])

  const handleSearch = () => setSearch(searchInput.trim())

  const handleResetFilters = () => {
    setAcadStatus('all')
    setSeasonFilter('all')
    setStageFilter('all')
    setBirthYear('all')
  }

  // CSS grid natif web — minmax élargi pour meilleure densité
  const gridStyle = Platform.OS === 'web'
    ? { display: 'grid' as never, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }
    : s.gridFallback

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── En-tête ── */}
      <View style={s.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Joueurs</AureakText>
          {!loading && (
            <AureakText variant="caption" style={s.headerSub}>
              {total} joueur{total !== 1 ? 's' : ''}
              {activeFilterCount > 0 && `  ·  ${activeFilterCount} filtre${activeFilterCount > 1 ? 's' : ''} actif${activeFilterCount > 1 ? 's' : ''}`}
            </AureakText>
          )}
        </View>
        {activeFilterCount > 0 && (
          <Pressable style={s.resetBtn} onPress={handleResetFilters}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '600' as never }}>
              Réinitialiser
            </AureakText>
          </Pressable>
        )}
      </View>

      {/* ── Barre de recherche ── */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          placeholder="Rechercher par nom…"
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          inputMode="search"
        />
        <Pressable style={s.searchBtn} onPress={handleSearch}>
          <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
            Chercher
          </AureakText>
        </Pressable>
        {search !== '' && (
          <Pressable style={s.clearBtn} onPress={() => { setSearch(''); setSearchInput('') }}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
          </Pressable>
        )}
      </View>

      {/* ── Filtres ── */}
      <View style={s.filtersBlock}>

        {/* Statut — toujours visible */}
        <FilterRow
          label="Statut"
          tabs={acadStatusTabs}
          active={acadStatus}
          onSelect={setAcadStatus}
        />

        {/* Toggle filtres avancés */}
        <Pressable
          style={[s.advToggle, showAdvFilters && s.advToggleOpen]}
          onPress={() => setShowAdvFilters(v => !v)}
        >
          <AureakText
            variant="caption"
            style={[s.advToggleLabel, advFilterCount > 0 && s.advToggleLabelActive] as never}
          >
            {advFilterCount > 0
              ? `Filtres avancés  ·  ${advFilterCount} actif${advFilterCount > 1 ? 's' : ''}`
              : 'Filtres avancés'
            }
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
            {showAdvFilters ? '▲' : '▼'}
          </AureakText>
        </Pressable>

        {/* Filtres avancés repliables */}
        {showAdvFilters && (
          <View style={s.advFilters}>
            <FilterRow
              label="Expérience académie"
              tabs={SEASON_TABS}
              active={seasonFilter}
              onSelect={setSeasonFilter}
            />
            <FilterRow
              label="Expérience stage"
              tabs={STAGE_TABS}
              active={stageFilter}
              onSelect={setStageFilter}
            />
            <FilterRow
              label="Année de naissance"
              tabs={BIRTH_YEAR_TABS}
              active={birthYear}
              onSelect={setBirthYear}
            />
          </View>
        )}
      </View>

      {/* ── Grille joueurs ── */}
      {loading ? (
        <View style={gridStyle as never}>
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : joueurs.length === 0 ? (
        <View style={s.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucun joueur</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
            {search.trim() ? 'Modifiez votre recherche.' : 'Aucun joueur ne correspond aux filtres.'}
          </AureakText>
        </View>
      ) : (
        <View style={gridStyle as never}>
          {joueurs.map(item => (
            <JoueurCard
              key={item.id}
              item={item}
              onPress={() => router.push(`/children/${item.id}` as never)}
            />
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.md },

  // En-tête
  header   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub: { color: colors.text.muted, marginTop: 3, fontSize: 12 },

  // Recherche
  searchRow : { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  searchInput: {
    flex             : 1,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 8,
    paddingHorizontal: space.md,
    paddingVertical  : 9,
    color            : colors.text.dark,
    fontSize         : 13,
  },
  searchBtn: {
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    paddingHorizontal: space.md,
    paddingVertical  : 9,
    borderRadius     : 8,
  },
  clearBtn: {
    width          : 34,
    height         : 34,
    alignItems     : 'center',
    justifyContent : 'center',
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    backgroundColor: colors.light.surface,
  },
  resetBtn: {
    paddingHorizontal: space.sm,
    paddingVertical  : 5,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '60',
    backgroundColor  : colors.accent.gold + '08',
  },

  // Bloc filtres
  filtersBlock: { gap: space.sm },

  advToggle: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingVertical  : 8,
    paddingHorizontal: 12,
    borderRadius     : 7,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  advToggleOpen: {
    borderColor    : colors.accent.gold + '50',
    backgroundColor: colors.accent.gold + '08',
  },
  advToggleLabel: {
    color     : colors.text.muted,
    fontSize  : 11,
    fontWeight: '600' as never,
  },
  advToggleLabelActive: {
    color: colors.text.dark,
  },
  advFilters: {
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    padding        : 12,
    gap            : 12,
  },

  // Grille
  gridFallback: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  // État vide
  emptyState: {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
    ...shadows.sm,
  },
})
