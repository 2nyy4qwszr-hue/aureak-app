import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listSituations, listThemeGroups } from '@aureak/api-client'
import { AureakButton } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows } from '@aureak/theme'
import type { Situation, ThemeGroup } from '@aureak/types'
import BlocsManagerModal from '../_components/BlocsManagerModal'

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: colors.light.primary },
  content        : { padding: space.xl, gap: space.lg },
  header         : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft     : { flexDirection: 'row', alignItems: 'center', gap: space.md },
  manageBtn      : { paddingHorizontal: space.sm, paddingVertical: 4 },
  filterRow      : { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip     : { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: 'transparent' },
  filterChipActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  groupSection   : { gap: space.md },
  blocBadge      : { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent.gold + '20', borderWidth: 1, borderColor: colors.accent.gold + '60', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
})

export default function SituationsPage() {
  const router = useRouter()
  const [situations,      setSituations]      = useState<Situation[]>([])
  const [groups,          setGroups]          = useState<ThemeGroup[]>([])
  const [loading,         setLoading]         = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [modalVisible,    setModalVisible]    = useState(false)

  const loadData = async () => {
    const [s, g] = await Promise.all([listSituations(), listThemeGroups()])
    setSituations(s.data)
    setGroups(g.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const visibleSituations = selectedGroupId
    ? situations.filter(s => s.blocId === selectedGroupId)
    : situations

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]))

  const groupedSituations = groups.map(group => ({
    group,
    situations: visibleSituations.filter(s => s.blocId === group.id),
  }))
  const ungrouped = visibleSituations.filter(s => s.blocId === null)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AureakText variant="h2">Situations</AureakText>
          <Pressable
            style={styles.manageBtn}
            onPress={() => setModalVisible(true)}
          >
            <AureakText style={{ fontSize: 12, color: colors.text.muted }}>⚙ Gérer les blocs</AureakText>
          </Pressable>
        </View>
        <AureakButton
          label="Nouvelle situation"
          onPress={() => router.push('/methodologie/situations/new' as never)}
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

      {groupedSituations.map(({ group, situations: groupSits }) => (
        groupSits.length > 0 && (
          <View key={group.id} style={styles.groupSection}>
            <AureakText variant="label" style={{ color: colors.text.muted }}>
              {group.name}
            </AureakText>
            {groupSits.map(sit => (
              <SituationCard key={sit.id} situation={sit} groupName={groupMap[sit.blocId ?? ''] ?? null} router={router} />
            ))}
          </View>
        )
      ))}

      {ungrouped.length > 0 && (
        <View style={styles.groupSection}>
          <AureakText variant="label" style={{ color: colors.text.muted }}>Sans groupe</AureakText>
          {ungrouped.map(sit => (
            <SituationCard key={sit.id} situation={sit} groupName={null} router={router} />
          ))}
        </View>
      )}

      {!loading && situations.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucune situation configurée.
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

function SituationCard({
  situation, groupName, router,
}: {
  situation: Situation
  groupName: string | null
  router: ReturnType<typeof useRouter>
}) {
  return (
    <View style={{
      backgroundColor: colors.light.surface,
      borderRadius   : 8,
      padding        : space.md,
      borderWidth    : 1,
      borderColor    : colors.border.light,
      flexDirection  : 'row',
      justifyContent : 'space-between',
      alignItems     : 'center',
      gap            : space.sm,
      boxShadow      : shadows.sm,
    }}>
      <View style={{ flex: 1, gap: space.xs }}>
        {groupName && (
          <View style={styles.blocBadge as never}>
            <AureakText style={{ fontSize: 10, color: colors.text.dark, fontWeight: '600' }}>
              Bloc : {groupName}
            </AureakText>
          </View>
        )}
        <AureakText variant="label">{situation.name}</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          {situation.situationKey} · v{situation.version}
        </AureakText>
      </View>
      <AureakButton
        label="Gérer"
        onPress={() => router.push(`/methodologie/situations/${situation.situationKey}` as never)}
        variant="secondary"
      />
    </View>
  )
}
