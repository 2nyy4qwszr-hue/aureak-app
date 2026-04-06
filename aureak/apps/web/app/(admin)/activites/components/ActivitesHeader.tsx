'use client'
// Story 65-1 — Activités Hub : header onglets + bouton nouvelle séance
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

const TABS = [
  { key: 'seances',     label: 'SÉANCES',     href: '/(admin)/activites' },
  { key: 'presences',   label: 'PRÉSENCES',   href: '/(admin)/activites/presences' },
  { key: 'evaluations', label: 'ÉVALUATIONS', href: '/(admin)/activites/evaluations' },
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
            color        : isActive ? colors.text.dark : colors.text.muted,
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

      {/* Bouton + Nouvelle séance */}
      <Pressable
        onPress={() => router.push('/(admin)/seances/new')}
        style={({ pressed }) => [styles.newBtn, pressed && styles.newBtnPressed] as object[]}
      >
        <AureakText style={styles.newBtnText}>+ Nouvelle séance</AureakText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    backgroundColor  : colors.light.surface,
    paddingHorizontal: space.lg,
    paddingTop       : space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabs: {
    flexDirection: 'row',
    gap          : space.xl,
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
    color     : '#18181B',
    fontSize  : 13,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
})
