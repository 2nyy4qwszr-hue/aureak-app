'use client'
// Story 60.1 — Placeholder Progression (sera implémenté dans une story ultérieure)
import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space, radius } from '@aureak/theme'

export default function ProgressionPage() {
  const router = useRouter()
  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
      <Text style={{ fontSize: 32, marginBottom: 16 }}>📈</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.dark, marginBottom: 8 }}>Progression</Text>
      <Text style={{ fontSize: 14, color: colors.text.muted, textAlign: 'center' as never, marginBottom: 24 }}>
        Cette section sera disponible prochainement.
      </Text>
      <Pressable
        onPress={() => router.push('/analytics' as never)}
        style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.accent.gold, borderRadius: radius.button }}
      >
        <Text style={{ color: colors.text.dark, fontWeight: '700', fontSize: 14 }}>← Retour Stats Room</Text>
      </Pressable>
    </View>
  )
}
