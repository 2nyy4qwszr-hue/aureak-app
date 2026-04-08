'use client'
// Story 75.2 — Layout hub Académie : AcademieNavBar partagée sur toutes les sous-routes
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'
import { AcademieNavBar } from './_components/AcademieNavBar'

export default function AcademieLayout() {
  return (
    <View style={s.wrapper}>
      <AcademieNavBar />
      <View style={s.content}>
        <Slot />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    flex: 1,
  },
})
