'use client'
// Story 88.2 — Tableau CRM prospects avec 7 colonnes
import React from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { PROSPECT_STATUS_LABELS } from '@aureak/types'
import type { ClubProspectListItem, ProspectStatus } from '@aureak/types'

type Props = {
  prospects: ClubProspectListItem[]
}

/** Couleur badge par statut pipeline */
function statusBadgeColors(status: ProspectStatus): { bg: string; text: string } {
  switch (status) {
    case 'premier_contact':
      return { bg: colors.status.infoBg, text: colors.status.infoText }
    case 'mapping_orga':
      return { bg: colors.status.warningBg, text: colors.status.warningText }
    case 'decisionnaire_identifie':
      return { bg: colors.status.orangeBg, text: colors.status.orangeText }
    case 'rdv_qualifie':
      return { bg: colors.status.successBg, text: colors.status.successText }
    case 'closing':
      return { bg: colors.border.goldBg, text: colors.accent.gold }
    case 'converti':
      return { bg: colors.status.successBg, text: colors.status.successText }
    case 'perdu':
      return { bg: colors.status.errorBg, text: colors.status.errorText }
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

export function ProspectTable({ prospects }: Props) {
  const router = useRouter()

  if (prospects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AureakText variant="body" style={styles.emptyText}>
          Aucun prospect pour le moment. Ajoutez votre premier club !
        </AureakText>
      </View>
    )
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.cell, styles.cellClub]}><AureakText style={styles.headerText}>CLUB</AureakText></View>
          <View style={[styles.cell, styles.cellCity]}><AureakText style={styles.headerText}>VILLE</AureakText></View>
          <View style={[styles.cell, styles.cellStatus]}><AureakText style={styles.headerText}>STATUT</AureakText></View>
          <View style={[styles.cell, styles.cellContacts]}><AureakText style={styles.headerText}>CONTACTS</AureakText></View>
          <View style={[styles.cell, styles.cellDecis]}><AureakText style={styles.headerText}>DECISIONNAIRE</AureakText></View>
          <View style={[styles.cell, styles.cellCommercial]}><AureakText style={styles.headerText}>COMMERCIAL</AureakText></View>
          <View style={[styles.cell, styles.cellAction]}><AureakText style={styles.headerText}>DERNIERE ACTION</AureakText></View>
        </View>

        {/* Data rows */}
        {prospects.map(p => {
          const badgeColors = statusBadgeColors(p.status)
          return (
            <Pressable
              key={p.id}
              style={({ pressed }) => [styles.dataRow, pressed && styles.dataRowPressed]}
              onPress={() => router.push(`/developpement/prospection/clubs/${p.id}` as never)}
            >
              <View style={[styles.cell, styles.cellClub]}>
                <AureakText style={styles.cellText} numberOfLines={1}>{p.clubName}</AureakText>
              </View>
              <View style={[styles.cell, styles.cellCity]}>
                <AureakText style={styles.cellTextMuted} numberOfLines={1}>{p.city}</AureakText>
              </View>
              <View style={[styles.cell, styles.cellStatus]}>
                <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                  <AureakText style={[styles.statusBadgeText, { color: badgeColors.text }] as never}>
                    {PROSPECT_STATUS_LABELS[p.status]}
                  </AureakText>
                </View>
              </View>
              <View style={[styles.cell, styles.cellContacts]}>
                <AureakText style={styles.cellText}>{p.contactsCount}</AureakText>
              </View>
              <View style={[styles.cell, styles.cellDecis]}>
                <AureakText style={p.decisionnaireNom ? styles.cellText : styles.cellTextMuted} numberOfLines={1}>
                  {p.decisionnaireNom ?? '--'}
                </AureakText>
              </View>
              <View style={[styles.cell, styles.cellCommercial]}>
                <AureakText style={styles.cellTextMuted} numberOfLines={1}>{p.commercialDisplayName}</AureakText>
              </View>
              <View style={[styles.cell, styles.cellAction]}>
                <AureakText style={styles.cellTextMuted}>{formatRelativeDate(p.updatedAt)}</AureakText>
              </View>
            </Pressable>
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
    flexDirection  : 'row',
    backgroundColor: colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    paddingVertical: space.sm,
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
  dataRowPressed: {
    backgroundColor: colors.light.hover,
  },
  cell: {
    paddingHorizontal: space.xs,
    justifyContent   : 'center',
  },
  cellClub      : { width: 180 },
  cellCity      : { width: 120 },
  cellStatus    : { width: 160 },
  cellContacts  : { width: 80 },
  cellDecis     : { width: 160 },
  cellCommercial: { width: 140 },
  cellAction    : { width: 120 },
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
  emptyContainer: {
    padding   : space.xl,
    alignItems: 'center',
  },
  emptyText: {
    color    : colors.text.muted,
    textAlign: 'center',
  },
})
