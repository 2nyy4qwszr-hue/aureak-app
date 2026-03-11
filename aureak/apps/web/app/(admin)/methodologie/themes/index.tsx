import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listThemes, listThemeGroups } from '@aureak/api-client'
import { AureakButton } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Theme, ThemeGroup } from '@aureak/types'
import BlocsManagerModal from '../_components/BlocsManagerModal'
import ThemeCard from '../_components/ThemeCard'

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: colors.light.primary },
  content         : { padding: space.xl, gap: space.lg },
  header          : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft      : { flexDirection: 'row', alignItems: 'center', gap: space.md },
  manageBtn       : { paddingHorizontal: space.sm, paddingVertical: 4 },
  filterRow       : { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip      : { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: 'transparent' },
  filterChipActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
})

export default function ThemesPage() {
  const router = useRouter()
  const [themes,          setThemes]          = useState<Theme[]>([])
  const [groups,          setGroups]          = useState<ThemeGroup[]>([])
  const [loading,         setLoading]         = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [modalVisible,    setModalVisible]    = useState(false)

  const loadData = async () => {
    const [t, g] = await Promise.all([listThemes(), listThemeGroups()])
    setThemes(t.data)
    setGroups(g.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const visibleThemes = selectedGroupId
    ? themes.filter(t => t.groupId === selectedGroupId)
    : themes

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]))

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AureakText variant="h2">Thèmes</AureakText>
          <Pressable
            style={styles.manageBtn}
            onPress={() => setModalVisible(true)}
          >
            <AureakText style={{ fontSize: 12, color: colors.text.muted }}>⚙ Gérer les blocs</AureakText>
          </Pressable>
        </View>
        <AureakButton
          label="Nouveau thème"
          onPress={() => router.push('/methodologie/themes/new' as never)}
          variant="primary"
        />
      </View>

      {/* Filtre par Bloc */}
      {groups.length > 0 && (
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, !selectedGroupId && styles.filterChipActive]}
            onPress={() => setSelectedGroupId(null)}
          >
            <AureakText style={{ fontSize: 12, color: !selectedGroupId ? colors.text.dark : colors.text.muted, fontWeight: !selectedGroupId ? '700' : '400' }}>
              Tous
            </AureakText>
          </Pressable>
          {groups.map(g => (
            <Pressable
              key={g.id}
              style={[styles.filterChip, selectedGroupId === g.id && styles.filterChipActive]}
              onPress={() => setSelectedGroupId(g.id)}
            >
              <AureakText style={{ fontSize: 12, color: selectedGroupId === g.id ? colors.text.dark : colors.text.muted, fontWeight: selectedGroupId === g.id ? '700' : '400' }}>
                {g.name}
              </AureakText>
            </Pressable>
          ))}
        </View>
      )}

      {loading && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      )}

      {!loading && visibleThemes.length > 0 && (
        <View style={{
          display             : 'grid',
          gridTemplateColumns : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap                 : space.lg,
        } as never}>
          {visibleThemes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              groupName={groupMap[theme.groupId ?? ''] ?? null}
              onPress={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
              onManage={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
            />
          ))}
        </View>
      )}

      {!loading && themes.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucun thème configuré.
        </AureakText>
      )}

      <BlocsManagerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onBlocChanged={() => {
          setLoading(true)
          loadData()
        }}
      />
    </ScrollView>
  )
}
