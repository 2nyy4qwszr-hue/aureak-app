'use client'
// Annuaire des groupes — vue globale tous groupes/implantations
// Hiérarchie : Implantation → Groupe → Séances → Présences / Évaluations
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listAllGroups, listImplantations, listAcademySeasons, createGroup } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import {
  GROUP_METHODS, METHOD_COLOR,
} from '@aureak/business-logic'
import type { GroupWithMeta, GroupMethod, Implantation, AcademySeason } from '@aureak/types'

// ── Method badge ───────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: GroupMethod | null }) {
  if (!method) return null
  const color = METHOD_COLOR[method]
  return (
    <View style={{
      backgroundColor  : color + '18',
      borderColor      : color,
      borderWidth      : 1,
      borderRadius     : 20,
      paddingHorizontal: 9,
      paddingVertical  : 2,
    }}>
      <AureakText variant="caption" style={{ color, fontWeight: '700', fontSize: 10 }}>
        {method}
      </AureakText>
    </View>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

type FilterMethod = GroupMethod | 'all'

export default function GroupsPage() {
  const router = useRouter()

  const [groups,         setGroups]         = useState<GroupWithMeta[]>([])
  const [implantations,  setImplantations]  = useState<Implantation[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [implantFilter,  setImplantFilter]  = useState<string>('all')
  const [methodFilter,   setMethodFilter]   = useState<FilterMethod>('all')

  // ── Modal génération ──────────────────────────────────────────────────────
  const [showGenModal,   setShowGenModal]   = useState(false)
  const [seasons,        setSeasons]        = useState<AcademySeason[]>([])
  const [genSeasonId,    setGenSeasonId]    = useState<string>('')
  const [genImplantId,   setGenImplantId]   = useState<string>('')
  const [generating,     setGenerating]     = useState(false)
  const [genResult,      setGenResult]      = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [allGroups, { data: impls }, { data: seas }] = await Promise.all([
        listAllGroups(),
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

  function formatTime(h: number | null, m: number | null): string {
    if (h === null) return ''
    return `${String(h).padStart(2, '0')}h${String(m ?? 0).padStart(2, '0')}`
  }

  const genImplant = implantations.find(i => i.id === genImplantId)

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
        <Pressable style={s.genBtn} onPress={handleOpenGenModal}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
            + Générer groupes
          </AureakText>
        </Pressable>
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
          {filtered.map(group => {
            const methodColor = group.method ? METHOD_COLOR[group.method] : colors.border.light
            return (
              <Pressable
                key={group.id}
                style={[s.card, { borderTopColor: methodColor }]}
                onPress={() => router.push(`/groups/${group.id}` as never)}
              >
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.xs }}>
                  <AureakText variant="body" style={{ fontWeight: '700', flex: 1, fontSize: 14 }}>
                    {group.name}
                  </AureakText>
                  <MethodBadge method={group.method} />
                </View>

                {/* Implantation */}
                <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
                  {group.implantationName}
                </AureakText>

                {/* Schedule */}
                {group.dayOfWeek && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <View style={s.chip}>
                      <AureakText variant="caption" style={{ fontSize: 11 }}>{group.dayOfWeek}</AureakText>
                    </View>
                    {group.startHour !== null && (
                      <View style={s.chip}>
                        <AureakText variant="caption" style={{ fontSize: 11 }}>
                          {formatTime(group.startHour, group.startMinute)}
                        </AureakText>
                      </View>
                    )}
                    {group.durationMinutes && (
                      <View style={s.chip}>
                        <AureakText variant="caption" style={{ fontSize: 11 }}>{group.durationMinutes} min</AureakText>
                      </View>
                    )}
                  </View>
                )}

                {/* Footer */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={s.memberBadge}>
                      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
                        {group.memberCount} joueur{group.memberCount !== 1 ? 's' : ''}
                      </AureakText>
                    </View>
                  </View>
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700', fontSize: 11 }}>
                    Gérer →
                  </AureakText>
                </View>
              </Pressable>
            )
          })}
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
            <Pressable
              style={[s2.cancelBtn]}
              onPress={() => setShowGenModal(false)}
            >
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
  card       : {
    backgroundColor : colors.light.surface,
    borderRadius    : 10,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    borderTopWidth  : 3,
    padding         : space.md,
    width           : '100%' as never,
    maxWidth        : 340,
    minWidth        : 260,
    gap             : 2,
  },
  chip       : {
    backgroundColor: colors.light.muted,
    borderRadius   : 12,
    paddingHorizontal: 8,
    paddingVertical  : 2,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  memberBadge: {
    backgroundColor: colors.light.muted,
    borderRadius   : 10,
    paddingHorizontal: 8,
    paddingVertical  : 2,
  },

  skeletonBox : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  skeletonCard: {
    width  : 280, height : 130,
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
})
