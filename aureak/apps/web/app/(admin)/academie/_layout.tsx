'use client'
// Story 75.2 — Layout hub Académie
// AcademieNavBar déplacée dans chaque page (comme séances) pour headerBlock uniforme
// Story 93.2 — Counts partagés via Context (une seule query pour les 8 pages du hub)
import React, { createContext, useEffect, useState } from 'react'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { getAcademieCounts, type AcademieCounts } from '@aureak/api-client'
import { colors } from '@aureak/theme'

export const AcademieCountsContext = createContext<AcademieCounts | null>(null)

export default function AcademieLayout() {
  const [counts, setCounts] = useState<AcademieCounts | null>(null)

  useEffect(() => {
    let cancelled = false
    getAcademieCounts()
      .then(({ data }) => {
        if (!cancelled) setCounts(data)
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[academie/_layout] counts error:', err)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <AcademieCountsContext.Provider value={counts}>
      <View style={s.wrapper}>
        <Slot />
      </View>
    </AcademieCountsContext.Provider>
  )
}

const s = StyleSheet.create({
  wrapper: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
})
