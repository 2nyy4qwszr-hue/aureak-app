'use client'
// Vue d'ensemble méthodologie : header + tiles semaine (thème + situation) + 4 KPIs + 3 widgets
// Layout miroir de /activites (voir activites/page.tsx).
import React, { useContext } from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space } from '@aureak/theme'

import { MethodologieCountsContext }          from './_layout'
import { MethodologieHeader }                 from '../../../components/admin/methodologie/MethodologieHeader'
import { MethodologieHubKpis }                from '../../../components/admin/methodologie/MethodologieHubKpis'
import { MethodologieHubThemeOfWeek }         from '../../../components/admin/methodologie/MethodologieHubThemeOfWeek'
import { MethodologieHubSituationOfWeek }     from '../../../components/admin/methodologie/MethodologieHubSituationOfWeek'
import { MethodologieHubRecentTrainings }     from '../../../components/admin/methodologie/MethodologieHubRecentTrainings'
import { MethodologieHubRecentSituations }    from '../../../components/admin/methodologie/MethodologieHubRecentSituations'
import { MethodologieHubOrphanThemes }        from '../../../components/admin/methodologie/MethodologieHubOrphanThemes'
import { PrimaryAction }                      from '../../../components/admin/PrimaryAction'

export default function MethodologieHubPage() {
  const router    = useRouter()
  const { width } = useWindowDimensions()
  const counts    = useContext(MethodologieCountsContext)

  const widgetCols = width >= 1024 ? 3 : 1
  const weekCols   = width >= 768  ? 2 : 1

  return (
    <View style={styles.container}>
      <MethodologieHeader counts={counts ?? undefined} hideNewButton />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.weekTilesGrid, { gridTemplateColumns: `repeat(${weekCols}, 1fr)` } as never]}>
          <MethodologieHubThemeOfWeek />
          <MethodologieHubSituationOfWeek />
        </View>

        <MethodologieHubKpis />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <MethodologieHubRecentTrainings />
          <MethodologieHubRecentSituations />
          <MethodologieHubOrphanThemes />
        </View>
      </ScrollView>

      <PrimaryAction
        label="Nouvel entraînement"
        onPress={() => router.push('/methodologie/seances/new' as never)}
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
  weekTilesGrid: {
    display          : 'grid' as never,
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingTop       : space.sm,
  },
  widgetsGrid: {
    display          : 'grid' as never,
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingTop       : space.sm,
  },
})
