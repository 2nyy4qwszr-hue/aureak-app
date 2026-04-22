'use client'
// Story 97.8 — Refonte /academie/clubs : remplace l'ancien redirect vers /clubs
// par une page native Académie (AdminPageHeader + AcademieNavBar + liste).
//
// DIAGNOSTIC :
//   - Avant : redirect `router.replace('/clubs')` → cassait la cohérence URL de
//     l'onglet CLUBS d'AcademieNavBar (active=false sur /clubs).
//   - Page cible : liste `club_directory` paginée avec filtres nom/province/actif.
//   - Legacy `/clubs` conservée (tickets internes, Import RBFA, bouton + Nouveau),
//     accessibles depuis cette page via "Voir gestion avancée".
import { useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { View, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { listClubDirectory } from '@aureak/api-client'
import type { ClubDirectoryEntry, BelgianProvince } from '@aureak/types'
import { BELGIAN_PROVINCES } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { AcademieCountsContext } from '../_layout'

const PAGE_SIZE = 50

type ActifFilter = 'all' | 'actif' | 'inactif'

export default function AcademieClubsPage() {
  const router         = useRouter()
  const academieCounts = useContext(AcademieCountsContext)

  const [rows,     setRows]     = useState<ClubDirectoryEntry[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [province, setProvince] = useState<BelgianProvince | ''>('')
  const [actif,    setActif]    = useState<ActifFilter>('all')
  const [page,     setPage]     = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count, error } = await listClubDirectory({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        province: province || undefined,
        actif: actif === 'all' ? undefined : actif === 'actif',
      })
      if (error && process.env.NODE_ENV !== 'production') {
        console.error('[academie/clubs] listClubDirectory error:', error)
      }
      setRows(data)
      setTotal(count)
    } finally {
      setLoading(false)
    }
  }, [page, search, province, actif])

  useEffect(() => { load() }, [load])

  const handleSearch = useCallback((v: string) => {
    setSearch(v)
    setPage(0)
  }, [])

  const handleReset = useCallback(() => {
    setSearch('')
    setProvince('')
    setActif('all')
    setPage(0)
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1
  const rangeEnd   = Math.min((page + 1) * PAGE_SIZE, total)

  const hasFilters = search || province || actif !== 'all'

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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        {/* Stat cards */}
        <View style={s.statCardsRow}>
          <View style={s.statCard}>
            <AureakText style={s.statPicto}>🏛️</AureakText>
            <AureakText style={s.statLabel as never}>CLUBS ANNUAIRE</AureakText>
            <AureakText style={s.statValue as never}>{loading ? '—' : String(total)}</AureakText>
          </View>
          <View style={s.statCard}>
            <AureakText style={s.statPicto}>✅</AureakText>
            <AureakText style={s.statLabel as never}>ACTIFS (SUR PAGE)</AureakText>
            <AureakText style={[s.statValue, { color: colors.status.present }] as never}>
              {loading ? '—' : String(rows.filter(r => r.actif).length)}
            </AureakText>
          </View>
          <View style={s.statCard}>
            <AureakText style={s.statPicto}>📍</AureakText>
            <AureakText style={s.statLabel as never}>PROVINCES</AureakText>
            <AureakText style={s.statValue as never}>
              {loading ? '—' : String(new Set(rows.map(r => r.province).filter(Boolean)).size)}
            </AureakText>
          </View>
        </View>

        {/* Filtres */}
        <View style={s.filtersRow}>
          <TextInput
            style={s.searchInput as never}
            value={search}
            onChangeText={handleSearch}
            placeholder="Rechercher par nom, matricule, ville…"
            placeholderTextColor={colors.text.muted}
          />
          <View style={s.pillRow}>
            {(['all', 'actif', 'inactif'] as ActifFilter[]).map(k => (
              <Pressable
                key={k}
                onPress={() => { setActif(k); setPage(0) }}
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

        {/* Province chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.provinceRow}>
          <Pressable
            onPress={() => { setProvince(''); setPage(0) }}
            style={province === '' ? s.chipActive : s.chipInactive}
          >
            <AureakText style={(province === '' ? s.chipTextActive : s.chipTextInactive) as never}>
              Toutes provinces
            </AureakText>
          </Pressable>
          {BELGIAN_PROVINCES.map(p => (
            <Pressable
              key={p}
              onPress={() => { setProvince(p); setPage(0) }}
              style={province === p ? s.chipActive : s.chipInactive}
            >
              <AureakText style={(province === p ? s.chipTextActive : s.chipTextInactive) as never}>
                {p}
              </AureakText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Table */}
        {loading ? (
          <View style={s.emptyState}>
            <AureakText style={s.emptyText as never}>Chargement…</AureakText>
          </View>
        ) : rows.length === 0 ? (
          <View style={s.emptyState}>
            <AureakText style={s.emptyIcon}>🏛️</AureakText>
            <AureakText style={s.emptyHeading as never}>Aucun club</AureakText>
            <AureakText style={s.emptyText as never}>
              {hasFilters ? 'Aucun résultat pour ces filtres.' : 'L\'annuaire des clubs est vide.'}
            </AureakText>
          </View>
        ) : (
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
        )}

        {/* Pagination */}
        {rows.length > 0 && totalPages > 1 && (
          <View style={s.pagination}>
            <AureakText style={s.paginationInfo as never}>
              {rangeStart}–{rangeEnd} / {total} clubs
            </AureakText>
            <View style={s.paginationBtns}>
              <Pressable
                disabled={page === 0}
                onPress={() => setPage(p => Math.max(0, p - 1))}
                style={[s.pageBtn, page === 0 && s.pageBtnDisabled] as never}
              >
                <AureakText style={{ color: page === 0 ? colors.text.muted : colors.text.dark } as never}>←</AureakText>
              </Pressable>
              <AureakText style={s.paginationPage as never}>{page + 1} / {totalPages}</AureakText>
              <Pressable
                disabled={page >= totalPages - 1}
                onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                style={[s.pageBtn, page >= totalPages - 1 && s.pageBtnDisabled] as never}
              >
                <AureakText style={{ color: page >= totalPages - 1 ? colors.text.muted : colors.text.dark } as never}>→</AureakText>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page    : { flex: 1, backgroundColor: colors.light.primary },
  content : { padding: space.xl, gap: space.md, paddingBottom: space.xxl },

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

  provinceRow : { flexDirection: 'row', gap: space.xs },
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

  pagination: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  paginationInfo: { color: colors.text.muted, fontSize: 12 },
  paginationBtns: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  pageBtn: {
    paddingHorizontal: space.sm, paddingVertical: 4,
    borderRadius   : radius.xs,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  pageBtnDisabled: { opacity: 0.4 },
  paginationPage : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },
})
