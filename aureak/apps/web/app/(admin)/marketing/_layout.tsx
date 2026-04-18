'use client'
// Story 91.1 — Layout hub Marketing avec NavBar + Slot
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'
import { MarketingNavBar } from './_components/MarketingNavBar'

export default function MarketingLayout() {
  return (
    <View style={s.wrapper}>
      <MarketingNavBar />
      <Slot />
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
})
