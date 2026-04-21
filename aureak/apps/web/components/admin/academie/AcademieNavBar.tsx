'use client'
// Story 75.2 — AcademieNavBar : barre de navigation horizontale partagée hub Académie
// Story 93.2 — Prop counts optionnelle pour badges de count sur chaque tab
import { useRouter, usePathname } from 'expo-router'
import { ScrollView, Pressable, View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { SubtabCount } from '../SubtabCount'

const TABS = [
  { key: 'joueurs',       label: 'JOUEURS',       href: '/academie/joueurs'       },
  { key: 'coachs',        label: 'COACHS',        href: '/academie/coachs'        },
  { key: 'scouts',        label: 'SCOUTS',        href: '/academie/scouts'        },
  { key: 'managers',      label: 'MANAGERS',      href: '/academie/managers'      },
  { key: 'commerciaux',   label: 'COMMERCIAUX',   href: '/academie/commerciaux'   },
  { key: 'marketeurs',    label: 'MARKETEURS',    href: '/academie/marketeurs'    },
  { key: 'clubs',         label: 'CLUBS',         href: '/academie/clubs'         },
  { key: 'implantations', label: 'IMPLANTATIONS', href: '/academie/implantations' },
] as const

type TabKey = typeof TABS[number]['key']

export type AcademieNavBarProps = {
  counts?: Partial<Record<TabKey, number | null>>
}

export function AcademieNavBar({ counts }: AcademieNavBarProps = {}) {
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
