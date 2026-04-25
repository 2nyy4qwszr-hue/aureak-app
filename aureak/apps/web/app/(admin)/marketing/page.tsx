'use client'
// Vue d'ensemble Marketing — design aligné sur /activites :
// MarketingNavBar (bande blanche + onglets) + KPIs globaux + 3 mini-widgets, sans titre.
import React from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { colors, space } from '@aureak/theme'

import { MarketingNavBar }              from '../../../components/admin/marketing/MarketingNavBar'
import { MarketingHubKpis }             from '../../../components/admin/marketing/MarketingHubKpis'
import { MarketingHubMediasEnAttente }  from '../../../components/admin/marketing/MarketingHubMediasEnAttente'
import { MarketingHubProchaineCampagne } from '../../../components/admin/marketing/MarketingHubProchaineCampagne'
import { MarketingHubReseaux }          from '../../../components/admin/marketing/MarketingHubReseaux'

export default function MarketingHubPage() {
  const { width }  = useWindowDimensions()
  const widgetCols = width >= 1024 ? 3 : 1

  return (
    <View style={styles.container}>
      <MarketingNavBar />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <MarketingHubKpis />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <MarketingHubMediasEnAttente />
          <MarketingHubProchaineCampagne />
          <MarketingHubReseaux />
        </View>
      </ScrollView>
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
