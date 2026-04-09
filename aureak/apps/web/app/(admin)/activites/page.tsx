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
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('today')

  return (
    <View style={styles.container}>
      {/* Header onglets + bouton */}
      <ActivitesHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 4 Stat cards */}
        <StatCards scope={scope} />

        {/* Filtres scope + temporels sur une ligne */}
        <View style={styles.filtresRow}>
          <FiltresScope value={scope} onChange={setScope} />
          <PseudoFiltresTemporels value={temporalFilter} onChange={setTemporalFilter} />
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
    flex: 1,
  },
  scrollContent: {
    paddingTop: space.md,
  },
  filtresRow: {
    flexDirection    : 'row',
    justifyContent   : 'space-between',
    alignItems       : 'center',
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    zIndex           : 9999,
  },
})
