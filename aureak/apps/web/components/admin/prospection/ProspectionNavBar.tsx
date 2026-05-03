'use client'
// ProspectionNavBar — header onglets aligné sur le pattern ActivitesHeader
// (texte noir + underline gold absolu sur tab actif, scrollable horizontal sur mobile).
import React from 'react'
import { useRouter, usePathname } from 'expo-router'
import { ScrollView, Pressable, View, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { SubtabCount } from '../SubtabCount'
import { useScrollTabIntoView } from '../../../hooks/admin/useScrollTabIntoView'

const TABS = [
  { key: 'overview',    label: 'PROSPECTION',    href: '/prospection'             },
  { key: 'clubs',       label: 'CLUBS',          href: '/prospection/clubs'       },
  { key: 'gardiens',    label: 'GARDIENS',       href: '/prospection/gardiens'    },
  { key: 'entraineurs', label: 'ENTRAÎNEURS',    href: '/prospection/entraineurs' },
  { key: 'attribution', label: 'ATTRIBUTION',    href: '/prospection/attribution' },
  { key: 'ressources',  label: 'RESSOURCES',     href: '/prospection/ressources'  },
] as const

type TabKey = typeof TABS[number]['key']

export type ProspectionNavBarProps = {
  counts?: Partial<Record<TabKey, number | null>>
}

export function ProspectionNavBar({ counts }: ProspectionNavBarProps = {}) {
  const router   = useRouter()
  const pathname = usePathname()
  // Overview matche uniquement /prospection exact ; les autres onglets matchent leur sous-arbre.
  const activeKey: TabKey | null =
    (pathname === '/prospection'
      ? 'overview'
      : TABS.find(t => t.key !== 'overview' && (pathname === t.href || pathname.startsWith(t.href + '/')))?.key
    ) ?? null

  useScrollTabIntoView('tab-prospection', activeKey)

  return (
    <View style={styles.headerBlock}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {TABS.map(tab => {
          const isActive = tab.key === activeKey
          const count    = tab.key === 'overview' ? null : (counts?.[tab.key] ?? null)
          return (
            <Pressable
              key={tab.href}
              nativeID={`tab-prospection-${tab.key}`}
              onPress={() => router.push(tab.href as never)}
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
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  headerBlock: {
    backgroundColor: colors.light.primary,
    gap            : 12,
  },
  tabsScroll: {
    flexGrow : 0,
    marginTop: space.sm,
  },
  tabsRow: {
    flexDirection    : 'row',
    gap              : 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingHorizontal: space.lg,
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
  tabLabel: {
    fontFamily   : fonts.body,
    fontSize     : 12,
    fontWeight   : '600',
    letterSpacing: 1.7,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  } as TextStyle,
  tabLabelActive: {
    fontFamily   : fonts.body,
    fontSize     : 12,
    fontWeight   : '600',
    letterSpacing: 1.7,
    color        : colors.text.dark,
    textTransform: 'uppercase',
  } as TextStyle,
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
