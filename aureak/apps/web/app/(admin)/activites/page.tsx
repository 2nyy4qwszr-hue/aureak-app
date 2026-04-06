'use client'
// Story 65-1 — Activités Hub : page principale (onglet Séances)
import React, { useState } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

import { ActivitesHeader }          from './components/ActivitesHeader'
import { FiltresScope }             from './components/FiltresScope'
import { PseudoFiltresTemporels }   from './components/PseudoFiltresTemporels'
import { StatCards }                from './components/StatCards'
import { TableauSeances }           from './components/TableauSeances'
import type { ScopeState }          from './components/FiltresScope'
import type { TemporalFilter }      from './components/PseudoFiltresTemporels'

export default function ActivitesPage() {
  const [scope,          setScope]          = useState<ScopeState>({ scope: 'global' })
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('past')

  return (
    <View style={styles.container}>
      {/* Header onglets + bouton */}
      <ActivitesHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Filtres scope — ligne 1 */}
        <FiltresScope value={scope} onChange={setScope} />

        {/* Pseudo-filtres temporels — ligne 2 */}
        <PseudoFiltresTemporels value={temporalFilter} onChange={setTemporalFilter} />

        {/* 4 Stat cards */}
        <StatCards scope={scope} />

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
    flex: 1,
  },
  scrollContent: {
    paddingTop: space.md,
  },
})
