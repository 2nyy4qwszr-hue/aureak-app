'use client'
// Refonte alignée sur /activites/seances :
//  - Suppression des StatCards
//  - Filtres (Province, Statut) en <select> natif + recherche
//  - Tableau style TableauSeances (border + lignes alternées + pagination)
//  - Mobile : stack de cards (préservé), desktop : table
import { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { View, Pressable, TextInput, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listClubDirectory } from '@aureak/api-client'
import type { ClubDirectoryEntry, BelgianProvince } from '@aureak/types'
import { BELGIAN_PROVINCES } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { InfiniteScrollContainer } from '../../../../components/admin/InfiniteScrollContainer'
import { EmptyState } from '../../../../components/admin/states'
import { FilterSheet } from '../../../../components/admin/FilterSheet'
import { ShieldIcon } from '@aureak/ui'
import { usePaginatedList } from '../../../../hooks/admin/usePaginatedList'
import { AcademieCountsContext } from '../_layout'

const MOBILE_MAX        = 640
const MOBILE_PAGE_SIZE  = 30
const DESKTOP_PAGE_SIZE = 50

type ActifFilter = 'all' | 'actif' | 'inactif'

export default function AcademieClubsPage() {
  const router         = useRouter()
  const academieCounts = useContext(AcademieCountsContext)
  const { width }      = useWindowDimensions()
  const isMobile       = width < MOBILE_MAX

  const [search,   setSearch]   = useState('')
  const [province, setProvince] = useState<BelgianProvince | ''>('')
  const [actif,    setActif]    = useState<ActifFilter>('all')

  return isMobile ? (
    <MobileView
      router={router}
      academieCounts={academieCounts}
      search={search} setSearch={setSearch}
      province={province} setProvince={setProvince}
      actif={actif} setActif={setActif}
    />
  ) : (
    <DesktopView
      router={router}
      academieCounts={academieCounts}
      search={search} setSearch={setSearch}
      province={province} setProvince={setProvince}
      actif={actif} setActif={setActif}
    />
  )
}

type ViewProps = {
  router        : ReturnType<typeof useRouter>
  academieCounts: React.ContextType<typeof AcademieCountsContext>
  search        : string
  setSearch     : (v: string) => void
  province      : BelgianProvince | ''
  setProvince   : (v: BelgianProvince | '') => void
  actif         : ActifFilter
  setActif      : (v: ActifFilter) => void
}

function Filters({
  search, setSearch, province, setProvince, actif, setActif,
}: Pick<ViewProps, 'search' | 'setSearch' | 'province' | 'setProvince' | 'actif' | 'setActif'>) {
  return (
    <View style={s.controls}>
      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput as never}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom, matricule, ville…"
          placeholderTextColor={colors.text.muted}
        />
      </View>
      <FilterSheet
        activeCount={(province !== '' ? 1 : 0) + (actif !== 'all' ? 1 : 0)}
        onReset={() => { setProvince(''); setActif('all') }}
        triggerLabel="Filtrer les clubs"
      >
        <View style={s.selectField}>
          <AureakText style={s.selectLabel}>Province</AureakText>
          <select
            value={province}
            onChange={e => setProvince(e.target.value as BelgianProvince | '')}
            style={selectNativeStyle}
          >
            <option value="">Toutes</option>
            {BELGIAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </View>

        <View style={s.selectField}>
          <AureakText style={s.selectLabel}>Statut</AureakText>
          <select
            value={actif}
            onChange={e => setActif(e.target.value as ActifFilter)}
            style={selectNativeStyle}
          >
            <option value="all">Tous</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </View>
      </FilterSheet>
    </View>
  )
}

function EmptyStateView({ hasFilters }: { hasFilters: boolean }) {
  return (
    <View style={s.emptyStateBox}>
      <EmptyState
        icon={ShieldIcon}
        title="Aucun club"
        message={hasFilters ? 'Aucun résultat pour ces filtres.' : 'L\'annuaire des clubs est vide.'}
      />
    </View>
  )
}

function MobileView(props: ViewProps) {
  const { router, academieCounts, search, province, actif } = props

  const fetchPage = useCallback(async (offset: number, limit: number) => {
    const { data, count, error } = await listClubDirectory({
      page    : Math.floor(offset / limit),
      pageSize: limit,
      search  : search.trim() || undefined,
      province: province || undefined,
      actif   : actif === 'all' ? undefined : actif === 'actif',
    })
    if (error && process.env.NODE_ENV !== 'production') {
      console.error('[academie/clubs] listClubDirectory error:', error)
    }
    return { data, total: count }
  }, [search, province, actif])

  const {
    data: rows, loading, error, hasMore, loadMore, refresh, total,
  } = usePaginatedList<ClubDirectoryEntry>({ fetchPage, pageSize: MOBILE_PAGE_SIZE })

  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, province, actif])

  const hasFilters = !!(search || province || actif !== 'all')
  const isEmpty    = !loading && total === 0

  return (
    <View style={s.page}>
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <InfiniteScrollContainer
        variant="infinite"
        onLoadMore={loadMore}
        hasMore={hasMore}
        loading={loading}
        error={error}
        onRetry={refresh}
        isEmpty={isEmpty}
        emptyState={<EmptyStateView hasFilters={hasFilters} />}
      >
        <View style={s.contentMobile}>
          <Filters {...props} />

          {loading && rows.length === 0 ? (
            <View style={s.loadingState}>
              <AureakText style={s.loadingText}>Chargement…</AureakText>
            </View>
          ) : rows.length > 0 ? (
            <View style={s.mobileStack}>
              {rows.map(row => (
                <Pressable
                  key={row.id}
                  onPress={() => router.push(`/clubs/${row.id}` as never)}
                  style={({ pressed }) => [s.mobileCard, pressed && s.mobileCardPressed] as never}
                >
                  <AureakText style={s.mobileCardTitle as never} numberOfLines={1}>
                    {row.nom}
                  </AureakText>
                  <View style={s.mobileCardMeta}>
                    <AureakText style={s.mobileCardMetaText as never} numberOfLines={1}>
                      {row.ville ?? '—'}
                      {row.province ? ` · ${row.province}` : ''}
                      {row.matricule ? ` · #${row.matricule}` : ''}
                    </AureakText>
                  </View>
                  <View style={s.mobileCardFooter}>
                    <AureakText style={s.mobileCardStat as never}>
                      {row.gardienCount} gardien{row.gardienCount !== 1 ? 's' : ''}
                    </AureakText>
                    <View style={[s.badge, {
                      backgroundColor: row.actif ? colors.status.present + '22' : colors.text.muted + '22',
                      borderColor    : row.actif ? colors.status.present : colors.text.muted,
                    }]}>
                      <AureakText style={{
                        fontSize: 10, fontWeight: '700',
                        color: row.actif ? colors.status.present : colors.text.muted,
                      } as never}>
                        {row.actif ? 'ACTIF' : 'INACTIF'}
                      </AureakText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </InfiniteScrollContainer>
    </View>
  )
}

function DesktopView(props: ViewProps) {
  const { router, academieCounts, search, province, actif } = props

  const [rows,    setRows]    = useState<ClubDirectoryEntry[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<Error | null>(null)

  const genRef = useRef(0)

  const load = useCallback(async () => {
    const gen = ++genRef.current
    setLoading(true)
    try {
      const { data, count, error: err } = await listClubDirectory({
        page,
        pageSize: DESKTOP_PAGE_SIZE,
        search  : search.trim() || undefined,
        province: province || undefined,
        actif   : actif === 'all' ? undefined : actif === 'actif',
      })
      if (gen !== genRef.current) return
      if (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[academie/clubs] listClubDirectory error:', err)
        }
        setError(err instanceof Error ? err : new Error(String(err)))
      } else {
        setError(null)
      }
      setRows(data)
      setTotal(count)
    } finally {
      if (gen === genRef.current) setLoading(false)
    }
  }, [page, search, province, actif])

  useEffect(() => { load() }, [load])

  const filtersMountedRef = useRef(false)
  useEffect(() => {
    if (!filtersMountedRef.current) {
      filtersMountedRef.current = true
      return
    }
    setPage(0)
  }, [search, province, actif])

  const totalPages = Math.max(1, Math.ceil(total / DESKTOP_PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : page * DESKTOP_PAGE_SIZE + 1
  const rangeEnd   = Math.min((page + 1) * DESKTOP_PAGE_SIZE, total)
  const hasFilters = !!(search || province || actif !== 'all')
  const isEmpty    = !loading && total === 0

  return (
    <View style={s.page}>
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <View style={s.desktopScroll}>
        <View style={s.contentDesktop}>
          <Filters {...props} />

          <InfiniteScrollContainer
            variant="paginated"
            onLoadMore={() => { /* paginated = no-op */ }}
            hasMore={false}
            loading={loading}
            error={error}
            onRetry={load}
            isEmpty={isEmpty}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={total}
            unitLabel="clubs"
            emptyState={<EmptyStateView hasFilters={hasFilters} />}
          >
            {loading && rows.length === 0 ? (
              <View style={s.loadingState}>
                <AureakText style={s.loadingText}>Chargement…</AureakText>
              </View>
            ) : rows.length > 0 ? (
              <View style={s.card}>
                <View style={s.tableHeader}>
                  <AureakText style={[s.colHeader, { flex: 2.5 }] as never}>NOM</AureakText>
                  <AureakText style={[s.colHeader, { width: 90 }] as never}>MATRICULE</AureakText>
                  <AureakText style={[s.colHeader, { flex: 1.5 }] as never}>VILLE</AureakText>
                  <AureakText style={[s.colHeader, { width: 100 }] as never}>PROVINCE</AureakText>
                  <AureakText style={[s.colHeader, { width: 70 }] as never}>GARDIENS</AureakText>
                  <AureakText style={[s.colHeader, { width: 70 }] as never}>STATUT</AureakText>
                </View>
                {rows.map((row, idx) => (
                  <Pressable
                    key={row.id}
                    onPress={() => router.push(`/clubs/${row.id}` as never)}
                    style={({ pressed }) => [
                      s.tableRow,
                      { backgroundColor: idx % 2 === 0 ? colors.light.surface : colors.light.muted },
                      pressed && s.rowPressed,
                    ] as never}
                  >
                    <AureakText style={[s.cellText, { flex: 2.5, fontWeight: '600' }] as never} numberOfLines={1}>
                      {row.nom}
                    </AureakText>
                    <AureakText style={[s.cellMuted, { width: 90 }] as never} numberOfLines={1}>
                      {row.matricule ?? '—'}
                    </AureakText>
                    <AureakText style={[s.cellMuted, { flex: 1.5 }] as never} numberOfLines={1}>
                      {row.ville ?? '—'}
                    </AureakText>
                    <AureakText style={[s.cellMuted, { width: 100 }] as never} numberOfLines={1}>
                      {row.province ?? '—'}
                    </AureakText>
                    <AureakText style={[s.cellText, { width: 70, textAlign: 'center' }] as never}>
                      {row.gardienCount}
                    </AureakText>
                    <View style={{ width: 70 }}>
                      <View style={[s.badge, {
                        backgroundColor: row.actif ? colors.status.present + '22' : colors.text.muted + '22',
                        borderColor    : row.actif ? colors.status.present : colors.text.muted,
                      }]}>
                        <AureakText style={{
                          fontSize: 10, fontWeight: '700',
                          color: row.actif ? colors.status.present : colors.text.muted,
                        } as never}>
                          {row.actif ? 'ACTIF' : 'INACTIF'}
                        </AureakText>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </InfiniteScrollContainer>
        </View>
      </View>
    </View>
  )
}

const selectNativeStyle: React.CSSProperties = {
  width        : '100%',
  padding      : '7px 10px',
  fontSize     : 13,
  color        : colors.text.dark,
  background   : colors.light.muted,
  border       : `1px solid ${colors.border.divider}`,
  borderRadius : radius.xs,
  outline      : 'none',
  fontFamily   : fonts.body,
}

const s = StyleSheet.create({
  page    : { flex: 1, backgroundColor: colors.light.primary },

  contentDesktop: { paddingTop: space.md, gap: space.md, paddingBottom: space.xxl },
  contentMobile : { paddingTop: space.md, gap: space.md, paddingBottom: space.xxl },
  desktopScroll: {
    flex     : 1,
    // @ts-ignore web only
    overflowY: 'auto',
  },

  controls: {
    flexDirection    : 'row',
    flexWrap         : 'wrap',
    gap              : space.md,
    paddingHorizontal: space.lg,
    alignItems       : 'center',
  },
  selectField: {
    flexGrow : 1,
    flexBasis: 160,
    gap      : 4,
  },
  selectLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    fontFamily   : fonts.display,
  },

  searchWrap : { flex: 1, minWidth: 200 },
  searchInput: {
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    fontSize         : 13,
    color            : colors.text.dark,
  },

  card: {
    borderRadius    : 10,
    marginHorizontal: space.lg,
    marginBottom    : space.lg,
    overflow        : 'hidden',
    borderWidth     : 1,
    borderColor     : colors.border.divider,
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
  },
  colHeader: {
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
    gap              : space.sm,
  },
  rowPressed: { opacity: 0.75 },
  cellText  : { color: colors.text.dark,  fontSize: 13 },
  cellMuted : { color: colors.text.muted, fontSize: 13 },

  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    alignSelf        : 'flex-start',
  },

  mobileStack: {
    gap             : space.sm,
    paddingHorizontal: space.lg,
  },
  mobileCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    padding        : space.md,
    gap            : space.xs,
    // @ts-ignore web only
    boxShadow      : shadows.sm,
  },
  mobileCardPressed: { opacity: 0.75 },
  mobileCardTitle  : {
    fontSize  : 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color     : colors.text.dark,
  },
  mobileCardMeta    : { flexDirection: 'row' },
  mobileCardMetaText: { fontSize: 13, color: colors.text.muted },
  mobileCardFooter: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    marginTop     : space.xs,
  },
  mobileCardStat: {
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.text.subtle,
  },

  emptyStateBox: {
    padding        : space.xxl,
    alignItems     : 'center',
    gap            : space.xs,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    marginHorizontal: space.lg,
  },

  loadingState: { padding: space.xl, alignItems: 'center' },
  loadingText : { color: colors.text.muted, fontSize: 14 },
})
