// Story 89.3 — Composant champ avec masquage RGPD conditionnel.
// Affiche la valeur telle qu'elle (claire ou masquée selon le serveur), avec un badge
// "Masqué (RGPD)" + bouton "Demander l'accès" si masked=true.
'use client'

import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

type Props = {
  value            : string | null
  masked           : boolean
  hasPendingRequest: boolean
  onRequestAccess ?: () => void
}

export function MaskedField({ value, masked, hasPendingRequest, onRequestAccess }: Props) {
  if (value === null || value === '') {
    return <AureakText style={styles.empty as never}>—</AureakText>
  }

  const canRequest = masked && !hasPendingRequest && typeof onRequestAccess === 'function'

  return (
    <View style={styles.row}>
      <AureakText style={[styles.value, masked && styles.valueMasked] as never}>
        {value}
      </AureakText>

      {masked && (
        <View style={styles.badge}>
          <AureakText style={styles.badgeText as never}>Masqué (RGPD)</AureakText>
        </View>
      )}

      {masked && onRequestAccess && (
        <Pressable
          onPress={canRequest ? onRequestAccess : undefined}
          disabled={!canRequest}
          style={[styles.btn, !canRequest && styles.btnDisabled] as never}
          accessibilityLabel={hasPendingRequest ? 'Demande d\'accès en cours' : 'Demander l\'accès aux coordonnées'}
        >
          <AureakText style={styles.btnText as never}>
            {hasPendingRequest ? 'Demande en cours' : 'Demander l\'accès'}
          </AureakText>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    flexWrap     : 'wrap',
  },
  value: {
    color   : colors.text.dark,
    fontSize: 14,
  },
  valueMasked: {
    color     : colors.text.muted,
    fontFamily: 'monospace',
  },
  empty: {
    color   : colors.text.muted,
    fontSize: 14,
  },
  badge: {
    backgroundColor  : colors.status.amberBg,
    paddingHorizontal: space.xs,
    paddingVertical  : 2,
    borderRadius     : radius.badge,
  },
  badgeText: {
    fontSize  : 10,
    fontWeight: '700',
    color     : colors.status.amberText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  btn: {
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
  btnDisabled: {
    opacity    : 0.5,
    borderColor: colors.border.light,
  },
  btnText: {
    fontSize  : 12,
    fontWeight: '700',
    color     : colors.accent.gold,
  },
})
