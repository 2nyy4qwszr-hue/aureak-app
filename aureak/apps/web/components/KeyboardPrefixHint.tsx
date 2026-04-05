'use client'
// Story 51.6 — Badge visuel préfixe chord actif
// Affiché en bas à droite quand G ou N est en attente de la 2ème touche
// Disparaît automatiquement après 1s (géré par le hook parent)

import React from 'react'
import { View } from 'react-native'
import { Text } from 'tamagui'
import { colors, shadows, radius } from '@aureak/theme'

// ── Props ─────────────────────────────────────────────────────────────────────

interface KeyboardPrefixHintProps {
  prefixActive : boolean
  prefixKey    : string | null
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function KeyboardPrefixHint({ prefixActive, prefixKey }: KeyboardPrefixHintProps) {
  if (!prefixActive || !prefixKey) return null

  return (
    <View
      style={{
        position       : 'fixed' as never,
        bottom         : 24,
        right          : 24,
        zIndex         : 200,
        backgroundColor: colors.background.elevated,
        borderRadius   : radius.xs,
        borderWidth    : 1,
        borderColor    : colors.accent.gold + '60',
        boxShadow      : shadows.gold,
        paddingHorizontal: 12,
        paddingVertical  : 8,
        flexDirection    : 'row',
        alignItems       : 'center',
        gap              : 6,
      } as never}
    >
      {/* Badge touche active */}
      <View
        style={{
          backgroundColor  : colors.accent.gold + '22',
          borderWidth      : 1,
          borderColor      : colors.accent.gold,
          borderRadius     : 4,
          paddingHorizontal: 6,
          paddingVertical  : 2,
          minWidth         : 24,
          alignItems       : 'center',
        }}
      >
        <Text
          fontFamily="$body"
          fontSize={13}
          fontWeight="700"
          color={colors.accent.gold}
        >
          {prefixKey}
        </Text>
      </View>

      {/* Points de suspension */}
      <Text
        fontFamily="$body"
        fontSize={13}
        color={colors.text.secondary}
      >
        …
      </Text>
    </View>
  )
}
