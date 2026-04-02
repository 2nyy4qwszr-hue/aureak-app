'use client'
// /seances/tampons — Gestion tampons de rattrapage (Story 32.1)

import { useState, useEffect, useCallback } from 'react'
import { View, Pressable, ActivityIndicator, StyleSheet, TextInput, ScrollView } from 'react-native'
import { Text } from 'tamagui'
import {
  listAllGroups, getGroupDebt, listSessionBuffers, createSessionBuffer, activateBuffer,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, radius } from '@aureak/theme'
import type { Group, SessionBuffer, SeasonDebt } from '@aureak/types'

type GroupWithDebt = {
  group        : Group
  debt         : SeasonDebt | null
  buffers      : SessionBuffer[]
}

export default function TamponsPage() {
  const { user }                          = useAuthStore()
  const tenantId                          = (user?.app_metadata?.tenant_id as string | undefined) ?? ''
  const [rows, setRows]                   = useState<GroupWithDebt[]>([])
  const [loading, setLoading]             = useState(true)
  const [activating, setActivating]       = useState<string | null>(null)
  const [creating, setCreating]           = useState<string | null>(null)
  const [newDate, setNewDate]             = useState<Record<string, string>>({})
  const [error, setError]                 = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const groups = await listAllGroups()
      const enriched = await Promise.all(
        groups.map(async (group) => {
          const { debt, buffers } = await getGroupDebt(group.id)
          return { group, debt, buffers }
        }),
      )
      // Afficher seulement les groupes avec dette ou tampons
      setRows(enriched.filter((r) => (r.debt?.debtCount ?? 0) > 0 || r.buffers.length > 0))
      setError(null)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[TamponsPage] load:', err)
      setError('Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleActivate(bufferId: string, groupId: string) {
    setActivating(bufferId)
    try {
      await activateBuffer(bufferId, tenantId, groupId)
      load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[TamponsPage] activate:', err)
    } finally {
      setActivating(null)
    }
  }

  async function handleCreateBuffer(groupId: string) {
    const date = newDate[groupId]?.trim()
    if (!date) return
    setCreating(groupId)
    try {
      await createSessionBuffer(tenantId, groupId, date)
      setNewDate((prev) => ({ ...prev, [groupId]: '' }))
      load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[TamponsPage] create:', err)
    } finally {
      setCreating(null)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.light.primary }}>
      <View style={styles.page}>
        <Text fontSize={24} fontWeight="700" color={colors.text.primary} style={{ marginBottom: 4 }}>Tampons</Text>
        <Text fontSize={14} color={colors.text.muted} style={{ marginBottom: 16 }}>
          Gestion des séances de rattrapage et des dettes par groupe
        </Text>

        {error && <Text color={colors.accent.red} style={{ marginBottom: 12 }}>{error}</Text>}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent.gold} />
          </View>
        ) : rows.length === 0 ? (
          <View style={[styles.card, styles.center, { paddingVertical: 40 }]}>
            <Text color={colors.text.muted}>Aucun groupe avec dette ou tampon.</Text>
          </View>
        ) : (
          rows.map(({ group, debt, buffers }) => {
            const available  = buffers.filter((b) => b.status === 'available')
            const activated  = buffers.filter((b) => b.status === 'activated')
            const debtCount  = debt?.debtCount ?? 0
            const suspended  = debt?.suspendedCount ?? 0

            return (
              <View key={group.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text fontSize={16} fontWeight="700" color={colors.text.primary}>{group.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {debtCount > 0 ? (
                        <View style={[styles.badge, { backgroundColor: colors.accent.red }]}>
                          <Text fontSize={11} fontWeight="600" color="#fff">⚠️ {debtCount} dette(s)</Text>
                        </View>
                      ) : null}
                      {suspended > 0 ? (
                        <View style={[styles.badge, { backgroundColor: '#92400E' }]}>
                          <Text fontSize={11} fontWeight="600" color="#fff">{suspended} suspendue(s)</Text>
                        </View>
                      ) : null}
                      <View style={[styles.badge, { backgroundColor: colors.light.elevated, borderWidth: 1, borderColor: colors.border.light }]}>
                        <Text fontSize={11} color={colors.text.muted}>{available.length} tampon(s) disponible(s)</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Liste des tampons */}
                {buffers.length > 0 && (
                  <View style={{ marginTop: 12, gap: 6 }}>
                    {buffers.map((buf) => (
                      <View key={buf.id} style={styles.bufferRow}>
                        <Text fontSize={13} color={colors.text.primary} style={{ flex: 1 }}>
                          📅 {buf.bufferDate}
                        </Text>
                        <View style={[styles.badge, {
                          backgroundColor: buf.status === 'available' ? colors.accent.gold + '22'
                            : buf.status === 'activated' ? colors.status.success + '22'
                            : colors.light.elevated,
                        }]}>
                          <Text fontSize={11} color={
                            buf.status === 'available' ? colors.accent.gold
                              : buf.status === 'activated' ? colors.status.success
                              : colors.text.muted
                          }>
                            {buf.status === 'available' ? 'Disponible' : buf.status === 'activated' ? '✓ Activé' : 'Expiré'}
                          </Text>
                        </View>
                        {buf.status === 'available' && debtCount > 0 && (
                          <Pressable
                            onPress={() => handleActivate(buf.id, group.id)}
                            disabled={activating === buf.id}
                            style={styles.btnActivate}
                          >
                            {activating === buf.id
                              ? <ActivityIndicator size="small" color="#000" />
                              : <Text fontSize={12} fontWeight="600" color="#000">Activer</Text>
                            }
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Créer un nouveau tampon */}
                <View style={{ marginTop: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    value={newDate[group.id] ?? ''}
                    onChangeText={(v) => setNewDate((prev) => ({ ...prev, [group.id]: v }))}
                    placeholder="Date tampon (YYYY-MM-DD)"
                    style={styles.dateInput}
                  />
                  <Pressable
                    onPress={() => handleCreateBuffer(group.id)}
                    disabled={creating === group.id || !newDate[group.id]?.trim()}
                    style={[styles.btnPrimary, (!newDate[group.id]?.trim() || creating === group.id) && { opacity: 0.5 }]}
                  >
                    {creating === group.id
                      ? <ActivityIndicator size="small" color="#000" />
                      : <Text fontSize={12} fontWeight="600" color="#000">+ Tampon</Text>
                    }
                  </Pressable>
                </View>
              </View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page      : { padding: 20, gap: 12 },
  center    : { justifyContent: 'center', alignItems: 'center' },
  card      : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : 16,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow      : shadows.sm,
  } as never,
  badge     : { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.xs },
  bufferRow : { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dateInput : {
    flex           : 1,
    backgroundColor: colors.light.elevated,
    borderWidth    : 1, borderColor: colors.border.light,
    borderRadius   : radius.button,
    padding        : 10, fontSize: 13,
    color          : colors.text.primary,
  },
  btnPrimary: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius     : radius.button,
    alignItems       : 'center',
  },
  btnActivate: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius     : radius.xs,
    alignItems       : 'center',
  },
})
