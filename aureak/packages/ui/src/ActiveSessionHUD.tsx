// Story 61.2 — ActiveSessionHUD
// Barre HUD permanente affichée pendant une séance active sur mobile (< 768px)
// RÈGLE : zéro accès Supabase direct — tout via le contexte
// RÈGLE : clearInterval OBLIGATOIRE dans le cleanup
import React, { useEffect, useRef, useState } from 'react'
import { Pressable, Text as RNText, View } from 'react-native'
import { colors, fonts } from '@aureak/theme'
import type { ActiveSessionInfo } from '@aureak/types'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ActiveSessionHUDProps {
  session     : ActiveSessionInfo
  presentCount: number
  totalCount  : number
  onPress     : () => void
  /** Afficher uniquement sur mobile (< 768px). Default: true. */
  isMobile?   : boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatElapsed(startedAt: Date): string {
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000) // secondes
  const minutes = Math.floor(elapsed / 60)
  const hours   = Math.floor(minutes / 60)
  if (hours > 0) {
    const mm = String(minutes % 60).padStart(2, '0')
    return `${hours}h${mm}`
  }
  const ss = String(elapsed % 60).padStart(2, '0')
  return `${minutes}:${ss}`
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ActiveSessionHUD({
  session,
  presentCount,
  totalCount,
  onPress,
  isMobile = true,
}: ActiveSessionHUDProps) {
  const startedAt = useRef(new Date(session.scheduledAt)).current
  const [elapsed, setElapsed] = useState(() => formatElapsed(startedAt))

  // Chronomètre mis à jour toutes les 30s (AC5)
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(formatElapsed(startedAt))
    }, 30_000)
    return () => clearInterval(id) // BLOCKER cleanup
  }, [startedAt])

  // AC7 — uniquement sur mobile
  if (!isMobile) return null

  // Couleur compteur selon taux de présence (AC6)
  const rate         = totalCount > 0 ? (presentCount / totalCount) * 100 : 0
  const counterColor = rate >= 75
    ? colors.status.success
    : rate >= 50
      ? colors.accent.gold
      : colors.accent.red

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Séance en cours : ${session.groupName}`}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection : 'row',
            alignItems    : 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            height        : 44,
            backgroundColor: colors.dark.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.dark.border,
            opacity       : pressed ? 0.85 : 1,
          }}
        >
          {/* Indicateur "EN COURS" pulsant (AC6) */}
          <PulseIndicator />

          {/* Nom du groupe */}
          <RNText
            numberOfLines={1}
            style={{
              flex        : 1,
              marginLeft  : 8,
              fontSize    : 12,
              fontWeight  : '600',
              color       : colors.dark.text,
              fontFamily  : fonts.body,
            }}
          >
            {session.groupName}
          </RNText>

          {/* Compteur présents / inscrits */}
          <RNText
            style={{
              marginRight: 10,
              fontSize   : 12,
              fontWeight : '700',
              color      : counterColor,
            }}
          >
            {presentCount}/{totalCount}
          </RNText>

          {/* Chronomètre (AC5) */}
          <RNText
            style={{
              fontSize  : 11,
              color     : colors.dark.textMuted,
            }}
          >
            {elapsed}
          </RNText>
        </View>
      )}
    </Pressable>
  )
}

// ── PulseIndicator ────────────────────────────────────────────────────────────

function PulseIndicator() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setVisible(v => !v), 800)
    return () => clearInterval(id)
  }, [])

  return (
    <View
      style={{
        width          : 7,
        height         : 7,
        borderRadius   : 3.5,
        backgroundColor: visible ? colors.status.absent : 'transparent',
        flexShrink     : 0,
      }}
    />
  )
}
