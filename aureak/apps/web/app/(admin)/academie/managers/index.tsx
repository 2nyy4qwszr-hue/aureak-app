'use client'
// Page Managers — Template Académie (stub, pas d'API managers encore)
import { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
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

export default function AcademieManagersPage() {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <View style={s.headerTopRow}>
            <AureakText style={s.pageTitle as TextStyle}>ACADÉMIE</AureakText>
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
            { picto: '👔', label: 'MANAGERS',       value: '—', color: colors.text.dark     },
            { picto: '📊', label: 'IMPLANTATIONS',  value: '—', color: colors.accent.gold   },
            { picto: '📅', label: 'ÉVÉNEMENTS',     value: '—', color: colors.text.muted    },
            { picto: '⭐', label: 'SCORE GESTION',  value: '—', color: colors.status.warning },
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
            <AureakText style={s.pillTextActive as TextStyle}>TOUS</AureakText>
          </Pressable>
        </View>

        {/* ── Table (empty state) ── */}
        <View style={s.tableWrapper}>
          <View style={s.tableHeader}>
            <AureakText style={[s.thText, { flex: 1.2, minWidth: 80 }] as never}>NOM</AureakText>
            <AureakText style={[s.thText, { flex: 1.2, minWidth: 80 }] as never}>PRÉNOM</AureakText>
            <AureakText style={[s.thText, { flex: 1.5, minWidth: 100 }] as never}>IMPLANTATION</AureakText>
            <AureakText style={[s.thText, { width: 90 }] as never}>RÔLE</AureakText>
            <AureakText style={[s.thText, { width: 90 }] as never}>STATUT</AureakText>
          </View>
          <View style={s.emptyRow}>
            <AureakText style={s.emptyText as TextStyle}>Bientôt disponible — aucun manager enregistré</AureakText>
          </View>
        </View>

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
  filtresRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.sm, zIndex: 9999 },
  pillActive      : { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.badge, backgroundColor: colors.accent.gold, borderWidth: 1, borderColor: colors.accent.gold },
  pillTextActive  : { fontSize: 12, fontWeight: '600', fontFamily: fonts.body, color: colors.text.dark },

  // ── Table ──
  tableWrapper: { marginHorizontal: space.lg, marginBottom: space.lg, borderRadius: 10, borderWidth: 1, borderColor: colors.border.divider, overflow: 'hidden' },
  tableHeader : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.light.muted, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  thText      : { fontSize: 10, fontWeight: '700', fontFamily: fonts.display, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1 },
  emptyRow    : { paddingVertical: space.xl, alignItems: 'center', backgroundColor: colors.light.surface },
  emptyText   : { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },
})
