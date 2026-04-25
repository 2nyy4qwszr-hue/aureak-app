'use client'
// Hub Performance — 7 onglets : Vue d'ensemble + 5 sous-pages + Comparaisons.
// Design aligné EXACTEMENT sur ActivitesHeader / MarketingNavBar.
import { useRouter, usePathname } from 'expo-router'
import { ScrollView, Pressable, View, StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { SubtabCount } from '../SubtabCount'
import { useScrollTabIntoView } from '../../../hooks/admin/useScrollTabIntoView'

const TABS = [
  { key: 'overview',     label: "VUE D'ENSEMBLE", href: '/performance'              },
  { key: 'charge',       label: 'CHARGE',         href: '/performance/charge'       },
  { key: 'clubs',        label: 'CLUBS',          href: '/performance/clubs'        },
  { key: 'presences',    label: 'PRÉSENCES',      href: '/performance/presences'    },
  { key: 'progression',  label: 'PROGRESSION',    href: '/performance/progression'  },
  { key: 'implantation', label: 'IMPLANTATIONS',  href: '/performance/implantation' },
  { key: 'comparaisons', label: 'COMPARAISONS',   href: '/performance/comparaisons' },
] as const

type TabKey = typeof TABS[number]['key']

export type PerformanceNavBarProps = {
  counts?: Partial<Record<TabKey, number | null>>
}

function isTabActive(pathname: string, href: string): boolean {
  if (href === '/performance') return pathname === '/performance'
  return pathname === href || pathname.startsWith(href + '/')
}

export function PerformanceNavBar({ counts }: PerformanceNavBarProps = {}) {
  const router    = useRouter()
  const pathname  = usePathname()
  const activeKey = TABS.find(t => isTabActive(pathname, t.href))?.key ?? null

  useScrollTabIntoView('tab-performance', activeKey)

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
              nativeID={`tab-performance-${tab.key}`}
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
