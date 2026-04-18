'use client'
// Page Clubs — Template Académie (table view, données depuis club_directory)
import { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { listClubDirectory } from '@aureak/api-client'
import type { ClubDirectoryEntry, ClubRelationType } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

// ── Navigation Académie ───────────────────────────────────────────────────────────
const ACADEMIE_TABS = [
  { label: 'JOUEURS',       href: '/academie/joueurs'       },
  { label: 'COACHS',        href: '/academie/coachs'        },
  { label: 'SCOUTS',        href: '/academie/scouts'        },
  { label: 'MANAGERS',      href: '/academie/managers'      },
  { label: 'CLUBS',         href: '/academie/clubs'         },
  { label: 'IMPLANTATIONS', href: '/academie/implantations' },
] as const

type RelationFilter = 'all' | ClubRelationType
const PAGE_SIZE = 25

const RELATION_LABEL: Record<ClubRelationType, string> = {
  partenaire: 'Partenaire',
  associe   : 'Associé',
  normal    : 'Normal',
}

// ── Page principale ──────────────────────────────────────────────────────────────
export default function AcademieClubsPage() {
  const router   = useRouter()
  const pathname = usePathname()

  const [clubs,          setClubs]          = useState<ClubDirectoryEntry[]>([])
  const [total,          setTotal]          = useState(0)
  const [loading,        setLoading]        = useState(true)
  const [relationFilter, setRelationFilter] = useState<RelationFilter>('all')
  const [page,           setPage]           = useState(0)

  // ── Stats ──
  const [cntTotal,      setCntTotal]      = useState(0)
  const [cntPartenaire, setCntPartenaire] = useState(0)
  const [cntAssocie,    setCntAssocie]    = useState(0)
  const [cntActif,      setCntActif]      = useState(0)

  // ── Chargement stats ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [all, partenaires, associes] = await Promise.all([
          listClubDirectory({ pageSize: 1 }),
          listClubDirectory({ relationTypes: ['partenaire'], pageSize: 1 }),
          listClubDirectory({ relationTypes: ['associe'], pageSize: 1 }),
        ])
        if (cancelled) return
        setCntTotal(all.count)
        setCntPartenaire(partenaires.count)
        setCntAssocie(associes.count)
        setCntActif(all.count) // actif count = total for now
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieClubsPage] loadStats error:', err)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Chargement clubs ──
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await listClubDirectory({
        relationTypes: relationFilter === 'all' ? undefined : [relationFilter as ClubRelationType],
        actif        : true,
        page,
        pageSize     : PAGE_SIZE,
      })
      setClubs(data)
      setTotal(count)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AcademieClubsPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [relationFilter, page])

  useEffect(() => { load() }, [load])

  const totalPages   = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const displayStart = page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, total)

  const handleRelation = (r: RelationFilter) => {
    setRelationFilter(prev => prev === r ? 'all' : r)
    setPage(0)
  }

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <View style={s.headerTopRow}>
            <AureakText style={s.pageTitle as TextStyle}>ACADÉMIE</AureakText>
            <Pressable
              onPress={() => router.push('/clubs/new' as never)}
              style={({ pressed }) => [s.newBtn, pressed && { opacity: 0.8 }] as never}
            >
              <AureakText style={s.newBtnLabel as TextStyle}>+ Nouveau club</AureakText>
            </Pressable>
          </View>
          <View style={s.tabsRow}>
            {ACADEMIE_TABS.map(tab => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
              return (
                <Pressable key={tab.href} onPress={() => router.push(tab.href as never)} style={s.tabItem}>
                  <AureakText style={[s.tabLabel, isActive && s.tabLabelActive] as never}>
                    {tab.label}
                  </AureakText>
                  {isActive && <View style={s.tabUnderline} />}
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* ── StatCards ── */}
        <View style={s.statCardsRow}>
          {([
            { picto: '🏟', label: 'TOTAL CLUBS',   value: loading ? '—' : String(cntTotal),      color: colors.text.dark      },
            { picto: '🤝', label: 'PARTENAIRES',   value: loading ? '—' : String(cntPartenaire),  color: colors.accent.gold    },
            { picto: '🔗', label: 'ASSOCIÉS',      value: loading ? '—' : String(cntAssocie),     color: colors.text.muted     },
            { picto: '✅', label: 'ACTIFS',         value: loading ? '—' : String(cntActif),       color: colors.status.present },
          ] as const).map(card => (
            <View key={card.label} style={s.statCard as never}>
              <AureakText style={s.statCardPicto as TextStyle}>{card.picto}</AureakText>
              <AureakText style={s.statCardLabel as TextStyle}>{card.label}</AureakText>
              <AureakText style={[s.statCardValue, { color: card.color }] as never}>{card.value}</AureakText>
            </View>
          ))}
        </View>

        {/* ── FiltresRow ── */}
        <View style={s.filtresRow}>
          <View style={s.filtresLeft}>
            <Pressable
              style={relationFilter === 'all' ? s.pillActive : s.pillInactive}
              onPress={() => { setRelationFilter('all'); setPage(0) }}
            >
              <AureakText style={(relationFilter === 'all' ? s.pillTextActive : s.pillTextInactive) as TextStyle}>
                TOUS
              </AureakText>
            </Pressable>
            <Pressable
              style={relationFilter === 'partenaire' ? s.pillActive : s.pillInactive}
              onPress={() => handleRelation('partenaire')}
            >
              <AureakText style={(relationFilter === 'partenaire' ? s.pillTextActive : s.pillTextInactive) as TextStyle}>
                PARTENAIRES
              </AureakText>
            </Pressable>
            <Pressable
              style={relationFilter === 'associe' ? s.pillActive : s.pillInactive}
              onPress={() => handleRelation('associe')}
            >
              <AureakText style={(relationFilter === 'associe' ? s.pillTextActive : s.pillTextInactive) as TextStyle}>
                ASSOCIÉS
              </AureakText>
            </Pressable>
            <Pressable
              style={relationFilter === 'normal' ? s.pillActive : s.pillInactive}
              onPress={() => handleRelation('normal')}
            >
              <AureakText style={(relationFilter === 'normal' ? s.pillTextActive : s.pillTextInactive) as TextStyle}>
                NORMAUX
              </AureakText>
            </Pressable>
          </View>
        </View>

        {/* ── Table ── */}
        {loading ? (
          <View style={s.loadingWrapper}>
            <AureakText style={s.loadingText as TextStyle}>Chargement…</AureakText>
          </View>
        ) : clubs.length === 0 ? (
          <View style={s.tableWrapper}>
            <View style={s.tableHeader}>
              <AureakText style={[s.thText, { flex: 1.5, minWidth: 120 }] as never}>NOM</AureakText>
              <AureakText style={[s.thText, { flex: 1, minWidth: 80 }] as never}>VILLE</AureakText>
              <AureakText style={[s.thText, { width: 100 }] as never}>PROVINCE</AureakText>
              <AureakText style={[s.thText, { width: 100 }] as never}>RELATION</AureakText>
              <AureakText style={[s.thText, { width: 80 }] as never}>GARDIENS</AureakText>
            </View>
            <View style={s.emptyRow}>
              <AureakText style={s.emptyText as TextStyle}>Aucun club pour ces filtres</AureakText>
            </View>
          </View>
        ) : (
          <View style={s.tableWrapper}>
            {/* Header */}
            <View style={s.tableHeader}>
              <AureakText style={[s.thText, { flex: 1.5, minWidth: 120 }] as never}>NOM</AureakText>
              <AureakText style={[s.thText, { flex: 1, minWidth: 80 }] as never}>VILLE</AureakText>
              <AureakText style={[s.thText, { width: 100 }] as never}>PROVINCE</AureakText>
              <AureakText style={[s.thText, { width: 100 }] as never}>RELATION</AureakText>
              <AureakText style={[s.thText, { width: 80 }] as never}>GARDIENS</AureakText>
            </View>

            {/* Rows */}
            {clubs.map((club, idx) => {
              const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              return (
                <Pressable
                  key={club.id}
                  onPress={() => router.push(`/clubs/${club.id}` as never)}
                  style={({ pressed }) => [s.tableRow, { backgroundColor: rowBg }, pressed && s.rowPressed] as never}
                >
                  <AureakText style={[s.cellText, { flex: 1.5, minWidth: 120 }] as never} numberOfLines={1}>
                    {club.nom}
                  </AureakText>
                  <AureakText style={[s.cellMuted, { flex: 1, minWidth: 80 }] as never} numberOfLines={1}>
                    {club.ville ?? '—'}
                  </AureakText>
                  <AureakText style={[s.cellMuted, { width: 100 }] as never} numberOfLines={1}>
                    {club.province ?? '—'}
                  </AureakText>
                  <View style={{ width: 100 }}>
                    <View style={[s.relationBadge, club.clubRelationType === 'partenaire' && s.relationBadgeGold]}>
                      <AureakText style={s.relationBadgeText as TextStyle}>
                        {RELATION_LABEL[club.clubRelationType] ?? club.clubRelationType}
                      </AureakText>
                    </View>
                  </View>
                  <AureakText style={[s.cellText, { width: 80, textAlign: 'center' }] as never}>
                    {String(club.gardienCount ?? 0)}
                  </AureakText>
                </Pressable>
              )
            })}

            {/* Pagination */}
            <View style={s.pagination}>
              <AureakText variant="caption" style={s.paginationInfo}>
                {total > 0
                  ? `Affichage de ${displayStart}–${displayEnd} / ${total} clubs`
                  : 'Aucun club'}
              </AureakText>
              <View style={s.paginationBtns}>
                <Pressable
                  onPress={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={[s.paginationBtn, page === 0 && s.paginationBtnDisabled] as never}
                >
                  <AureakText variant="caption" style={{ color: page === 0 ? colors.text.muted : colors.text.dark }}>←</AureakText>
                </Pressable>
                <AureakText variant="caption" style={s.paginationPage}>{page + 1} / {totalPages}</AureakText>
                <Pressable
                  onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={[s.paginationBtn, page >= totalPages - 1 && s.paginationBtnDisabled] as never}
                >
                  <AureakText variant="caption" style={{ color: page >= totalPages - 1 ? colors.text.muted : colors.text.dark }}>→</AureakText>
                </Pressable>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1, backgroundColor: colors.light.primary },
  scrollContent: { paddingTop: space.md, paddingBottom: space.xxl, backgroundColor: colors.light.primary },

  // ── Header ──
  headerBlock  : { backgroundColor: colors.light.primary, gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.lg },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },
  tabsRow      : { flexDirection: 'row', gap: 24, borderBottomWidth: 1, borderBottomColor: colors.border.divider, paddingHorizontal: space.lg },
  tabItem      : { paddingBottom: 10, position: 'relative' },
  tabLabel     : { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.text.subtle, textTransform: 'uppercase' },
  tabLabelActive: { color: colors.accent.gold },
  tabUnderline : { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.accent.gold, borderRadius: 1 },

  // ── StatCards ──
  statCardsRow: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, flexWrap: 'wrap' },
  statCard: {
    flex: 1, minWidth: 160, backgroundColor: colors.light.surface, borderRadius: radius.card,
    padding: space.md, borderWidth: 1, borderColor: colors.border.divider, alignItems: 'center', gap: 4,
    // @ts-ignore web
    boxShadow: shadows.sm,
  },
  statCardPicto: { fontSize: 22, marginBottom: 2 },
  statCardLabel: { fontSize: 10, fontFamily: fonts.display, fontWeight: '700', color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  statCardValue: { fontSize: 28, fontFamily: fonts.display, fontWeight: '900' },

  // ── FiltresRow ──
  filtresRow : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.sm, zIndex: 9999 },
  filtresLeft: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  pillActive      : { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.badge, backgroundColor: colors.accent.gold, borderWidth: 1, borderColor: colors.accent.gold },
  pillInactive    : { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.badge, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light },
  pillTextActive  : { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.dark },
  pillTextInactive: { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.muted },

  // ── Loading ──
  loadingWrapper: { padding: space.xl, alignItems: 'center' },
  loadingText   : { color: colors.text.muted, fontSize: 14, fontFamily: fonts.body },

  // ── Table ──
  tableWrapper: { marginHorizontal: space.lg, marginBottom: space.lg, borderRadius: 10, borderWidth: 1, borderColor: colors.border.divider, overflow: 'hidden' },
  tableHeader : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.light.muted, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  thText      : { fontSize: 10, fontWeight: '700', fontFamily: fonts.display, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1 },
  tableRow    : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  rowPressed  : { backgroundColor: colors.light.hover },
  cellText    : { color: colors.text.dark, fontSize: 13 },
  cellMuted   : { color: colors.text.muted, fontSize: 13 },
  emptyRow    : { paddingVertical: space.xl, alignItems: 'center', backgroundColor: colors.light.surface },
  emptyText   : { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },

  // ── Relation badge ──
  relationBadge    : { borderWidth: 1, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', borderColor: colors.border.divider },
  relationBadgeGold: { borderColor: colors.accent.gold },
  relationBadgeText: { fontSize: 11, fontWeight: '600', color: colors.text.muted },

  // ── Pagination ──
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: space.sm, backgroundColor: colors.light.muted, borderTopWidth: 1, borderTopColor: colors.border.divider },
  paginationInfo       : { color: colors.text.muted, fontSize: 12 },
  paginationBtns       : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  paginationBtn        : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  paginationBtnDisabled: { opacity: 0.4 },
  paginationPage       : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },
})
