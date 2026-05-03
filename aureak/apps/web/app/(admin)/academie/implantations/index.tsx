'use client'
// Refonte alignée sur /activites/seances :
//  - Suppression des StatCards
//  - Filtres (Statut) en <select> natif + recherche
//  - Tableau style TableauSeances (border + lignes alternées)
//  - Le grid de cards est remplacé par une vraie table.
import { useContext, useEffect, useState, useCallback } from 'react'
import { View, ScrollView, Pressable, TextInput, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listImplantations } from '@aureak/api-client'
import type { Implantation } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { AcademieNavBar } from '../../../../components/admin/academie/AcademieNavBar'
import { FilterSheet } from '../../../../components/admin/FilterSheet'
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
    // Le load() ne renvoie que les implantations non supprimées (deleted_at IS NULL).
    if (filter === 'fermees') return false
    return true
  })

  return (
    <View style={s.page}>
      <AcademieNavBar counts={academieCounts ?? undefined} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        <View style={s.controls}>
          <View style={s.searchWrap}>
            <TextInput
              style={s.searchInput as never}
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher par nom…"
              placeholderTextColor={colors.text.muted}
            />
          </View>
          <FilterSheet
            activeCount={filter !== 'all' ? 1 : 0}
            onReset={() => setFilter('all')}
            triggerLabel="Filtrer les implantations"
          >
            <View style={s.selectField}>
              <AureakText style={s.selectLabel}>Statut</AureakText>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as ActifFilter)}
                style={selectNativeStyle}
              >
                <option value="all">Toutes</option>
                <option value="actives">Actives</option>
                <option value="fermees">Fermées</option>
              </select>
            </View>
          </FilterSheet>
        </View>

        {loading ? (
          <View style={s.loadingState}>
            <AureakText style={s.loadingText}>Chargement…</AureakText>
          </View>
        ) : (
          <View style={[s.card, isMobile && s.cardMobile]}>
            {!isMobile && (
              <View style={s.tableHeader}>
                <AureakText style={[s.colHeader, { flex: 1.5, minWidth: 120 }] as never}>NOM</AureakText>
                <AureakText style={[s.colHeader, { flex: 2,   minWidth: 160 }] as never}>ADRESSE</AureakText>
                <AureakText style={[s.colHeader, { width: 80 }] as never}>GPS</AureakText>
                <AureakText style={[s.colHeader, { width: 80 }] as never}>PHOTO</AureakText>
                <View style={{ width: 28 }} />
              </View>
            )}

            {filtered.length === 0 ? (
              <View style={s.emptyRow}>
                <AureakText style={s.emptyText}>Aucune implantation pour ces filtres.</AureakText>
              </View>
            ) : filtered.map((impl, idx) => {
              const rowBg  = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              const hasGps = impl.gpsLat !== null && impl.gpsLon !== null
              return (
                <Pressable
                  key={impl.id}
                  onPress={() => router.push('/implantations' as never)}
                  style={({ pressed }) => [s.tableRow, { backgroundColor: rowBg }, pressed && { opacity: 0.8 }] as never}
                >
                  <AureakText style={[s.cellText, { flex: 1.5, minWidth: 120, fontWeight: '600' }] as never} numberOfLines={1}>
                    {impl.name}
                  </AureakText>
                  <AureakText style={[s.cellMuted, { flex: 2, minWidth: 160 }] as never} numberOfLines={1}>
                    {impl.address ?? '—'}
                  </AureakText>
                  <View style={{ width: 80 }}>
                    {hasGps ? (
                      <View style={[s.miniBadge, { backgroundColor: colors.status.present + '22', borderColor: colors.status.present }]}>
                        <AureakText style={[s.miniBadgeText, { color: colors.status.present }] as never}>GPS</AureakText>
                      </View>
                    ) : (
                      <AureakText style={s.cellMuted}>—</AureakText>
                    )}
                  </View>
                  <View style={{ width: 80 }}>
                    {impl.photoUrl ? (
                      <View style={[s.miniBadge, { backgroundColor: colors.accent.gold + '22', borderColor: colors.accent.gold }]}>
                        <AureakText style={[s.miniBadgeText, { color: colors.accent.gold }] as never}>PHOTO</AureakText>
                      </View>
                    ) : (
                      <AureakText style={s.cellMuted}>—</AureakText>
                    )}
                  </View>
                  <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                    <AureakText style={{ color: colors.text.muted }}>›</AureakText>
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}
      </ScrollView>
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
  content : { paddingTop: space.md, paddingBottom: 64, gap: space.md },

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
  cardMobile: { marginHorizontal: space.sm },

  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
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
  },
  cellText : { color: colors.text.dark,  fontSize: 13 },
  cellMuted: { color: colors.text.muted, fontSize: 13 },

  miniBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    alignSelf        : 'flex-start',
  },
  miniBadgeText: { fontSize: 10, fontWeight: '700' },

  emptyRow : { padding: space.xl, alignItems: 'center', backgroundColor: colors.light.surface },
  emptyText: { color: colors.text.muted, fontSize: 14, fontFamily: fonts.body },

  loadingState: { padding: space.xl, alignItems: 'center' },
  loadingText : { color: colors.text.muted, fontSize: 14 },
})
