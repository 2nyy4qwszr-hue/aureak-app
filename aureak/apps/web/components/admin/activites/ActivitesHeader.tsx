'use client'
// Story 110.1 — FAB unifié sur les 4 onglets : suppression du bouton conditionnel header,
// rename de l'onglet hub en "ACTIVITÉS" pour cohérence avec la sidebar.
import React from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { SubtabCount } from '../SubtabCount'
import { useScrollTabIntoView } from '../../../hooks/admin/useScrollTabIntoView'

const TABS = [
  { key: 'overview',    label: 'ACTIVITÉS',  href: '/activites' },
  { key: 'seances',     label: 'SÉANCES',    href: '/activites/seances' },
  { key: 'presences',   label: 'PRÉSENCES',  href: '/activites/presences' },
  { key: 'evaluations', label: 'ÉVALUATIONS', href: '/activites/evaluations' },
] as const

type TabKey = typeof TABS[number]['key']

export type ActivitesHeaderProps = {
  counts?: {
    seances    ?: number | null
    presences  ?: number | null
    evaluations?: number | null
  }
}

function getActiveTab(pathname: string): TabKey {
  if (pathname.endsWith('/seances') || pathname.includes('/seances/')) return 'seances'
  if (pathname.endsWith('/presences'))   return 'presences'
  if (pathname.endsWith('/evaluations')) return 'evaluations'
  return 'overview'
}

export function ActivitesHeader({ counts }: ActivitesHeaderProps = {}) {
  const router    = useRouter()
  const pathname  = usePathname()
  const activeTab = getActiveTab(pathname)

  // Story 100.2 — scroll automatique de l'onglet actif en vue sur mobile
  useScrollTabIntoView('tab-activites', activeTab)

  return (
    <View style={styles.headerBlock}>
      {/* Nav tabs — Story 100.2 : scrollable horizontal sur mobile, flex row desktop */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {TABS.map(tab => {
          const isActive = tab.key === activeTab
          const count    = tab.key === 'overview' ? null : (counts?.[tab.key] ?? null)
          return (
            <Pressable
              key={tab.key}
              nativeID={`tab-activites-${tab.key}`}
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
    flexGrow    : 0,
    marginTop   : space.sm,
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
