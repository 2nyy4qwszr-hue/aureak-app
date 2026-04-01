import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { listThemes, listThemeGroups, updateThemeOrder } from '@aureak/api-client'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Theme, ThemeGroup } from '@aureak/types'
import BlocsManagerModal from '../_components/BlocsManagerModal'
import PremiumThemeCard from '../_components/PremiumThemeCard'

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: colors.light.primary },
  content         : { padding: space.xl, gap: space.lg },
  header          : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', rowGap: space.sm },
  headerLeft      : { flexDirection: 'row', alignItems: 'center', gap: space.md },
  manageBtn       : { paddingHorizontal: space.sm, paddingVertical: 4 },
  filterRow       : { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip      : { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: 'transparent' },
  filterChipActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
})

export default function ThemesPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const gridColumns = width < 640 ? 1
    : width < 1100 ? 2
    : width < 1500 ? 3
    : 4

  const [themes,          setThemes]          = useState<Theme[]>([])
  const [orderedThemes,   setOrderedThemes]   = useState<Theme[]>([])
  const [groups,          setGroups]          = useState<ThemeGroup[]>([])
  const [loading,         setLoading]         = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [modalVisible,    setModalVisible]    = useState(false)
  const [dragIndex,       setDragIndex]       = useState<number | null>(null)
  const [hoverIndex,      setHoverIndex]      = useState<number | null>(null)
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null)

  const loadData = async () => {
    setErrorMsg(null)
    try {
      const [t, g] = await Promise.all([listThemes(), listThemeGroups()])
      if (t.error || g.error) {
        setErrorMsg('Impossible de charger les thèmes (erreur base de données). Réessayez ou contactez le support.')
        return
      }
      setThemes(t.data)
      setGroups(g.data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ThemesIndex] loadData error:', err)
      setErrorMsg('Impossible de charger les thèmes. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Maintenir orderedThemes trié par orderIndex
  useEffect(() => {
    const sorted = [...themes].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    setOrderedThemes(sorted)
  }, [themes])

  const visibleThemes = selectedGroupId
    ? orderedThemes.filter(t => t.groupId === selectedGroupId)
    : orderedThemes

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]))

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    const reordered = [...visibleThemes]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    const previousOrdered = orderedThemes
    // Optimistic update
    setOrderedThemes(prev => {
      // Replace visible items in their new positions, keeping non-visible items unchanged
      const next = [...prev]
      reordered.forEach((t, i) => {
        const idx = next.findIndex(x => x.id === t.id)
        if (idx !== -1) next[idx] = { ...t, orderIndex: i }
      })
      return next
    })
    // Persist changes — rollback on error
    try {
      await Promise.all(
        reordered
          .map((t, i) => ({ t, i }))
          .filter(({ t, i }) => t.orderIndex !== i)
          .map(({ t, i }) => updateThemeOrder(t.id, i))
      )
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ThemesIndex] handleDrop reorder error:', err)
      setOrderedThemes(previousOrdered)
    }
  }

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

      {errorMsg && (
        <AureakText variant="body" style={{ color: colors.accent.red }}>{errorMsg}</AureakText>
      )}

      {!loading && visibleThemes.length > 0 && (
        <View style={{
          display             : 'grid',
          gridTemplateColumns : `repeat(${gridColumns}, 1fr)`,
          gap                 : space.lg,
        } as never}>
          {visibleThemes.map((theme, index) => (
            <div
              key={theme.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e: React.DragEvent) => { e.preventDefault(); setHoverIndex(index) }}
              onDrop={() => { handleDrop(index); setHoverIndex(null) }}
              onDragEnd={() => { setDragIndex(null); setHoverIndex(null) }}
              style={{
                opacity     : dragIndex === index ? 0.5 : 1,
                cursor      : dragIndex !== null ? 'grabbing' : 'grab',
                outline     : hoverIndex === index && dragIndex !== index ? `2px solid ${colors.accent.gold}60` : 'none',
                borderRadius: 12,
                transition  : 'opacity 0.15s',
              }}
            >
              <PremiumThemeCard
                theme={theme}
                groupName={groupMap[theme.groupId ?? ''] ?? null}
                category={theme.category ?? null}
                onPress={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
                onManage={() => router.push(`/methodologie/themes/${theme.themeKey}` as never)}
              />
            </div>
          ))}
        </View>
      )}

      {!loading && !errorMsg && themes.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucun thème configuré.
        </AureakText>
      )}

      {!loading && themes.length > 0 && visibleThemes.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucun thème dans ce bloc.
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
