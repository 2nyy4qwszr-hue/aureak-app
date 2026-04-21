'use client'
// Story 93.2 — Layout Activités : charge les counts une seule fois + les partage via Context
// Consommé par ActivitesHeader pour afficher les badges count sur chaque tab.
import React, { createContext, useEffect, useState } from 'react'
import { Slot } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { getActivitesCounts, type ActivitesCounts } from '@aureak/api-client'
import { colors } from '@aureak/theme'

export const ActivitesCountsContext = createContext<ActivitesCounts | null>(null)

export default function ActivitesLayout() {
  const [counts, setCounts] = useState<ActivitesCounts | null>(null)

  useEffect(() => {
    let cancelled = false
    getActivitesCounts()
      .then(({ data }) => {
        if (!cancelled) setCounts(data)
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[activites/_layout] counts error:', err)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <ActivitesCountsContext.Provider value={counts}>
      <View style={styles.container}>
        <Slot />
      </View>
    </ActivitesCountsContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
})
