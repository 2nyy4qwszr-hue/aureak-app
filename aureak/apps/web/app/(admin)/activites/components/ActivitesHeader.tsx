'use client'
// Story 80-1 — Uniformisation design headerBlock (pattern Méthodologie)
// Story 93-2 — Prop counts optionnelle pour badges de count sur onglets
// Story 93-7 — Bouton "+ Nouvelle séance" déplacé en AdminTopbar (desktop), conservé sur mobile.
//             Subtab actif : texte noir + underline gold (alignement template).
import React from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { SubtabCount } from '../../_components/SubtabCount'

const TABS = [
  { key: 'seances',     label: 'SÉANCES',     href: '/activites' },
  { key: 'presences',   label: 'PRÉSENCES',   href: '/activites/presences' },
  { key: 'evaluations', label: 'ÉVALUATIONS', href: '/activites/evaluations' },
] as const

type TabKey = typeof TABS[number]['key']

const MOBILE_BREAKPOINT = 768

export type ActivitesHeaderProps = {
  counts?: {
    seances    ?: number | null
    presences  ?: number | null
    evaluations?: number | null
  }
}

function getActiveTab(pathname: string): TabKey {
  if (pathname.endsWith('/presences'))   return 'presences'
  if (pathname.endsWith('/evaluations')) return 'evaluations'
  return 'seances'
}

export function ActivitesHeader({ counts }: ActivitesHeaderProps = {}) {
  const router    = useRouter()
  const pathname  = usePathname()
  const { width } = useWindowDimensions()
  const activeTab = getActiveTab(pathname)
  const isMobile  = width < MOBILE_BREAKPOINT

  return (
    <View style={styles.headerBlock}>
      {/* Story 93.7 — Bouton "+ Nouvelle séance" conservé uniquement sur mobile (Topbar masquée) */}
      {isMobile && (
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.push('/(admin)/seances/new')}
            style={styles.newBtn}
          >
            <AureakText style={styles.newBtnLabel as TextStyle}>+ Nouvelle séance</AureakText>
          </Pressable>
        </View>
      )}

      {/* Nav tabs — Story 93.7 : actif noir + underline gold */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab
          const count    = counts?.[tab.key] ?? null
          return (
            <Pressable
              key={tab.key}
              onPress={() => router.push(tab.href as Parameters<typeof router.push>[0])}
              style={styles.tabItem}
            >
              <View style={styles.tabLabelRow}>
                <AureakText style={(isActive ? styles.tabLabelActive : styles.tabLabel) as TextStyle}>
                  {tab.label}
                </AureakText>
                <SubtabCount value={count} active={isActive} />
              </View>
              {isActive && <View style={styles.tabUnderline} />}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerBlock: {
    backgroundColor: colors.light.primary,
    gap            : 12,
  },
  headerTopRow: {
    flexDirection    : 'row',
    justifyContent   : 'flex-end',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
    paddingTop       : space.sm,
  },
  newBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: 18,
    paddingVertical  : 10,
    borderRadius     : 999,
  },
  newBtnLabel: {
    color     : colors.text.onGold,
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize  : 13,
  },
  tabsRow: {
    flexDirection    : 'row',
    gap              : 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingHorizontal: space.lg,
    marginTop        : space.sm,
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical  : 14,
    position         : 'relative',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.xs,
  },
  // Story 93.7 — tab inactif : muted (zinc-500), weight 600, letterSpacing 0.14em (~1.7)
  tabLabel: {
    fontFamily   : fonts.body,
    fontSize     : 12,
    fontWeight   : '600',
    letterSpacing: 1.7,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  } as TextStyle,
  // Story 93.7 — tab actif : texte noir (pas gold), underline gold géré séparément
  tabLabelActive: {
    fontFamily   : fonts.body,
    fontSize     : 12,
    fontWeight   : '600',
    letterSpacing: 1.7,
    color        : colors.text.dark,
    textTransform: 'uppercase',
  } as TextStyle,
  // Story 93.7 — underline gold 2px arrondi (template `.subtab[data-active]::after`)
  tabUnderline: {
    position       : 'absolute',
    bottom         : -1,
    left           : 12,
    right          : 12,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 2,
  },
})
