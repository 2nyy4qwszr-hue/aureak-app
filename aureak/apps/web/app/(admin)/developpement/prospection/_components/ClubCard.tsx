// Epic 85 — Story 85.3 — Card club avec badge statut commercial
import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, transitions } from '@aureak/theme'
import type { ClubDirectoryEntry } from '@aureak/types'

export type ClubCommercialStatus = 'partenaire' | 'en_cours' | 'pas_de_suite' | 'pas_contacte'

interface ClubCardProps {
  club  : ClubDirectoryEntry
  status: ClubCommercialStatus
  contactCount: number
}

const STATUS_CONFIG: Record<ClubCommercialStatus, { label: string; bg: string; text: string }> = {
  partenaire   : { label: 'Partenaire',    bg: colors.border.goldBg ?? '#FDF6E3', text: colors.accent.gold },
  en_cours     : { label: 'En cours',      bg: '#FEF3C7',                         text: '#D97706' },
  pas_de_suite : { label: 'Pas de suite',  bg: '#FEE2E2',                         text: '#DC2626' },
  pas_contacte : { label: 'Pas contacté',  bg: colors.light.hover ?? '#F5F5F5',   text: colors.text.muted },
}

export function ClubCard({ club, status, contactCount }: ClubCardProps) {
  const router = useRouter()
  const cfg    = STATUS_CONFIG[status]
  const isPartner = status === 'partenaire'

  const handlePress = () => {
    if (isPartner) return
    router.push(`/developpement/prospection/${club.id}` as never)
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isPartner}
      style={({ pressed }) => [
        styles.card,
        isPartner && styles.cardDisabled,
        pressed && !isPartner && styles.cardPressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <AureakText variant="h3" style={styles.clubName} numberOfLines={1}>
            {club.nom}
          </AureakText>
          {club.ville && (
            <AureakText variant="caption" style={styles.ville}>{club.ville}</AureakText>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <AureakText variant="caption" style={{ color: cfg.text, fontWeight: '600' } as never}>
            {cfg.label}
          </AureakText>
        </View>
      </View>

      {contactCount > 0 && (
        <AureakText variant="caption" style={styles.contactCount}>
          {contactCount} contact{contactCount > 1 ? 's' : ''} logué{contactCount > 1 ? 's' : ''}
        </AureakText>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    // @ts-ignore — web only
    boxShadow      : shadows.sm,
    // @ts-ignore — web only
    transition     : `box-shadow ${transitions.fast}, opacity ${transitions.fast}`,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardPressed: {
    // @ts-ignore — web only
    boxShadow: shadows.md,
  },
  header: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'flex-start',
    gap           : space.sm,
  },
  nameRow: {
    flex: 1,
  },
  clubName: {
    color: colors.text.dark,
  },
  ville: {
    color    : colors.text.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical  : 3,
    borderRadius     : radius.xs,
  },
  contactCount: {
    color    : colors.text.muted,
    marginTop: space.sm,
  },
})
