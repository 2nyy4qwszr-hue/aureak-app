'use client'
// Story 9.4 — Implantations & Groupes — nommage standardisé automatique
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'

import {
  listImplantations,
  createImplantation,
  updateImplantation,
  deleteImplantation,
  listGroupsByImplantation,
  createGroup,
  updateGroup,
  deleteGroup,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import {
  generateGroupName,
  buildGroupBaseName,
  GROUP_METHODS,
  DAYS_OF_WEEK,
  GROUP_DURATIONS,
  METHOD_COLOR,
} from '@aureak/business-logic'
import { AureakButton, AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Implantation, Group, GroupMethod } from '@aureak/types'

// ── Constants ────────────────────────────────────────────────────────────────

const START_HOURS   = [8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20]
const START_MINUTES = [0, 15, 30, 45]

const DEFAULT_METHOD  : GroupMethod = 'Goal and Player'
const DEFAULT_DAY                   = 'Mardi'
const DEFAULT_HOUR                  = 17
const DEFAULT_MINUTE                = 0
const DEFAULT_DURATION              = 60

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

function methodBadgeStyle(method: GroupMethod) {
  const color = METHOD_COLOR[method]
  return {
    backgroundColor: color + '18',
    borderColor    : color,
    borderWidth    : 1,
    borderRadius   : 20,
    paddingHorizontal: 10,
    paddingVertical  : 3,
  }
}

// ── Group form state ──────────────────────────────────────────────────────────

type GroupFormState = {
  method          : GroupMethod
  day             : string
  startHour       : number
  startMinute     : number
  durationMinutes : number
}

const emptyForm = (): GroupFormState => ({
  method         : DEFAULT_METHOD,
  day            : DEFAULT_DAY,
  startHour      : DEFAULT_HOUR,
  startMinute    : DEFAULT_MINUTE,
  durationMinutes: DEFAULT_DURATION,
})

// ── Sub-components ───────────────────────────────────────────────────────────

function ChipRow<T extends string | number>({
  options,
  value,
  onSelect,
  label,
  color,
}: {
  options : T[]
  value   : T
  onSelect: (v: T) => void
  label?  : (v: T) => string
  color?  : (v: T) => string
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => {
        const active = opt === value
        const c      = color ? color(opt) : colors.accent.gold
        return (
          <Pressable
            key={String(opt)}
            style={{
              borderWidth      : 1,
              borderColor      : active ? c : colors.border.light,
              borderRadius     : 20,
              paddingHorizontal: 12,
              paddingVertical  : 4,
              backgroundColor  : active ? c + '20' : 'transparent',
            }}
            onPress={() => onSelect(opt)}
          >
            <AureakText
              variant="caption"
              style={{ color: active ? c : colors.text.muted, fontWeight: active ? '700' : '400' }}
            >
              {label ? label(opt) : String(opt)}
            </AureakText>
          </Pressable>
        )
      })}
    </View>
  )
}

function NamePreview({ name }: { name: string }) {
  return (
    <View style={styles.namePreview}>
      <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: 2 }}>
        Nom généré automatiquement
      </AureakText>
      <AureakText variant="body" style={{ color: colors.accent.gold, fontWeight: '700' }}>
        {name}
      </AureakText>
    </View>
  )
}

function GroupRow({
  group,
  onManage,
  onDelete,
}: {
  group   : Group
  onManage: () => void
  onDelete: () => void
}) {
  const methodColor = group.method ? METHOD_COLOR[group.method] : colors.text.muted
  return (
    <View style={[styles.groupRow, { borderLeftColor: methodColor, borderLeftWidth: 3 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <AureakText variant="body" style={{ fontWeight: '600' }}>{group.name}</AureakText>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {group.method && (
            <View style={methodBadgeStyle(group.method)}>
              <AureakText variant="caption" style={{ color: methodColor, fontWeight: '600' }}>
                {group.method}
              </AureakText>
            </View>
          )}
          {group.dayOfWeek && group.startHour !== null && (
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              {group.dayOfWeek} · {formatTime(group.startHour!, group.startMinute ?? 0)}
              {group.durationMinutes ? ` · ${group.durationMinutes} min` : ''}
            </AureakText>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Pressable onPress={onManage} style={[styles.deleteBtn, { borderColor: colors.accent.gold + '60' }]}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '600' }}>Gérer →</AureakText>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <AureakText variant="caption" style={{ color: colors.status.absent }}>Suppr.</AureakText>
        </Pressable>
      </View>
    </View>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ImplantationsPage() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [groups, setGroups]               = useState<Record<string, Group[]>>({})
  const [loading, setLoading]             = useState(true)
  const [loadError, setLoadError]         = useState<string | null>(null)
  const [expanded, setExpanded]           = useState<string | null>(null)

  // Create implantation
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [creating, setCreating]     = useState(false)

  // Edit implantation
  const [editId, setEditId]   = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddr, setEditAddr] = useState('')
  const [saving, setSaving]     = useState(false)

  // Add group
  const [addGroupFor, setAddGroupFor]   = useState<string | null>(null)
  const [groupForm, setGroupForm]       = useState<GroupFormState>(emptyForm())
  const [addingGroup, setAddingGroup]   = useState(false)

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = async () => {
    setLoadError(null)
    const { data, error } = await listImplantations()
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[Implantations] listImplantations error:', error)
      setLoadError('Impossible de charger les implantations. Vérifiez votre connexion.')
    } else {
      setImplantations(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const loadGroups = async (implantationId: string) => {
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

  // ── Implantation CRUD ──────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newName.trim() || !tenantId) return
    setCreating(true)
    try {
      await createImplantation({ tenantId, name: newName.trim(), address: newAddress.trim() || undefined })
      setNewName('')
      setNewAddress('')
      setShowCreate(false)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Implantations] handleCreate error:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    if (!editId || !editName.trim()) return
    setSaving(true)
    try {
      await updateImplantation(editId, { name: editName.trim(), address: editAddr.trim() || undefined })
      setEditId(null)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Implantations] handleSave error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    await deleteImplantation(id)
    await load()
  }

  // ── Group CRUD ─────────────────────────────────────────────────────────────

  const getGroupName = (implId: string): string => {
    const impl          = implantations.find(i => i.id === implId)
    const place         = impl?.name ?? 'Lieu'
    const existingNames = (groups[implId] ?? []).map(g => g.name)
    return generateGroupName(
      place,
      groupForm.day,
      groupForm.startHour,
      groupForm.startMinute,
      groupForm.method,
      existingNames,
    )
  }

  const handleAddGroup = async () => {
    if (!addGroupFor || !tenantId) return
    setAddingGroup(true)
    try {
      const name = getGroupName(addGroupFor)
      await createGroup({
        tenantId,
        implantationId  : addGroupFor,
        name,
        method          : groupForm.method,
        dayOfWeek       : groupForm.day,
        startHour       : groupForm.startHour,
        startMinute     : groupForm.startMinute,
        durationMinutes : groupForm.durationMinutes,
      })
      await loadGroups(addGroupFor)
      setGroupForm(emptyForm())
      setAddGroupFor(null)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Implantations] handleAddGroup error:', err)
    } finally {
      setAddingGroup(false)
    }
  }

  const handleDeleteGroup = async (implId: string, groupId: string) => {
    await deleteGroup(groupId)
    await loadGroups(implId)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AureakText variant="h2" color={colors.accent.gold}>Implantations</AureakText>
        <AureakButton
          label="+ Nouvelle implantation"
          onPress={() => setShowCreate(true)}
          variant="primary"
        />
      </View>

      {/* Create implantation form */}
      {showCreate && (
        <View style={styles.formCard}>
          <AureakText variant="h3" style={{ marginBottom: space.sm }}>Nouvelle implantation</AureakText>
          <TextInput
            style={styles.input}
            placeholder="Nom (ex: Onhaye)"
            placeholderTextColor={colors.text.muted}
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={styles.input}
            placeholder="Adresse (optionnel)"
            placeholderTextColor={colors.text.muted}
            value={newAddress}
            onChangeText={setNewAddress}
          />
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xs }}>
            <AureakButton label="Annuler" onPress={() => setShowCreate(false)} variant="secondary" />
            <AureakButton label={creating ? 'Création...' : 'Créer'} onPress={handleCreate} loading={creating} fullWidth />
          </View>
        </View>
      )}

      {loadError && (
        <AureakText variant="body" style={{ color: colors.accent.red }}>{loadError}</AureakText>
      )}

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      ) : !loadError && implantations.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucune implantation. Créez la première.
        </AureakText>
      ) : (
        implantations.map((impl) => (
          <View key={impl.id} style={styles.card}>

            {/* Implantation header */}
            {editId === impl.id ? (
              <View style={{ gap: space.xs }}>
                <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={colors.text.muted} />
                <TextInput style={styles.input} value={editAddr} onChangeText={setEditAddr} placeholder="Adresse" placeholderTextColor={colors.text.muted} />
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
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>{impl.address}</AureakText>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: space.xs }}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => { setEditId(impl.id); setEditName(impl.name); setEditAddr(impl.address ?? '') }}
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
            <Pressable style={styles.groupsToggle} onPress={() => handleExpand(impl.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AureakText variant="label" style={{ color: colors.accent.gold }}>
                  {expanded === impl.id ? '▾' : '▸'}
                </AureakText>
                <AureakText variant="label" style={{ color: colors.accent.gold }}>
                  Groupes
                </AureakText>
                {groups[impl.id] && (
                  <View style={styles.groupCount}>
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
                      {groups[impl.id].length}
                    </AureakText>
                  </View>
                )}
              </View>
            </Pressable>

            {/* Groups section */}
            {expanded === impl.id && (
              <View style={styles.groupsSection}>

                {/* Existing groups */}
                {(groups[impl.id] ?? []).length === 0 ? (
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' }}>
                    Aucun groupe — créez le premier ci-dessous.
                  </AureakText>
                ) : (
                  (groups[impl.id] ?? []).map(g => (
                    <GroupRow
                      key={g.id}
                      group={g}
                      onManage={() => router.push(`/groups/${g.id}` as never)}
                      onDelete={() => handleDeleteGroup(impl.id, g.id)}
                    />
                  ))
                )}

                {/* Add group form */}
                {addGroupFor === impl.id ? (
                  <View style={styles.groupForm}>
                    <AureakText variant="label" style={{ color: colors.text.muted, marginBottom: space.xs }}>
                      MÉTHODE
                    </AureakText>
                    <ChipRow
                      options={GROUP_METHODS}
                      value={groupForm.method}
                      onSelect={(m) => setGroupForm(f => ({ ...f, method: m }))}
                      color={(m) => METHOD_COLOR[m]}
                    />

                    <AureakText variant="label" style={{ color: colors.text.muted, marginTop: space.sm, marginBottom: space.xs }}>
                      JOUR
                    </AureakText>
                    <ChipRow
                      options={[...DAYS_OF_WEEK]}
                      value={groupForm.day}
                      onSelect={(d) => setGroupForm(f => ({ ...f, day: d }))}
                    />

                    <AureakText variant="label" style={{ color: colors.text.muted, marginTop: space.sm, marginBottom: space.xs }}>
                      HEURE DE DÉBUT
                    </AureakText>
                    <ChipRow
                      options={START_HOURS}
                      value={groupForm.startHour}
                      onSelect={(h) => setGroupForm(f => ({ ...f, startHour: h }))}
                      label={(h) => `${String(h).padStart(2, '0')}h`}
                    />
                    <View style={{ marginTop: 6 }}>
                      <ChipRow
                        options={START_MINUTES}
                        value={groupForm.startMinute}
                        onSelect={(m) => setGroupForm(f => ({ ...f, startMinute: m }))}
                        label={(m) => `h${String(m).padStart(2, '0')}`}
                      />
                    </View>

                    <AureakText variant="label" style={{ color: colors.text.muted, marginTop: space.sm, marginBottom: space.xs }}>
                      DURÉE
                    </AureakText>
                    <ChipRow
                      options={[...GROUP_DURATIONS]}
                      value={groupForm.durationMinutes}
                      onSelect={(d) => setGroupForm(f => ({ ...f, durationMinutes: d }))}
                      label={(d) => `${d} min`}
                    />

                    <NamePreview name={getGroupName(impl.id)} />

                    <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                      <AureakButton
                        label="Annuler"
                        onPress={() => { setAddGroupFor(null); setGroupForm(emptyForm()) }}
                        variant="secondary"
                      />
                      <AureakButton
                        label={addingGroup ? 'Ajout...' : 'Créer le groupe'}
                        onPress={handleAddGroup}
                        loading={addingGroup}
                        fullWidth
                      />
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={styles.addGroupBtn}
                    onPress={() => { setAddGroupFor(impl.id); setGroupForm(emptyForm()) }}
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

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.light.primary },
  content     : { padding: space.xl, gap: space.md },
  header      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formCard    : {
    backgroundColor: colors.light.muted,
    borderRadius   : 10,
    padding        : space.md,
    gap            : space.sm,
    borderWidth    : 1,
    borderColor    : colors.accent.gold,
  },
  card        : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.sm,
  },
  cardHeader  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actionBtn   : {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 6,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
  },
  input       : {
    backgroundColor: colors.light.primary,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : 6,
    color          : colors.text.dark,
    padding        : space.sm,
    fontSize       : 14,
  },
  groupsToggle : { paddingVertical: space.xs },
  groupCount   : {
    backgroundColor: colors.light.muted,
    borderRadius   : 10,
    paddingHorizontal: 8,
    paddingVertical  : 1,
  },
  groupsSection: { gap: space.sm, paddingLeft: space.sm },
  groupRow     : {
    flexDirection    : 'row',
    alignItems       : 'center',
    backgroundColor  : colors.light.muted,
    borderRadius     : '0 8px 8px 0' as unknown as number,
    paddingHorizontal: space.sm,
    paddingVertical  : space.sm,
    gap              : space.sm,
  },
  deleteBtn   : {
    borderWidth      : 1,
    borderColor      : colors.status.absent + '40',
    borderRadius     : 6,
    paddingHorizontal: 10,
    paddingVertical  : 3,
  },
  groupForm   : {
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : 0,
  },
  namePreview : {
    backgroundColor: colors.light.primary,
    borderRadius   : 6,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '40',
    padding        : space.sm,
    marginTop      : space.sm,
  },
  addGroupBtn : {
    paddingVertical  : space.xs,
    paddingHorizontal: space.sm,
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '40',
    borderRadius     : 6,
    borderStyle      : 'dashed' as const,
    alignItems       : 'center',
  },
})
