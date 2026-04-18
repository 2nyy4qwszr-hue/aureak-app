// Story 86.4 — Placeholder Partenariat
import React from 'react'
import { YStack, Text } from 'tamagui'
import { colors } from '@aureak/theme'

export default function PartenariatPage() {
  return (
    <YStack flex={1} padding={32} gap={16}>
      <Text fontFamily="$heading" fontSize={24} fontWeight="700" color={colors.text.primary}>
        Partenariat
      </Text>
      <Text fontFamily="$body" fontSize={14} color={colors.text.secondary}>
        Cette section sera disponible prochainement.
      </Text>
    </YStack>
  )
}
