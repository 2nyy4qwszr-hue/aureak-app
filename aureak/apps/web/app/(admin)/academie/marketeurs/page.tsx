'use client'
// Story 87.2 — Page Académie > Marketeurs avec LayoutActivités
import { useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { listMarketers } from '@aureak/api-client'
import type { MarketerListRow } from '@aureak/api-client'
import { AureakText, UserCheckIcon } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

// ── Types locaux ─────────────────────────────────────────────────────────────────
type MarketerDisplay = MarketerListRow & {
  nom   : string
  prenom: string
}

// ── Navigation Académie ───────────────────────────────────────────────────────────
const ACADEMIE_TABS = [
  { label: 'JOUEURS',       href: '/academie/joueurs'       },
  { label: 'COACHS',        href: '/academie/coachs'        },
  { label: 'SCOUTS',        href: '/academie/scouts'        },
  { label: 'MANAGERS',      href: '/academie/managers'      },
  { label: 'COMMERCIAUX',   href: '/academie/commerciaux'   },
  { label: 'MARKETEURS',    href: '/academie/marketeurs'    },
  { label: 'CLUBS',         href: '/academie/clubs'         },
  { label: 'IMPLANTATIONS', href: '/academie/implantations' },
] as const

const PAGE_SIZE = 25

// ── Helper ───────────────────────────────────────────────────────────────────────
function splitName(displayName: string | null): { prenom: string; nom: string } {
  if (!displayName) return { prenom: '—', nom: '—' }
  const parts = displayName.trim().split(' ')
  if (parts.length === 1) return { prenom: parts[0], nom: '—' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}

// ── Page principale ──────────────────────────────────────────────────────────────
export default function AcademieMarketeursPage() {
  const router   = useRouter()
  const pathname = usePathname()

  const [marketers, setMarketers] = useState<MarketerDisplay[]>([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { data: allRows } = await listMarketers({ page: 0, pageSize: 500 })
        if (cancelled) return

        const withNames: MarketerDisplay[] = allRows.map(m => {
          const { prenom, nom } = splitName(m.displayName)
          return { ...m, nom, prenom }
        })

        setMarketers(withNames)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieMarketeursPage] load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const totalPages   = Math.max(1, Math.ceil(marketers.length / PAGE_SIZE))
  const paginated    = marketers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const displayStart = page * PAGE_SIZE + 1
  const displayEnd   = Math.min((page + 1) * PAGE_SIZE, marketers.length)

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* ── headerBlock ── */}
        <View style={s.headerBlock}>
          <View style={s.headerTopRow}>
            <AureakText style={s.pageTitle as TextStyle}>ACADÉMIE</AureakText>
            <Pressable
              onPress={() => router.push('/academie/marketeurs/new' as never)}
              style={({ pressed }) => [s.newBtn, pressed && s.newBtnPressed] as never}
            >
              <AureakText style={s.newBtnLabel as TextStyle}>+ Nouveau marketeur</AureakText>
            </Pressable>
          </View>
          <View style={s.tabsRow}>
            {ACADEMIE_TABS.map(tab => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
              return (
                <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
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
          {/* MARKETEURS total */}
          <View style={s.statCard as never}>
            <AureakText style={s.statCardPicto as TextStyle}>📱</AureakText>
            <AureakText style={s.statCardLabel as TextStyle}>MARKETEURS</AureakText>
            <AureakText style={{ ...s.statCardValue, color: colors.text.dark } as TextStyle}>
              {loading ? '—' : String(marketers.length)}
            </AureakText>
          </View>

          {/* MÉDIAS CE MOIS */}
          <View style={s.statCard as never}>
            <AureakText style={s.statCardPicto as TextStyle}>📸</AureakText>
            <AureakText style={s.statCardLabel as TextStyle}>MÉDIAS CE MOIS</AureakText>
            <AureakText style={{ ...s.statCardValue, color: colors.accent.gold } as TextStyle}>—</AureakText>
          </View>

          {/* POSTS PUBLIÉS */}
          <View style={s.statCard as never}>
            <AureakText style={s.statCardPicto as TextStyle}>📝</AureakText>
            <AureakText style={s.statCardLabel as TextStyle}>POSTS PUBLIÉS</AureakText>
            <AureakText style={{ ...s.statCardValue, color: colors.text.muted } as TextStyle}>—</AureakText>
          </View>

          {/* ENGAGEMENT */}
          <View style={s.statCard as never}>
            <AureakText style={s.statCardPicto as TextStyle}>📈</AureakText>
            <AureakText style={s.statCardLabel as TextStyle}>ENGAGEMENT</AureakText>
            <AureakText style={{ ...s.statCardValue, color: colors.accent.gold } as TextStyle}>—</AureakText>
          </View>
        </View>

        {/* ── FiltresRow : pill TOUS ── */}
        <View style={s.filtresRow}>
          <Pressable style={s.pillActive}>
            <AureakText style={s.pillTextActive as TextStyle}>TOUS</AureakText>
          </Pressable>
        </View>

        {/* ── MarketeursTable ── */}
        {loading ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Chargement…</AureakText>
          </View>
        ) : marketers.length === 0 ? (
          <View style={s.emptyState}>
            <AureakText variant="body" style={s.emptyText}>Aucun marketeur</AureakText>
          </View>
        ) : (
          <View style={s.tableWrapper}>
            {/* En-têtes */}
            <View style={s.tableHeader}>
              <View style={s.cellStatut} />
              <AureakText style={[s.thText, s.cellNom]    as never}>NOM</AureakText>
              <AureakText style={[s.thText, s.cellPrenom]  as never}>PRÉNOM</AureakText>
              <AureakText style={[s.thText, s.cellMedias]  as never}>MÉDIAS REÇUS</AureakText>
              <AureakText style={[s.thText, s.cellPosts]   as never}>POSTS</AureakText>
            </View>

            {/* Lignes */}
            {paginated.map((marketer, idx) => {
              const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
              return (
                <Pressable
                  key={marketer.userId}
                  onPress={() => router.push(`/academie/marketeurs/${marketer.userId}` as never)}
                  style={({ pressed }) => [
                    s.tableRow,
                    { backgroundColor: rowBg },
                    pressed && s.rowPressed,
                  ] as never}
                >
                  <View style={[s.cellStatut, s.cellCenter]}>
                    <UserCheckIcon color={colors.text.muted} size={18} strokeWidth={1.5} />
                  </View>
                  <AureakText variant="body" style={[s.cellNom,    s.cellText]  as never} numberOfLines={1}>{marketer.nom}</AureakText>
                  <AureakText variant="body" style={[s.cellPrenom, s.cellText]  as never} numberOfLines={1}>{marketer.prenom}</AureakText>
                  <AureakText variant="body" style={[s.cellMedias, s.cellMuted] as never} numberOfLines={1}>—</AureakText>
                  <AureakText variant="body" style={[s.cellPosts,  s.cellMuted] as never}>—</AureakText>
                </Pressable>
              )
            })}

            {/* Pagination */}
            <View style={s.pagination}>
              <AureakText variant="caption" style={s.paginationInfo}>
                {marketers.length > 0
                  ? `Affichage de ${displayStart}–${displayEnd} / ${marketers.length} marketeurs`
                  : 'Aucun marketeur'}
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
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl, gap: space.md },

  // ── headerBlock ──
  headerBlock  : { gap: 12 },
  headerTopRow : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle    : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  newBtn       : { backgroundColor: colors.accent.gold, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 8 },
  newBtnPressed: { opacity: 0.8 },
  newBtnLabel  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },
  // Nav tabs
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: colors.accent.gold },
  tabUnderline  : {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },

  // ── StatCards ──
  statCardsRow: {
    flexDirection    : 'row',
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingVertical  : space.md,
    flexWrap         : 'wrap',
  },
  statCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    minWidth       : 160,
    alignItems     : 'center',
    gap            : 4,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  statCardPicto: { fontSize: 22, marginBottom: 2 },
  statCardLabel: {
    fontSize     : 10,
    fontFamily   : fonts.display,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign    : 'center',
  },
  statCardValue: {
    fontSize  : 28,
    fontFamily: fonts.display,
    fontWeight: '900',
  },

  // ── FiltresRow ──
  filtresRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
  },
  pillActive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.accent.gold,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
  pillTextActive: { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.dark },

  // ── MarketeursTable ──
  tableWrapper: {
    borderRadius: 10,
    borderWidth : 1,
    borderColor : colors.border.divider,
    overflow    : 'hidden',
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  thText: {
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
  rowPressed: { opacity: 0.75 },

  // ── Columns ──
  cellStatut: { width: 40 },
  cellNom   : { flex: 1.2, minWidth: 80 },
  cellPrenom: { flex: 1.2, minWidth: 80 },
  cellMedias: { flex: 1.5, minWidth: 100 },
  cellPosts : { width: 90 },

  cellCenter: { alignItems: 'center', justifyContent: 'center' },
  cellText  : { color: colors.text.dark, fontSize: 13 },
  cellMuted : { color: colors.text.muted, fontSize: 13 },

  // ── Pagination ──
  pagination: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.muted,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  },
  paginationInfo    : { color: colors.text.muted, fontSize: 12 },
  paginationBtns    : { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  paginationBtn     : { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light },
  paginationBtnDisabled: { opacity: 0.4 },
  paginationPage    : { color: colors.text.muted, fontSize: 12, paddingHorizontal: space.xs },

  emptyState: { alignItems: 'center', paddingVertical: space.xl },
  emptyText : { color: colors.text.muted },
})
