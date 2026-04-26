'use client'
// Vue d'ensemble Académie — pattern strictement aligné /activites :
// header tabs uniformisé + 4 KPIs + 3 widgets + FAB.
import React, { useContext } from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space } from '@aureak/theme'

import { AcademieCountsContext }         from './_layout'
import { AcademieNavBar }                 from '../../../components/admin/academie/AcademieNavBar'
import { AcademieHubKpis }                from '../../../components/admin/academie/AcademieHubKpis'
import { AcademieHubRecentJoueurs }       from '../../../components/admin/academie/AcademieHubRecentJoueurs'
import { AcademieHubImplantations }       from '../../../components/admin/academie/AcademieHubImplantations'
import { AcademieHubOldAcademiciens }     from '../../../components/admin/academie/AcademieHubOldAcademiciens'
import { PrimaryAction }                  from '../../../components/admin/PrimaryAction'

export default function AcademieHubPage() {
  const router    = useRouter()
  const { width } = useWindowDimensions()
  const counts    = useContext(AcademieCountsContext)

  const widgetCols = width >= 1024 ? 3 : 1

  return (
    <View style={styles.container}>
      <AcademieNavBar counts={counts ?? undefined} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <AcademieHubKpis />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <AcademieHubRecentJoueurs />
          <AcademieHubImplantations />
          <AcademieHubOldAcademiciens />
        </View>
      </ScrollView>

      <PrimaryAction
        label="Nouveau joueur"
        onPress={() => router.push('/children/new' as never)}
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
