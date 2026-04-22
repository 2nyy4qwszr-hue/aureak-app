'use client'
// Story 91.1 — Layout hub Marketing
// Story 97.12 — MarketingNavBar déplacée dans chaque page (après AdminPageHeader)
import React from 'react'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'

export default function MarketingLayout() {
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
