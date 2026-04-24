'use client'
// Story 89.5 — Liste d'attente admin : vue consolidée par groupe
// Affiche l'ensemble des entrées trial_waitlist du tenant avec leur statut.
// Story 99.3 — AdminPageHeader v2 ("Liste d'attente")
// AC7 : "Vue admin : liste d'attente par groupe avec statuts"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, fonts, radius } from '@aureak/theme'
import {
  listWaitlist, removeFromWaitlist, listAllGroups, listImplantations,
  getChildDirectoryEntry,
} from '@aureak/api-client'
import type {
  TrialWaitlistEntry, WaitlistStatus,
  GroupWithMeta, Implantation, ChildDirectoryEntry,
} from '@aureak/types'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'

const STATUS_LABEL: Record<WaitlistStatus, string> = {
  waiting  : 'En attente',
  notified : 'Notifié',
  confirmed: 'Confirmé',
  expired  : 'Expiré',
}

const STATUS_COLOR: Record<WaitlistStatus, string> = {
  waiting  : colors.status.attention,
  notified : colors.accent.gold,
  confirmed: colors.status.present,
  expired  : colors.status.absent,
}

type FilterStatus = WaitlistStatus | 'all'

type EnrichedEntry = TrialWaitlistEntry & {
  childDisplayName: string
  groupName       : string
  implantationName: string
}

export default function WaitlistAdminPage() {
  const { width } = useWindowDimensions()
  const isMobile = width <= 640
  const [entries,       setEntries]       = useState<EnrichedEntry[]>([])
  const [loading,       setLoading]       = useState(true)
  const [statusFilter,  setStatusFilter]  = useState<FilterStatus>('all')
  const [groupFilter,   setGroupFilter]   = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [raw, groups, impls] = await Promise.all([
        listWaitlist(),
        listAllGroups(),
        listImplantations(),
      ])

      const groupMap = new Map<string, GroupWithMeta>(groups.map(g => [g.id, g]))
      const implMap  = new Map<string, Implantation>((impls.data ?? []).map(i => [i.id, i]))

      // Enrich : résolution child_directory name + group + implantation
      const enriched: EnrichedEntry[] = await Promise.all(raw.map(async (e) => {
        let childName = '—'
        try {
          const c = await getChildDirectoryEntry(e.childId) as ChildDirectoryEntry | null
          if (c) childName = `${c.prenom ?? ''} ${c.nom ?? ''}`.trim() || '—'
        } catch {
          // ignore — laisser le fallback
        }
        return {
          ...e,
          childDisplayName: childName,
          groupName       : groupMap.get(e.groupId)?.name ?? '—',
          implantationName: implMap.get(e.implantationId)?.name ?? '—',
        }
      }))

      setEntries(enriched)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[WaitlistAdminPage] load error:', err)
      setError('Impossible de charger la liste d\'attente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (groupFilter && e.groupId !== groupFilter) return false
      return true
    })
  }, [entries, statusFilter, groupFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<WaitlistStatus, number> = { waiting: 0, notified: 0, confirmed: 0, expired: 0 }
    entries.forEach(e => { counts[e.status]++ })
    return counts
  }, [entries])

  const uniqueGroups = useMemo(() => {
    const map = new Map<string, string>()
    entries.forEach(e => map.set(e.groupId, e.groupName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [entries])

  const handleRemove = async (id: string) => {
    try {
      await removeFromWaitlist(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[WaitlistAdminPage] remove error:', err)
    }
  }

  return (
    <View style={styles.container}>
      {/* Story 99.3 — AdminPageHeader v2 */}
      <AdminPageHeader title="Liste d'attente" />

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, isMobile && { paddingHorizontal: space.md }]}>
        {/* StatCards — counts par statut */}
        <View style={styles.statCards}>
          {(['waiting', 'notified', 'confirmed', 'expired'] as WaitlistStatus[]).map(st => (
            <View key={st} style={styles.statCard}>
              <AureakText style={styles.statLabel}>{STATUS_LABEL[st]}</AureakText>
              <AureakText style={{ ...styles.statValue, color: STATUS_COLOR[st] }}>
                {statusCounts[st]}
              </AureakText>
            </View>
          ))}
        </View>

        {/* Filtres */}
        <View style={styles.filtresRow}>
          {/* Status pills */}
          <View style={styles.pillRow}>
            {(['all', 'waiting', 'notified', 'confirmed', 'expired'] as FilterStatus[]).map(st => (
              <Pressable
                key={st}
                style={[styles.pill, statusFilter === st && styles.pillActive]}
                onPress={() => setStatusFilter(st)}
              >
                <AureakText variant="caption" style={statusFilter === st ? styles.pillTextActive : styles.pillText}>
                  {st === 'all' ? 'TOUS' : STATUS_LABEL[st].toUpperCase()}
                </AureakText>
              </Pressable>
            ))}
          </View>

          {/* Group filter */}
          {uniqueGroups.length > 0 && (
            <View style={styles.pillRow}>
              <Pressable
                style={[styles.pill, groupFilter === null && styles.pillActive]}
                onPress={() => setGroupFilter(null)}
              >
                <AureakText variant="caption" style={groupFilter === null ? styles.pillTextActive : styles.pillText}>
                  TOUS GROUPES
                </AureakText>
              </Pressable>
              {uniqueGroups.map(g => (
                <Pressable
                  key={g.id}
                  style={[styles.pill, groupFilter === g.id && styles.pillActive]}
                  onPress={() => setGroupFilter(g.id)}
                >
                  <AureakText variant="caption" style={groupFilter === g.id ? styles.pillTextActive : styles.pillText}>
                    {g.name}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Table */}
        {loading ? (
          <View style={styles.empty}>
            <AureakText variant="caption" style={styles.emptyText}>Chargement…</AureakText>
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <AureakText variant="caption" style={{ ...styles.emptyText, color: colors.status.absent }}>{error}</AureakText>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <AureakText variant="caption" style={styles.emptyText}>Aucune entrée.</AureakText>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <AureakText style={{ ...styles.th, flex: 2 }}>GARDIEN</AureakText>
              <AureakText style={{ ...styles.th, flex: 2 }}>GROUPE</AureakText>
              <AureakText style={{ ...styles.th, flex: 1.5 }}>IMPLANTATION</AureakText>
              <AureakText style={{ ...styles.th, width: 110 }}>STATUT</AureakText>
              <AureakText style={{ ...styles.th, width: 140 }}>DEMANDE</AureakText>
              <AureakText style={{ ...styles.th, width: 140 }}>NOTIFICATION</AureakText>
              <View style={{ width: 80 }} />
            </View>
            {filtered.map(e => (
              <View key={e.id} style={styles.tableRow}>
                <AureakText style={{ ...styles.td, flex: 2 }}>{e.childDisplayName}</AureakText>
                <AureakText style={{ ...styles.td, flex: 2 }}>{e.groupName}</AureakText>
                <AureakText style={{ ...styles.td, flex: 1.5 }}>{e.implantationName}</AureakText>
                <View style={{ width: 110 }}>
                  <View style={{ ...styles.statusBadge, backgroundColor: STATUS_COLOR[e.status] + '20', borderColor: STATUS_COLOR[e.status] }}>
                    <AureakText variant="caption" style={{ color: STATUS_COLOR[e.status], fontWeight: '700' }}>
                      {STATUS_LABEL[e.status]}
                    </AureakText>
                  </View>
                </View>
                <AureakText style={{ ...styles.td, width: 140 }}>{formatDate(e.requestedAt)}</AureakText>
                <AureakText style={{ ...styles.td, width: 140 }}>{e.notifiedAt ? formatDate(e.notifiedAt) : '—'}</AureakText>
                <View style={{ width: 80 }}>
                  {e.status !== 'confirmed' && (
                    <Pressable onPress={() => handleRemove(e.id)}>
                      <AureakText variant="caption" style={styles.removeBtn}>Retirer</AureakText>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  scroll   : { flex: 1, backgroundColor: colors.light.primary },
  scrollContent: { paddingTop: space.md, paddingBottom: space.xxl, paddingHorizontal: space.lg, gap: space.md },

  header      : { gap: 4 },
  pageTitle   : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  pageSubtitle: { color: colors.text.muted },

  statCards: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  statCard : {
    backgroundColor: colors.light.surface,
    borderRadius: radius.card, borderWidth: 1, borderColor: colors.border.divider,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    minWidth: 160,
  },
  statLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
    color: colors.text.muted, textTransform: 'uppercase',
    fontFamily: fonts.body,
  },
  statValue: {
    fontSize: 28, fontWeight: '900', fontFamily: fonts.display, marginTop: 4,
  },

  filtresRow: { gap: space.sm, zIndex: 9999 },
  pillRow   : { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },
  pill      : {
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border.divider,
    backgroundColor: colors.light.surface,
  },
  pillActive: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  pillText  : { color: colors.text.muted, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
  pillTextActive: { color: colors.light.surface, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },

  empty    : { padding: space.xl, alignItems: 'center' },
  emptyText: { color: colors.text.muted },

  table     : {
    backgroundColor: colors.light.surface,
    borderRadius: radius.card, borderWidth: 1, borderColor: colors.border.divider,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: space.md, paddingVertical: space.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border.divider,
    backgroundColor: colors.light.primary,
  },
  th: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
    color: colors.text.muted, textTransform: 'uppercase',
    fontFamily: fonts.body,
  },
  tableRow: {
    flexDirection: 'row', paddingHorizontal: space.md, paddingVertical: space.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border.divider,
    alignItems: 'center',
  },
  td: { color: colors.text.dark, fontSize: 13 },

  statusBadge: {
    paddingHorizontal: space.sm, paddingVertical: 2,
    borderRadius: 999, borderWidth: 1,
    alignSelf: 'flex-start',
  },

  removeBtn: { color: colors.status.absent, fontWeight: '700', fontSize: 12 },
})
