import React from 'react'
import { TouchableOpacity, View, StyleSheet } from 'react-native'
import type { EvaluationSignal } from '@aureak/types'
import { colors } from '@aureak/theme'
import { AureakText } from '../Text/Text'

export type IndicatorValue = EvaluationSignal | 'none'

export type IndicatorToggleProps = {
  value: IndicatorValue
  onChange: (value: IndicatorValue) => void
  label?: string
  disabled?: boolean
  /** Callback haptique — injecter `() => Haptics.impactAsync(Light)` depuis l'app mobile */
  onHaptic?: () => void
}

// Cycle 3 états : none → positive → attention → none (JAMAIS rouge)
const CYCLE: IndicatorValue[] = ['none', 'positive', 'attention']

function nextValue(current: IndicatorValue): IndicatorValue {
  const idx = CYCLE.indexOf(current)
  return CYCLE[(idx + 1) % CYCLE.length]
}

// Couleurs d'état — RÈGLE : jamais $statusAbsent ici
const STATE_COLORS: Record<IndicatorValue, { bg: string; border: string }> = {
  none      : { bg: 'transparent',             border: colors.accent.zinc },
  positive  : { bg: colors.status.present,     border: colors.status.present },
  attention : { bg: colors.status.attention,   border: colors.status.attention },
}

const CIRCLE_SIZE = 28

const styles = StyleSheet.create({
  touchable: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    marginTop: 4,
  },
  container: {
    alignItems: 'center',
  },
})

export function IndicatorToggle({
  value,
  onChange,
  label,
  disabled = false,
  onHaptic,
}: IndicatorToggleProps) {
  const { bg, border } = STATE_COLORS[value]

  const handlePress = () => {
    if (disabled) return
    onHaptic?.()
    onChange(nextValue(value))
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[styles.touchable, disabled && styles.disabled]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label ?? `Évaluation: ${value}`}
        accessibilityState={{ disabled }}
      >
        <View style={[styles.circle, { backgroundColor: bg, borderColor: border }]} />
      </TouchableOpacity>
      {label && (
        <AureakText variant="label" style={styles.label}>
          {label}
        </AureakText>
      )}
    </View>
  )
}
