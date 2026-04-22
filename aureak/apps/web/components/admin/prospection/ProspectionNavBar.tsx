'use client'
// Story 88.1 — ProspectionNavBar : 3 onglets hub Prospection (Clubs / Gardiens / Entraîneurs)
// Pattern aligné sur AcademieNavBar (horizontal, gold underline active, SubtabCount optionnel)
import { useRouter, usePathname } from 'expo-router'
import { ScrollView, Pressable, View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { SubtabCount } from '../SubtabCount'

const TABS = [
  { key: 'clubs',       label: 'CLUBS',       href: '/developpement/prospection/clubs'       },
  { key: 'gardiens',    label: 'GARDIENS',    href: '/developpement/prospection/gardiens'    },
  { key: 'entraineurs', label: 'ENTRAÎNEURS', href: '/developpement/prospection/entraineurs' },
] as const

type TabKey = typeof TABS[number]['key']

export type ProspectionNavBarProps = {
  counts?: Partial<Record<TabKey, number | null>>
}

export function ProspectionNavBar({ counts }: ProspectionNavBarProps = {}) {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <View style={s.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.container}
      >
        {TABS.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          const count    = counts?.[tab.key] ?? null
          return (
            <Pressable
              key={tab.href}
              onPress={() => router.push(tab.href as never)}
              style={({ pressed }) => [
                s.tab,
                isActive && s.tabActive,
                pressed && !isActive && s.tabPressed,
              ] as never}
            >
              <View style={s.tabInner}>
                <AureakText
                  variant="label"
                  style={[
                    s.tabLabel,
                    isActive ? s.tabLabelActive : s.tabLabelInactive,
                  ] as never}
                >
                  {tab.label}
                </AureakText>
                <SubtabCount value={count} active={isActive} />
              </View>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor  : colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  container: {
    paddingHorizontal: space.md,
    flexDirection    : 'row',
    alignItems       : 'stretch',
    gap              : space.xs,
  },
  tab: {
    paddingVertical  : 14,
    paddingHorizontal: space.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent.gold,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.xs,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
  },
  tabLabelActive: {
    color  : colors.text.dark,
    opacity: 1,
  },
  tabLabelInactive: {
    color  : colors.text.dark,
    opacity: 0.5,
  },
})
