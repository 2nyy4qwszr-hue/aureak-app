'use client'
// Story 108.2 — Vue d'ensemble sans filtres : widgets toujours en scope global.
// Suppression du periodButton (« avril 2026 ») et de l'ActivitesToolbar.
import React, { useContext } from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space } from '@aureak/theme'

import { ActivitesCountsContext }        from './_layout'
import { ActivitesHeader }               from '../../../components/admin/activites/ActivitesHeader'
import { ActivitesHubKpis }              from '../../../components/admin/activites/ActivitesHubKpis'
import { ActivitesHubNextSession }       from '../../../components/admin/activites/ActivitesHubNextSession'
import { ActivitesHubRecentEvaluations } from '../../../components/admin/activites/ActivitesHubRecentEvaluations'
import { ActivitesHubAtRiskPlayers }     from '../../../components/admin/activites/ActivitesHubAtRiskPlayers'
import { PrimaryAction }                 from '../../../components/admin/PrimaryAction'
import type { ScopeState }               from '../../../components/admin/activites/FiltresScope'

const GLOBAL_SCOPE: ScopeState = { scope: 'global' }

export default function ActivitesHubPage() {
  const router     = useRouter()
  const { width }  = useWindowDimensions()
  const counts     = useContext(ActivitesCountsContext)

  const widgetCols = width >= 1024 ? 3 : 1

  return (
    <View style={styles.container}>
      <ActivitesHeader counts={counts ?? undefined} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ActivitesHubKpis scope={GLOBAL_SCOPE} />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <ActivitesHubNextSession scope={GLOBAL_SCOPE} />
          <ActivitesHubRecentEvaluations scope={GLOBAL_SCOPE} />
          <ActivitesHubAtRiskPlayers scope={GLOBAL_SCOPE} />
        </View>
      </ScrollView>

      <PrimaryAction
        label="Nouvelle séance"
        onPress={() => router.push('/activites/seances/new' as never)}
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
