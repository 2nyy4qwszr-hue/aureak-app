'use client'
// Story 93.5 — Layout Méthodologie : charge les counts une seule fois + les partage via Context
// Consommé par MethodologieHeader pour afficher les badges count sur chaque tab.
import React, { createContext, useEffect, useState } from 'react'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { getMethodologieCounts, type MethodologieCounts } from '@aureak/api-client'
import { colors } from '@aureak/theme'

export const MethodologieCountsContext = createContext<MethodologieCounts | null>(null)

export default function MethodologieLayout() {
  const [counts, setCounts] = useState<MethodologieCounts | null>(null)

  useEffect(() => {
    let cancelled = false
    getMethodologieCounts()
      .then(({ data }) => {
        if (!cancelled) setCounts(data)
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[methodologie/_layout] counts error:', err)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <MethodologieCountsContext.Provider value={counts}>
      <View style={styles.container}>
        <Slot />
      </View>
    </MethodologieCountsContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
})
