'use client'
// Story 34.2 — MethodologieNavBar : barre de navigation horizontale partagée section Méthodologie
// Pattern identique à AcademieNavBar (story 75-2)
import { useRouter, usePathname } from 'expo-router'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'

const TABS = [
  { label: 'ENTRAÎNEMENTS', href: '/methodologie/seances'     },
  { label: 'PROGRAMMES',    href: '/methodologie/programmes'  },
  { label: 'THÈMES',        href: '/methodologie/themes'      },
  { label: 'SITUATIONS',    href: '/methodologie/situations'   },
  { label: 'ÉVALUATIONS',   href: '/methodologie/evaluations'  },
] as const

export function MethodologieNavBar() {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <View style={s.tabsRow}>
      {TABS.map(tab => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
            <AureakText style={[s.tabLabel, isActive && s.tabLabelActive] as never}>
              {tab.label}
            </AureakText>
            {isActive && <View style={s.tabUnderline} />}
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  tabsRow: {
    flexDirection    : 'row',
    gap              : 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  tabLabel: {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: colors.accent.gold },
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
