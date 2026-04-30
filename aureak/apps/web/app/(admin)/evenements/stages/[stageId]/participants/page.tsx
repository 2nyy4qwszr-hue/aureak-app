'use client'
// Story 105.2 — Gestion des participants au stage (ajout + création à la volée)
import { useCallback, useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getStage,
  listStageChildren,
  removeChildFromStage,
} from '@aureak/api-client'
import type { StageChild } from '@aureak/api-client'
import type { StageWithMeta } from '@aureak/types'
import { AureakText, HierarchyBreadcrumb, ConfirmDialog } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import {
  ParticipantsList,
} from '../../../../../../components/admin/stages/participants/ParticipantsList'
import {
  AddParticipantModal,
} from '../../../../../../components/admin/stages/participants/AddParticipantModal'

export default function StageParticipantsPage() {
  const router = useRouter()
  const { stageId } = useLocalSearchParams<{ stageId: string }>()

  const [stage, setStage] = useState<StageWithMeta | null>(null)
  const [participants, setParticipants] = useState<StageChild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const refresh = useCallback(async () => {
    if (!stageId) return
    try {
      const list = await listStageChildren(stageId)
      setParticipants(list)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[StageParticipantsPage] listStageChildren error:', err)
      }
      setError('Impossible de charger les participants')
    }
  }, [stageId])

  useEffect(() => {
    if (!stageId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [s, list] = await Promise.all([
          getStage(stageId),
          listStageChildren(stageId),
        ])
        if (cancelled) return
        setStage(s)
        setParticipants(list)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[StageParticipantsPage] initial load error:', err)
        }
        if (!cancelled) setError('Impossible de charger le stage')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [stageId])

  const onConfirmRemove = useCallback(async () => {
    if (!stageId || !confirmRemoveId) return
    setRemoving(true)
    try {
      await removeChildFromStage(stageId, confirmRemoveId)
      await refresh()
      setConfirmRemoveId(null)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[StageParticipantsPage] remove error:', err)
      }
    } finally {
      setRemoving(false)
    }
  }, [stageId, confirmRemoveId, refresh])

  if (!stageId) {
    return (
      <View style={styles.center}>
        <AureakText variant="body">Stage introuvable</AureakText>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.push(`/evenements/stages/${stageId}` as never)} style={styles.backBtn}>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>← Stage</AureakText>
        </Pressable>
        <HierarchyBreadcrumb items={[
          { label: 'Stages', onPress: () => router.push('/stages' as never) },
          { label: stage?.name ?? 'Stage', onPress: () => router.push(`/evenements/stages/${stageId}` as never) },
          { label: 'Participants' },
        ]} />
        <Pressable
          style={styles.primaryBtn}
          onPress={() => setShowAddModal(true)}
        >
          <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' as never }}>
            + Ajouter un gardien
          </AureakText>
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <AureakText variant="h2" style={{ color: colors.text.dark }}>
          Participants
        </AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          {loading ? 'Chargement…' : `${participants.length} gardien${participants.length > 1 ? 's' : ''} inscrit${participants.length > 1 ? 's' : ''}`}
        </AureakText>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <AureakText variant="caption" style={{ color: colors.accent.red }}>{error}</AureakText>
        </View>
      )}

      <ParticipantsList
        participants={participants}
        loading={loading}
        onRequestRemove={setConfirmRemoveId}
        onAdd={() => setShowAddModal(true)}
      />

      <AddParticipantModal
        visible={showAddModal}
        stageId={stageId}
        existingParticipantIds={participants.map((p) => p.id)}
        onClose={() => setShowAddModal(false)}
        onChanged={refresh}
      />

      <ConfirmDialog
        visible={confirmRemoveId !== null}
        title="Retirer ce gardien ?"
        message="Le gardien sera retiré de la liste des participants au stage. Sa fiche dans l'annuaire reste intacte."
        confirmLabel={removing ? 'Suppression…' : 'Retirer'}
        cancelLabel="Annuler"
        danger
        onConfirm={onConfirmRemove}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.lg, gap: space.md },
  headerRow : {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  backBtn   : {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  primaryBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  titleBlock: { gap: space.xs / 2, marginTop: space.sm },
  errorBox  : {
    padding: space.md,
    borderRadius: radius.xs,
    backgroundColor: colors.accent.red + '15',
    borderWidth: 1,
    borderColor: colors.accent.red,
  },
  center    : { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl },
})
