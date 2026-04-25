'use client'
// Story 93.5 — MethodologieHeader : NavBar 5 onglets + count badges (mirror ActivitesHeader)
// Bouton CTA conservé sur mobile uniquement (AdminTopbar prend le relais desktop).
import React from 'react'
import { View, Pressable, ScrollView, StyleSheet, useWindowDimensions, type TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { SubtabCount } from '../SubtabCount'
import { useScrollTabIntoView } from '../../../hooks/admin/useScrollTabIntoView'

const TABS = [
  { key: 'overview',    label: "VUE D'ENSEMBLE", href: '/methodologie'             },
  { key: 'seances',     label: 'ENTRAÎNEMENTS',  href: '/methodologie/entrainements' },
  { key: 'programmes',  label: 'PROGRAMMES',     href: '/methodologie/programmes'  },
  { key: 'themes',      label: 'THÈMES',         href: '/methodologie/themes'      },
  { key: 'situations',  label: 'SITUATIONS',     href: '/methodologie/situations'  },
  { key: 'evaluations', label: 'ÉVALUATIONS',    href: '/methodologie/evaluations' },
] as const

type TabKey = typeof TABS[number]['key']

const MOBILE_BREAKPOINT = 768

export type MethodologieHeaderProps = {
  newLabel      ?: string
  newHref       ?: string
  hideNewButton?: boolean
  counts?: {
    seances    ?: number | null
    programmes ?: number | null
    themes     ?: number | null
    situations ?: number | null
    evaluations?: number | null
  }
}

function getActiveTab(pathname: string): TabKey {
  if (pathname.endsWith('/seances')     || pathname.includes('/seances/'))     return 'seances'
  if (pathname.endsWith('/programmes')  || pathname.includes('/programmes/'))  return 'programmes'
  if (pathname.endsWith('/themes')      || pathname.includes('/themes/'))      return 'themes'
  if (pathname.endsWith('/situations')  || pathname.includes('/situations/'))  return 'situations'
  if (pathname.endsWith('/evaluations') || pathname.includes('/evaluations/')) return 'evaluations'
  return 'overview'
}

export function MethodologieHeader({
  newLabel,
  newHref,
  hideNewButton = false,
  counts,
}: MethodologieHeaderProps) {
  const router    = useRouter()
  const pathname  = usePathname()
  const { width } = useWindowDimensions()
  const activeTab = getActiveTab(pathname)
  const isMobile  = width < MOBILE_BREAKPOINT

  // Story 100.2 — scroll automatique de l'onglet actif en vue sur mobile
  useScrollTabIntoView('tab-methodologie', activeTab)

  return (
    <View style={styles.headerBlock}>
      {isMobile && !hideNewButton && newLabel && newHref && (
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.push(newHref as Parameters<typeof router.push>[0])}
            style={styles.newBtn}
          >
            <AureakText style={styles.newBtnLabel as TextStyle}>{newLabel}</AureakText>
          </Pressable>
        </View>
      )}

      {/* Story 100.2 — scrollable horizontal sur mobile */}
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
              nativeID={`tab-methodologie-${tab.key}`}
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

export default MethodologieHeader

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
