import React, { useState } from 'react'
import { View } from 'react-native'
import { Text } from 'tamagui'
import { colors, radius } from '@aureak/theme'

interface NavTooltipProps {
  label   : string
  visible : boolean
  children: React.ReactNode
}

/**
 * NavTooltip — Story 51.7
 * Wrapper qui affiche un tooltip à droite de l'icône au hover en mode collapsed.
 * Utilise position: 'absolute' + left: 56 pour se positionner à droite de la sidebar.
 */
export function NavTooltip({ label, visible, children }: NavTooltipProps) {
  return (
    <View style={{ position: 'relative' }}>
      {children}
      {visible && (
        <View
          style={{
            position       : 'absolute',
            left           : 36,
            top            : '50%' as never,
            transform      : [{ translateY: -14 }],
            backgroundColor: colors.background.elevated,
            borderRadius   : radius.xs,
            paddingHorizontal: 8,
            paddingVertical  : 4,
            zIndex           : 100,
            // Story 110.10 — boxShadow web (replace deprecated shadow* props)
            boxShadow        : '0 2px 4px rgba(0,0,0,0.25)',
            // CSS-only on web
            opacity          : 1,
            pointerEvents    : 'none',
            whiteSpace       : 'nowrap',
          } as never}
        >
          <Text
            fontFamily="$body"
            fontSize={12}
            color={colors.text.primary}
            style={{ userSelect: 'none' } as never}
          >
            {label}
          </Text>
        </View>
      )}
    </View>
  )
}
