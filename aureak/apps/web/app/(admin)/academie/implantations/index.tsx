'use client'
// Page Implantations — Template Académie (table view, données depuis listImplantations)
import { useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { listImplantations } from '@aureak/api-client'
import type { Implantation } from '@aureak/types'
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

const PAGE_SIZE = 25

// ── Page principale ──────────────────────────────────────────────────────────────
export default function AcademieImplantationsPage() {
  const router   = useRouter()
  const pathname = usePathname()

  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [loading,       setLoading]       = useState(true)
  const [page,          setPage]          = useState(0)

  // ── Chargement ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await listImplantations()
        if (!cancelled) setImplantations(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieImplantationsPage] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Stats dérivées ──
  const totalCount  = implantations.length
  const withGps     = implantations.filter(i => i.gpsLat != null && i.gpsLon != null).length
  const withPhoto   = implantations.filter(i => i.photoUrl).length
  const totalCapa   = implantations.reduce((sum, i) => sum + (i.maxPlayers ?? 0), 0)

  // ── Pagination ──
  const totalPages   = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const paginated    = implantations.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const displayStart = page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, totalCount)

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <View style={s.headerTopRow}>
            <AureakText style={s.pageTitle as TextStyle}>ACADÉMIE</AureakText>
            <Pressable
              onPress={() => router.push('/implantations?create=true' as never)}
              style={({ pressed }) => [s.newBtn, pressed && { opacity: 0.8 }] as never}
            >
              <AureakText style={s.newBtnLabel as TextStyle}>+ Nouvelle implantation</AureakText>
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
            { picto: '📍', label: 'IMPLANTATIONS', value: loading ? '—' : String(totalCount), color: colors.text.dark      },
            { picto: '🗺',  label: 'GÉOLOCALISÉES', value: loading ? '—' : String(withGps),    color: colors.accent.gold    },
            { picto: '📷', label: 'AVEC PHOTO',     value: loading ? '—' : String(withPhoto),   color: colors.text.muted     },
            { picto: '👥', label: 'CAPACITÉ TOTALE', value: loading ? '—' : String(totalCapa),  color: colors.status.present },
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
          <Pressable style={s.pillActive}>
            <AureakText style={s.pillTextActive as TextStyle}>TOUTES</AureakText>
          </Pressable>
        </View>

        {/* ── Table ── */}
        {loading ? (
          <View style={s.loadingWrapper}>
            <AureakText style={s.loadingText as TextStyle}>Chargement…</AureakText>
          </View>
        ) : implantations.length === 0 ? (
          <View style={s.tableWrapper}>
            <View style={s.tableHeader}>
              <AureakText style={[s.thText, { flex: 1.5, minWidth: 120 }] as never}>NOM</AureakText>
              <AureakText style={[s.thText, { flex: 1.5, minWidth: 120 }] as never}>ADRESSE</AureakText>
              <AureakText style={[s.thText, { width: 90 }] as never}>CAPACITÉ</AureakText>
              <AureakText style={[s.thText, { width: 60 }] as never}>GPS</AureakText>
              <AureakText style={[s.thText, { width: 60 }] as never}>PHOTO</AureakText>
            </View>
            <View style={s.emptyRow}>
              <AureakText style={s.emptyText as TextStyle}>Aucune implantation enregistrée</AureakText>
            </View>
          </View>
        ) : (
          <View style={s.tableWrapper}>
            {/* Header */}
            <View style={s.tableHeader}>
              <AureakText style={[s.thText, { flex: 1.5, minWidth: 120 }] as never}>NOM</AureakText>
              <AureakText style={[s.thText, { flex: 1.5, minWidth: 120 }] as never}>ADRESSE</AureakText>
              <AureakText style={[s.thText, { width: 90 }] as never}>CAPACITÉ</AureakText>
              <AureakText style={[s.thText, { width: 60 }] as never}>GPS</AureakText>
              <AureakText style={[s.thText, { width: 60 }] as never}>PHOTO</AureakText>
            </View>

            {/* Rows */}
            {paginated.map((impl, idx) => {
              const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              return (
                <Pressable
                  key={impl.id}
                  onPress={() => router.push(`/implantations?selected=${impl.id}` as never)}
                  style={({ pressed }) => [s.tableRow, { backgroundColor: rowBg }, pressed && s.rowPressed] as never}
                >
                  <AureakText style={[s.cellText, { flex: 1.5, minWidth: 120 }] as never} numberOfLines={1}>
                    {impl.name}
                  </AureakText>
                  <AureakText style={[s.cellMuted, { flex: 1.5, minWidth: 120 }] as never} numberOfLines={1}>
                    {impl.address ?? '—'}
                  </AureakText>
                  <AureakText style={[s.cellText, { width: 90, textAlign: 'center' }] as never}>
                    {impl.maxPlayers ? String(impl.maxPlayers) : '—'}
                  </AureakText>
                  <View style={{ width: 60, alignItems: 'center' }}>
                    <AureakText style={{ color: impl.gpsLat != null && impl.gpsLon != null ? colors.status.present : colors.text.muted, fontSize: 13 }}>
                      {impl.gpsLat != null && impl.gpsLon != null ? '✓' : '—'}
                    </AureakText>
                  </View>
                  <View style={{ width: 60, alignItems: 'center' }}>
                    <AureakText style={{ color: impl.photoUrl ? colors.status.present : colors.text.muted, fontSize: 13 }}>
                      {impl.photoUrl ? '✓' : '—'}
                    </AureakText>
                  </View>
                </Pressable>
              )
            })}

            {/* Pagination */}
            <View style={s.pagination}>
              <AureakText variant="caption" style={s.paginationInfo}>
                {totalCount > 0
                  ? `Affichage de ${displayStart}–${displayEnd} / ${totalCount} implantations`
                  : 'Aucune implantation'}
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
  scrollContent: { paddingTop: space.md, paddingBottom: space.xxl, backgroundColor: colors.light.primary, maxWidth: 1200, alignSelf: 'center', width: '100%' },

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
  filtresRow     : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.sm, zIndex: 9999 },
  pillActive     : { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.badge, backgroundColor: colors.accent.gold, borderWidth: 1, borderColor: colors.accent.gold },
  pillTextActive : { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.dark },

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

  // ── Pagination ──
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: space.sm, backgroundColor: colors.light.muted, borderTopWidth: 1, borderTopColor: colors.border.divider },
  paginationInfo       : { color: colors.text.muted, fontSize: 12 },
  paginationBtns       : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  paginationBtn        : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  paginationBtnDisabled: { opacity: 0.4 },
  paginationPage       : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },
})
