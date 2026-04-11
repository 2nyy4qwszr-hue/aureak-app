import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'

export type StatsInlineItem = {
  value: string
  label: string
}

export type StatsInlineProps = {
  items: StatsInlineItem[]
}

export function StatsInline({ items }: StatsInlineProps) {
  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 && <View style={styles.divider} />}
          <View style={styles.item}>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    alignItems   : 'center',
    gap          : 24,
  },
  item: {
    flexDirection: 'column',
    gap          : 4,
  },
  value: {
    color        : colors.accent.gold,
    fontFamily   : 'Montserrat-Black',
    fontWeight   : '900',
    fontSize     : 28,
    letterSpacing: -0.3,
  },
  label: {
    color     : colors.text.subtle,  // zinc-400
    fontFamily: 'Poppins-Regular',
    fontWeight: '400',
    fontSize  : 12,
  },
  divider: {
    width          : 1,
    height         : 32,
    backgroundColor: colors.border.light,  // zinc-200-ish
  },
})
