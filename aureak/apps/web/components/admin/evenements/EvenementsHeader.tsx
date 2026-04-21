'use client'
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'

const TABS = [
  { key: 'stages',      label: 'STAGES',      href: '/evenements' },
  { key: 'tournois',    label: 'TOURNOIS',     href: '/evenements/tournois' },
  { key: 'fun-days',    label: 'FUN DAYS',     href: '/evenements/fun-days' },
  { key: 'detect-days', label: 'DETECT DAYS',  href: '/evenements/detect-days' },
  { key: 'seminaires',  label: 'SÉMINAIRES',   href: '/evenements/seminaires' },
] as const

type TabKey = typeof TABS[number]['key']

function getActiveTab(pathname: string): TabKey {
  if (pathname.endsWith('/tournois'))    return 'tournois'
  if (pathname.endsWith('/fun-days'))    return 'fun-days'
  if (pathname.endsWith('/detect-days')) return 'detect-days'
  if (pathname.endsWith('/seminaires'))  return 'seminaires'
  return 'stages'
}

export function EvenementsHeader() {
  const router    = useRouter()
  const pathname  = usePathname()
  const activeTab = getActiveTab(pathname)

  return (
    <View style={styles.headerBlock}>
      {/* Titre + bouton */}
      <View style={styles.headerTopRow}>
        <AureakText style={styles.pageTitle}>ÉVÉNEMENTS</AureakText>
        <Pressable
          onPress={() => router.push('/(admin)/stages/new' as Parameters<typeof router.push>[0])}
          style={styles.newBtn}
        >
          <AureakText style={styles.newBtnLabel}>+ Nouvel événement</AureakText>
        </Pressable>
      </View>

      {/* Nav tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab
          return (
            <Pressable
              key={tab.key}
              onPress={() => router.push(tab.href as Parameters<typeof router.push>[0])}
              style={styles.tabItem}
            >
              <AureakText style={{ ...styles.tabLabel, ...(isActive ? styles.tabLabelActive : {}) } as TextStyle}>
                {tab.label}
              </AureakText>
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
    backgroundColor  : colors.light.primary,
    gap              : 12,
  },
  headerTopRow: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
    paddingTop       : space.lg,
  },
  pageTitle: {
    fontSize     : 24,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.dark,
    letterSpacing: 0.5,
  },
  newBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    borderRadius     : 8,
  },
  newBtnLabel: {
    color     : colors.text.dark,
    fontWeight: '700',
    fontSize  : 13,
  },
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingHorizontal: space.lg,
  },
  tabItem: {
    paddingBottom: 10,
    position     : 'relative',
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
  } as TextStyle,
  tabLabelActive: {
    color: colors.accent.gold,
  },
  tabUnderline: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },
})
