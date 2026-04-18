// Story 89.1 — Pipeline Gardiens : liste child_directory avec statut prospect
'use client'
import { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, childProspectStatusColors } from '@aureak/theme'
import {
  listChildDirectory,
  updateChildProspectStatus,
} from '@aureak/api-client'
import type { ChildDirectoryEntry } from '@aureak/types'
import type { ChildProspectStatus } from '@aureak/types'
import {
  CHILD_PROSPECT_STATUSES,
  CHILD_PROSPECT_STATUS_LABELS,
} from '@aureak/types'

// ── ProspectBadge ────────────────────────────────────────────────────────────

function ProspectBadge({ status }: { status: ChildProspectStatus | null }) {
  if (!status) return null
  const colorSet = childProspectStatusColors[status] ?? { bg: colors.light.muted, text: colors.text.muted }
  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }] as never}>
      <AureakText variant="caption" style={{ color: colorSet.text, fontWeight: '600' } as never}>
        {CHILD_PROSPECT_STATUS_LABELS[status] ?? status}
      </AureakText>
    </View>
  )
}

// ── ProspectStatusDropdown ──────────────────────────────────────────────────

function ProspectStatusDropdown({
  childId,
  currentStatus,
  onChanged,
}: {
  childId: string
  currentStatus: ChildProspectStatus | null
  onChanged: () => void
}) {
  const [saving, setSaving] = useState(false)

  const handleChange = useCallback(async (newStatus: ChildProspectStatus | null) => {
    setSaving(true)
    try {
      await updateChildProspectStatus(childId, newStatus)
      onChanged()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectStatusDropdown] error:', err)
    } finally {
      setSaving(false)
    }
  }, [childId, onChanged])

  return (
    <View style={styles.dropdownWrap}>
      <select
        value={currentStatus ?? ''}
        disabled={saving}
        onChange={(e) => {
          const val = e.target.value as ChildProspectStatus | ''
          handleChange(val === '' ? null : val)
        }}
        style={{
          padding: '4px 8px',
          borderRadius: 6,
          border: `1px solid ${colors.border.light}`,
          fontSize: 13,
          backgroundColor: saving ? colors.light.muted : colors.light.surface,
          cursor: saving ? 'wait' : 'pointer',
          color: colors.text.dark,
        }}
      >
        <option value="">— Aucun —</option>
        {CHILD_PROSPECT_STATUSES.map((s) => (
          <option key={s} value={s}>{CHILD_PROSPECT_STATUS_LABELS[s]}</option>
        ))}
      </select>
    </View>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProspectionGardiensPage() {
  const [entries, setEntries] = useState<ChildDirectoryEntry[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ChildProspectStatus | 'all_prospects' | 'all'>('all_prospects')
  const [page, setPage] = useState(0)
  const pageSize = 50

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const prospectOpt = statusFilter === 'all' ? undefined : statusFilter
      const { data, count: total } = await listChildDirectory({
        search: search || undefined,
        prospectStatus: prospectOpt,
        page,
        pageSize,
      })
      setEntries(data)
      setCount(total)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionGardiens] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(count / pageSize)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <AureakText variant="h2" style={styles.title}>Pipeline Gardiens</AureakText>
        <AureakText variant="body" style={styles.subtitle}>
          {count} gardien{count !== 1 ? 's' : ''} dans le pipeline
        </AureakText>
      </View>

      {/* Filtres */}
      <View style={styles.filtersRow}>
        {/* Search */}
        <TextInput
          style={styles.searchInput as never}
          placeholder="Rechercher un gardien..."
          placeholderTextColor={colors.text.muted}
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(0) }}
        />

        {/* Status pills */}
        <View style={styles.pills}>
          <Pressable
            onPress={() => { setStatusFilter('all_prospects'); setPage(0) }}
            style={statusFilter === 'all_prospects' ? styles.pillActive : styles.pillInactive}
          >
            <AureakText style={statusFilter === 'all_prospects' ? styles.pillTextActive : styles.pillTextInactive as never}>
              Tous prospects
            </AureakText>
          </Pressable>
          {CHILD_PROSPECT_STATUSES.map((s) => (
            <Pressable
              key={s}
              onPress={() => { setStatusFilter(s); setPage(0) }}
              style={statusFilter === s ? styles.pillActive : styles.pillInactive}
            >
              <AureakText style={statusFilter === s ? styles.pillTextActive : styles.pillTextInactive as never}>
                {CHILD_PROSPECT_STATUS_LABELS[s]}
              </AureakText>
            </Pressable>
          ))}
          <Pressable
            onPress={() => { setStatusFilter('all'); setPage(0) }}
            style={statusFilter === 'all' ? styles.pillActive : styles.pillInactive}
          >
            <AureakText style={statusFilter === 'all' ? styles.pillTextActive : styles.pillTextInactive as never}>
              Tous
            </AureakText>
          </Pressable>
        </View>
      </View>

      {/* Table */}
      {loading ? (
        <View style={styles.emptyState}>
          <AureakText variant="body" style={{ color: colors.text.muted } as never}>Chargement...</AureakText>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <AureakText variant="h3" style={{ color: colors.text.muted, marginBottom: space.sm } as never}>
            Aucun gardien trouvé
          </AureakText>
          <AureakText variant="body" style={{ color: colors.text.muted } as never}>
            Modifiez vos filtres ou ajoutez un statut prospect depuis la fiche joueur.
          </AureakText>
        </View>
      ) : (
        <View style={styles.tableCard}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <AureakText style={[styles.colName, styles.headerText] as never}>Nom</AureakText>
            <AureakText style={[styles.colClub, styles.headerText] as never}>Club</AureakText>
            <AureakText style={[styles.colCategory, styles.headerText] as never}>Catégorie</AureakText>
            <AureakText style={[styles.colBadge, styles.headerText] as never}>Statut</AureakText>
            <AureakText style={[styles.colAction, styles.headerText] as never}>Action</AureakText>
          </View>

          {/* Table rows */}
          {entries.map((entry) => (
            <View key={entry.id} style={styles.tableRow}>
              <AureakText style={styles.colName as never} numberOfLines={1}>
                {entry.displayName}
              </AureakText>
              <AureakText style={[styles.colClub, { color: colors.text.muted }] as never} numberOfLines={1}>
                {entry.currentClub ?? '—'}
              </AureakText>
              <AureakText style={[styles.colCategory, { color: colors.text.muted }] as never} numberOfLines={1}>
                {entry.ageCategory ?? '—'}
              </AureakText>
              <View style={styles.colBadge as never}>
                <ProspectBadge status={entry.prospectStatus} />
              </View>
              <View style={styles.colAction as never}>
                <ProspectStatusDropdown
                  childId={entry.id}
                  currentStatus={entry.prospectStatus}
                  onChanged={fetchData}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled] as never}
          >
            <AureakText style={styles.pageBtnText as never}>Précédent</AureakText>
          </Pressable>
          <AureakText style={{ color: colors.text.dark } as never}>
            Page {page + 1} / {totalPages}
          </AureakText>
          <Pressable
            onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled] as never}
          >
            <AureakText style={styles.pageBtnText as never}>Suivant</AureakText>
          </Pressable>
        </View>
      )}
    </ScrollView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
  },
  header: {
    marginBottom: space.lg,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  subtitle: {
    color: colors.text.muted,
  },

  // Filters
  filtersRow: {
    marginBottom: space.lg,
    gap         : space.md,
  },
  searchInput: {
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : radius.card,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    fontSize         : 14,
    color            : colors.text.dark,
    maxWidth         : 360,
  },
  pills: {
    flexDirection: 'row' as const,
    flexWrap     : 'wrap' as const,
    gap          : space.xs,
  },
  pillActive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.accent.gold,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
  pillInactive: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.badge,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  pillTextActive: {
    color     : colors.text.dark,
    fontSize  : 13,
    fontWeight: '600' as const,
  },
  pillTextInactive: {
    color   : colors.text.muted,
    fontSize: 13,
  },

  // Table
  tableCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    boxShadow      : shadows.md,
    overflow: 'hidden' as const,
  },
  tableHeader: {
    flexDirection    : 'row' as const,
    backgroundColor  : colors.light.muted,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerText: {
    fontSize  : 12,
    fontWeight: '700' as const,
    color     : colors.text.muted,
    textTransform: 'uppercase' as const,
  },
  tableRow: {
    flexDirection    : 'row' as const,
    alignItems       : 'center' as const,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  colName    : { flex: 2, fontSize: 14, color: colors.text.dark },
  colClub    : { flex: 2, fontSize: 13 },
  colCategory: { flex: 1, fontSize: 13 },
  colBadge   : { flex: 1.2, alignItems: 'flex-start' as const },
  colAction  : { flex: 1.5, alignItems: 'flex-start' as const },

  // Badge
  badge: {
    borderRadius       : radius.badge,
    paddingHorizontal  : space.sm,
    paddingVertical    : 3,
    alignSelf          : 'flex-start' as const,
  },

  // Dropdown
  dropdownWrap: {},

  // Empty
  emptyState: {
    alignItems    : 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: space.xxl,
  },

  // Pagination
  pagination: {
    flexDirection : 'row' as const,
    justifyContent: 'center' as const,
    alignItems    : 'center' as const,
    gap           : space.md,
    marginTop     : space.lg,
  },
  pageBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.card,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    color   : colors.text.dark,
  },
})
