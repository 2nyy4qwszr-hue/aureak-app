'use client'
// Story 97.9 — Refonte /academie/implantations
//
// DIAGNOSTIC :
//   - Avant : redirect vers /implantations → onglet IMPLANTATIONS d'AcademieNavBar
//     jamais actif (pathname !== /academie/implantations après redirect).
//   - Page legacy /implantations reste disponible (1729 lignes, riche — map,
//     bulk ops, compare) via CTA "Gestion avancée".
//
// REFONTE : page native alignée au pattern Académie.
import { useContext, useEffect, useState, useCallback } from 'react'
import { View, ScrollView, Pressable, TextInput, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listImplantations } from '@aureak/api-client'
import type { Implantation } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { AcademieCountsContext } from '../_layout'

type ActifFilter = 'all' | 'actives' | 'fermees'

export default function AcademieImplantationsPage() {
  const router         = useRouter()
  const academieCounts = useContext(AcademieCountsContext)
  const { width }      = useWindowDimensions()
  const isMobile       = width <= 640

  const [rows,    setRows]    = useState<Implantation[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<ActifFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await listImplantations()
      if (error && process.env.NODE_ENV !== 'production') {
        console.error('[academie/implantations] load error:', error)
      }
      setRows(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    // Implantation a un deletedAt → soft-delete. Pour "fermees" on utiliserait deletedAt.
    // Le load() filtre déjà deleted_at null, donc toutes les rows sont actives.
    if (filter === 'fermees') return false
    return true
  })

  const withGps    = rows.filter(r => r.gpsLat !== null && r.gpsLon !== null).length
  const withPhoto  = rows.filter(r => r.photoUrl !== null).length
  const hasFilters = search || filter !== 'all'

  return (
    <View style={s.page}>
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.content, isMobile && { padding: 16 }]}>
        {/* Stat cards */}
        <View style={s.statCardsRow}>
          <View style={s.statCard}>
            <AureakText style={s.statPicto}>🏟️</AureakText>
            <AureakText style={s.statLabel as never}>IMPLANTATIONS</AureakText>
            <AureakText style={s.statValue as never}>{loading ? '—' : String(rows.length)}</AureakText>
          </View>
          <View style={s.statCard}>
            <AureakText style={s.statPicto}>📍</AureakText>
            <AureakText style={s.statLabel as never}>GPS CONFIGURÉS</AureakText>
            <AureakText style={[s.statValue, { color: colors.status.present }] as never}>
              {loading ? '—' : String(withGps)}
            </AureakText>
          </View>
          <View style={s.statCard}>
            <AureakText style={s.statPicto}>📸</AureakText>
            <AureakText style={s.statLabel as never}>AVEC PHOTO</AureakText>
            <AureakText style={[s.statValue, { color: colors.accent.gold }] as never}>
              {loading ? '—' : String(withPhoto)}
            </AureakText>
          </View>
        </View>

        {/* Filtres */}
        <View style={s.filtersRow}>
          <TextInput
            style={s.searchInput as never}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher par nom…"
            placeholderTextColor={colors.text.muted}
          />
          <View style={s.pillRow}>
            {(['all', 'actives', 'fermees'] as ActifFilter[]).map(k => (
              <Pressable
                key={k}
                onPress={() => setFilter(k)}
                style={filter === k ? s.pillActive : s.pillInactive}
              >
                <AureakText style={(filter === k ? s.pillTextActive : s.pillTextInactive) as never}>
                  {k === 'all' ? 'Toutes' : k === 'actives' ? 'Actives' : 'Fermées'}
                </AureakText>
              </Pressable>
            ))}
          </View>
          {hasFilters && (
            <Pressable onPress={() => { setSearch(''); setFilter('all') }} style={s.resetBtn}>
              <AureakText style={s.resetLabel as never}>✕ Réinit.</AureakText>
            </Pressable>
          )}
        </View>

        {/* Grid cards */}
        {loading ? (
          <View style={s.emptyState}>
            <AureakText style={s.emptyText as never}>Chargement…</AureakText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <AureakText style={s.emptyIcon}>🏟️</AureakText>
            <AureakText style={s.emptyHeading as never}>Aucune implantation</AureakText>
            <AureakText style={s.emptyText as never}>
              {hasFilters ? 'Aucun résultat pour ces filtres.' : 'Aucune implantation configurée.'}
            </AureakText>
          </View>
        ) : (
          <View style={s.grid}>
            {filtered.map(impl => (
              <Pressable
                key={impl.id}
                onPress={() => router.push('/implantations' as never)}
                style={({ pressed }) => [s.card, pressed && s.cardPressed] as never}
              >
                <View style={s.cardAccent} />
                <View style={s.cardBody}>
                  <AureakText style={s.cardTitle as never} numberOfLines={1}>{impl.name}</AureakText>
                  {impl.address && (
                    <AureakText style={s.cardMeta as never} numberOfLines={2}>
                      📍 {impl.address}
                    </AureakText>
                  )}
                  <View style={s.cardChips}>
                    {impl.gpsLat !== null && impl.gpsLon !== null && (
                      <View style={[s.chip, { backgroundColor: colors.status.present + '22', borderColor: colors.status.present }]}>
                        <AureakText style={[s.chipText, { color: colors.status.present }] as never}>GPS</AureakText>
                      </View>
                    )}
                    {impl.photoUrl && (
                      <View style={[s.chip, { backgroundColor: colors.accent.gold + '22', borderColor: colors.accent.gold }]}>
                        <AureakText style={[s.chipText, { color: colors.accent.gold }] as never}>PHOTO</AureakText>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
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

  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  card: {
    flex           : 1,
    minWidth       : 260,
    maxWidth       : 360,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  cardPressed: { opacity: 0.85 },
  cardAccent : { height: 3, backgroundColor: colors.accent.gold },
  cardBody   : { padding: space.md, gap: space.xs },
  cardTitle  : {
    fontSize  : 15,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  cardMeta   : { fontSize: 12, color: colors.text.muted, lineHeight: 18 },
  cardChips  : { flexDirection: 'row', gap: space.xs, marginTop: 4 },
  chip       : {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius     : radius.badge,
    borderWidth      : 1,
  },
  chipText   : { fontSize: 10, fontWeight: '700' },

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
