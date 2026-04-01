// Story 5.6 — Indicateur de synchronisation offline
import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, space } from '@aureak/theme'
import type { SyncStatus } from '@aureak/business-logic'
import { AureakText } from '../Text/Text'

type Props = {
  status   : SyncStatus
  onRetry? : () => void
}

export function SyncStatusBanner({ status, onRetry }: Props) {
  const { pendingCount, failedCount, isSyncing } = status

  if (pendingCount === 0 && failedCount === 0 && !isSyncing) {
    return null // Tout est à jour → rien à afficher
  }

  const isError = failedCount > 0
  const bgColor = isError ? colors.status.absent + '18' : colors.status.attention + '18'
  const txColor = isError ? colors.status.absent         : colors.status.attention
  const brColor = isError ? colors.status.absent         : colors.status.attention

  const message = isSyncing
    ? 'Synchronisation en cours…'
    : isError
      ? `Échec de synchronisation (${failedCount} opération${failedCount > 1 ? 's' : ''}) — Vérifiez votre connexion`
      : `${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente de synchronisation`

  return (
    <View style={[styles.banner, { backgroundColor: bgColor, borderColor: brColor }]}>
      <AureakText variant="caption" style={{ color: txColor, flex: 1 }}>
        {message}
      </AureakText>
      {isError && onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <AureakText variant="caption" style={{ color: txColor, fontWeight: '700' }}>
            Réessayer
          </AureakText>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  banner  : {
    flexDirection: 'row',
    alignItems   : 'center',
    padding      : space.sm,
    borderWidth  : 1,
    borderRadius : 6,
    gap          : space.sm,
  },
  retryBtn: {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
  },
})
