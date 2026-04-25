'use client'
// Hub Partenariat — Vue d'ensemble : pattern strictement aligné sur /activites
// (header tabs uniformisé, KPIs + 3 widgets, FAB "+ Nouveau sponsor").
import React from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space } from '@aureak/theme'

import { PartenariatNavBar }              from '../../../components/admin/partenariat/PartenariatNavBar'
import { PartenariatHubKpis }             from '../../../components/admin/partenariat/PartenariatHubKpis'
import { PartenariatHubRecentSponsors }   from '../../../components/admin/partenariat/PartenariatHubRecentSponsors'
import { PartenariatHubRecentPartners }   from '../../../components/admin/partenariat/PartenariatHubRecentPartners'
import { PartenariatHubTopSponsors }      from '../../../components/admin/partenariat/PartenariatHubTopSponsors'
import { PrimaryAction }                  from '../../../components/admin/PrimaryAction'

export default function PartenariatHubPage() {
  const router    = useRouter()
  const { width } = useWindowDimensions()
  const widgetCols = width >= 1024 ? 3 : 1

  return (
    <View style={styles.container}>
      <PartenariatNavBar />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <PartenariatHubKpis />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <PartenariatHubRecentSponsors />
          <PartenariatHubRecentPartners />
          <PartenariatHubTopSponsors />
        </View>
      </ScrollView>

      <PrimaryAction
        label="Nouveau sponsor"
        onPress={() => router.push('/partenariat/sponsors' as never)}
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
