'use client'
// Story 92.1 — PartenariatNavBar : 2 onglets hub Partenariat (Sponsors / Clubs partenaires)
// Pattern aligné sur MarketingNavBar / AcademieNavBar (horizontal, gold underline active)
import { useRouter, usePathname } from 'expo-router'
import { ScrollView, Pressable, View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { useScrollTabIntoView } from '../../../hooks/admin/useScrollTabIntoView'

const TABS = [
  { key: 'sponsors', label: 'SPONSORS',          href: '/partenariat/sponsors' },
  { key: 'clubs',    label: 'CLUBS PARTENAIRES', href: '/partenariat/clubs'    },
] as const

export function PartenariatNavBar() {
  const router   = useRouter()
  const pathname = usePathname()
  const activeKey = TABS.find(t => pathname === t.href || pathname.startsWith(t.href + '/'))?.key ?? null

  // Story 100.2 — scroll automatique de l'onglet actif en vue sur mobile
  useScrollTabIntoView('tab-partenariat', activeKey)

  return (
    <View style={s.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.container}
      >
        {TABS.map(tab => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Pressable
              key={tab.href}
              nativeID={`tab-partenariat-${tab.key}`}
              onPress={() => router.push(tab.href as never)}
              style={({ pressed }) => [
                s.tab,
                isActive && s.tabActive,
                pressed && !isActive && s.tabPressed,
              ] as never}
            >
              <AureakText
                variant="label"
                style={[
                  s.tabLabel,
                  isActive ? s.tabLabelActive : s.tabLabelInactive,
                ] as never}
              >
                {tab.label}
              </AureakText>
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
