import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { listThemes, listThemeGroups } from '@aureak/api-client'
import { AureakButton, Badge } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Theme, ThemeGroup } from '@aureak/types'

const LEVEL_LABEL: Record<string, string> = {
  debutant     : 'Débutant',
  intermediaire: 'Intermédiaire',
  avance       : 'Avancé',
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupSection: {
    gap: space.md,
  },
})

export default function ThemesPage() {
  const router = useRouter()
  const [themes, setThemes] = useState<Theme[]>([])
  const [groups, setGroups] = useState<ThemeGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listThemes(), listThemeGroups()]).then(([t, g]) => {
      setThemes(t.data)
      setGroups(g.data)
      setLoading(false)
    })
  }, [])

  const groupedThemes = groups.map((group) => ({
    group,
    themes: themes.filter((t) => t.groupId === group.id),
  }))
  const ungrouped = themes.filter((t) => t.groupId === null)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AureakText variant="h2">Thèmes</AureakText>
        <AureakButton
          label="Nouveau thème"
          onPress={() => router.push('/methodologie/themes/new' as never)}
          variant="primary"
        />
      </View>

      {loading && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      )}

      {groupedThemes.map(({ group, themes: groupThemes }) => (
        groupThemes.length > 0 && (
          <View key={group.id} style={styles.groupSection}>
            <AureakText variant="label" style={{ color: colors.text.muted }}>
              {group.name}
            </AureakText>
            {groupThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} router={router} />
            ))}
          </View>
        )
      ))}

      {ungrouped.length > 0 && (
        <View style={styles.groupSection}>
          <AureakText variant="label" style={{ color: colors.text.muted }}>
            Sans groupe
          </AureakText>
          {ungrouped.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} router={router} />
          ))}
        </View>
      )}

      {!loading && themes.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucun thème configuré.
        </AureakText>
      )}
    </ScrollView>
  )
}

function ThemeCard({ theme, router }: { theme: Theme; router: ReturnType<typeof useRouter> }) {
  return (
    <View style={{ backgroundColor: colors.light.surface, borderRadius: 8, padding: space.md, borderWidth: 1, borderColor: colors.border.light, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm }}>
      <View style={{ flex: 1, gap: space.xs }}>
        <AureakText variant="label">{theme.name}</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          {theme.themeKey} · v{theme.version}
        </AureakText>
        <View style={{ flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' }}>
          {theme.level && (
            <Badge label={LEVEL_LABEL[theme.level] ?? theme.level} variant="zinc" />
          )}
          {theme.ageGroup && (
            <Badge label={theme.ageGroup} variant="zinc" />
          )}
        </View>
      </View>
      <AureakButton
        label="Gérer"
        onPress={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
        variant="secondary"
      />
    </View>
  )
}
