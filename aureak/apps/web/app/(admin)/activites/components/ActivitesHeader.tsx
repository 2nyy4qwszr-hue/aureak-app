'use client'
// Story 80-1 — Uniformisation design headerBlock (pattern Méthodologie)
// Story 93-2 — Prop counts optionnelle pour badges de count sur onglets
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { SubtabCount } from '../../_components/SubtabCount'

const TABS = [
  { key: 'seances',     label: 'SÉANCES',     href: '/activites' },
  { key: 'presences',   label: 'PRÉSENCES',   href: '/activites/presences' },
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
  if (pathname.endsWith('/presences'))   return 'presences'
  if (pathname.endsWith('/evaluations')) return 'evaluations'
  return 'seances'
}

export function ActivitesHeader({ counts }: ActivitesHeaderProps = {}) {
  const router    = useRouter()
  const pathname  = usePathname()
  const activeTab = getActiveTab(pathname)

  return (
    <View style={styles.headerBlock}>
      {/* Story 93.1 — pageTitle retiré (désormais rendu par <AdminPageHeader /> au niveau page). */}
      <View style={styles.headerTopRow}>
        <Pressable
          onPress={() => router.push('/(admin)/seances/new')}
          style={styles.newBtn}
        >
          <AureakText style={styles.newBtnLabel}>+ Nouvelle séance</AureakText>
        </Pressable>
      </View>

      {/* Nav tabs */}
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
                <AureakText style={{ ...styles.tabLabel, ...(isActive ? styles.tabLabelActive : {}) } as TextStyle}>
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
    backgroundColor  : colors.light.primary,
    gap              : 12,
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
  tabLabelRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.xs,
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
