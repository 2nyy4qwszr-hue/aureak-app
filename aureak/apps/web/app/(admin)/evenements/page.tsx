'use client'
// Hub Événements — vue d'ensemble : 4 KPIs + 3 mini-widgets.
// Pattern miroir de /activites, /academie, /methodologie.
import React from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space } from '@aureak/theme'

import { EvenementsHeader }                     from '../../../components/admin/evenements/EvenementsHeader'
import { EvenementsHubKpis }                    from '../../../components/admin/evenements/EvenementsHubKpis'
import { EvenementsHubNextEvent }               from '../../../components/admin/evenements/EvenementsHubNextEvent'
import { EvenementsHubRecentRegistrations }     from '../../../components/admin/evenements/EvenementsHubRecentRegistrations'
import { EvenementsHubAlmostFullWidget }        from '../../../components/admin/evenements/EvenementsHubAlmostFull'
import { PrimaryAction }                        from '../../../components/admin/PrimaryAction'

export default function EvenementsHubPage() {
  const router    = useRouter()
  const { width } = useWindowDimensions()

  const widgetCols = width >= 1024 ? 3 : 1

  return (
    <View style={styles.container}>
      <EvenementsHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <EvenementsHubKpis />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <EvenementsHubNextEvent />
          <EvenementsHubRecentRegistrations />
          <EvenementsHubAlmostFullWidget />
        </View>
      </ScrollView>

      <PrimaryAction
        label="Nouveau stage"
        onPress={() => router.push('/evenements/stages/new' as never)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scroll: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scrollContent: {
    paddingTop   : space.md,
    paddingBottom: 64,
    gap          : space.md,
  },
  widgetsGrid: {
    display          : 'grid' as never,
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingTop       : space.sm,
  },
})
