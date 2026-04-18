'use client'
// Story 90.1 — Tableau pipeline entraîneurs avec changement de statut inline
import React, { useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { COACH_PROSPECT_STATUSES, COACH_PROSPECT_STATUS_LABELS } from '@aureak/types'
import type { CoachProspectListItem, CoachProspectStatus } from '@aureak/types'
import { updateCoachProspectStatus } from '@aureak/api-client'

type Props = {
  prospects: CoachProspectListItem[]
  onStatusChanged: () => void
}

/** Couleur badge par statut pipeline */
function statusBadgeColors(status: CoachProspectStatus): { bg: string; text: string } {
  switch (status) {
    case 'identified':
      return { bg: colors.status.infoBg, text: colors.status.infoText }
    case 'contacted':
      return { bg: colors.status.warningBg, text: colors.status.warningText }
    case 'interview':
      return { bg: colors.status.orangeBg, text: colors.status.orangeText }
    case 'recruited':
      return { bg: colors.status.successBg, text: colors.status.successText }
    default:
      return { bg: colors.light.muted, text: colors.text.muted }
  }
}

function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `il y a ${days}j`
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}

export function CoachProspectTable({ prospects, onStatusChanged }: Props) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [updatingId, setUpdatingId]         = useState<string | null>(null)

  async function handleStatusChange(id: string, newStatus: CoachProspectStatus) {
    setUpdatingId(id)
    try {
      await updateCoachProspectStatus(id, newStatus)
      onStatusChanged()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CoachProspectTable] status update error:', err)
    } finally {
      setUpdatingId(null)
      setOpenDropdownId(null)
    }
  }

  if (prospects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AureakText variant="body" style={styles.emptyText}>
          Aucun prospect entraîneur pour le moment. Ajoutez votre premier prospect !
        </AureakText>
      </View>
    )
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.cell, styles.cellName]}><AureakText style={styles.headerText}>NOM</AureakText></View>
          <View style={[styles.cell, styles.cellSource]}><AureakText style={styles.headerText}>SOURCE</AureakText></View>
          <View style={[styles.cell, styles.cellDiplomas]}><AureakText style={styles.headerText}>DIPLOMES</AureakText></View>
          <View style={[styles.cell, styles.cellExp]}><AureakText style={styles.headerText}>EXP.</AureakText></View>
          <View style={[styles.cell, styles.cellStatus]}><AureakText style={styles.headerText}>STATUT</AureakText></View>
          <View style={[styles.cell, styles.cellManager]}><AureakText style={styles.headerText}>MANAGER</AureakText></View>
          <View style={[styles.cell, styles.cellAction]}><AureakText style={styles.headerText}>DERNIERE MAJ</AureakText></View>
        </View>

        {/* Data rows */}
        {prospects.map(p => {
          const badgeColors = statusBadgeColors(p.status)
          const isOpen = openDropdownId === p.id
          return (
            <View key={p.id} style={styles.dataRow}>
              <View style={[styles.cell, styles.cellName]}>
                <AureakText style={styles.cellText} numberOfLines={1}>{p.name}</AureakText>
              </View>
              <View style={[styles.cell, styles.cellSource]}>
                <AureakText style={styles.cellTextMuted} numberOfLines={1}>{p.source ?? '--'}</AureakText>
              </View>
              <View style={[styles.cell, styles.cellDiplomas]}>
                <AureakText style={styles.cellTextMuted} numberOfLines={1}>
                  {p.diplomas.length > 0 ? p.diplomas.join(', ') : '--'}
                </AureakText>
              </View>
              <View style={[styles.cell, styles.cellExp]}>
                <AureakText style={styles.cellTextMuted}>
                  {p.experienceYears != null ? `${p.experienceYears} an${p.experienceYears > 1 ? 's' : ''}` : '--'}
                </AureakText>
              </View>
              <View style={[styles.cell, styles.cellStatus, { position: 'relative', zIndex: isOpen ? 100 : 1 }]}>
                <Pressable
                  style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}
                  onPress={() => setOpenDropdownId(isOpen ? null : p.id)}
                  disabled={updatingId === p.id}
                >
                  <AureakText style={[styles.statusBadgeText, { color: badgeColors.text }] as never}>
                    {updatingId === p.id ? '...' : COACH_PROSPECT_STATUS_LABELS[p.status]}
                  </AureakText>
                  <AureakText style={[styles.dropdownArrow, { color: badgeColors.text }] as never}>
                    {isOpen ? '▲' : '▼'}
                  </AureakText>
                </Pressable>
                {isOpen && (
                  <View style={styles.dropdown as object}>
                    {COACH_PROSPECT_STATUSES.filter(s => s !== p.status).map(s => {
                      const sColors = statusBadgeColors(s)
                      return (
                        <Pressable
                          key={s}
                          style={styles.dropdownItem}
                          onPress={() => handleStatusChange(p.id, s)}
                        >
                          <View style={[styles.dropdownDot, { backgroundColor: sColors.text }]} />
                          <AureakText style={styles.dropdownItemText}>
                            {COACH_PROSPECT_STATUS_LABELS[s]}
                          </AureakText>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
              </View>
              <View style={[styles.cell, styles.cellManager]}>
                <AureakText style={p.managerDisplayName ? styles.cellTextMuted : styles.cellTextMuted} numberOfLines={1}>
                  {p.managerDisplayName ?? '--'}
                </AureakText>
              </View>
              <View style={[styles.cell, styles.cellAction]}>
                <AureakText style={styles.cellTextMuted}>{formatRelativeDate(p.updatedAt)}</AureakText>
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  table: {
    minWidth: 900,
  },
  headerRow: {
    flexDirection    : 'row',
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingVertical  : space.sm,
    paddingHorizontal: space.sm,
  },
  headerText: {
    fontSize     : 10,
    fontFamily   : fonts.display,
    fontWeight   : '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color        : colors.text.muted,
  },
  dataRow: {
    flexDirection    : 'row',
    backgroundColor  : colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingVertical  : space.sm,
    paddingHorizontal: space.sm,
    alignItems       : 'center',
  },
  cell: {
    paddingHorizontal: space.xs,
    justifyContent   : 'center',
  },
  cellName     : { width: 180 },
  cellSource   : { width: 130 },
  cellDiplomas : { width: 160 },
  cellExp      : { width: 70 },
  cellStatus   : { width: 150 },
  cellManager  : { width: 140 },
  cellAction   : { width: 120 },
  cellText: {
    fontSize  : 13,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  cellTextMuted: {
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  statusBadge: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 4,
    paddingHorizontal: 10,
    paddingVertical  : 4,
    borderRadius     : 12,
    alignSelf        : 'flex-start',
  },
  statusBadgeText: {
    fontSize  : 11,
    fontFamily: fonts.body,
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 8,
  },
  dropdown: {
    position       : 'absolute',
    top            : 32,
    left           : 0,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    zIndex         : 200,
    minWidth       : 140,
    boxShadow      : '0 4px 12px rgba(0,0,0,0.12)',
  },
  dropdownItem: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 8,
    paddingVertical  : 8,
    paddingHorizontal: 12,
  },
  dropdownDot: {
    width       : 8,
    height      : 8,
    borderRadius: 4,
  },
  dropdownItemText: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.dark,
  },
  emptyContainer: {
    padding   : space.xl,
    alignItems: 'center',
  },
  emptyText: {
    color    : colors.text.muted,
    textAlign: 'center',
  },
})
