'use client'
// Story 88.3 — Timeline chronologique des actions commerciales sur un prospect
import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import {
  PROSPECT_ACTION_TYPE_LABELS,
  PROSPECT_ACTION_TYPE_ICONS,
} from '@aureak/types'
import type { ProspectAction } from '@aureak/types'

type Props = {
  actions: ProspectAction[]
}

/** Calcule une date relative lisible (il y a X jours / heures / minutes) */
function relativeDate(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return "A l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`

  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH}h`

  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'Hier'
  if (diffD < 30) return `Il y a ${diffD} jours`

  const diffM = Math.floor(diffD / 30)
  if (diffM < 12) return `Il y a ${diffM} mois`

  return `Il y a ${Math.floor(diffM / 12)} an(s)`
}

/** Couleur du dot timeline par type d'action */
function dotColor(actionType: ProspectAction['actionType']): string {
  switch (actionType) {
    case 'premier_contact':        return colors.status.infoText
    case 'relance':                return colors.accent.gold
    case 'identification_contact': return colors.status.successText
    case 'obtention_rdv':          return colors.status.warningText
    case 'presentation':           return colors.status.infoText
    case 'closing':                return colors.status.successText
    case 'note':                   return colors.text.muted
    case 'changement_statut':      return colors.accent.gold
    default:                       return colors.text.muted
  }
}

export function ProspectTimeline({ actions }: Props) {
  if (actions.length === 0) {
    return (
      <AureakText style={styles.emptyText}>
        Aucune action enregistree. Les changements de statut et actions manuelles apparaitront ici.
      </AureakText>
    )
  }

  const content = actions.map((action, idx) => (
    <View key={action.id} style={styles.timelineItem}>
      {/* Ligne verticale */}
      {idx < actions.length - 1 && <View style={styles.verticalLine} />}

      {/* Dot */}
      <View style={[styles.dot, { backgroundColor: dotColor(action.actionType) }]} />

      {/* Contenu */}
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <AureakText style={styles.iconText}>
            {PROSPECT_ACTION_TYPE_ICONS[action.actionType]}
          </AureakText>
          <AureakText style={styles.typeLabel}>
            {PROSPECT_ACTION_TYPE_LABELS[action.actionType]}
          </AureakText>
          <AureakText style={styles.dateText}>
            {relativeDate(action.createdAt)}
          </AureakText>
        </View>

        <AureakText style={styles.performerText}>
          {action.performerDisplayName ?? 'Inconnu'}
        </AureakText>

        {action.description && (
          <AureakText style={styles.descriptionText}>
            {action.description}
          </AureakText>
        )}
      </View>
    </View>
  ))

  // Scroll si > 10 actions
  if (actions.length > 10) {
    return (
      <ScrollView style={styles.scrollContainer} nestedScrollEnabled>
        {content}
      </ScrollView>
    )
  }

  return <View>{content}</View>
}

const styles = StyleSheet.create({
  emptyText: {
    color     : colors.text.muted,
    fontSize  : 13,
    fontFamily: fonts.body,
    fontStyle : 'italic',
  },
  scrollContainer: {
    maxHeight: 500,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingLeft  : space.md,
    marginBottom : space.md,
    position     : 'relative',
  },
  verticalLine: {
    position       : 'absolute',
    left           : space.md + 5,
    top            : 16,
    bottom         : -space.md,
    width          : 2,
    backgroundColor: colors.border.divider,
  },
  dot: {
    width       : 12,
    height      : 12,
    borderRadius: 6,
    marginTop   : 4,
    marginRight : space.sm,
    zIndex      : 1,
  },
  itemContent: {
    flex           : 1,
    paddingBottom  : space.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.xs,
    flexWrap     : 'wrap',
  },
  iconText: {
    fontSize: 14,
  },
  typeLabel: {
    fontSize  : 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  dateText: {
    fontSize  : 11,
    fontFamily: fonts.body,
    color     : colors.text.subtle,
    marginLeft: 'auto',
  },
  performerText: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
    marginTop : 2,
  },
  descriptionText: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.dark,
    marginTop : space.xs,
    fontStyle : 'italic',
  },
})
