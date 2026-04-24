'use client'
// Story 108.1 — Hub Activités : vue d'ensemble 100% cartes (4 KPIs + 3 mini-widgets).
// Le tableau séances est déplacé sur /activites/seances (tab dédié).
import React, { useContext, useState } from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space } from '@aureak/theme'

import { AdminPageHeader }          from '../../../components/admin/AdminPageHeader'
import { formatPeriodLabel }        from '../../../lib/admin/formatPeriodLabel'
import { ActivitesCountsContext }   from './_layout'
import { ActivitesHeader }          from '../../../components/admin/activites/ActivitesHeader'
import { ActivitesToolbar }         from '../../../components/admin/activites/ActivitesToolbar'
import { ActivitesHubKpis }         from '../../../components/admin/activites/ActivitesHubKpis'
import { ActivitesHubNextSession }  from '../../../components/admin/activites/ActivitesHubNextSession'
import { ActivitesHubRecentEvaluations } from '../../../components/admin/activites/ActivitesHubRecentEvaluations'
import { ActivitesHubAtRiskPlayers } from '../../../components/admin/activites/ActivitesHubAtRiskPlayers'
import { PrimaryAction }            from '../../../components/admin/PrimaryAction'
import type { ScopeState }          from '../../../components/admin/activites/FiltresScope'
import type { TemporalFilter }      from '../../../components/admin/activites/PseudoFiltresTemporels'

export default function ActivitesHubPage() {
  const router                              = useRouter()
  const { width }                           = useWindowDimensions()
  const [scope,          setScope]          = useState<ScopeState>({ scope: 'global' })
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('today')
  const counts                              = useContext(ActivitesCountsContext)

  const widgetCols = width >= 1024 ? 3 : 1

  return (
    <View style={styles.container}>
      <AdminPageHeader
        title="Activités"
        periodButton={{
          label  : formatPeriodLabel(),
          onPress: () => { /* TODO : ouvrir picker mois */ },
        }}
      />

      <ActivitesHeader counts={counts ?? undefined} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ActivitesHubKpis scope={scope} />

        <View style={styles.toolbarWrap}>
          <ActivitesToolbar
            scope={scope}
            onScopeChange={setScope}
            temporal={temporalFilter}
            onTemporalChange={setTemporalFilter}
          />
        </View>

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <ActivitesHubNextSession scope={scope} />
          <ActivitesHubRecentEvaluations scope={scope} />
          <ActivitesHubAtRiskPlayers scope={scope} />
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
  toolbarWrap: {
    paddingHorizontal: space.lg,
  },
  widgetsGrid: {
    display          : 'grid' as never,
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingTop       : space.sm,
  },
})
