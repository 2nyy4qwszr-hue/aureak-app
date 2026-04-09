'use client'
// Story 75.2 — Layout hub Académie
// AcademieNavBar déplacée dans chaque page (comme séances) pour headerBlock uniforme
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'

export default function AcademieLayout() {
  return (
    <View style={s.wrapper}>
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
