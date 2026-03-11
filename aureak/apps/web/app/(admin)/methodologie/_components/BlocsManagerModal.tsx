import React, { useCallback, useEffect, useState } from 'react'
import { View, Modal, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native'
import { listThemeGroups, createThemeGroup, updateThemeGroup, deleteThemeGroup } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { ThemeGroup } from '@aureak/types'

type Props = {
  visible      : boolean
  onClose      : () => void
  onBlocChanged: () => void
}

export default function BlocsManagerModal({ visible, onClose, onBlocChanged }: Props) {
  const tenantId = useAuthStore(s => s.tenantId)

  const [blocs,       setBlocs]       = useState<ThemeGroup[]>([])
  const [loading,     setLoading]     = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [editName,    setEditName]    = useState('')
  const [newBlocName, setNewBlocName] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const loadBlocs = useCallback(async () => {
    setLoading(true)
    const { data } = await listThemeGroups()
    setBlocs(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (visible) {
      setError(null)
      setEditingId(null)
      setNewBlocName('')
      loadBlocs()
    }
  }, [visible, loadBlocs])

  const handleStartEdit = (bloc: ThemeGroup) => {
    setEditingId(bloc.id)
    setEditName(bloc.name)
    setError(null)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return
    setSaving(true)
    setError(null)
    const { error: err } = await updateThemeGroup(id, { name: editName.trim() })
    setSaving(false)
    if (err) {
      setError('Erreur lors de la sauvegarde.')
      return
    }
    setEditingId(null)
    await loadBlocs()
    onBlocChanged()
  }

  const handleDelete = async (id: string, name: string) => {
    setError(null)
    setSaving(true)
    const { error: err } = await deleteThemeGroup(id)
    setSaving(false)
    if (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any
      if (e?.type === 'IN_USE') {
        setError(`Le bloc « ${name} » est utilisé par ${e.count} élément(s) et ne peut pas être supprimé.`)
      } else {
        setError('Erreur lors de la suppression.')
      }
      return
    }
    await loadBlocs()
    onBlocChanged()
  }

  const handleAddBloc = async () => {
    if (!newBlocName.trim() || !tenantId) return
    setSaving(true)
    setError(null)
    const { error: err } = await createThemeGroup({ tenantId, name: newBlocName.trim() })
    setSaving(false)
    if (err) {
      setError('Erreur lors de la création.')
      return
    }
    setNewBlocName('')
    await loadBlocs()
    onBlocChanged()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>

          {/* Header */}
          <View style={s.header}>
            <AureakText variant="h3" style={{ color: colors.text.dark }}>Gérer les Blocs</AureakText>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <AureakText style={{ fontSize: 18, color: colors.text.muted }}>✕</AureakText>
            </Pressable>
          </View>

          {error && (
            <View style={s.errorBanner}>
              <AureakText style={{ color: colors.accent.red, fontSize: 12 }}>{error}</AureakText>
            </View>
          )}

          {/* Bloc list */}
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: space.sm, padding: space.md }}>
            {loading ? (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement…</AureakText>
            ) : blocs.length === 0 ? (
              <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' }}>Aucun bloc créé.</AureakText>
            ) : blocs.map(bloc => (
              <View key={bloc.id} style={s.blocRow}>
                {editingId === bloc.id ? (
                  <View style={{ flex: 1, flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
                    <TextInput
                      style={s.input}
                      value={editName}
                      onChangeText={setEditName}
                      autoFocus
                      onSubmitEditing={() => handleSaveEdit(bloc.id)}
                    />
                    <Pressable
                      style={[s.actionBtn, { backgroundColor: colors.accent.gold }]}
                      onPress={() => handleSaveEdit(bloc.id)}
                      disabled={saving}
                    >
                      <AureakText style={{ fontSize: 11, color: colors.text.dark, fontWeight: '700' }}>
                        {saving ? '…' : 'OK'}
                      </AureakText>
                    </Pressable>
                    <Pressable
                      style={[s.actionBtn, { backgroundColor: colors.light.muted }]}
                      onPress={() => setEditingId(null)}
                    >
                      <AureakText style={{ fontSize: 11, color: colors.text.muted }}>Annuler</AureakText>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <AureakText style={{ flex: 1, fontSize: 13, color: colors.text.dark }}>{bloc.name}</AureakText>
                    <Pressable
                      style={[s.actionBtn, { backgroundColor: colors.light.muted }]}
                      onPress={() => handleStartEdit(bloc)}
                    >
                      <AureakText style={{ fontSize: 11, color: colors.text.muted }}>Renommer</AureakText>
                    </Pressable>
                    <Pressable
                      style={[s.actionBtn, { backgroundColor: colors.accent.red + '18' }]}
                      onPress={() => handleDelete(bloc.id, bloc.name)}
                      disabled={saving}
                    >
                      <AureakText style={{ fontSize: 11, color: colors.accent.red }}>Supprimer</AureakText>
                    </Pressable>
                  </>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Add new bloc */}
          <View style={s.addRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={newBlocName}
              onChangeText={setNewBlocName}
              placeholder="Nom du nouveau bloc…"
              placeholderTextColor={colors.text.muted}
              onSubmitEditing={handleAddBloc}
            />
            <Pressable
              style={[s.actionBtn, { backgroundColor: colors.accent.gold, paddingHorizontal: space.md }]}
              onPress={handleAddBloc}
              disabled={saving || !newBlocName.trim()}
            >
              <AureakText style={{ fontSize: 12, color: colors.text.dark, fontWeight: '700' }}>
                {saving ? '…' : '+ Ajouter'}
              </AureakText>
            </Pressable>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay   : { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: space.xl },
  sheet     : { width: '100%', maxWidth: 520, backgroundColor: colors.light.surface, borderRadius: radius.cardLg, overflow: 'hidden', boxShadow: shadows.lg },
  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  closeBtn  : { padding: 6 },
  errorBanner: { backgroundColor: colors.accent.red + '10', padding: space.sm, paddingHorizontal: space.md },
  blocRow   : { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.light.muted, borderRadius: 8, padding: space.sm },
  input     : { flex: 1, borderWidth: 1, borderColor: colors.border.light, borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: 6, fontSize: 13, color: colors.text.dark, backgroundColor: colors.light.surface },
  actionBtn : { borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: 6 },
  addRow    : { flexDirection: 'row', gap: space.sm, padding: space.md, borderTopWidth: 1, borderTopColor: colors.border.divider, alignItems: 'center' },
})
