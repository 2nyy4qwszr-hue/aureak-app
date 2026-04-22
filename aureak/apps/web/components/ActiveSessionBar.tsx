// Story 51.2 — Topbar séance active permanente
// Barre dorée 36px affichée au-dessus du contenu si une séance est en cours.
// Props pré-chargées par _layout.tsx (polling 60s).
import React, { useRef, useEffect } from 'react'
import { Animated, Pressable } from 'react-native'
import { XStack, Text } from 'tamagui'
import { useRouter } from 'expo-router'
import { colors } from '@aureak/theme'
import type { ActiveSessionInfo } from '@aureak/types'

type Props = {
  sessions: ActiveSessionInfo[]
}

/** Indicateur vert pulsant (opacity 1→0.4→1 toutes les 1.5s) */
function PulsingDot() {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 750, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [pulse])

  return (
    <Animated.View
      style={{
        width          : 8,
        height         : 8,
        borderRadius   : 4,
        backgroundColor: colors.status.success,
        opacity        : pulse,
        marginRight    : 8,
        flexShrink     : 0,
      }}
    />
  )
}

/**
 * ActiveSessionBar — barre horizontale dorée 36px
 * Visible uniquement si sessions.length > 0.
 * AC7 : non rendu si < 768px (géré par le parent via isMobile guard).
 */
export function ActiveSessionBar({ sessions }: Props) {
  const router = useRouter()

  // AC1 : zéro espace vide si aucune séance active
  if (sessions.length === 0) return null

  const first   = sessions[0]
  const others  = sessions.length - 1
  const hasCount = first.totalCount > 0

  return (
    <XStack
      height={36}
      backgroundColor={(colors.accent.gold + '15') as never}
      borderBottomWidth={1}
      borderBottomColor={colors.border.goldSolid}
      alignItems="center"
      paddingHorizontal={16}
      gap={8}
      style={{ flexShrink: 0 } as never}
    >
      {/* Indicateur vert pulsant */}
      <PulsingDot />

      {/* Label principal */}
      <Text
        fontFamily="$body"
        fontSize={13}
        color={colors.text.dark}
        style={{ flexShrink: 1 } as never}
        numberOfLines={1}
      >
        {'Séance en cours — '}
        <Text fontWeight="700">{first.groupName}</Text>
        {hasCount ? ` · ${first.presentCount}/${first.totalCount} présents` : ''}
      </Text>

      {/* Lien Voir → */}
      <Pressable onPress={() => router.push(('/activites/seances/' + first.sessionId) as never)}>
        <Text
          fontFamily="$body"
          fontSize={12}
          fontWeight="600"
          color={colors.accent.gold}
          style={{ flexShrink: 0 } as never}
        >
          Voir →
        </Text>
      </Pressable>

      {/* AC3 : plusieurs séances simultanées */}
      {others > 0 && (
        <Pressable onPress={() => router.push('/activites/seances' as never)}>
          <Text
            fontFamily="$body"
            fontSize={12}
            color={colors.text.muted}
            style={{ flexShrink: 0 } as never}
          >
            {`(+${others} autre${others > 1 ? 's' : ''})`}
          </Text>
        </Pressable>
      )}
    </XStack>
  )
}
