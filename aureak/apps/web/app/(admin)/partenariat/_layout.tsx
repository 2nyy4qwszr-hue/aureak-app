'use client'
// Story 92.1 — Layout hub Partenariat
// Story 97.13 — PartenariatNavBar déplacée dans chaque page (après AdminPageHeader)
import React from 'react'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { colors } from '@aureak/theme'

export default function PartenariatLayout() {
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
