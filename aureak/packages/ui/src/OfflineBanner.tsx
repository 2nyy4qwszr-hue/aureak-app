// Story 61.5 — OfflineBanner
// Banner "Mode hors-ligne" affiché quand isOnline=false
import React from 'react'
import { Platform, View } from 'react-native'
import { Text } from 'tamagui'
import { colors } from '@aureak/theme'

export interface OfflineBannerProps {
  isOnline       : boolean
  cacheTimestamp : Date | null
  isSyncing?     : boolean
  syncResult?    : { succeeded: number; failed: number } | null
}

export function OfflineBanner({ isOnline, cacheTimestamp, isSyncing, syncResult }: OfflineBannerProps) {
  // Sur web, utiliser un div pour le style avancé
  if (Platform.OS === 'web') {
    return <OfflineBannerWeb isOnline={isOnline} cacheTimestamp={cacheTimestamp} isSyncing={isSyncing} syncResult={syncResult} />
  }

  if (isOnline) return null

  return (
    <View style={{
      backgroundColor: '#F59E0B',
      paddingHorizontal: 14,
      paddingVertical  : 8,
      flexDirection    : 'row',
      alignItems       : 'center',
      gap              : 8,
    }}>
      <Text color="#1A1A1A" fontSize={12} fontWeight="700">
        ● Mode hors-ligne
        {cacheTimestamp ? ` — données du ${cacheTimestamp.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}` : ''}
      </Text>
    </View>
  )
}

function OfflineBannerWeb({ isOnline, cacheTimestamp, isSyncing, syncResult }: OfflineBannerProps) {
  if (isOnline && !isSyncing && !syncResult) return null

  if (isSyncing) {
    return (
      <div style={{
        background    : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
        padding       : '6px 14px',
        display       : 'flex',
        alignItems    : 'center',
        gap           : 8,
        fontSize      : 12,
        color         : '#1A1A1A',
        fontFamily    : 'Montserrat, sans-serif',
        fontWeight    : '600',
      }}>
        ⟳ Synchronisation en cours...
      </div>
    )
  }

  if (isOnline && syncResult) {
    if (syncResult.failed > 0) {
      return (
        <div style={{
          background : '#E05252',
          padding    : '6px 14px',
          fontSize   : 12,
          color      : '#fff',
          fontFamily : 'Montserrat, sans-serif',
          fontWeight : '600',
        }}>
          ⚠ {syncResult.failed} action{syncResult.failed > 1 ? 's' : ''} non synchronisée{syncResult.failed > 1 ? 's' : ''}
        </div>
      )
    }
    if (syncResult.succeeded > 0) {
      return (
        <div style={{
          background : '#10B981',
          padding    : '6px 14px',
          fontSize   : 12,
          color      : '#fff',
          fontFamily : 'Montserrat, sans-serif',
          fontWeight : '600',
        }}>
          ✓ Tout est à jour
        </div>
      )
    }
    return null
  }

  if (!isOnline) {
    const timeStr = cacheTimestamp
      ? cacheTimestamp.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
      : null

    return (
      <div style={{
        background  : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
        padding     : '6px 14px',
        display     : 'flex',
        alignItems  : 'center',
        gap         : 8,
        fontSize    : 12,
        color       : '#1A1A1A',
        fontFamily  : 'Montserrat, sans-serif',
        fontWeight  : '600',
      }}>
        <span style={{ color: '#DC2626', fontWeight: '900' }}>●</span>
        Mode hors-ligne{timeStr ? ` — données du ${timeStr}` : ''}
      </div>
    )
  }

  return null
}
