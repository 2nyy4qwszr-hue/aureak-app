'use client'
// Story 91.1 — Layout hub Marketing : MarketingNavBar + Slot (pattern ProspectionLayout)
import React from 'react'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'
import { MarketingNavBar } from '../../../components/admin/marketing/MarketingNavBar'

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
