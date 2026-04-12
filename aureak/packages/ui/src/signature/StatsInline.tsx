import React from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { colors, motion } from '@aureak/theme'
import { useEntryAnimation } from '../hooks/useEntryAnimation'

export type StatsInlineItem = {
  value: string
  label: string
}

export type StatsInlineProps = {
  items    : StatsInlineItem[]
  staggered?: boolean
}

export function StatsInline({ items, staggered = false }: StatsInlineProps) {
  return (
    <View style={styles.row}>
      {items.map((item, i) => (
        <React.Fragment key={`${item.label}-${i}`}>
          {i > 0 && <View style={styles.divider} />}
          <StatItem item={item} delay={staggered ? i * motion.stagger.default : 0} trigger={staggered} />
        </React.Fragment>
      ))}
    </View>
  )
}

function StatItem({ item, delay, trigger }: { item: StatsInlineItem; delay: number; trigger: boolean }) {
  const entry = useEntryAnimation({ trigger, delay })
  return (
    <Animated.View style={[styles.item, trigger && entry.style]}>
      <Text style={styles.value}>{item.value}</Text>
      <Text style={styles.label}>{item.label}</Text>
    </Animated.View>
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
    color     : colors.text.subtle,
    fontFamily: 'Poppins-Regular',
    fontWeight: '400',
    fontSize  : 12,
  },
  divider: {
    width          : 1,
    height         : 32,
    backgroundColor: colors.border.light,
  },
})
