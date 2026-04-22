'use client'
// Story 88.1 — Layout hub Prospection
// Story 97.11 — ProspectionNavBar déplacée dans chaque page (après AdminPageHeader),
// pattern aligné sur Académie / Événements.
import React from 'react'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'

export default function ProspectionLayout() {
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
