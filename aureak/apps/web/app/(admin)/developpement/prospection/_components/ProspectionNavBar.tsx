'use client'
// Story 88.1 — ProspectionNavBar : barre de navigation horizontale hub Prospection
import { useRouter, usePathname } from 'expo-router'
import { ScrollView, Pressable, View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const TABS = [
  { label: 'CLUBS',        href: '/developpement/prospection/clubs' },
  { label: 'GARDIENS',     href: '/developpement/prospection/gardiens' },
  { label: 'ENTRAÎNEURS',  href: '/developpement/prospection/entraineurs' },
  { label: 'RESSOURCES',  href: '/developpement/prospection/ressources' },
] as const

export function ProspectionNavBar() {
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
