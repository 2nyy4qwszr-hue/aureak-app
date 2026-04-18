// Story 88.2 + 88.3 — Page CRM Pipeline Clubs : StatCards + Filtres + Tableau + Mes actions
'use client'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { listClubProspects, listMyActions } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { PROSPECT_STATUSES, PROSPECT_STATUS_LABELS, PROSPECT_ACTION_TYPE_LABELS, PROSPECT_ACTION_TYPE_ICONS } from '@aureak/types'
import type { ClubProspectListItem, ProspectStatus, ProspectAction } from '@aureak/types'
import { ProspectionStatCards } from './_components/ProspectionStatCards'
import { ProspectTable } from './_components/ProspectTable'
import { CreateProspectModal } from './_components/CreateProspectModal'

export default function ProspectionClubsPage() {
  const { role } = useAuthStore()
  const [prospects, setProspects]           = useState<ClubProspectListItem[]>([])
  const [loading, setLoading]               = useState(true)
  const [filterStatus, setFilterStatus]     = useState<ProspectStatus | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [myActions, setMyActions] = useState<ProspectAction[]>([])

  const loadProspects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listClubProspects(
        filterStatus ? { status: filterStatus } : undefined,
      )
      setProspects(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionClubsPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    loadProspects()
  }, [loadProspects])

  // All prospects (unfiltered) for stat cards
  const [allProspects, setAllProspects] = useState<ClubProspectListItem[]>([])
  useEffect(() => {
    listClubProspects().then(setAllProspects).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionClubsPage] allProspects error:', err)
    })
  }, [prospects]) // re-fetch when prospects change (after create)

  // Mes dernières actions (Story 88.3)
  useEffect(() => {
    listMyActions({ limit: 5 }).then(setMyActions).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionClubsPage] myActions error:', err)
    })
  }, [prospects])

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
          <AureakText variant="h1" style={styles.title}>Pipeline Clubs</AureakText>
          <AureakText variant="body" style={styles.sub}>
            CRM prospection — gérez vos clubs prospects et contacts
          </AureakText>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <AureakText style={styles.addBtnText}>+ Ajouter un prospect</AureakText>
        </Pressable>
      </View>

      {/* Stat Cards */}
      <ProspectionStatCards prospects={allProspects} />

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
        {PROSPECT_STATUSES.map(s => (
          <Pressable
            key={s}
            style={[styles.filterPill, filterStatus === s && styles.filterPillActive]}
            onPress={() => setFilterStatus(filterStatus === s ? null : s)}
          >
            <AureakText style={[styles.filterPillText, filterStatus === s && styles.filterPillTextActive] as never}>
              {PROSPECT_STATUS_LABELS[s]}
            </AureakText>
          </Pressable>
        ))}
      </View>

      {/* Tableau */}
      <ProspectTable prospects={prospects} />

      {/* Mes actions (Story 88.3) */}
      {myActions.length > 0 && (
        <View style={styles.myActionsCard as object}>
          <AureakText variant="h2" style={styles.myActionsTitle}>
            Mes dernieres actions
          </AureakText>
          {myActions.map(action => (
            <View key={action.id} style={styles.myActionRow}>
              <AureakText style={styles.myActionIcon}>
                {PROSPECT_ACTION_TYPE_ICONS[action.actionType]}
              </AureakText>
              <View style={styles.myActionContent}>
                <AureakText style={styles.myActionType}>
                  {PROSPECT_ACTION_TYPE_LABELS[action.actionType]}
                </AureakText>
                {action.description && (
                  <AureakText style={styles.myActionDesc} numberOfLines={1}>
                    {action.description}
                  </AureakText>
                )}
              </View>
              <AureakText style={styles.myActionDate}>
                {new Date(action.createdAt).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })}
              </AureakText>
            </View>
          ))}
        </View>
      )}

      {/* Modale création */}
      <CreateProspectModal
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
    flex: 1,
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

  // Mes actions (Story 88.3)
  myActionsCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    marginTop      : space.xl,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    boxShadow      : shadows.sm,
  },
  myActionsTitle: {
    color       : colors.text.dark,
    marginBottom: space.md,
  },
  myActionRow: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  myActionIcon: {
    fontSize: 16,
    width   : 24,
  },
  myActionContent: {
    flex: 1,
  },
  myActionType: {
    fontSize  : 13,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  myActionDesc: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
    marginTop : 2,
  },
  myActionDate: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
  },
})
