'use client'
// Story 86-3 — Page admin : matrice permissions rôles × sections + overrides individuels
// Story 99.4 — AdminPageHeader v2 ("Permissions")
// Accès : admin uniquement (redirect sinon). Tokens @aureak/theme uniquement.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@aureak/business-logic'
import {
  listDefaultPermissions,
  upsertDefaultPermission,
  listUserOverrides,
  upsertUserOverride,
  deleteUserOverride,
  listUsers,
} from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import type { SectionKey, UserRole, SectionPermissionRow, UserSectionOverrideRow } from '@aureak/types'
import { SECTION_KEYS, SECTION_KEY_LABELS } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'
import { colors, space, radius } from '@aureak/theme'

// ── Constantes UI ────────────────────────────────────────────────────────────

const ROLES: UserRole[] = [
  'admin', 'coach', 'parent', 'child',
  'club', 'commercial', 'manager', 'marketeur',
]

const ROLE_LABELS: Record<UserRole, string> = {
  admin     : 'Admin',
  coach     : 'Coach',
  parent    : 'Parent',
  child     : 'Joueur',
  club      : 'Club',
  commercial: 'Commercial',
  manager   : 'Manager',
  marketeur : 'Marketeur',
}

type Tab = 'matrix' | 'overrides'

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const router = useRouter()
  const { role, isLoading } = useAuthStore()
  const { width } = useWindowDimensions()
  const isMobile = width <= 640

  // Garde d'accès admin (AC6)
  useEffect(() => {
    if (!isLoading && role !== 'admin') {
      router.replace('/dashboard' as never)
    }
  }, [role, isLoading, router])

  const [tab, setTab] = useState<Tab>('matrix')

  if (isLoading) return null
  if (role !== 'admin') return null

  return (
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
      {/* Story 99.4 — AdminPageHeader v2 */}
      <AdminPageHeader title="Permissions" />

      <ScrollView style={s.container} contentContainerStyle={[s.content, isMobile && { padding: space.md }]}>
      {/* Tabs */}
      <View style={s.tabs}>
        {(['matrix', 'overrides'] as Tab[]).map((t) => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <AureakText
              variant="caption"
              style={{
                color     : tab === t ? colors.accent.gold : colors.text.muted,
                fontWeight: '700',
              }}
            >
              {t === 'matrix' ? 'Matrice par rôle' : 'Overrides individuels'}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {tab === 'matrix' ? <PermissionMatrix /> : <UserOverridesPanel />}
      </ScrollView>
    </View>
  )
}

// ── PermissionMatrix : 8 rôles × 10 sections ─────────────────────────────────

function PermissionMatrix() {
  const [rows,    setRows]    = useState<SectionPermissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState<string | null>(null)  // key = `${role}|${section}`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listDefaultPermissions()
      setRows(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[PermissionMatrix] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Map pour lookup rapide (role+section → granted)
  const grantedMap = useMemo(() => {
    const m = new Map<string, boolean>()
    rows.forEach((r) => m.set(`${r.role}|${r.sectionKey}`, r.granted))
    return m
  }, [rows])

  const handleToggle = async (targetRole: UserRole, sectionKey: SectionKey) => {
    const key     = `${targetRole}|${sectionKey}`
    const current = grantedMap.get(key) ?? false
    const next    = !current
    if (saving) return

    setSaving(key)
    // Optimistic update
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.role === targetRole && r.sectionKey === sectionKey)
      if (idx === -1) {
        return [...prev, {
          role      : targetRole,
          sectionKey,
          granted   : next,
          updatedAt : new Date().toISOString(),
          updatedBy : null,
        }]
      }
      const copy = [...prev]
      copy[idx]  = { ...copy[idx], granted: next, updatedAt: new Date().toISOString() }
      return copy
    })

    try {
      await upsertDefaultPermission(targetRole, sectionKey, next)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[PermissionMatrix] toggle error:', err)
      // Rollback en cas d'erreur
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.role === targetRole && r.sectionKey === sectionKey)
        if (idx === -1) return prev
        const copy = [...prev]
        copy[idx]  = { ...copy[idx], granted: current }
        return copy
      })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={s.matrixScroll}>
      <View style={s.matrix}>
        {/* Header : rôles en colonnes */}
        <View style={s.matrixRow}>
          <View style={s.sectionLabelCell} />
          {ROLES.map((r) => (
            <View key={r} style={s.roleHeaderCell}>
              <AureakText
                variant="caption"
                style={{
                  color         : colors.text.muted,
                  fontWeight    : '600',
                  textTransform : 'uppercase',
                  fontSize      : 10,
                }}
              >
                {ROLE_LABELS[r]}
              </AureakText>
            </View>
          ))}
        </View>

        {/* Lignes : sections */}
        {SECTION_KEYS.map((sk) => (
          <View key={sk} style={s.matrixRow}>
            <View style={s.sectionLabelCell}>
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' }}>
                {SECTION_KEY_LABELS[sk]}
              </AureakText>
            </View>
            {ROLES.map((r) => {
              const key     = `${r}|${sk}`
              const granted = grantedMap.get(key) ?? false
              const isSaving = saving === key
              return (
                <Pressable
                  key={r}
                  style={[
                    s.cell,
                    { backgroundColor: granted ? colors.status.present : colors.status.absent },
                    isSaving && s.cellSaving,
                  ]}
                  onPress={() => handleToggle(r, sk)}
                  disabled={isSaving}
                >
                  <AureakText
                    variant="caption"
                    style={{ color: colors.text.primary, fontWeight: '700', fontSize: 11 }}
                  >
                    {granted ? 'ON' : 'OFF'}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

// ── UserOverridesPanel : search user + liste overrides ───────────────────────

function UserOverridesPanel() {
  const [search,        setSearch]        = useState('')
  const [searching,     setSearching]     = useState(false)
  const [results,       setResults]       = useState<UserRow[]>([])
  const [selectedUser,  setSelectedUser]  = useState<UserRow | null>(null)
  const [overrides,     setOverrides]     = useState<UserSectionOverrideRow[]>([])
  const [loadingUser,   setLoadingUser]   = useState(false)
  const [saving,        setSaving]        = useState<string | null>(null)

  // Debounced search
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    let cancelled = false
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await listUsers({ search: search.trim(), pageSize: 20 })
        if (!cancelled) setResults(data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[UserOverridesPanel] search error:', err)
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [search])

  const selectUser = useCallback(async (u: UserRow) => {
    setSelectedUser(u)
    setResults([])
    setSearch('')
    setLoadingUser(true)
    try {
      const data = await listUserOverrides(u.userId)
      setOverrides(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[UserOverridesPanel] load overrides error:', err)
    } finally {
      setLoadingUser(false)
    }
  }, [])

  const overrideMap = useMemo(() => {
    const m = new Map<SectionKey, boolean>()
    overrides.forEach((o) => m.set(o.sectionKey, o.granted))
    return m
  }, [overrides])

  const handleOverrideToggle = async (sectionKey: SectionKey, currentGranted: boolean | undefined) => {
    if (!selectedUser || saving) return
    const next = !(currentGranted ?? false)
    const hadOverride = currentGranted !== undefined
    setSaving(sectionKey)
    // Optimistic update — appliqué AVANT l'appel API
    setOverrides((prev) => {
      const idx = prev.findIndex((o) => o.sectionKey === sectionKey)
      if (idx === -1) {
        return [...prev, {
          profileId : selectedUser.userId,
          sectionKey,
          tenantId  : '',  // peu importe côté UI (pas utilisé pour l'affichage)
          granted   : next,
          grantedAt : new Date().toISOString(),
          grantedBy : null,
          deletedAt : null,
        }]
      }
      const copy = [...prev]
      copy[idx]  = { ...copy[idx], granted: next, grantedAt: new Date().toISOString() }
      return copy
    })
    try {
      await upsertUserOverride(selectedUser.userId, sectionKey, next)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[UserOverridesPanel] toggle error:', err)
      // Rollback
      setOverrides((prev) => {
        if (!hadOverride) return prev.filter((o) => o.sectionKey !== sectionKey)
        const idx = prev.findIndex((o) => o.sectionKey === sectionKey)
        if (idx === -1) return prev
        const copy = [...prev]
        copy[idx]  = { ...copy[idx], granted: currentGranted ?? false }
        return copy
      })
    } finally {
      setSaving(null)
    }
  }

  const handleRemoveOverride = async (sectionKey: SectionKey) => {
    if (!selectedUser || saving) return
    setSaving(sectionKey)
    try {
      await deleteUserOverride(selectedUser.userId, sectionKey)
      setOverrides((prev) => prev.filter((o) => o.sectionKey !== sectionKey))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[UserOverridesPanel] delete error:', err)
    } finally {
      setSaving(null)
    }
  }

  return (
    <View style={s.overridesPanel}>
      {/* Recherche utilisateur */}
      <View style={s.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un utilisateur (nom, email)…"
          placeholderTextColor={colors.text.muted}
          style={s.searchInput}
        />
        {searching && (
          <AureakText variant="caption" style={{ color: colors.text.muted }}>…</AureakText>
        )}
      </View>

      {/* Résultats recherche */}
      {results.length > 0 && (
        <View style={s.searchResults}>
          {results.map((u) => (
            <Pressable key={u.userId} style={s.resultItem} onPress={() => selectUser(u)}>
              <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '600' }}>
                {u.displayName || '(sans nom)'}
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {u.email ?? '—'} · {u.userRole}
              </AureakText>
            </Pressable>
          ))}
        </View>
      )}

      {/* Utilisateur sélectionné + overrides */}
      {selectedUser && (
        <View style={s.selectedUser}>
          <View style={s.selectedHeader}>
            <View style={{ flex: 1 }}>
              <AureakText variant="body" style={{ fontWeight: '700', color: colors.text.dark }}>
                {selectedUser.displayName || '(sans nom)'}
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {selectedUser.email ?? '—'} · Rôle principal : {selectedUser.userRole}
              </AureakText>
            </View>
            <Pressable onPress={() => { setSelectedUser(null); setOverrides([]) }}>
              <AureakText variant="caption" style={{ color: colors.accent.gold }}>Fermer</AureakText>
            </Pressable>
          </View>

          {loadingUser ? (
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Chargement…</AureakText>
          ) : (
            <View style={s.overridesList}>
              {SECTION_KEYS.map((sk) => {
                const override = overrideMap.get(sk)
                const hasOverride = override !== undefined
                const isSaving = saving === sk
                return (
                  <View key={sk} style={s.overrideRow}>
                    <View style={{ flex: 1 }}>
                      <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '600' }}>
                        {SECTION_KEY_LABELS[sk]}
                      </AureakText>
                      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
                        {hasOverride
                          ? `Override actif : ${override ? 'accordé' : 'refusé'}`
                          : 'Défaut du rôle appliqué'}
                      </AureakText>
                    </View>
                    <Pressable
                      style={[
                        s.overrideBtn,
                        {
                          backgroundColor: hasOverride
                            ? (override ? colors.status.present : colors.status.absent)
                            : colors.light.surface,
                          borderColor    : hasOverride
                            ? (override ? colors.status.present : colors.status.absent)
                            : colors.border.light,
                        },
                        isSaving && s.cellSaving,
                      ]}
                      onPress={() => handleOverrideToggle(sk, override)}
                      disabled={isSaving}
                    >
                      <AureakText
                        variant="caption"
                        style={{
                          color     : hasOverride ? colors.text.primary : colors.text.muted,
                          fontWeight: '700',
                          fontSize  : 11,
                        }}
                      >
                        {hasOverride ? (override ? 'ON' : 'OFF') : '—'}
                      </AureakText>
                    </Pressable>
                    {hasOverride && (
                      <Pressable
                        style={s.removeBtn}
                        onPress={() => handleRemoveOverride(sk)}
                        disabled={isSaving}
                      >
                        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
                          Retirer
                        </AureakText>
                      </Pressable>
                    )}
                  </View>
                )
              })}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ── Styles (tokens uniquement) ────────────────────────────────────────────────

const s = StyleSheet.create({
  container       : { flex: 1, backgroundColor: colors.light.primary },
  content         : { padding: space.xl, gap: space.md },

  // Tabs
  tabs            : {
    flexDirection   : 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom    : space.sm,
  },
  tab             : { paddingVertical: 8, paddingHorizontal: space.md, marginBottom: -1 },
  tabActive       : { borderBottomWidth: 2, borderBottomColor: colors.accent.gold },

  // Matrix
  matrixScroll    : { marginTop: space.sm },
  matrix          : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.sm,
  },
  matrixRow       : { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  sectionLabelCell: { width: 130, paddingRight: space.sm },
  roleHeaderCell  : {
    width         : 80,
    alignItems    : 'center',
    paddingVertical: 6,
  },
  cell            : {
    width         : 80,
    paddingVertical: 10,
    borderRadius  : radius.xs,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  cellSaving      : { opacity: 0.5 },

  // Overrides panel
  overridesPanel  : { gap: space.md, marginTop: space.sm },
  searchRow       : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    paddingHorizontal: space.md,
  },
  searchInput     : {
    flex           : 1,
    paddingVertical: space.sm,
    color          : colors.text.dark,
    fontSize       : 14,
  },
  searchResults   : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
  },
  resultItem      : {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap            : 2,
  },
  selectedUser    : {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : space.md,
  },
  selectedHeader  : {
    flexDirection   : 'row',
    alignItems      : 'center',
    gap             : space.sm,
    paddingBottom   : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  overridesList   : { gap: space.xs },
  overrideRow     : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    paddingVertical: space.xs,
  },
  overrideBtn     : {
    width         : 64,
    paddingVertical: 8,
    borderRadius  : radius.xs,
    borderWidth   : 1,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  removeBtn       : {
    paddingHorizontal: space.sm,
    paddingVertical : 6,
  },
})
