'use client'
// Story 87.2 — Tabs Résumé / Activité / Accès synchronisés sur ?tab=
// Le parent reçoit onChange(tab) et bascule via router.setParams.

import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'

type TabKey = 'resume' | 'activite' | 'acces'

type ProfileTabsProps = {
  activeTab: TabKey
  onChange : (next: TabKey) => void
}

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'resume',   label: 'RÉSUMÉ'   },
  { key: 'activite', label: 'ACTIVITÉ' },
  { key: 'acces',    label: 'ACCÈS'    },
]

export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <View style={s.wrapper}>
      {TABS.map(tab => {
        const isActive = tab.key === activeTab
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [s.tab, pressed && !isActive && s.tabPressed] as never}
          >
            <AureakText style={[s.tabLabel, isActive && s.tabLabelActive] as never}>
              {tab.label}
            </AureakText>
            {isActive ? <View style={s.underline} /> : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    flexDirection    : 'row',
    gap              : space.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingHorizontal: space.sm,
  },
  tab        : { paddingVertical: 12, paddingHorizontal: 4, position: 'relative' },
  tabPressed : { opacity: 0.7 },
  tabLabel   : {
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 1,
    color        : colors.text.subtle,
    fontFamily   : fonts.display,
    textTransform: 'uppercase',
    opacity      : 0.5,
  } as TextStyle,
  tabLabelActive: { color: colors.accent.gold, opacity: 1 },
  underline     : {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    height         : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : 1,
  },
})
