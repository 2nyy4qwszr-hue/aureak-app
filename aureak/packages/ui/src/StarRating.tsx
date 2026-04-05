// Story 58-6 — Composant notation par étoiles 1–5 pour les situations pédagogiques
import React, { useState } from 'react'
import { View, Pressable, Text } from 'react-native'
import { colors } from '@aureak/theme'

type Props = {
  value    : number         // 1–5
  onChange?: (v: number) => void  // undefined = read-only
  size?    : number         // taille en px des étoiles (défaut 18)
}

export function StarRating({ value, onChange, size = 18 }: Props) {
  const [hovered, setHovered] = useState(0)
  const display = hovered > 0 ? hovered : value

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Pressable
          key={i}
          disabled={!onChange}
          onPress={() => onChange?.(i)}
          onHoverIn={() => setHovered(i)}
          onHoverOut={() => setHovered(0)}
        >
          <Text style={{
            fontSize : size,
            color    : i <= display ? colors.accent.gold : colors.border.light,
          }}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
