'use client'
// Vue d'ensemble méthodologie — pattern strictement aligné /activites :
// header tabs uniformisé + 4 KPIs + 3 widgets + FAB.
import React, { useContext } from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space } from '@aureak/theme'

import { MethodologieCountsContext }          from './_layout'
import { MethodologieHeader }                 from '../../../components/admin/methodologie/MethodologieHeader'
import { MethodologieHubKpis }                from '../../../components/admin/methodologie/MethodologieHubKpis'
import { MethodologieHubRecentTrainings }     from '../../../components/admin/methodologie/MethodologieHubRecentTrainings'
import { MethodologieHubRecentSituations }    from '../../../components/admin/methodologie/MethodologieHubRecentSituations'
import { MethodologieHubOrphanThemes }        from '../../../components/admin/methodologie/MethodologieHubOrphanThemes'
import { PrimaryAction }                      from '../../../components/admin/PrimaryAction'

export default function MethodologieHubPage() {
  const router    = useRouter()
  const { width } = useWindowDimensions()
  const counts    = useContext(MethodologieCountsContext)

  const widgetCols = width >= 1024 ? 3 : 1

  return (
    <View style={styles.container}>
      <MethodologieHeader counts={counts ?? undefined} hideNewButton />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <MethodologieHubKpis />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <MethodologieHubRecentTrainings />
          <MethodologieHubRecentSituations />
          <MethodologieHubOrphanThemes />
        </View>
      </ScrollView>

      <PrimaryAction
        label="Nouvel entraînement"
        onPress={() => router.push('/methodologie/entrainements/new' as never)}
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
