'use client'
// Annuaire des groupes — vue globale tous groupes/implantations
// Story 56-1 : GroupCard team sheet avec mini-terrain SVG
// Story 56-3 : Avatars joueurs sur la card (listGroupsWithMembers sans N+1)
// Story 56-4 : Drag-drop transfert joueur entre groupes
// Hiérarchie : Implantation → Groupe → Séances → Présences / Évaluations
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listGroupsWithMembers, listImplantations, listAcademySeasons, createGroup,
  transferGroupMember, getTopGroupByAttendance,
} from '@aureak/api-client'
import type { GroupWithMembers } from '@aureak/api-client'
import { GroupGeneratorModal } from './GroupGeneratorModal'
import { AureakText } from '@aureak/ui'
import { GroupCard } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import {
  GROUP_METHODS, METHOD_COLOR,
} from '@aureak/business-logic'
import { useAuthStore } from '@aureak/business-logic'
import type { GroupMethod, Implantation, AcademySeason } from '@aureak/types'

// ── Types ──────────────────────────────────────────────────────────────────────

type FilterMethod = GroupMethod | 'all'

// Drag-drop state
type DragState = {
  childId    : string
  displayName: string
  fromGroupId: string
  fromGroupName: string
} | null

type TransferConfirm = {
  childId      : string
  displayName  : string
  fromGroupId  : string
  fromGroupName: string
  toGroupId    : string
  toGroupName  : string
} | null

// ── Main ───────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const router   = useRouter()
  const tenantId = useAuthStore(s => s.tenantId) ?? ''

  const [groups,        setGroups]        = useState<GroupWithMembers[]>([])
  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [implantFilter, setImplantFilter] = useState<string>('all')
  const [methodFilter,  setMethodFilter]  = useState<FilterMethod>('all')

  // Story 56-5 — Badge groupe du mois
  const [topGroupId,     setTopGroupId]     = useState<string | null>(null)
  const [badgePeriod,    setBadgePeriod]    = useState<'month' | 'season'>('month')
  const [badgeLoading,   setBadgeLoading]   = useState(false)

  // Modal génération groupes
  const [showGenModal, setShowGenModal] = useState(false)
  const [seasons,      setSeasons]      = useState<AcademySeason[]>([])
  const [genSeasonId,  setGenSeasonId]  = useState<string>('')
  const [genImplantId, setGenImplantId] = useState<string>('')
  const [generating,   setGenerating]   = useState(false)
  const [genResult,    setGenResult]    = useState<string | null>(null)

  // Story 56-7 — Modal générateur par âge
  const [showAgeModal, setShowAgeModal] = useState(false)

  // Drag-drop (Story 56-4)
  const [dragState,      setDragState]      = useState<DragState>(null)
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)
  const [transferConfirm, setTransferConfirm] = useState<TransferConfirm>(null)
  const [transferring,    setTransferring]    = useState(false)
  const [transferError,   setTransferError]   = useState<string | null>(null)
  const dragStateRef = useRef<DragState>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [allGroups, { data: impls }, { data: seas }] = await Promise.all([
        listGroupsWithMembers(),
        listImplantations(),
        listAcademySeasons(),
      ])
      setGroups(allGroups)
      setImplantations(impls ?? [])
      const seasonList = seas ?? []
      setSeasons(seasonList)
      setGenSeasonId(prev => {
        if (prev || seasonList.length === 0) return prev
        const current = seasonList.find(s => s.isCurrent) ?? seasonList[0]
        return current.id
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Story 56-5 — Charger le groupe du mois à chaque changement de période
  useEffect(() => {
    if (!tenantId) return
    setBadgeLoading(true)
    getTopGroupByAttendance(tenantId, badgePeriod)
      .then(({ data }) => { setTopGroupId(data?.groupId ?? null) })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[GroupsPage] getTopGroupByAttendance:', err)
        setTopGroupId(null)
      })
      .finally(() => { setBadgeLoading(false) })
  }, [tenantId, badgePeriod])

  const handleOpenGenModal = () => {
    if (implantations.length > 0 && !genImplantId) {
      setGenImplantId(implantations[0].id)
    }
    setGenResult(null)
    setShowGenModal(true)
  }

  const handleGenerate = async () => {
    if (!genImplantId) return
    const implant = implantations.find(i => i.id === genImplantId)
    if (!implant) return
    setGenerating(true)
    setGenResult(null)
    try {
      let created = 0
      let errors  = 0
      for (const method of GROUP_METHODS) {
        const name = `${implant.name} - ${method}`
        const { error } = await createGroup({
          tenantId       : implant.tenantId,
          implantationId : genImplantId,
          name,
          method,
        })
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[GroupsPage] createGroup error:', error)
          errors++
        } else {
          created++
        }
      }
      setGenResult(`${created} groupe${created !== 1 ? 's' : ''} créé${created !== 1 ? 's' : ''}${errors > 0 ? `, ${errors} erreur(s)` : ''}.`)
      await load()
    } finally {
      setGenerating(false)
    }
  }

  const filtered = groups.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
    if (implantFilter !== 'all' && g.implantationId !== implantFilter)  return false
    if (methodFilter  !== 'all' && g.method         !== methodFilter)   return false
    return true
  })

  const genImplant = implantations.find(i => i.id === genImplantId)

  // ── Drag-drop handlers (Story 56-4) ────────────────────────────────────────

  function handleDragOver(e: React.DragEvent, groupId: string) {
    e.preventDefault()
    // Ne pas permettre de droper dans le même groupe
    if (dragStateRef.current?.fromGroupId === groupId) return
    setDragOverGroupId(groupId)
  }

  function handleDragLeave(groupId: string) {
    setDragOverGroupId(prev => prev === groupId ? null : prev)
  }

  function handleDrop(e: React.DragEvent, group: GroupWithMembers) {
    e.preventDefault()
    setDragOverGroupId(null)
    const drag = dragStateRef.current
    if (!drag) return
    if (drag.fromGroupId === group.id) return

    // Ouvrir modal de confirmation
    setTransferConfirm({
      childId      : drag.childId,
      displayName  : drag.displayName,
      fromGroupId  : drag.fromGroupId,
      fromGroupName: drag.fromGroupName,
      toGroupId    : group.id,
      toGroupName  : group.name,
    })
    setTransferError(null)
  }

  function handleDragEnd() {
    dragStateRef.current = null
    setDragState(null)
    setDragOverGroupId(null)
  }

  const handleConfirmTransfer = async () => {
    if (!transferConfirm) return
    setTransferring(true)
    setTransferError(null)

    // Optimistic update
    const { childId, fromGroupId, toGroupId } = transferConfirm
    const prevGroups = [...groups]

    setGroups(prev => prev.map(g => {
      if (g.id === fromGroupId) {
        return {
          ...g,
          memberCount  : Math.max(0, g.memberCount - 1),
          memberAvatars: g.memberAvatars.filter(m => m.childId !== childId),
        }
      }
      if (g.id === toGroupId) {
        const moved = prevGroups.find(pg => pg.id === fromGroupId)?.memberAvatars.find(m => m.childId === childId)
        return {
          ...g,
          memberCount  : g.memberCount + 1,
          memberAvatars: moved ? [...g.memberAvatars, moved] : g.memberAvatars,
        }
      }
      return g
    }))

    try {
      const { error } = await transferGroupMember(childId, fromGroupId, toGroupId, tenantId)
      if (error) {
        // Rollback optimiste
        setGroups(prevGroups)
        setTransferError('Erreur lors du transfert. Veuillez réessayer.')
        if (process.env.NODE_ENV !== 'production') console.error('[GroupsPage] transferGroupMember error:', error)
      } else {
        setTransferConfirm(null)
      }
    } finally {
      setTransferring(false)
    }
  }

  return (
    <>
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <AureakText variant="h2" color={colors.accent.gold}>Groupes</AureakText>
          {!loading && (
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 2 }}>
              {filtered.length} groupe{filtered.length !== 1 ? 's' : ''}
            </AureakText>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          {/* Story 56-7 — Générer par âge (admin only) */}
          <Pressable style={s.genBtn} onPress={() => setShowAgeModal(true)}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
              👶 Par âge
            </AureakText>
          </Pressable>
          <Pressable style={s.genBtn} onPress={handleOpenGenModal}>
            <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
              + Générer
            </AureakText>
          </Pressable>
        </View>
      </View>

      {/* ── Sélecteur période badge (Story 56-5) ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700', letterSpacing: 0.5 }}>
          🏆 Badge :
        </AureakText>
        {(['month', 'season'] as const).map(p => (
          <Pressable
            key={p}
            style={[s.tab, badgePeriod === p && s.tabActive]}
            onPress={() => setBadgePeriod(p)}
          >
            <AureakText variant="caption" style={{
              color     : badgePeriod === p ? colors.accent.gold : colors.text.muted,
              fontWeight: badgePeriod === p ? '700' : '400',
            }}>
              {p === 'month' ? 'Mois en cours' : 'Cette saison'}
            </AureakText>
          </Pressable>
        ))}
        {badgeLoading && (
          <AureakText variant="caption" style={{ color: colors.text.subtle, fontSize: 10 }}>…</AureakText>
        )}
      </View>

      {/* ── Search ── */}
      <TextInput
        style={s.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher par nom…"
        placeholderTextColor={colors.text.muted}
      />

      {/* ── Filters ── */}
      <View style={s.filterRow}>
        {/* Implantation filter */}
        <View style={s.filterGroup}>
          <Pressable
            style={[s.tab, implantFilter === 'all' && s.tabActive]}
            onPress={() => setImplantFilter('all')}
          >
            <AureakText variant="caption" style={{ color: implantFilter === 'all' ? colors.accent.gold : colors.text.muted, fontWeight: implantFilter === 'all' ? '700' : '400' }}>
              Toutes
            </AureakText>
          </Pressable>
          {implantations.map(i => (
            <Pressable
              key={i.id}
              style={[s.tab, implantFilter === i.id && s.tabActive]}
              onPress={() => setImplantFilter(prev => prev === i.id ? 'all' : i.id)}
            >
              <AureakText variant="caption" style={{ color: implantFilter === i.id ? colors.accent.gold : colors.text.muted, fontWeight: implantFilter === i.id ? '700' : '400' }}>
                {i.name}
              </AureakText>
            </Pressable>
          ))}
        </View>

        {/* Method filter */}
        <View style={s.filterGroup}>
          <Pressable
            style={[s.tab, methodFilter === 'all' && s.tabActive]}
            onPress={() => setMethodFilter('all')}
          >
            <AureakText variant="caption" style={{ color: methodFilter === 'all' ? colors.accent.gold : colors.text.muted, fontWeight: methodFilter === 'all' ? '700' : '400' }}>
              Toutes méthodes
            </AureakText>
          </Pressable>
          {GROUP_METHODS.map(m => (
            <Pressable
              key={m}
              style={[s.tab, methodFilter === m && s.tabActive]}
              onPress={() => setMethodFilter(prev => prev === m ? 'all' : m)}
            >
              <AureakText variant="caption" style={{ color: methodFilter === m ? METHOD_COLOR[m] : colors.text.muted, fontWeight: methodFilter === m ? '700' : '400' }}>
                {m}
              </AureakText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Grid ── */}
      {loading ? (
        <View style={s.skeletonBox}>
          {[0,1,2,3,4].map(i => <View key={i} style={s.skeletonCard} />)}
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted }}>Aucun groupe</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
            {search ? 'Aucun résultat pour cette recherche.' : 'Créez des groupes depuis la page Implantations.'}
          </AureakText>
          {!search && (
            <Pressable
              style={{ marginTop: space.md, paddingHorizontal: space.md, paddingVertical: space.xs + 2, borderRadius: 6, backgroundColor: colors.accent.gold }}
              onPress={() => router.push('/implantations' as never)}
            >
              <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                Gérer les implantations →
              </AureakText>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={s.grid}>
          {filtered.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              memberCount={group.memberCount}
              members={group.memberAvatars}
              onPress={() => router.push(`/groups/${group.id}` as never)}
              isDragOver={dragOverGroupId === group.id}
              onDragOver={(e: React.DragEvent) => handleDragOver(e, group.id)}
              onDragLeave={() => handleDragLeave(group.id)}
              onDrop={(e: React.DragEvent) => handleDrop(e, group)}
              isGroupOfMonth={topGroupId !== null && group.id === topGroupId}
            />
          ))}
        </View>
      )}
    </ScrollView>

    {/* ── Modal génération groupes ── */}
    {showGenModal && (
      <Pressable
        style={{
          position: 'fixed' as never,
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 100,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}
        onPress={() => setShowGenModal(false)}
      >
        <Pressable
          onPress={e => e.stopPropagation()}
          style={{
            backgroundColor: colors.light.surface,
            borderRadius   : 12,
            padding        : 24,
            width          : '100%',
            maxWidth       : 480,
            gap            : 16,
          }}
        >
          {/* Modal header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AureakText variant="h3" style={{ color: colors.text.dark }}>Générer des groupes</AureakText>
            <Pressable onPress={() => setShowGenModal(false)}>
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 18 }}>✕</AureakText>
            </Pressable>
          </View>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            Génère un groupe par méthode pédagogique pour l'implantation sélectionnée.
          </AureakText>

          {/* Saison */}
          {seasons.length > 0 && (
            <View style={{ gap: 6 }}>
              <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700' }}>SAISON</AureakText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {seasons.map(season => (
                    <Pressable
                      key={season.id}
                      style={[s2.chip, genSeasonId === season.id && s2.chipActive]}
                      onPress={() => setGenSeasonId(season.id)}
                    >
                      <AureakText variant="caption" style={{ color: genSeasonId === season.id ? colors.light.primary : colors.text.dark, fontWeight: '600' }}>
                        {season.label}{season.isCurrent ? ' (actuelle)' : ''}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Implantation */}
          <View style={{ gap: 6 }}>
            <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700' }}>IMPLANTATION</AureakText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {implantations.map(i => (
                <Pressable
                  key={i.id}
                  style={[s2.chip, genImplantId === i.id && s2.chipActive]}
                  onPress={() => setGenImplantId(i.id)}
                >
                  <AureakText variant="caption" style={{ color: genImplantId === i.id ? colors.light.primary : colors.text.dark, fontWeight: '600' }}>
                    {i.name}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Aperçu */}
          {genImplantId && (
            <View style={{ backgroundColor: colors.light.muted, borderRadius: 8, padding: 12, gap: 6 }}>
              <AureakText variant="caption" style={{ color: colors.text.subtle, fontWeight: '700', letterSpacing: 0.8 }}>
                APERÇU ({GROUP_METHODS.length} GROUPES)
              </AureakText>
              {GROUP_METHODS.map(method => {
                const color = METHOD_COLOR[method]
                return (
                  <View key={method} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                    <AureakText variant="caption" style={{ color: colors.text.dark }}>
                      {genImplant?.name ?? '…'} — {method}
                    </AureakText>
                  </View>
                )
              })}
            </View>
          )}

          {/* Résultat */}
          {genResult && (
            <AureakText variant="caption" style={{ color: colors.status.present, fontWeight: '700' }}>
              {genResult}
            </AureakText>
          )}

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <Pressable style={[s2.cancelBtn]} onPress={() => setShowGenModal(false)}>
              <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '600' }}>Annuler</AureakText>
            </Pressable>
            <Pressable
              style={[s2.generateBtn, (!genImplantId || generating) && { opacity: 0.5 }]}
              onPress={handleGenerate}
              disabled={!genImplantId || generating}
            >
              <AureakText variant="caption" style={{ color: colors.light.primary, fontWeight: '700' }}>
                {generating ? 'Génération…' : 'Générer'}
              </AureakText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    )}

    {/* ── Modal générateur par âge (Story 56-7) ── */}
    {showAgeModal && (
      <GroupGeneratorModal
        visible={showAgeModal}
        implantationId={genImplantId || (implantations[0]?.id ?? '')}
        tenantId={tenantId}
        seasonStartYear={new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear() - 1}
        onClose={() => setShowAgeModal(false)}
        onCreated={() => { setShowAgeModal(false); load() }}
      />
    )}

    {/* ── Modal confirmation transfert (Story 56-4) ── */}
    <Modal visible={!!transferConfirm} transparent animationType="fade">
      <Pressable
        style={s.overlay}
        onPress={() => { if (!transferring) setTransferConfirm(null) }}
      >
        <Pressable style={s.modal} onPress={e => e.stopPropagation?.()}>
          <AureakText variant="h3" style={{ color: colors.text.dark, marginBottom: space.sm }}>
            Confirmer le transfert
          </AureakText>
          {transferConfirm && (
            <>
              <AureakText variant="body" style={{ color: colors.text.dark, marginBottom: space.sm }}>
                Transférer{' '}
                <AureakText variant="body" style={{ fontWeight: '700', color: colors.accent.gold }}>
                  {transferConfirm.displayName}
                </AureakText>
                {' '}du groupe{' '}
                <AureakText variant="body" style={{ fontWeight: '700' }}>
                  {transferConfirm.fromGroupName}
                </AureakText>
                {' '}vers{' '}
                <AureakText variant="body" style={{ fontWeight: '700' }}>
                  {transferConfirm.toGroupName}
                </AureakText>
                {' '}?
              </AureakText>

              {transferError && (
                <AureakText variant="caption" style={{ color: colors.status.absent, marginBottom: space.sm }}>
                  {transferError}
                </AureakText>
              )}

              <View style={{ flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' }}>
                <Pressable
                  style={s.cancelBtn}
                  onPress={() => setTransferConfirm(null)}
                  disabled={transferring}
                >
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '600' }}>
                    Annuler
                  </AureakText>
                </Pressable>
                <Pressable
                  style={[s.confirmBtn, transferring && { opacity: 0.6 }]}
                  onPress={handleConfirmTransfer}
                  disabled={transferring}
                >
                  <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
                    {transferring ? 'Transfert…' : 'Confirmer le transfert'}
                  </AureakText>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
    </>
  )
}

const s2 = StyleSheet.create({
  chip       : {
    paddingHorizontal: 12,
    paddingVertical  : 6,
    borderRadius     : 16,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.muted,
  },
  chipActive : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  cancelBtn  : {
    paddingHorizontal: 16,
    paddingVertical  : 8,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  generateBtn: {
    paddingHorizontal: 16,
    paddingVertical  : 8,
    borderRadius     : 8,
    backgroundColor  : colors.accent.gold,
  },
})

const s = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { padding: space.xl, gap: space.md },
  header     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  genBtn     : {
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.gold,
    backgroundColor  : colors.accent.gold + '08',
  },

  searchInput: {
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
  },

  filterRow  : { gap: space.sm },
  filterGroup: {
    flexDirection    : 'row',
    gap              : space.xs,
    flexWrap         : 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingBottom    : space.sm,
  },
  tab        : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  tabActive  : { backgroundColor: colors.light.muted },

  grid       : {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },

  skeletonBox : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  skeletonCard: {
    width  : 280, height : 200,
    backgroundColor: colors.light.surface,
    borderRadius   : 10, opacity: 0.5,
    borderWidth    : 1, borderColor: colors.border.light,
  },
  emptyState  : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.xxl,
    alignItems     : 'center',
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },

  // Modal transfert
  overlay: {
    flex           : 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent : 'center',
    alignItems     : 'center',
    padding        : space.xl,
  },
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    padding        : space.lg,
    width          : '100%',
    maxWidth       : 460,
  },
  cancelBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : 8,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  confirmBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : 8,
    backgroundColor  : colors.accent.gold,
  },
})
