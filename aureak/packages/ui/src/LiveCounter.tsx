// Story 60.8 — Composant LiveCounter — Affichage temps réel séances en cours
// Composant présentationnel pur — zéro Supabase direct
// RÈGLE : styles via tokens @aureak/theme uniquement

import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius, shadows } from '@aureak/theme'

// ── CSS animations (constantes statiques — pas de contenu utilisateur)  ────────

const LIVE_COUNTER_CSS = `
  @keyframes live-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes counter-flip {
    0%   { transform: translateY(-8px); opacity: 0; }
    100% { transform: translateY(0);    opacity: 1; }
  }
  .live-dot-pulse    { animation: live-pulse 1.5s ease-in-out infinite; color: #4CAF50; }
  .counter-flip-anim { animation: counter-flip 0.2s ease-out; }
`

// ── Props ─────────────────────────────────────────────────────────────────────

export interface LiveCounterProps {
  sessionCount: number
  presentCount: number
  totalCount  : number
  isLive?     : boolean
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function LiveCounter({
  sessionCount,
  presentCount,
  totalCount,
  isLive = true,
}: LiveCounterProps) {
  // Animation flip sur changement de valeur (AC4)
  const [flipping, setFlipping] = useState(false)
  const prevPresent = useRef(presentCount)

  useEffect(() => {
    if (presentCount !== prevPresent.current) {
      setFlipping(true)
      prevPresent.current = presentCount
      const t = setTimeout(() => setFlipping(false), 220)
      return () => clearTimeout(t)
    }
  }, [presentCount])

  return (
    <View style={s.container}>
      {/* Style CSS pour animation pulse web — contenu statique uniquement */}
      <style>{LIVE_COUNTER_CSS}</style>

      {/* Badge LIVE / polling */}
      <View style={s.headerRow}>
        <Text style={s.title}>Séances en cours</Text>
        {isLive ? (
          <View style={s.liveBadge}>
            <span className="live-dot-pulse" aria-hidden="true">●</span>
            <Text style={s.liveText}>LIVE</Text>
          </View>
        ) : (
          <View style={s.pollingBadge}>
            <Text style={s.pollingText}>sync en 30s</Text>
          </View>
        )}
      </View>

      {/* Compteurs */}
      <View style={s.countersRow}>
        {/* Séances */}
        <View style={s.counter}>
          <Text style={s.counterValue}>{sessionCount}</Text>
          <Text style={s.counterLabel}>séance{sessionCount !== 1 ? 's' : ''}</Text>
        </View>

        <View style={s.divider} />

        {/* Présents / inscrits */}
        <View style={s.counter}>
          <View style={s.presentRow}>
            <span className={flipping ? 'counter-flip-anim' : undefined} style={{ display: 'inline-block' }}>
              <Text style={s.presentValue}>{presentCount}</Text>
            </span>
            <Text style={s.separatorSlash}> / </Text>
            <Text style={s.totalValue}>{totalCount}</Text>
          </View>
          <Text style={s.counterLabel}>présents / inscrits</Text>
        </View>
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius   : radius.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.present,
    paddingVertical : 14,
    paddingHorizontal: 20,
    boxShadow      : shadows.sm,
    marginBottom   : 16,
  } as never,

  headerRow: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
    marginBottom   : 10,
  },
  title: {
    fontSize  : 13,
    fontWeight: '700',
    color     : colors.text.primary,
    fontFamily: 'Montserrat',
    textTransform: 'uppercase' as never,
    letterSpacing: 0.5,
  },

  // Badge LIVE
  liveBadge: {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : 4,
    backgroundColor: 'rgba(76,175,80,0.15)',
    paddingVertical : 3,
    paddingHorizontal: 10,
    borderRadius   : radius.badge,
    borderWidth    : 1,
    borderColor    : colors.status.present,
  },
  liveText: {
    fontSize  : 10,
    fontWeight: '700',
    color     : colors.status.present,
    letterSpacing: 1,
  },

  // Badge polling
  pollingBadge: {
    backgroundColor: colors.background.elevated,
    paddingVertical : 3,
    paddingHorizontal: 10,
    borderRadius   : radius.badge,
  },
  pollingText: {
    fontSize: 10,
    color   : colors.text.muted,
  },

  // Compteurs
  countersRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 20,
  },
  counter: { alignItems: 'center' },
  counterValue: {
    fontSize  : 28,
    fontWeight: '800',
    color     : colors.accent.gold,
    fontFamily: 'Montserrat',
    lineHeight: 32,
  },
  counterLabel: {
    fontSize : 11,
    color    : colors.text.secondary,
    marginTop: 2,
  },

  divider: {
    width          : 1,
    height         : 40,
    backgroundColor: colors.border.dark,
    marginHorizontal: 4,
  },

  // Compteur présents
  presentRow: {
    flexDirection: 'row',
    alignItems   : 'baseline',
    gap          : 2,
  },
  presentValue: {
    fontSize  : 28,
    fontWeight: '800',
    color     : colors.status.present,
    fontFamily: 'Montserrat',
    lineHeight: 32,
  },
  separatorSlash: {
    fontSize : 20,
    color    : colors.text.secondary,
  },
  totalValue: {
    fontSize  : 20,
    fontWeight: '600',
    color     : colors.text.secondary,
    fontFamily: 'Montserrat',
  },
})
