'use client'
// Story 92.1 — Layout hub Partenariat avec NavBar + Slot
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'
import { PartenariatNavBar } from './_components/PartenariatNavBar'

export default function PartenariatLayout() {
  return (
    <View style={s.wrapper}>
      <PartenariatNavBar />
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
