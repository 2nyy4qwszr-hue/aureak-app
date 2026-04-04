'use client'
// Story 9.4 — Implantations & Groupes — nommage standardisé automatique
// Story 44.6 — Stats groupes + listing enfants expandable
// Story 47.2 — Design card avec photo de couverture + chips groupes
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'

import {
  listImplantations,
  createImplantation,
  updateImplantation,
  deleteImplantation,
  listGroupsByImplantation,
  createGroup,
  listGroupMembersWithDetails,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import {
  generateGroupName,
  GROUP_METHODS,
  DAYS_OF_WEEK,
  GROUP_DURATIONS,
  METHOD_COLOR,
} from '@aureak/business-logic'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { Implantation, Group, GroupMethod, GroupMemberWithDetails } from '@aureak/types'

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

// ── ImplantationCard — card visuelle avec photo + groupes chips ──────────────

function ImplantationCard({
  impl,
  implGroups,
  membersByGroup,
  isEditing,
  editName,
  editAddr,
  saving,
  onEditStart,
  onEditNameChange,
  onEditAddrChange,
  onSave,
  onCancelEdit,
  onDeactivate,
  onAddGroup,
  onManageGroup,
  router,
}: {
  impl           : Implantation
  implGroups     : Group[]
  membersByGroup : Record<string, GroupMemberWithDetails[]>
  isEditing      : boolean
  editName       : string
  editAddr       : string
  saving         : boolean
  onEditStart    : () => void
  onEditNameChange: (v: string) => void
  onEditAddrChange: (v: string) => void
  onSave         : () => void
  onCancelEdit   : () => void
  onDeactivate   : () => void
  onAddGroup     : () => void
  onManageGroup  : (groupId: string) => void
  router         : ReturnType<typeof useRouter>
}) {
  const totalChildren = implGroups.reduce((total, g) => total + (membersByGroup[g.id]?.length ?? 0), 0)

  return (
    <View style={styles.card}>
      {/* ── Photo de couverture ── */}
      <View style={styles.coverContainer}>
        {/* Gradient vert terrain (systématique — pas de photo_url dans le type Implantation actuel) */}
        <View
          style={[
            styles.coverGradient,
            { background: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)' } as any,
          ]}
        />
        {/* Badge joueurs en haut à droite */}
        {totalChildren > 0 && (
          <View style={styles.playersBadge}>
            <AureakText variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
              {totalChildren} joueur{totalChildren !== 1 ? 's' : ''}
            </AureakText>
          </View>
        )}
        {/* Overlay sombre subtil en bas pour lisibilité */}
        <View
          style={[
            styles.coverOverlay,
            { background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)' } as any,
          ]}
        />
      </View>

      {/* ── Contenu card ── */}
      <View style={styles.cardBody}>

        {/* Mode édition */}
        {isEditing ? (
          <View style={{ gap: space.xs }}>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={onEditNameChange}
              placeholderTextColor={colors.text.muted}
              placeholder="Nom de l'implantation"
            />
            <TextInput
              style={styles.input}
              value={editAddr}
              onChangeText={onEditAddrChange}
              placeholder="Adresse"
              placeholderTextColor={colors.text.muted}
            />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <AureakButton label="Annuler" onPress={onCancelEdit} variant="secondary" />
              <AureakButton label={saving ? 'Enregistrement...' : 'Enregistrer'} onPress={onSave} loading={saving} fullWidth />
            </View>
          </View>
        ) : (
          <>
            {/* Nom + actions */}
            <View style={styles.cardTitleRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <AureakText variant="h3" style={styles.cardTitle}>{impl.name}</AureakText>
                {impl.address && (
                  <AureakText variant="caption" style={styles.cardAddress}>{impl.address}</AureakText>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: space.xs }}>
                <Pressable style={styles.actionBtn} onPress={onEditStart}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold }}>Modifier</AureakText>
                </Pressable>
                <Pressable style={[styles.actionBtn, { borderColor: colors.status.absent }]} onPress={onDeactivate}>
                  <AureakText variant="caption" style={{ color: colors.status.absent }}>Désactiver</AureakText>
                </Pressable>
              </View>
            </View>

            {/* Chips groupes scrollables */}
            {implGroups.length > 0 && (
              <View style={styles.groupsChipSection}>
                <AureakText variant="label" style={styles.groupsLabel}>GROUPES</AureakText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.groupsChipScroll}
                >
                  {implGroups.map((g) => {
                    const methodColor = g.method ? METHOD_COLOR[g.method] : colors.accent.gold
                    return (
                      <Pressable
                        key={g.id}
                        style={[styles.groupChip, { borderColor: methodColor + '60' }]}
                        onPress={() => onManageGroup(g.id)}
                      >
                        <View style={[styles.groupChipDot, { backgroundColor: methodColor }]} />
                        <AureakText
                          variant="caption"
                          style={{ color: colors.text.dark, fontWeight: '600', fontSize: 12 }}
                          numberOfLines={1}
                        >
                          {g.name}
                        </AureakText>
                        {g.dayOfWeek && g.startHour !== null && (
                          <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
                            {g.dayOfWeek} {formatTime(g.startHour!, g.startMinute ?? 0)}
                          </AureakText>
                        )}
                        {(membersByGroup[g.id]?.length ?? 0) > 0 && (
                          <View style={styles.groupChipCount}>
                            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
                              {membersByGroup[g.id]?.length}
                            </AureakText>
                          </View>
                        )}
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
            )}

            {/* Bouton ajouter un groupe */}
            <Pressable style={styles.addGroupBtn} onPress={onAddGroup}>
              <AureakText variant="caption" style={{ color: colors.accent.gold }}>+ Ajouter un groupe</AureakText>
            </Pressable>
          </>
        )}
      </View>
    </View>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ImplantationsPage() {
  const router      = useRouter()
  const tenantId    = useAuthStore((s) => s.tenantId)
  const { width }   = useWindowDimensions()

  // Grille responsive : 3 cols ≥1024, 2 cols ≥640, 1 col mobile
  const numCols = width >= 1024 ? 3 : width >= 640 ? 2 : 1

  const [implantations, setImplantations]   = useState<Implantation[]>([])
  const [groups, setGroups]               = useState<Record<string, Group[]>>({})
  const [loading, setLoading]             = useState(true)
  const [loadError, setLoadError]         = useState<string | null>(null)

  // Story 44.6 — stats enfants par groupe
  const [membersByGroup, setMembersByGroup] = useState<Record<string, GroupMemberWithDetails[]>>({})
  const [loadingMembers, setLoadingMembers] = useState(false)

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

  // Add group panel (pour le formulaire détaillé)
  const [addGroupFor, setAddGroupFor]   = useState<string | null>(null)
  const [groupForm, setGroupForm]       = useState<GroupFormState>(emptyForm())
  const [addingGroup, setAddingGroup]   = useState(false)

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = async () => {
    setLoadError(null)
    try {
      const { data, error } = await listImplantations()
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[Implantations] listImplantations error:', error)
        setLoadError('Impossible de charger les implantations. Vérifiez votre connexion.')
      } else {
        setImplantations(data)
        // Charger les groupes de toutes les implantations en parallèle (pour les chips)
        loadAllGroups(data.map(i => i.id))
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAllGroups = async (implantationIds: string[]) => {
    if (implantationIds.length === 0) return
    try {
      const results = await Promise.all(
        implantationIds.map(id => listGroupsByImplantation(id).then(res => ({ id, groups: res.data })))
      )
      const newGroups: Record<string, Group[]> = {}
      for (const { id, groups: g } of results) {
        newGroups[id] = g
      }
      setGroups(prev => ({ ...prev, ...newGroups }))
      // Charger les membres pour tous les groupes
      const allGroupIds = results.flatMap(r => r.groups.map(g => g.id))
      await loadMembersForGroups(allGroupIds)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Implantations] loadAllGroups error:', err)
    }
  }

  // Story 44.6 — chargement parallèle des membres pour une liste de groupIds
  const loadMembersForGroups = async (groupIds: string[]) => {
    if (groupIds.length === 0) return
    setLoadingMembers(true)
    try {
      const results = await Promise.all(
        groupIds.map(gid => listGroupMembersWithDetails(gid).then(members => ({ gid, members })))
      )
      setMembersByGroup(prev => {
        const next = { ...prev }
        for (const { gid, members } of results) {
          next[gid] = members
        }
        return next
      })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Implantations] loadMembersForGroups error:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  const loadGroups = async (implantationId: string) => {
    const { data } = await listGroupsByImplantation(implantationId)
    setGroups(prev => ({ ...prev, [implantationId]: data }))
    await loadMembersForGroups(data.map(g => g.id))
  }

  useEffect(() => { load() }, [])

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

  // ── Render helpers ─────────────────────────────────────────────────────────

  // Calcul de la largeur de chaque colonne selon la grille
  const colGap   = space.md
  const paddings = space.xl * 2
  const colWidth = (width - paddings - colGap * (numCols - 1)) / numCols

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
        <>
          {/* Grille de cards */}
          <View style={[styles.grid, { gap: colGap }]}>
            {implantations.map((impl) => (
              <View key={impl.id} style={{ width: colWidth }}>
                <ImplantationCard
                  impl={impl}
                  implGroups={groups[impl.id] ?? []}
                  membersByGroup={membersByGroup}
                  isEditing={editId === impl.id}
                  editName={editName}
                  editAddr={editAddr}
                  saving={saving}
                  onEditStart={() => { setEditId(impl.id); setEditName(impl.name); setEditAddr(impl.address ?? '') }}
                  onEditNameChange={setEditName}
                  onEditAddrChange={setEditAddr}
                  onSave={handleSave}
                  onCancelEdit={() => setEditId(null)}
                  onDeactivate={() => handleDeactivate(impl.id)}
                  onAddGroup={() => { setAddGroupFor(impl.id); setGroupForm(emptyForm()) }}
                  onManageGroup={(groupId) => router.push(`/groups/${groupId}` as never)}
                  router={router}
                />
              </View>
            ))}
          </View>

          {/* Formulaire d'ajout de groupe — panneau flottant */}
          {addGroupFor !== null && (
            <View style={styles.addGroupPanel}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
                <AureakText variant="h3">
                  Nouveau groupe — {implantations.find(i => i.id === addGroupFor)?.name}
                </AureakText>
                <Pressable onPress={() => { setAddGroupFor(null); setGroupForm(emptyForm()) }}>
                  <AureakText variant="body" style={{ color: colors.text.muted }}>✕</AureakText>
                </Pressable>
              </View>

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

              <NamePreview name={getGroupName(addGroupFor)} />

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
          )}
        </>
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
    borderRadius   : radius.card,
    padding        : space.md,
    gap            : space.sm,
    borderWidth    : 1,
    borderColor    : colors.accent.gold,
  },
  input       : {
    backgroundColor: colors.light.primary,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : radius.xs,
    color          : colors.text.dark,
    padding        : space.sm,
    fontSize       : 14,
  },
  // ── Grille responsive ──
  grid        : {
    flexDirection : 'row',
    flexWrap      : 'wrap',
  },
  // ── Card implantation ──
  card        : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    boxShadow      : shadows.sm,
  } as any,
  // ── Photo de couverture ──
  coverContainer: {
    height   : 140,
    position : 'relative',
    overflow : 'hidden',
  },
  coverGradient : {
    position        : 'absolute',
    top             : 0, left: 0, right: 0, bottom: 0,
  },
  coverOverlay  : {
    position        : 'absolute',
    top             : 0, left: 0, right: 0, bottom: 0,
  },
  playersBadge  : {
    position         : 'absolute',
    top              : space.sm,
    right            : space.sm,
    backgroundColor  : 'rgba(0,0,0,0.45)',
    borderRadius     : radius.badge,
    paddingHorizontal: 10,
    paddingVertical  : 4,
    zIndex           : 2,
  },
  // ── Contenu card ──
  cardBody      : {
    padding : space.md,
    gap     : space.sm,
  },
  cardTitleRow  : {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    justifyContent: 'space-between',
    gap           : space.sm,
  },
  cardTitle     : {
    fontWeight: '700',
    color     : colors.text.dark,
  },
  cardAddress   : {
    color     : colors.text.muted,
    marginTop : 2,
  },
  actionBtn     : {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
  },
  // ── Chips groupes ──
  groupsChipSection: {
    gap: space.xs,
  },
  groupsLabel   : {
    color        : colors.text.muted,
    marginBottom : 2,
  },
  groupsChipScroll: {
    flexDirection : 'row',
    gap           : space.xs,
    paddingBottom : space.xs,
  },
  groupChip     : {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 5,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderRadius     : radius.badge,
    paddingHorizontal: 10,
    paddingVertical  : 5,
  },
  groupChipDot  : {
    width        : 7,
    height       : 7,
    borderRadius : 4,
  },
  groupChipCount: {
    backgroundColor  : colors.border.light,
    borderRadius     : radius.badge,
    paddingHorizontal: 6,
    paddingVertical  : 1,
    marginLeft       : 2,
  },
  addGroupBtn   : {
    paddingVertical  : space.xs,
    paddingHorizontal: space.sm,
    borderWidth      : 1,
    borderColor      : colors.accent.gold + '40',
    borderRadius     : radius.xs,
    borderStyle      : 'dashed' as const,
    alignItems       : 'center',
  },
  // ── Panneau ajout groupe ──
  addGroupPanel : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.accent.gold,
    gap            : 0,
    marginTop      : space.md,
    boxShadow      : shadows.gold,
  } as any,
  namePreview   : {
    backgroundColor: colors.light.primary,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '40',
    padding        : space.sm,
    marginTop      : space.sm,
  },
})
