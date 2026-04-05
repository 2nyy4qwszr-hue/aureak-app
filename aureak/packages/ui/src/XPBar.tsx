// XPBar.tsx — Barre de progression XP animée
// Story 52-7 : composant gamification, tokens @aureak/theme exclusivement
import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { gamification, colors, space } from '@aureak/theme'
import { Text as AureakText } from './components/Text'

export type XPBarProps = {
  /** Score XP brut */
  xp        : number
  /** XP max du niveau courant */
  maxXp     : number
  /** Label du niveau (ex: "Or") */
  level     : string
  /** Couleur hex du niveau */
  levelColor: string
  /** Animer la barre au montage — défaut true */
  animated? : boolean
}

// ── XP jalons visuels ─────────────────────────────────────────────────────────

const MILESTONES = [25, 50, 75, 100] // en % de la barre

// ── XPBar ─────────────────────────────────────────────────────────────────────

export function XPBar({ xp, maxXp, level, levelColor, animated: shouldAnimate = true }: XPBarProps) {
  const fillPercent = Math.min(100, Math.max(0, maxXp > 0 ? (xp / maxXp) * 100 : 0))

  const fillAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (shouldAnimate) {
      Animated.timing(fillAnim, {
        toValue        : fillPercent,
        duration       : 600,
        useNativeDriver: false,
      }).start()
    } else {
      fillAnim.setValue(fillPercent)
    }
  }, [fillPercent, shouldAnimate, fillAnim])

  const fillWidth = fillAnim.interpolate({
    inputRange : [0, 100],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={xp_.wrapper}>
      {/* Label niveau + XP */}
      <View style={xp_.labelRow}>
        <AureakText style={[xp_.levelLabel, { color: levelColor }] as never}>
          Niveau : {level}
        </AureakText>
        <AureakText style={xp_.xpLabel as never}>
          {xp} XP
        </AureakText>
      </View>

      {/* Track + fill + jalons */}
      <View
        style={[xp_.track, { height: gamification.xp.barHeight, borderRadius: gamification.xp.barRadius, backgroundColor: gamification.xp.trackColor }]}
      >
        {/* Fill animé */}
        <Animated.View
          style={[
            xp_.fill,
            {
              width       : fillWidth as never,
              height      : gamification.xp.barHeight,
              borderRadius: gamification.xp.barRadius,
              backgroundColor: gamification.xp.fillColor,
            },
          ]}
        />

        {/* Jalons à 25%, 50%, 75%, 100% */}
        {MILESTONES.map(pct => {
          const isNextMilestone = pct > fillPercent && (pct - 25) <= fillPercent
          return (
            <View
              key={pct}
              style={[
                xp_.milestone,
                {
                  left           : `${pct}%` as never,
                  backgroundColor: isNextMilestone ? gamification.xp.fillColor : colors.border.light,
                },
              ]}
            />
          )
        })}
      </View>
    </View>
  )
}

const xp_ = StyleSheet.create({
  wrapper : { gap: space.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelLabel: { fontSize: 12, fontWeight: '700' as never },
  xpLabel   : { fontSize: 11, color: colors.text.muted },
  track     : { position: 'relative' as never, overflow: 'hidden' },
  fill      : { position: 'absolute' as never, top: 0, left: 0 },
  milestone : {
    position: 'absolute' as never,
    top     : 0,
    width   : 1,
    height  : 12,
    marginTop: -2,
    transform: [{ translateX: -0.5 }],
  },
})
