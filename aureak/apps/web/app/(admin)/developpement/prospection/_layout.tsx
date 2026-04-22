'use client'
// Story 88.1 — Layout hub Prospection : ProspectionNavBar + Slot (pattern AcademieLayout)
import React from 'react'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'
import { ProspectionNavBar } from '../../../../components/admin/prospection/ProspectionNavBar'

export default function ProspectionLayout() {
  return (
    <View style={s.wrapper}>
      <ProspectionNavBar />
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
