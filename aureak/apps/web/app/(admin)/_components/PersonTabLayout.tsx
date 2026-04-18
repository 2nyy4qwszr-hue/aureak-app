'use client'
// Story 87.3 — Composant partagé de fiche personne avec onglets (Profil/Acces/Activite)
// Utilisé par : commerciaux, marketeurs, coachs, scouts, managers
import { useState, type ReactNode } from 'react'
import { View, ScrollView, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'

// ── Types ────────────────────────────────────────────────────────────────────────
export type PersonTab = {
  key   : string
  label : string
  render: () => ReactNode
  /** Called when the tab is selected (for lazy loading) */
  onSelect?: () => void
}

export type PersonTabLayoutProps = {
  /** Display name shown in header (or 'Chargement...' when loading) */
  displayName : string
  /** Whether the initial data is still loading */
  loading     : boolean
  /** Tab definitions — first tab is selected by default */
  tabs        : PersonTab[]
  /** Default selected tab key (defaults to first tab) */
  defaultTab? : string
  /** Optional extra content rendered after the header and before the tabs (e.g. subtitle) */
  headerExtra?: ReactNode
}

// ── Helper ───────────────────────────────────────────────────────────────────────
export function splitName(displayName: string | null): { prenom: string; nom: string } {
  if (!displayName) return { prenom: '—', nom: '—' }
  const parts = displayName.trim().split(' ')
  if (parts.length === 1) return { prenom: parts[0], nom: '—' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}

// ── Component ────────────────────────────────────────────────────────────────────
export default function PersonTabLayout({
  displayName,
  loading,
  tabs,
  defaultTab,
  headerExtra,
}: PersonTabLayoutProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>(defaultTab ?? tabs[0]?.key ?? '')

  const handleTabPress = (tab: PersonTab) => {
    setActiveTab(tab.key)
    tab.onSelect?.()
  }

  const currentTab = tabs.find(t => t.key === activeTab)

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* ── Header ── */}
        <View style={s.headerBlock}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <AureakText style={s.backLabel as TextStyle}>{'\u2190'} Retour</AureakText>
          </Pressable>
          <AureakText style={s.pageTitle as TextStyle}>
            {loading ? 'Chargement\u2026' : displayName}
          </AureakText>
          {headerExtra}
        </View>

        {/* ── Onglets ── */}
        <View style={s.tabsRow}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <Pressable key={tab.key} onPress={() => handleTabPress(tab)}>
                <AureakText style={[s.tabLabel, isActive && s.tabLabelActive] as never}>
                  {tab.label}
                </AureakText>
                {isActive && <View style={s.tabUnderline} />}
              </Pressable>
            )
          })}
        </View>

        {/* ── Contenu de l'onglet actif ── */}
        <View style={s.section}>
          {currentTab?.render()}
        </View>

      </ScrollView>
    </View>
  )
}

// ── Shared sub-components for Profil tab ─────────────────────────────────────────
export function ProfileInfoCard({ fields }: { fields: { label: string; value: string }[] }) {
  return (
    <View style={s.infoCard as never}>
      {fields.map((field, i) => (
        <View key={field.label}>
          {i > 0 && <View style={s.infoDivider} />}
          <View style={s.infoRow}>
            <AureakText style={s.infoLabel as TextStyle}>{field.label}</AureakText>
            <AureakText style={s.infoValue as TextStyle}>{field.value}</AureakText>
          </View>
        </View>
      ))}
    </View>
  )
}

export function ActivityPlaceholder({
  message,
  linkLabel,
  linkRoute,
}: {
  message   : string
  linkLabel : string
  linkRoute : string
}) {
  const router = useRouter()
  return (
    <View style={s.infoCard as never}>
      <AureakText variant="body" style={s.emptyText}>
        {message}
      </AureakText>
      <View style={{ height: space.md }} />
      <Pressable
        onPress={() => router.push(linkRoute as never)}
        style={({ pressed }) => [s.activityLink, pressed && { opacity: 0.7 }] as never}
      >
        <AureakText style={s.activityLinkText as TextStyle}>
          {linkLabel}
        </AureakText>
      </Pressable>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl, gap: space.md },

  // ── Header ──
  headerBlock: { gap: 8 },
  backBtn    : { alignSelf: 'flex-start', marginBottom: 4 },
  backLabel  : { fontSize: 13, color: colors.accent.gold, fontWeight: '600' },
  pageTitle  : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },

  // ── Tabs ──
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

  // ── Section ──
  section: { gap: space.md },

  // ── InfoCard ──
  infoCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  infoRow    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoLabel  : { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  infoValue  : { fontSize: 13, fontWeight: '500', color: colors.text.dark },
  infoDivider: { height: 1, backgroundColor: colors.border.divider },

  // ── Activity link ──
  activityLink: {
    alignSelf        : 'flex-start',
    paddingVertical  : 8,
    paddingHorizontal: 12,
    backgroundColor  : colors.accent.gold,
    borderRadius     : radius.xs,
  },
  activityLinkText: { fontSize: 13, fontWeight: '700', color: colors.text.dark },

  emptyText: { color: colors.text.muted, textAlign: 'center' },
})
