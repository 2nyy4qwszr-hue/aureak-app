'use client'
// Story 97.10 — EvenementsHeader simplifié : nav secondaire 5 onglets
// (Stages / Tournois / Fun Days / Detect Days / Séminaires). Titre + action
// déplacés vers <AdminPageHeader /> dans chaque sous-page.
import React from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { useScrollTabIntoView } from '../../../hooks/admin/useScrollTabIntoView'

const TABS = [
  { key: 'overview',    label: "VUE D'ENSEMBLE", href: '/evenements'             },
  { key: 'stages',      label: 'STAGES',         href: '/evenements/stages'      },
  { key: 'tournois',    label: 'TOURNOIS',       href: '/evenements/tournois'    },
  { key: 'fun-days',    label: 'FUN DAYS',       href: '/evenements/fun-days'    },
  { key: 'detect-days', label: 'DETECT DAYS',    href: '/evenements/detect-days' },
  { key: 'seminaires',  label: 'SÉMINAIRES',     href: '/evenements/seminaires'  },
] as const

type TabKey = typeof TABS[number]['key']

function getActiveTab(pathname: string): TabKey {
  if (pathname.endsWith('/tournois')    || pathname.includes('/tournois/'))    return 'tournois'
  if (pathname.endsWith('/fun-days')    || pathname.includes('/fun-days/'))    return 'fun-days'
  if (pathname.endsWith('/detect-days') || pathname.includes('/detect-days/')) return 'detect-days'
  if (pathname.endsWith('/seminaires')  || pathname.includes('/seminaires/'))  return 'seminaires'
  if (pathname.endsWith('/stages')      || pathname.includes('/stages/'))      return 'stages'
  return 'overview'
}

export function EvenementsHeader() {
  const router    = useRouter()
  const pathname  = usePathname()
  const activeTab = getActiveTab(pathname)

  // Story 100.2 — scroll automatique de l'onglet actif en vue sur mobile
  useScrollTabIntoView('tab-evenements', activeTab)

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsRow}
      style={styles.tabsScroll}
    >
      {TABS.map(tab => {
        const isActive = tab.key === activeTab
        return (
          <Pressable
            key={tab.key}
            nativeID={`tab-evenements-${tab.key}`}
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  tabsScroll: {
    flexGrow       : 0,
    backgroundColor: colors.light.primary,
  },
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingHorizontal: space.lg,
    backgroundColor  : colors.light.primary,
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
