// Hub Prospection — Vue d'ensemble : pattern strictement aligné sur /activites
// (header tabs uniformisé, KPIs + 3 widgets, FAB "+ Nouveau prospect").
'use client'
import React from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space } from '@aureak/theme'

import { ProspectionNavBar } from '../../../components/admin/prospection/ProspectionNavBar'
import { ProspectionHubKpis } from '../../../components/admin/prospection/ProspectionHubKpis'
import { ProspectionHubRecentActions } from '../../../components/admin/prospection/ProspectionHubRecentActions'
import { ProspectionHubFunnel } from '../../../components/admin/prospection/ProspectionHubFunnel'
import { ProspectionHubTopCommercials } from '../../../components/admin/prospection/ProspectionHubTopCommercials'
import { PrimaryAction } from '../../../components/admin/PrimaryAction'

export default function ProspectionHubPage() {
  const router    = useRouter()
  const { width } = useWindowDimensions()
  const widgetCols = width >= 1024 ? 3 : 1

  return (
    <View style={styles.container}>
      <ProspectionNavBar />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ProspectionHubKpis />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <ProspectionHubFunnel />
          <ProspectionHubRecentActions />
          <ProspectionHubTopCommercials />
        </View>
      </ScrollView>

      <PrimaryAction
        label="Nouveau prospect"
        onPress={() => router.push('/prospection/clubs' as never)}
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
