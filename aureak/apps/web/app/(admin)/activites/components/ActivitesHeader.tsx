'use client'
// Story 65-1 — Activités Hub : header onglets + bouton nouvelle séance
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const TABS = [
  { key: 'seances',     label: 'SÉANCES',     href: '/activites' },
  { key: 'presences',   label: 'PRÉSENCES',   href: '/activites/presences' },
  { key: 'evaluations', label: 'ÉVALUATIONS', href: '/activites/evaluations' },
] as const

type TabKey = typeof TABS[number]['key']

function getActiveTab(pathname: string): TabKey {
  if (pathname.endsWith('/presences'))   return 'presences'
  if (pathname.endsWith('/evaluations')) return 'evaluations'
  return 'seances'
}

export function ActivitesHeader() {
  const router    = useRouter()
  const pathname  = usePathname()
  const activeTab = getActiveTab(pathname)

  return (
    <View style={styles.wrapper}>
      {/* Titre page */}
      <View style={styles.titleRow}>
        <AureakText style={styles.pageTitle}>ACTIVITÉS</AureakText>
        {/* Bouton + Nouvelle séance */}
        <Pressable
          onPress={() => router.push('/(admin)/seances/new')}
          style={({ pressed }) => [styles.newBtn, pressed && styles.newBtnPressed] as object[]}
        >
          <AureakText style={styles.newBtnText}>+ Nouvelle séance</AureakText>
        </Pressable>
      </View>

    <View style={styles.container}>
      {/* Onglets */}
      <View style={styles.tabs}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab
          const labelStyle: TextStyle = {
            fontSize     : 13,
            fontWeight   : '700',
            fontFamily   : 'Montserrat',
            letterSpacing: 0.8,
            color        : colors.text.dark,
          }
          return (
            <Pressable
              key={tab.key}
              onPress={() => router.push(tab.href as Parameters<typeof router.push>[0])}
              style={styles.tabItem}
            >
              <AureakText style={labelStyle}>{tab.label}</AureakText>
              {isActive && <View style={styles.tabUnderline} />}
            </Pressable>
          )
        })}
      </View>
    </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor  : colors.light.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  titleRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingHorizontal: space.lg,
    paddingTop       : space.lg,
    paddingBottom    : space.sm,
  },
  pageTitle: {
    fontSize     : 22,
    fontWeight   : '900',
    fontFamily   : 'Montserrat',
    letterSpacing: 0.5,
    color        : colors.text.dark,
  },
  container: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
  },
  tabs: {
    flexDirection: 'row',
    gap          : space.xl,
    flex         : 1,
  },
  tabItem: {
    paddingBottom: space.sm,
    position     : 'relative',
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
  newBtn: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    marginBottom     : space.sm,
  },
  newBtnPressed: {
    opacity: 0.85,
  },
  newBtnText: {
    color     : colors.text.dark,
    fontSize  : 13,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
})
