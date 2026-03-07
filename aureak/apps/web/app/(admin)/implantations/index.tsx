'use client'
// Story 9.4 — CRUD Implantations, Groupes & Assignations Coaches (UI)
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'

import {
  listImplantations,
  createImplantation,
  updateImplantation,
  deleteImplantation,
  listGroupsByImplantation,
  createGroup,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Implantation, Group, AgeGroup } from '@aureak/types'

const AGE_GROUPS: AgeGroup[] = ['U5', 'U8', 'U11', 'Senior']

export default function ImplantationsPage() {
  const tenantId = useAuthStore((s) => s.tenantId)
  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [groups, setGroups]               = useState<Record<string, Group[]>>({})
  const [loading, setLoading]             = useState(true)
  const [expanded, setExpanded]           = useState<string | null>(null)

  // Create implantation form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [creating, setCreating]     = useState(false)

  // Edit implantation
  const [editId, setEditId]       = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editAddr, setEditAddr]   = useState('')
  const [saving, setSaving]       = useState(false)

  // Add group
  const [addGroupFor, setAddGroupFor]   = useState<string | null>(null)
  const [groupName, setGroupName]       = useState('')
  const [groupAge, setGroupAge]         = useState<AgeGroup>('U8')
  const [addingGroup, setAddingGroup]   = useState(false)

  const load = async () => {
    const { data } = await listImplantations()
    setImplantations(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const loadGroups = async (implantationId: string) => {
    if (groups[implantationId]) return
    const { data } = await listGroupsByImplantation(implantationId)
    setGroups(prev => ({ ...prev, [implantationId]: data }))
  }

  const handleExpand = (id: string) => {
    if (expanded === id) {
      setExpanded(null)
    } else {
      setExpanded(id)
      loadGroups(id)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !tenantId) return
    setCreating(true)
    await createImplantation({ tenantId, name: newName.trim(), address: newAddress.trim() || undefined })
    setNewName('')
    setNewAddress('')
    setShowCreate(false)
    setCreating(false)
    await load()
  }

  const handleSave = async () => {
    if (!editId || !editName.trim()) return
    setSaving(true)
    await updateImplantation(editId, { name: editName.trim(), address: editAddr.trim() || undefined })
    setEditId(null)
    setSaving(false)
    await load()
  }

  const handleDeactivate = async (id: string) => {
    await deleteImplantation(id)
    await load()
  }

  const handleAddGroup = async () => {
    if (!addGroupFor || !groupName.trim() || !tenantId) return
    setAddingGroup(true)
    await createGroup({ tenantId, implantationId: addGroupFor, name: groupName.trim(), ageGroup: groupAge })
    // Refresh groups for this implantation
    const { data } = await listGroupsByImplantation(addGroupFor)
    setGroups(prev => ({ ...prev, [addGroupFor]: data }))
    setGroupName('')
    setAddGroupFor(null)
    setAddingGroup(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AureakText variant="h2">Implantations</AureakText>
        <AureakButton
          label="+ Nouvelle implantation"
          onPress={() => setShowCreate(true)}
          variant="primary"
        />
      </View>

      {/* Create form */}
      {showCreate && (
        <View style={styles.formCard}>
          <AureakText variant="h3" style={{ marginBottom: space.sm }}>Nouvelle implantation</AureakText>
          <TextInput
            style={styles.input}
            placeholder="Nom (ex: Salle des sports Nord)"
            placeholderTextColor={colors.text.secondary}
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Adresse (optionnel)"
            placeholderTextColor={colors.text.secondary}
            value={newAddress}
            onChangeText={setNewAddress}
          />
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xs }}>
            <AureakButton label="Annuler" onPress={() => setShowCreate(false)} variant="secondary" />
            <AureakButton label={creating ? 'Création...' : 'Créer'} onPress={handleCreate} loading={creating} fullWidth />
          </View>
        </View>
      )}

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
      ) : implantations.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>
          Aucune implantation. Créez la première.
        </AureakText>
      ) : (
        implantations.map((impl) => (
          <View key={impl.id} style={styles.card}>
            {/* Header row */}
            {editId === impl.id ? (
              <View style={{ gap: space.xs }}>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={styles.input}
                  value={editAddr}
                  onChangeText={setEditAddr}
                  placeholder="Adresse"
                  placeholderTextColor={colors.text.secondary}
                />
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <AureakButton label="Annuler" onPress={() => setEditId(null)} variant="secondary" />
                  <AureakButton label={saving ? 'Enregistrement...' : 'Enregistrer'} onPress={handleSave} loading={saving} fullWidth />
                </View>
              </View>
            ) : (
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <AureakText variant="h3">{impl.name}</AureakText>
                  {impl.address && (
                    <AureakText variant="caption" style={{ color: colors.text.secondary }}>
                      {impl.address}
                    </AureakText>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: space.xs }}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => {
                      setEditId(impl.id)
                      setEditName(impl.name)
                      setEditAddr(impl.address ?? '')
                    }}
                  >
                    <AureakText variant="caption" style={{ color: colors.accent.gold }}>Modifier</AureakText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: colors.status.absent }]}
                    onPress={() => handleDeactivate(impl.id)}
                  >
                    <AureakText variant="caption" style={{ color: colors.status.absent }}>Désactiver</AureakText>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Groups toggle */}
            <Pressable
              style={styles.groupsToggle}
              onPress={() => handleExpand(impl.id)}
            >
              <AureakText variant="label" style={{ color: colors.accent.gold }}>
                {expanded === impl.id ? '▾ Groupes' : '▸ Groupes'}
              </AureakText>
            </Pressable>

            {expanded === impl.id && (
              <View style={styles.groupsSection}>
                {(groups[impl.id] ?? []).map((g) => (
                  <View key={g.id} style={styles.groupRow}>
                    <AureakText variant="body">{g.name}</AureakText>
                    {g.ageGroup && (
                      <Badge label={g.ageGroup} variant="zinc" />
                    )}
                  </View>
                ))}

                {/* Add group */}
                {addGroupFor === impl.id ? (
                  <View style={{ gap: space.xs, marginTop: space.sm }}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nom du groupe"
                      placeholderTextColor={colors.text.secondary}
                      value={groupName}
                      onChangeText={setGroupName}
                    />
                    <View style={{ flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' }}>
                      {AGE_GROUPS.map(ag => (
                        <Pressable
                          key={ag}
                          style={[styles.chipBtn, groupAge === ag && styles.chipBtnActive]}
                          onPress={() => setGroupAge(ag)}
                        >
                          <AureakText
                            variant="caption"
                            style={{ color: groupAge === ag ? colors.accent.gold : colors.text.secondary }}
                          >
                            {ag}
                          </AureakText>
                        </Pressable>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: space.sm }}>
                      <AureakButton label="Annuler" onPress={() => setAddGroupFor(null)} variant="secondary" />
                      <AureakButton
                        label={addingGroup ? 'Ajout...' : 'Ajouter'}
                        onPress={handleAddGroup}
                        loading={addingGroup}
                        fullWidth
                      />
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={{ marginTop: space.sm }}
                    onPress={() => { setAddGroupFor(impl.id); setGroupName(''); setGroupAge('U8') }}
                  >
                    <AureakText variant="caption" style={{ color: colors.accent.gold }}>+ Ajouter un groupe</AureakText>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.background.primary },
  content     : { padding: space.xl, gap: space.md },
  header      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formCard    : {
    backgroundColor: colors.background.elevated,
    borderRadius   : 10,
    padding        : space.md,
    gap            : space.sm,
    borderWidth    : 1,
    borderColor    : colors.accent.gold,
  },
  card        : {
    backgroundColor: colors.background.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    gap            : space.sm,
  },
  cardHeader  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actionBtn   : {
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    borderRadius   : 6,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
  },
  input       : {
    backgroundColor: colors.background.primary,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    borderRadius   : 6,
    color          : colors.text.primary,
    padding        : space.sm,
    fontSize       : 14,
  },
  groupsToggle : { paddingVertical: space.xs },
  groupsSection: { gap: space.xs, paddingLeft: space.sm },
  groupRow     : {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
    backgroundColor: colors.background.elevated,
    borderRadius   : 6,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
  },
  chipBtn      : {
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    borderRadius   : 20,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
  },
  chipBtnActive: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.background.elevated,
  },
})
