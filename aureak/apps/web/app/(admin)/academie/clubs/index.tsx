'use client'
// Story 97.8 — Refonte /academie/clubs : remplace l'ancien redirect vers /clubs
// par une page native Académie (AdminPageHeader + AcademieNavBar + liste).
//
// Story 101.4 — Page pilote pour <InfiniteScrollContainer /> :
//   - Mobile (<640)  : infinite scroll auto via usePaginatedList (pageSize 30)
//   - Desktop (≥640) : pagination classique gérée inline (pageSize 50)
//
// NB : Deux chemins de fetch coexistent (mobile = hook cumulatif, desktop =
// fetch direct par page) car la pagination numérotée n'a pas besoin d'accumuler.
// Approche volontairement simple pour cette page pilote — l'API listClubDirectory
// reste inchangée (pas de modification côté api-client).
//
// DIAGNOSTIC (story 97.8) :
//   - Avant : redirect `router.replace('/clubs')` → cassait la cohérence URL.
//   - Page cible : liste `club_directory` paginée avec filtres nom/province/actif.
//   - Legacy `/clubs` conservée, accessible via "Gestion avancée".
import { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { View, Pressable, TextInput, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listClubDirectory } from '@aureak/api-client'
import type { ClubDirectoryEntry, BelgianProvince } from '@aureak/types'
import { BELGIAN_PROVINCES } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { InfiniteScrollContainer } from '../../../../components/admin/InfiniteScrollContainer'
import { EmptyState } from '../../../../components/admin/states'
import { ShieldIcon } from '@aureak/ui'
import { usePaginatedList } from '../../../../hooks/admin/usePaginatedList'
import { AcademieCountsContext } from '../_layout'

// Breakpoint aligné DataCard/FilterSheet/InfiniteScrollContainer
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

// ─────────────────────────────────────────────────────────────────────────────
// Vue partagée : header + filtres (même JSX desktop/mobile)
// ─────────────────────────────────────────────────────────────────────────────

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
  const hasFilters = search || province || actif !== 'all'
  const handleReset = () => { setSearch(''); setProvince(''); setActif('all') }

  return (
    <>
      <View style={s.filtersRow}>
        <TextInput
          style={s.searchInput as never}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom, matricule, ville…"
          placeholderTextColor={colors.text.muted}
        />
        <View style={s.pillRow}>
          {(['all', 'actif', 'inactif'] as ActifFilter[]).map(k => (
            <Pressable
              key={k}
              onPress={() => setActif(k)}
              style={actif === k ? s.pillActive : s.pillInactive}
            >
              <AureakText style={(actif === k ? s.pillTextActive : s.pillTextInactive) as never}>
                {k === 'all' ? 'Tous' : k === 'actif' ? 'Actifs' : 'Inactifs'}
              </AureakText>
            </Pressable>
          ))}
        </View>
        {hasFilters && (
          <Pressable onPress={handleReset} style={s.resetBtn}>
            <AureakText style={s.resetLabel as never}>✕ Réinit.</AureakText>
          </Pressable>
        )}
      </View>

      <View style={s.provinceRowWrap}>
        <Pressable
          onPress={() => setProvince('')}
          style={province === '' ? s.chipActive : s.chipInactive}
        >
          <AureakText style={(province === '' ? s.chipTextActive : s.chipTextInactive) as never}>
            Toutes provinces
          </AureakText>
        </Pressable>
        {BELGIAN_PROVINCES.map(p => (
          <Pressable
            key={p}
            onPress={() => setProvince(p)}
            style={province === p ? s.chipActive : s.chipInactive}
          >
            <AureakText style={(province === p ? s.chipTextActive : s.chipTextInactive) as never}>
              {p}
            </AureakText>
          </Pressable>
        ))}
      </View>
    </>
  )
}

function StatCards({ total, rows, loading }: { total: number; rows: ClubDirectoryEntry[]; loading: boolean }) {
  return (
    <View style={s.statCardsRow}>
      <View style={s.statCard}>
        <AureakText style={s.statPicto}>🏛️</AureakText>
        <AureakText style={s.statLabel as never}>CLUBS ANNUAIRE</AureakText>
        <AureakText style={s.statValue as never}>{loading && total === 0 ? '—' : String(total)}</AureakText>
      </View>
      <View style={s.statCard}>
        <AureakText style={s.statPicto}>✅</AureakText>
        <AureakText style={s.statLabel as never}>ACTIFS (AFFICHÉS)</AureakText>
        <AureakText style={[s.statValue, { color: colors.status.present }] as never}>
          {loading && rows.length === 0 ? '—' : String(rows.filter(r => r.actif).length)}
        </AureakText>
      </View>
      <View style={s.statCard}>
        <AureakText style={s.statPicto}>📍</AureakText>
        <AureakText style={s.statLabel as never}>PROVINCES</AureakText>
        <AureakText style={s.statValue as never}>
          {loading && rows.length === 0
            ? '—'
            : String(new Set(rows.map(r => r.province).filter(Boolean)).size)}
        </AureakText>
      </View>
    </View>
  )
}

function EmptyStateView({ hasFilters }: { hasFilters: boolean }) {
  // Story 101.5 — consommation pilote du composant générique <EmptyState />
  return (
    <View style={s.emptyState}>
      <EmptyState
        icon={ShieldIcon}
        title="Aucun club"
        message={hasFilters ? 'Aucun résultat pour ces filtres.' : 'L\'annuaire des clubs est vide.'}
      />
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE — infinite scroll via usePaginatedList
// ─────────────────────────────────────────────────────────────────────────────

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

  // Refresh au changement de filtres UNIQUEMENT (pas au mount — le hook s'en charge).
  // Sans ce guard, on déclencherait un double-fetch au mount : le useEffect initial
  // du hook (fetch page 0) PUIS ce useEffect (refresh → fetch page 0). Le generation
  // token du hook évite la corruption de data mais pas le double appel réseau.
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
      <AdminPageHeader
        title="Clubs"
        actionButton={{
          label  : 'Gestion avancée →',
          onPress: () => router.push('/clubs' as never),
        }}
      />
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
        <View style={s.content}>
          <StatCards total={total} rows={rows} loading={loading} />
          <Filters {...props} />

          {loading && rows.length === 0 ? (
            <View style={s.emptyState}>
              <AureakText style={s.emptyText as never}>Chargement…</AureakText>
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

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP — pagination numérotée, fetch direct par page
// ─────────────────────────────────────────────────────────────────────────────

function DesktopView(props: ViewProps) {
  const { router, academieCounts, search, province, actif } = props

  const [rows,    setRows]    = useState<ClubDirectoryEntry[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<Error | null>(null)

  // Generation token anti-race-condition : si un fetch antérieur résout APRÈS un
  // plus récent (ex. user tape vite dans la recherche), on ignore son résultat
  // pour ne pas écraser les données fraîches par des données obsolètes.
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
      if (gen !== genRef.current) return   // stale response — ignore
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

  // Reset page=0 au changement de filtres (skip mount pour éviter double-fetch initial)
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
      <AdminPageHeader
        title="Clubs"
        actionButton={{
          label  : 'Gestion avancée →',
          onPress: () => router.push('/clubs' as never),
        }}
      />
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <View style={s.desktopScroll}>
        <View style={s.content}>
          <StatCards total={total} rows={rows} loading={loading} />
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
              <View style={s.emptyState}>
                <AureakText style={s.emptyText as never}>Chargement…</AureakText>
              </View>
            ) : rows.length > 0 ? (
              <View style={s.table}>
                <View style={s.thead}>
                  <AureakText style={[s.thText, { flex: 2.5 }] as never}>NOM</AureakText>
                  <AureakText style={[s.thText, { width: 90 }] as never}>MATRICULE</AureakText>
                  <AureakText style={[s.thText, { flex: 1.5 }] as never}>VILLE</AureakText>
                  <AureakText style={[s.thText, { width: 100 }] as never}>PROVINCE</AureakText>
                  <AureakText style={[s.thText, { width: 70 }] as never}>GARDIENS</AureakText>
                  <AureakText style={[s.thText, { width: 70 }] as never}>STATUT</AureakText>
                </View>
                {rows.map((row, idx) => (
                  <Pressable
                    key={row.id}
                    onPress={() => router.push(`/clubs/${row.id}` as never)}
                    style={({ pressed }) => [
                      s.tr,
                      { backgroundColor: idx % 2 === 0 ? colors.light.surface : colors.light.muted },
                      pressed && s.trPressed,
                    ] as never}
                  >
                    <AureakText style={[s.cell, { flex: 2.5, fontWeight: '600' }] as never} numberOfLines={1}>
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
                    <AureakText style={[s.cell, { width: 70, textAlign: 'center' }] as never}>
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page    : { flex: 1, backgroundColor: colors.light.primary },
  content : { padding: space.xl, gap: space.md, paddingBottom: space.xxl },
  desktopScroll: {
    flex     : 1,
    // @ts-ignore web only — permet scroll vertical normal en desktop
    overflowY: 'auto',
  },

  statCardsRow: {
    flexDirection: 'row',
    gap          : space.md,
    flexWrap     : 'wrap',
  },
  statCard: {
    flex           : 1,
    minWidth       : 180,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    padding        : space.md,
    alignItems     : 'center',
    gap            : 4,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  statPicto: { fontSize: 22 },
  statLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize  : 28,
    fontWeight: '900',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },

  filtersRow: {
    flexDirection: 'row',
    gap          : space.sm,
    alignItems   : 'center',
    flexWrap     : 'wrap',
  },
  searchInput: {
    flex             : 1,
    minWidth         : 240,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
    color            : colors.text.dark,
    fontSize         : 13,
    fontFamily       : fonts.body,
  },
  pillRow     : { flexDirection: 'row', gap: space.xs },
  pillActive  : {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius   : radius.badge,
    backgroundColor: colors.accent.gold,
    borderWidth    : 1,
    borderColor    : colors.accent.gold,
  },
  pillInactive: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius   : radius.badge,
    backgroundColor: colors.light.muted,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  pillTextActive  : { fontSize: 12, fontWeight: '600', color: colors.text.dark },
  pillTextInactive: { fontSize: 12, fontWeight: '600', color: colors.text.muted },
  resetBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  resetLabel: { color: colors.status.absent, fontSize: 12, fontWeight: '600' },

  provinceRowWrap: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
  },
  chipActive  : {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius   : radius.badge,
    backgroundColor: colors.accent.gold + '22',
    borderWidth    : 1,
    borderColor    : colors.accent.gold,
  },
  chipInactive: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius   : radius.badge,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  chipTextActive  : { fontSize: 11, fontWeight: '700', color: colors.accent.gold },
  chipTextInactive: { fontSize: 11, fontWeight: '500', color: colors.text.muted },

  table: {
    borderRadius: radius.card,
    borderWidth : 1,
    borderColor : colors.border.divider,
    overflow    : 'hidden',
  },
  thead: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
  },
  thText: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tr: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    minHeight        : 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.sm,
  },
  trPressed: { opacity: 0.75 },
  cell     : { color: colors.text.dark, fontSize: 13 },
  cellMuted: { color: colors.text.muted, fontSize: 13 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    alignSelf        : 'flex-start',
  },

  // Mobile stack (story 101.4)
  mobileStack: {
    gap: space.sm,
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
  mobileCardMetaText: {
    fontSize: 13,
    color   : colors.text.muted,
  },
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

  emptyState: {
    padding        : space.xxl,
    alignItems     : 'center',
    gap            : space.xs,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
  },
  emptyIcon   : { fontSize: 40 },
  emptyHeading: { fontSize: 16, fontWeight: '700', color: colors.text.dark },
  emptyText   : { color: colors.text.muted, fontSize: 13 },
})

