'use client'
// Hub Académie — 9 onglets : Vue d'ensemble + 8 sous-sections.
// Design aligné EXACTEMENT sur ActivitesHeader / MarketingNavBar (label actif noir,
// underline gold absolu, paddings 20×14, gap 2, support pastilles count).
//
// Story 75.2 — AcademieNavBar (origine).
// Story 93.2 — Prop counts optionnelle.
// Refonte design alignment epic — pattern strict /activites.
import React from 'react'
import { useRouter, usePathname } from 'expo-router'
import { ScrollView, Pressable, View, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { SubtabCount } from '../SubtabCount'
import { useScrollTabIntoView } from '../../../hooks/admin/useScrollTabIntoView'

const TABS = [
  { key: 'overview',      label: "VUE D'ENSEMBLE", href: '/academie'               },
  { key: 'joueurs',       label: 'JOUEURS',        href: '/academie/joueurs'       },
  { key: 'coachs',        label: 'COACHS',         href: '/academie/coachs'        },
  { key: 'scouts',        label: 'SCOUTS',         href: '/academie/scouts'        },
  { key: 'managers',      label: 'MANAGERS',       href: '/academie/managers'      },
  { key: 'commerciaux',   label: 'COMMERCIAUX',    href: '/academie/commerciaux'   },
  { key: 'marketeurs',    label: 'MARKETEURS',     href: '/academie/marketeurs'    },
  { key: 'clubs',         label: 'CLUBS',          href: '/academie/clubs'         },
  { key: 'implantations', label: 'IMPLANTATIONS',  href: '/academie/implantations' },
] as const

type TabKey = typeof TABS[number]['key']

export type AcademieNavBarProps = {
  counts?: Partial<Record<TabKey, number | null>>
}

function isTabActive(pathname: string, href: string): boolean {
  if (href === '/academie') return pathname === '/academie'
  return pathname === href || pathname.startsWith(href + '/')
}

export function AcademieNavBar({ counts }: AcademieNavBarProps = {}) {
  const router    = useRouter()
  const pathname  = usePathname()
  const activeKey = TABS.find(t => isTabActive(pathname, t.href))?.key ?? null

  useScrollTabIntoView('tab-academie', activeKey)

  return (
    <View style={styles.headerBlock}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {TABS.map(tab => {
          const isActive = isTabActive(pathname, tab.href)
          const count    = tab.key === 'overview' ? null : (counts?.[tab.key] ?? null)
          return (
            <Pressable
              key={tab.key}
              nativeID={`tab-academie-${tab.key}`}
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
