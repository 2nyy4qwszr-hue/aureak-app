import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { listSituations, listThemeGroups } from '@aureak/api-client'
import { AureakButton } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Situation, ThemeGroup } from '@aureak/types'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.xl, gap: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupSection: { gap: space.md },
  situationCard: {
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
})

export default function SituationsPage() {
  const router = useRouter()
  const [situations, setSituations] = useState<Situation[]>([])
  const [blocs, setBlocs] = useState<ThemeGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listSituations(), listThemeGroups()]).then(([s, g]) => {
      setSituations(s.data)
      setBlocs(g.data)
      setLoading(false)
    })
  }, [])

  const groupedSituations = blocs.map((bloc) => ({
    bloc,
    situations: situations.filter((s) => s.blocId === bloc.id),
  }))
  const ungrouped = situations.filter((s) => s.blocId === null)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AureakText variant="h2">Situations</AureakText>
        <AureakButton
          label="Nouvelle situation"
          onPress={() => router.push('/(admin)/methodologie/situations/new' as never)}
          variant="primary"
        />
      </View>

      {loading && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      )}

      {groupedSituations.map(({ bloc, situations: groupSit }) =>
        groupSit.length > 0 ? (
          <View key={bloc.id} style={styles.groupSection}>
            <AureakText variant="label" style={{ color: colors.text.muted }}>{bloc.name}</AureakText>
            {groupSit.map((sit) => (
              <View key={sit.id} style={styles.situationCard}>
                <View style={{ flex: 1, gap: space.xs }}>
                  <AureakText variant="label">{sit.name}</AureakText>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>
                    {sit.situationKey} · v{sit.version}
                  </AureakText>
                </View>
                <AureakButton
                  label="Gérer"
                  onPress={() => router.push(`/(admin)/methodologie/situations/${sit.situationKey}` as never)}
                  variant="secondary"
                />
              </View>
            ))}
          </View>
        ) : null
      )}

      {ungrouped.length > 0 && (
        <View style={styles.groupSection}>
          <AureakText variant="label" style={{ color: colors.text.muted }}>Sans groupe</AureakText>
          {ungrouped.map((sit) => (
            <View key={sit.id} style={styles.situationCard}>
              <View style={{ flex: 1, gap: space.xs }}>
                <AureakText variant="label">{sit.name}</AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  {sit.situationKey} · v{sit.version}
                </AureakText>
              </View>
              <AureakButton
                label="Gérer"
                onPress={() => router.push(`/(admin)/methodologie/situations/${sit.situationKey}` as never)}
                variant="secondary"
              />
            </View>
          ))}
        </View>
      )}

      {!loading && situations.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucune situation configurée.
        </AureakText>
      )}
    </ScrollView>
  )
}
