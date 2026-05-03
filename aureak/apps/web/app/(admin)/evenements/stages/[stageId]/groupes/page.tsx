'use client'
// Story 105.3 — Page gestion sous-groupes d'un stage (kanban simple)
// Story 105.4 — Drag & drop natif HTML5 desktop (≥1024px)
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, TextInput, Platform, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, radius, space } from '@aureak/theme'
import {
  listStageGroups, createStageGroup, renameStageGroup, deleteStageGroup,
  moveChildToGroup, listStageChildren,
} from '@aureak/api-client'
import type { StageChild } from '@aureak/api-client'
import type { StageGroup } from '@aureak/types'

function computeAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const d = new Date(birthDate)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export default function StageGroupesPage() {
  const router = useRouter()
  const { stageId } = useLocalSearchParams<{ stageId: string }>()
  const { width } = useWindowDimensions()
  // Story 105.4 — drag & drop activé seulement sur web desktop (≥ 1024px)
  const dragEnabled = Platform.OS === 'web' && width >= 1024

  const [groups,   setGroups]   = useState<StageGroup[]>([])
  const [children, setChildren] = useState<StageChild[]>([])
  const [loading,  setLoading]  = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName]   = useState('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [movingChildId, setMovingChildId] = useState<string | null>(null)
  // Story 105.4 — état drag & drop
  const [draggedChildId, setDraggedChildId] = useState<string | null>(null)
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!stageId || typeof stageId !== 'string') return
    setLoading(true)
    try {
      const [g, c] = await Promise.all([
        listStageGroups(stageId),
        listStageChildren(stageId),
      ])
      setGroups(g)
      setChildren(c)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stages/groupes] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [stageId])

  useEffect(() => { void load() }, [load])

  const defaultGroup = useMemo(() => groups.find(g => g.isDefault) ?? null, [groups])

  const childrenByGroup = useMemo(() => {
    const map = new Map<string, StageChild[]>()
    for (const g of groups) map.set(g.id, [])
    for (const c of children) {
      const groupId = c.stageGroupId ?? defaultGroup?.id ?? null
      if (!groupId) continue
      const list = map.get(groupId) ?? []
      list.push(c)
      map.set(groupId, list)
    }
    return map
  }, [groups, children, defaultGroup])

  const handleCreate = async () => {
    if (!stageId || typeof stageId !== 'string') return
    const trimmed = newName.trim()
    if (trimmed.length < 1 || trimmed.length > 50) return
    setCreating(true)
    try {
      await createStageGroup(stageId, trimmed)
      setNewName('')
      setShowNewInput(false)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stages/groupes] create error:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleRename = async (groupId: string) => {
    const trimmed = editName.trim()
    if (trimmed.length < 1 || trimmed.length > 50) {
      setEditingGroupId(null)
      return
    }
    try {
      await renameStageGroup(groupId, trimmed)
      setEditingGroupId(null)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stages/groupes] rename error:', err)
    }
  }

  const handleDelete = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group || group.isDefault) return
    const count = (childrenByGroup.get(groupId) ?? []).length
    const msg = count > 0
      ? `Supprimer le groupe "${group.name}" ? Les ${count} gardiens seront déplacés vers "${defaultGroup?.name ?? 'le groupe par défaut'}".`
      : `Supprimer le groupe "${group.name}" ?`
    if (typeof window !== 'undefined' && !window.confirm(msg)) return
    try {
      await deleteStageGroup(groupId)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stages/groupes] delete error:', err)
    }
  }

  const handleMove = async (childId: string, targetGroupId: string) => {
    if (!stageId || typeof stageId !== 'string') return
    // Story 105.3.b — setState menu close en finally pour éviter race condition
    // RN-web : démonter le Pressable parent avant que onPress termine peut interrompre la mutation.
    try {
      await moveChildToGroup(stageId, childId, targetGroupId)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[stages/groupes] move error:', err)
    } finally {
      setMovingChildId(null)
    }
  }

  if (loading && groups.length === 0) {
    return (
      <View style={s.container}>
        <AureakText style={s.loadingText}>Chargement…</AureakText>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <AureakText style={s.backLabel}>← Retour</AureakText>
        </Pressable>
        <AureakText style={s.title}>Groupes du stage</AureakText>
        {!showNewInput ? (
          <Pressable onPress={() => setShowNewInput(true)} style={s.newBtn}>
            <AureakText style={s.newBtnLabel}>+ Nouveau groupe</AureakText>
          </Pressable>
        ) : (
          <View style={s.newInputRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nom du groupe (1-50 caractères)"
              maxLength={50}
              autoFocus
              style={s.newInput}
              onSubmitEditing={handleCreate}
            />
            <Pressable onPress={handleCreate} disabled={creating} style={s.newSubmit}>
              <AureakText style={s.newSubmitLabel}>{creating ? '…' : 'Créer'}</AureakText>
            </Pressable>
            <Pressable onPress={() => { setShowNewInput(false); setNewName('') }} style={s.newCancel}>
              <AureakText style={s.newCancelLabel}>Annuler</AureakText>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView horizontal contentContainerStyle={s.boardScroll}>
        {groups.map(group => {
          const groupChildren = childrenByGroup.get(group.id) ?? []
          const isEditing = editingGroupId === group.id
          const isHovered = hoveredGroupId === group.id
          // Story 105.4 — handlers drag & drop pour la colonne (drop zone)
          const dropProps = dragEnabled ? {
            onDragOver: (e: React.DragEvent) => { e.preventDefault() },
            onDragEnter: () => setHoveredGroupId(group.id),
            onDragLeave: (e: React.DragEvent) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setHoveredGroupId(null)
            },
            onDrop: async (e: React.DragEvent) => {
              e.preventDefault()
              setHoveredGroupId(null)
              const childId = e.dataTransfer.getData('text/plain')
              setDraggedChildId(null)
              if (!childId || !stageId || typeof stageId !== 'string') return
              if (group.id === childrenByGroup.get(group.id)?.find(c => c.id === childId)?.stageGroupId) return
              try {
                await moveChildToGroup(stageId, childId, group.id)
                await load()
              } catch (err) {
                if (process.env.NODE_ENV !== 'production') console.error('[stages/groupes] drop error:', err)
              }
            },
          } as Record<string, unknown> : {}
          return (
            <View key={group.id} style={[s.column, isHovered && s.columnHovered] as never} {...dropProps}>
              <View style={s.columnHeader}>
                {isEditing ? (
                  <View style={s.editRow}>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      maxLength={50}
                      autoFocus
                      style={s.editInput}
                      onSubmitEditing={() => handleRename(group.id)}
                    />
                    <Pressable onPress={() => handleRename(group.id)} style={s.editSubmit}>
                      <AureakText style={s.editSubmitLabel}>OK</AureakText>
                    </Pressable>
                  </View>
                ) : (
                  <View style={s.columnTitleRow}>
                    <AureakText style={s.columnTitle}>{group.name}</AureakText>
                    <Pressable
                      onPress={() => { setEditingGroupId(group.id); setEditName(group.name) }}
                      style={s.iconBtn}
                      accessibilityLabel="Renommer le groupe"
                    >
                      <AureakText style={s.iconText}>✏️</AureakText>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(group.id)}
                      style={[s.iconBtn, group.isDefault && s.iconBtnDisabled]}
                      disabled={group.isDefault}
                      accessibilityLabel={group.isDefault ? 'Le groupe par défaut ne peut pas être supprimé' : 'Supprimer le groupe'}
                    >
                      <AureakText style={group.isDefault ? { ...s.iconText, ...s.iconTextDisabled } : s.iconText}>🗑</AureakText>
                    </Pressable>
                  </View>
                )}
                <AureakText style={s.columnCount}>{groupChildren.length} gardien{groupChildren.length > 1 ? 's' : ''}</AureakText>
              </View>

              <ScrollView style={s.columnBody} contentContainerStyle={s.columnBodyContent}>
                {groupChildren.length === 0 ? (
                  <AureakText style={s.emptyColumn}>Aucun gardien dans ce groupe</AureakText>
                ) : (
                  groupChildren.map(child => {
                    const age = computeAge(child.birthDate)
                    const otherGroups = groups.filter(g => g.id !== group.id)
                    const showMenu = movingChildId === child.id
                    const isDragging = draggedChildId === child.id
                    // Story 105.4 — handlers drag pour la card (draggable source)
                    const dragProps = dragEnabled ? {
                      draggable: true,
                      onDragStart: (e: React.DragEvent) => {
                        e.dataTransfer.setData('text/plain', child.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggedChildId(child.id)
                      },
                      onDragEnd: () => setDraggedChildId(null),
                    } as Record<string, unknown> : {}
                    return (
                      <View key={child.id} style={[s.childCard, isDragging && s.childCardDragging] as never} {...dragProps}>
                        <View style={s.childInfo}>
                          <AureakText style={s.childName}>{child.prenom} {child.nom}</AureakText>
                          <AureakText style={s.childAge}>{age !== null ? `${age} ans` : '—'}</AureakText>
                        </View>
                        {otherGroups.length > 0 && (
                          <Pressable
                            onPress={() => setMovingChildId(showMenu ? null : child.id)}
                            style={s.moveBtn}
                            accessibilityLabel="Déplacer"
                          >
                            <AureakText style={s.moveBtnLabel}>↔</AureakText>
                          </Pressable>
                        )}
                        {showMenu && (
                          <View style={s.moveMenu}>
                            {otherGroups.map(g => (
                              <Pressable key={g.id} onPress={() => handleMove(child.id, g.id)} style={s.moveOption}>
                                <AureakText style={s.moveOptionLabel}>→ {g.name}</AureakText>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    )
                  })
                )}
              </ScrollView>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  loadingText: {
    fontFamily: fonts.body, fontSize: 14, color: colors.text.muted,
    textAlign: 'center', paddingVertical: space.xxl,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.lg, paddingVertical: space.md,
    borderBottomWidth: 1, borderBottomColor: colors.border.divider,
    backgroundColor: colors.light.surface, flexWrap: 'wrap',
  },
  backBtn: {
    paddingHorizontal: space.sm, paddingVertical: 6,
    borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider,
  },
  backLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.text.dark, fontWeight: '600' },
  title: {
    fontFamily: fonts.heading, fontSize: 18, fontWeight: '700',
    color: colors.text.dark, flex: 1, minWidth: 200,
  },
  newBtn: {
    paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.xs,
    backgroundColor: colors.accent.gold,
  },
  newBtnLabel: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: colors.text.onGold },
  newInputRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center', flex: 1 },
  newInput: {
    flex: 1, paddingHorizontal: space.sm, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border.divider, borderRadius: radius.xs,
    fontFamily: fonts.body, fontSize: 13, color: colors.text.dark,
    backgroundColor: colors.light.surface,
  } as never,
  newSubmit: {
    paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.xs,
    backgroundColor: colors.accent.gold,
  },
  newSubmitLabel: { fontFamily: fonts.body, fontSize: 13, fontWeight: '700', color: colors.text.onGold },
  newCancel: {
    paddingHorizontal: space.sm, paddingVertical: 8, borderRadius: radius.xs,
    borderWidth: 1, borderColor: colors.border.divider,
  },
  newCancelLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.text.muted },
  boardScroll: { padding: space.md, gap: space.md, alignItems: 'flex-start' },
  column: {
    width: 280, backgroundColor: colors.light.surface, borderRadius: radius.card,
    borderWidth: 1, borderColor: colors.border.divider, marginRight: space.md,
    minHeight: 200, maxHeight: 600,
  },
  // Story 105.4 — drop zone hover (desktop drag&drop)
  columnHovered: {
    borderColor    : colors.accent.gold,
    borderWidth    : 2,
    backgroundColor: colors.accent.gold + '0F',
  },
  childCardDragging: {
    opacity: 0.4,
  },
  columnHeader: {
    padding: space.md, borderBottomWidth: 1, borderBottomColor: colors.border.divider,
    gap: 4, backgroundColor: colors.light.muted,
    borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card,
  },
  columnTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  columnTitle: { flex: 1, fontFamily: fonts.heading, fontSize: 15, fontWeight: '700', color: colors.text.dark },
  iconBtn: { padding: 4 },
  iconBtnDisabled: { opacity: 0.3 },
  iconText: { fontSize: 14 },
  iconTextDisabled: { opacity: 0.5 },
  columnCount: { fontFamily: fonts.body, fontSize: 11, color: colors.text.muted },
  editRow: { flexDirection: 'row', gap: 4 },
  editInput: {
    flex: 1, padding: 6, borderWidth: 1, borderColor: colors.accent.gold, borderRadius: radius.xs,
    fontFamily: fonts.body, fontSize: 13, backgroundColor: colors.light.surface,
  } as never,
  editSubmit: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.accent.gold, borderRadius: radius.xs },
  editSubmitLabel: { fontFamily: fonts.body, fontSize: 11, fontWeight: '700', color: colors.text.onGold },
  columnBody: { flex: 1 },
  columnBodyContent: { padding: space.sm, gap: 6 },
  emptyColumn: {
    fontFamily: fonts.body, fontSize: 12, color: colors.text.subtle,
    fontStyle: 'italic', textAlign: 'center', padding: space.md,
  },
  childCard: {
    backgroundColor: colors.light.primary, borderRadius: radius.xs,
    borderWidth: 1, borderColor: colors.border.divider, padding: space.sm,
    flexDirection: 'row', alignItems: 'center', gap: space.xs, position: 'relative',
  },
  childInfo: { flex: 1 },
  childName: { fontFamily: fonts.body, fontSize: 13, fontWeight: '600', color: colors.text.dark },
  childAge: { fontFamily: fonts.body, fontSize: 11, color: colors.text.muted, marginTop: 2 },
  moveBtn: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  moveBtnLabel: { fontSize: 14, color: colors.text.dark },
  moveMenu: {
    position: 'absolute', top: '100%', right: 0, marginTop: 4,
    backgroundColor: colors.light.surface, borderRadius: radius.xs,
    borderWidth: 1, borderColor: colors.border.divider,
    paddingVertical: 4, zIndex: 10, minWidth: 160,
    // @ts-ignore web shadow
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  moveOption: { paddingHorizontal: space.md, paddingVertical: 8 },
  moveOptionLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.text.dark },
})
