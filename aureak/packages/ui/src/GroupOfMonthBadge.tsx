// Story 56-5 — Badge "Groupe du mois" avec animation shimmer gold
// Position : coin supérieur gauche de la GroupCard (overlay)
// RÈGLE : styles uniquement via @aureak/theme tokens
import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { colors, space, radius } from '@aureak/theme'
import { AureakText } from './components/Text'

export interface GroupOfMonthBadgeProps {
  /** Texte du badge — défaut : "Groupe du mois" */
  label?: string
}

export function GroupOfMonthBadge({ label = 'Groupe du mois' }: GroupOfMonthBadgeProps) {
  const shimmer = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [shimmer])

  return (
    <Animated.View style={[s.badge, { opacity: shimmer }]}>
      {/* Trophée SVG inline (web) */}
      {/* @ts-ignore — élément SVG natif web */}
      <View style={s.iconWrap}>
        {/* @ts-ignore */}
        <svg width="11" height="11" viewBox="0 0 24 24" fill={colors.text.dark} aria-hidden="true">
          {/* @ts-ignore */}
          <path d="M12 2C9.24 2 7 4.24 7 7v4c0 2.61 1.67 4.83 4 5.65V18H9v2h6v-2h-2v-1.35C15.33 15.83 17 13.61 17 11V7c0-2.76-2.24-5-5-5zm0 13c-2.21 0-4-1.79-4-4V7c0-2.21 1.79-4 4-4s4 1.79 4 4v4c0 2.21-1.79 4-4 4z"/>
          {/* @ts-ignore */}
          <path d="M5 7H3v4c0 1.66.83 3.13 2.1 4L5 15c0 .55.45 1 1 1s1-.45 1-1V7H5zM19 7h-2v8c0 .55.45 1 1 1s1-.45 1-1l-.1-.06C20.17 14.13 21 12.66 21 11V7h-2z" opacity="0.6"/>
        </svg>
      </View>
      <AureakText
        variant="caption"
        style={s.label}
      >
        {label}
      </AureakText>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  badge: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 4,
    position         : 'absolute' as never,
    top              : space.xs,
    left             : space.xs,
    zIndex           : 20,
    backgroundColor  : colors.accent.gold,
    borderRadius     : radius.badge,
    paddingHorizontal: 7,
    paddingVertical  : 3,
    shadowColor      : colors.accent.gold,
    shadowOffset     : { width: 0, height: 1 },
    shadowOpacity    : 0.4,
    shadowRadius     : 3,
    elevation        : 3,
  },
  iconWrap: {
    width : 11,
    height: 11,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  label: {
    color     : colors.text.dark,
    fontWeight: '700',
    fontSize  : 9,
    letterSpacing: 0.3,
  },
})
