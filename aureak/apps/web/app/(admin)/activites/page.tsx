'use client'
import React, { useContext, useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

import { AdminPageHeader }          from '../_components/AdminPageHeader'
import { formatEyebrow }            from '../_components/formatPeriodLabel'
import { ActivitesCountsContext }   from './_layout'
import { ActivitesHeader }          from './components/ActivitesHeader'
import { ActivitesToolbar }         from './components/ActivitesToolbar'
import { StatCards }                from './components/StatCards'
import { TableauSeances }           from './components/TableauSeances'
import type { ScopeState }          from './components/FiltresScope'
import type { TemporalFilter }      from './components/PseudoFiltresTemporels'

const ACTIVITES_SUBTITLE = "Séances programmées, présences des joueurs et évaluations des coachs — tout le pouls de l'académie au même endroit."

export default function ActivitesPage() {
  const [scope,          setScope]          = useState<ScopeState>({ scope: 'global' })
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('today')
  const counts                              = useContext(ActivitesCountsContext)

  return (
    <View style={styles.container}>
      {/* Story 93.1 — Header premium (eyebrow + title + subtitle) */}
      <AdminPageHeader
        eyebrow={formatEyebrow('Pilotage')}
        title="Activités"
        subtitle={ACTIVITES_SUBTITLE}
      />

      {/* Header onglets + bouton (Story 93.2 — counts depuis Context layout) */}
      <ActivitesHeader counts={counts ?? undefined} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 4 Stat cards */}
        <StatCards scope={scope} />

        {/* Story 93.7 — ActivitesToolbar : chips scope + bouton Filtres + segmented temporal alignés template */}
        <View style={styles.toolbarWrap}>
          <ActivitesToolbar
            scope={scope}
            onScopeChange={setScope}
            temporal={temporalFilter}
            onTemporalChange={setTemporalFilter}
          />
        </View>

        {/* Tableau des séances */}
        <TableauSeances scope={scope} temporalFilter={temporalFilter} />
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
    paddingTop     : space.md,
    paddingBottom  : 64, // Story 93.7 — alignement template `.page` padding-bottom 64
    backgroundColor: colors.light.primary,
  },
  toolbarWrap: {
    paddingHorizontal: space.lg,
  },
})
