// Story 55-8 — Tile "Joueur de la semaine" avec confetti animation
// Composant React Native Web — utilise les tokens @aureak/theme
// localStorage uniquement dans useEffect pour éviter les erreurs SSR.

import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Pressable, Image, Animated } from 'react-native'
import { colors, space, shadows, radius } from '@aureak/theme'
import { AureakText } from './components/Text'
import type { PlayerOfWeek } from '@aureak/types'

export interface PlayerOfWeekTileProps {
  player     : PlayerOfWeek
  onPress?   : () => void
}

const LOCAL_KEY = 'aureak_player_of_week_seen'

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [colors.accent.gold, '#FFFFFF', '#10B981', '#C1AC5C', '#FFE566']
const PARTICLE_COUNT  = 20

interface Particle {
  id       : number
  x        : number
  animY    : Animated.Value
  animX    : Animated.Value
  opacity  : Animated.Value
  color    : string
  size     : number
  delay    : number
}

function ConfettiLayer() {
  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id     : i,
      x      : Math.random() * 100,                                       // % horizontal
      animY  : new Animated.Value(-20),
      animX  : new Animated.Value(0),
      opacity: new Animated.Value(1),
      color  : CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      size   : 5 + Math.random() * 5,
      delay  : Math.random() * 600,
    }))
  ).current

  useEffect(() => {
    const anims = particles.map(p =>
      Animated.delay(p.delay).start.length
        ? Animated.sequence([
            Animated.delay(p.delay),
            Animated.parallel([
              Animated.timing(p.animY, {
                toValue        : 220,
                duration       : 1200,
                useNativeDriver: true,
              }),
              Animated.timing(p.animX, {
                toValue        : (Math.random() - 0.5) * 60,
                duration       : 1200,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
                Animated.timing(p.opacity, { toValue: 0, duration: 1100, useNativeDriver: true }),
              ]),
            ]),
          ])
        : Animated.delay(0)
    )
    Animated.parallel(
      particles.map(p =>
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.animY, { toValue: 220, duration: 1500, useNativeDriver: true }),
            Animated.timing(p.animX, { toValue: (Math.random() - 0.5) * 60, duration: 1500, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
              Animated.timing(p.opacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
            ]),
          ]),
        ])
      )
    ).start()
    return () => {
      particles.forEach(p => {
        p.animY.stopAnimation()
        p.animX.stopAnimation()
        p.opacity.stopAnimation()
      })
    }
  }, [])

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map(p => (
        <Animated.View
          key={p.id}
          style={{
            position       : 'absolute',
            top            : 0,
            left           : `${p.x}%` as never,
            width          : p.size,
            height         : p.size,
            borderRadius   : p.size / 2,
            backgroundColor: p.color,
            opacity        : p.opacity,
            transform      : [{ translateY: p.animY }, { translateX: p.animX }],
          }}
        />
      ))}
    </View>
  )
}

// ── Score display ─────────────────────────────────────────────────────────────

function ScoreDisplay({ score }: { score: number }) {
  const [scale] = useState(new Animated.Value(0.7))
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }).start()
  }, [])

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
      <AureakText style={s.score as never}>{score.toFixed(1)}</AureakText>
      <View style={s.scoreBadge}>
        <AureakText style={s.scoreBadgeText as never}>Meilleure note semaine</AureakText>
      </View>
    </Animated.View>
  )
}

// ── Tile principale ───────────────────────────────────────────────────────────

export function PlayerOfWeekTile({ player, onPress }: PlayerOfWeekTileProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Accès localStorage uniquement côté client (éviter SSR errors)
    if (typeof localStorage === 'undefined') return
    const lastSeenId = localStorage.getItem(LOCAL_KEY)
    if (lastSeenId !== player.childId) {
      setShowConfetti(true)
      localStorage.setItem(LOCAL_KEY, player.childId)
    }
  }, [player.childId])

  const initials = player.displayName
    .split(/\s+/).slice(0, 2)
    .map(w => w.charAt(0).toUpperCase()).join('')

  const dateLabel = (() => {
    try {
      return new Date(player.sessionDate).toLocaleDateString('fr-BE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    } catch { return player.sessionDate }
  })()

  return (
    <Pressable
      style={({ pressed }) => [s.container, pressed && { opacity: 0.9 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Joueur de la semaine : ${player.displayName}`}
    >
      {/* Confetti */}
      {showConfetti && <ConfettiLayer />}

      {/* Titre */}
      <AureakText style={s.title as never}>Joueur de la semaine</AureakText>

      {/* Photo */}
      <View style={s.photoWrapper}>
        {player.photoUrl ? (
          <Image
            source={{ uri: player.photoUrl }}
            style={s.photo}
            resizeMode="cover"
            accessibilityLabel={player.displayName}
          />
        ) : (
          <View style={s.photoFallback}>
            <AureakText style={s.initials as never}>{initials}</AureakText>
          </View>
        )}
        {/* Couronne */}
        <AureakText style={s.crown as never}>👑</AureakText>
      </View>

      {/* Nom */}
      <AureakText style={s.name as never} numberOfLines={1}>{player.displayName}</AureakText>

      {/* Score */}
      <ScoreDisplay score={player.score} />

      {/* Séance + date */}
      {player.sessionName && (
        <AureakText style={s.sessionMeta as never} numberOfLines={1}>
          {player.sessionName}
        </AureakText>
      )}
      <AureakText style={s.dateMeta as never}>{dateLabel}</AureakText>
    </Pressable>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#2A2006',
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '80',
    padding        : space.lg,
    alignItems     : 'center' as never,
    gap            : space.sm,
    overflow       : 'hidden' as never,
    boxShadow      : shadows.gold,
  } as never,
  title: {
    fontSize    : 11,
    color       : colors.accent.gold,
    fontWeight  : '700' as never,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as never,
  },
  photoWrapper: {
    position     : 'relative' as never,
    marginVertical: space.sm,
  },
  photo: {
    width       : 100,
    height      : 100,
    borderRadius: 50,
    borderWidth : 2,
    borderColor : colors.accent.gold,
  },
  photoFallback: {
    width          : 100,
    height         : 100,
    borderRadius   : 50,
    backgroundColor: colors.accent.gold + '30',
    borderWidth    : 2,
    borderColor    : colors.accent.gold,
    alignItems     : 'center' as never,
    justifyContent : 'center' as never,
  },
  initials: {
    color     : colors.accent.gold,
    fontSize  : 28,
    fontWeight: '700' as never,
  },
  crown: {
    position : 'absolute' as never,
    top      : -10,
    right    : -10,
    fontSize : 22,
  },
  name: {
    fontSize  : 16,
    fontWeight: '700' as never,
    color     : '#FFFFFF',
    letterSpacing: 0.3,
  },
  score: {
    fontSize  : 52,
    fontWeight: '900' as never,
    color     : colors.accent.gold,
    lineHeight: 56,
  },
  scoreBadge: {
    backgroundColor: colors.accent.gold + '20',
    borderRadius   : 12,
    paddingHorizontal: space.md,
    paddingVertical  : 3,
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '50',
  },
  scoreBadgeText: {
    fontSize  : 9,
    color     : colors.accent.gold,
    fontWeight: '600' as never,
    letterSpacing: 0.5,
  },
  sessionMeta: {
    fontSize: 11,
    color   : '#AAAAAA',
  },
  dateMeta: {
    fontSize: 10,
    color   : '#777777',
  },
})
