// Story 90.1 — Page Pipeline Entraîneurs : StatCards + Filtres + Tableau prospects
'use client'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { listCoachProspects } from '@aureak/api-client'
import { COACH_PROSPECT_STATUSES, COACH_PROSPECT_STATUS_LABELS } from '@aureak/types'
import type { CoachProspectListItem, CoachProspectStatus } from '@aureak/types'
import { CoachStatCards } from './_components/CoachStatCards'
import { CoachProspectTable } from './_components/CoachProspectTable'
import { CreateCoachProspectModal } from './_components/CreateCoachProspectModal'

export default function ProspectionEntraineursPage() {
  const [prospects, setProspects]           = useState<CoachProspectListItem[]>([])
  const [loading, setLoading]               = useState(true)
  const [filterStatus, setFilterStatus]     = useState<CoachProspectStatus | null>(null)
  const [filterManager, setFilterManager]   = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadProspects = useCallback(async () => {
    setLoading(true)
    try {
      const filters: { status?: CoachProspectStatus; managerId?: string } = {}
      if (filterStatus) filters.status = filterStatus
      if (filterManager) filters.managerId = filterManager
      const data = await listCoachProspects(Object.keys(filters).length > 0 ? filters : undefined)
      setProspects(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionEntraineursPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterManager])

  useEffect(() => {
    loadProspects()
  }, [loadProspects])

  // All prospects (unfiltered) for stat cards
  const [allProspects, setAllProspects] = useState<CoachProspectListItem[]>([])
  useEffect(() => {
    listCoachProspects().then(setAllProspects).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionEntraineursPage] allProspects error:', err)
    })
  }, [prospects]) // re-fetch when prospects change (after create/status change)

  // Derive unique managers for the filter
  const managers = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of allProspects) {
      if (p.assignedManagerId && p.managerDisplayName) {
        map.set(p.assignedManagerId, p.managerDisplayName)
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [allProspects])

  if (loading && prospects.length === 0) {
    return (
      <View style={styles.container}>
        <AureakText variant="body" style={styles.loadingText}>Chargement du pipeline...</AureakText>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AureakText variant="h1" style={styles.title}>Pipeline Entraîneurs</AureakText>
          <AureakText variant="body" style={styles.sub}>
            Recrutement d'entraîneurs — suivez vos prospects en 4 étapes
          </AureakText>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <AureakText style={styles.addBtnText}>+ Ajouter un prospect</AureakText>
        </Pressable>
      </View>

      {/* Stat Cards */}
      <CoachStatCards prospects={allProspects} />

      {/* Filtres pipeline pills */}
      <View style={styles.filtersRow}>
        <Pressable
          style={[styles.filterPill, filterStatus === null && styles.filterPillActive]}
          onPress={() => setFilterStatus(null)}
        >
          <AureakText style={[styles.filterPillText, filterStatus === null && styles.filterPillTextActive] as never}>
            Tous
          </AureakText>
        </Pressable>
        {COACH_PROSPECT_STATUSES.map(s => (
          <Pressable
            key={s}
            style={[styles.filterPill, filterStatus === s && styles.filterPillActive]}
            onPress={() => setFilterStatus(filterStatus === s ? null : s)}
          >
            <AureakText style={[styles.filterPillText, filterStatus === s && styles.filterPillTextActive] as never}>
              {COACH_PROSPECT_STATUS_LABELS[s]}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* Filtre manager */}
      {managers.length > 0 && (
        <View style={styles.filtersRow}>
          <AureakText style={styles.filterLabel}>Manager :</AureakText>
          <Pressable
            style={[styles.filterPill, filterManager === null && styles.filterPillActive]}
            onPress={() => setFilterManager(null)}
          >
            <AureakText style={[styles.filterPillText, filterManager === null && styles.filterPillTextActive] as never}>
              Tous
            </AureakText>
          </Pressable>
          {managers.map(m => (
            <Pressable
              key={m.id}
              style={[styles.filterPill, filterManager === m.id && styles.filterPillActive]}
              onPress={() => setFilterManager(filterManager === m.id ? null : m.id)}
            >
              <AureakText style={[styles.filterPillText, filterManager === m.id && styles.filterPillTextActive] as never}>
                {m.name}
              </AureakText>
            </Pressable>
          ))}
        </View>
      )}

      {/* Tableau */}
      <CoachProspectTable prospects={prospects} onStatusChanged={loadProspects} />

      {/* Modale création */}
      <CreateCoachProspectModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false)
          loadProspects()
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
  },
  header: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'flex-start',
    marginBottom  : space.xl,
    flexWrap      : 'wrap',
    gap           : space.md,
  },
  headerLeft: {
    flex    : 1,
    minWidth: 200,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    color: colors.text.muted,
  },
  addBtn: {
    backgroundColor  : colors.accent.gold,
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
  },
  addBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.primary,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
    marginBottom : space.lg,
    alignItems   : 'center',
  },
  filterLabel: {
    fontSize    : 12,
    fontFamily  : fonts.body,
    fontWeight  : '600',
    color       : colors.text.muted,
    marginRight : space.xs,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical  : 6,
    borderRadius     : 16,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  filterPillActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
  filterPillText: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  filterPillTextActive: {
    color     : colors.text.primary,
    fontWeight: '600',
  },
  loadingText: {
    color    : colors.text.muted,
    textAlign: 'center',
    marginTop: space.xl,
  },
})
