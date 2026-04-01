import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { listThemeGroups, createThemeGroup, updateThemeGroupOrder } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { ThemeGroup } from '@aureak/types'

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
  groupCard: {
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
  orderInput: {
    width: 56,
  },
  errorBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
  addRow: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-end',
  },
})

export default function ThemeGroupsPage() {
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [groups, setGroups] = useState<ThemeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const { data } = await listThemeGroups()
      setGroups(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGroups() }, [])

  const handleCreate = async () => {
    if (!newName.trim() || !tenantId) return
    setError(null)
    const { error: err } = await createThemeGroup({
      tenantId,
      name     : newName.trim(),
      sortOrder: groups.length,
    })
    if (err) { setError('Erreur lors de la création.'); return }
    setNewName('')
    await fetchGroups()
  }

  const handleOrder = async (id: string, order: number) => {
    await updateThemeGroupOrder(id, order)
    await fetchGroups()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      <AureakText variant="h2">Blocs</AureakText>
      <AureakText variant="body" style={{ color: colors.text.muted, marginTop: -8, marginBottom: 8 }}>
        Regroupement de haut niveau — Thèmes et Situations y font référence.
      </AureakText>

      {error && (
        <View style={styles.errorBanner}>
          <AureakText variant="body" style={{ color: colors.status.absent }}>{error}</AureakText>
        </View>
      )}

      <View style={styles.addRow}>
        <Input
          value={newName}
          onChangeText={setNewName}
          placeholder="Nom du bloc (ex: Tir au but)"
          autoCapitalize="words"
          style={{ flex: 1 }}
        />
        <AureakButton label="Ajouter" onPress={handleCreate} variant="primary" />
      </View>

      {loading && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      )}

      {groups.map((group) => (
        <View key={group.id} style={styles.groupCard}>
          <AureakText variant="label" style={{ flex: 1 }}>{group.name}</AureakText>
          <Input
            value={String(group.sortOrder ?? '')}
            onChangeText={(val) => handleOrder(group.id, Number(val))}
            placeholder="Ordre"
            keyboardType="numeric"
            style={styles.orderInput}
          />
        </View>
      ))}

      {!loading && groups.length === 0 && (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucun bloc configuré. Exemple : Tir au but, 1vs1, Relance...
        </AureakText>
      )}
    </ScrollView>
  )
}
