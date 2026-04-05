// Story 62.2 — Empty states illustrés SVG gold/blanc
// Composant web (SVG inline + CSS animation float)
// React Native : fallback vers texte simple (SVG non supporté natif sans lib)
'use client'
import React from 'react'
import { Platform, View, StyleSheet } from 'react-native'
import { colors, space, radius } from '@aureak/theme'

// ─────────────────────────────────────────────────────────────────────────────
// Types & defaults
// ─────────────────────────────────────────────────────────────────────────────

export type EmptyStateVariant =
  | 'no-sessions'
  | 'no-players'
  | 'no-stages'
  | 'no-clubs'
  | 'no-analytics'
  | 'no-messages'

export interface EmptyStateIllustratedProps {
  variant    : EmptyStateVariant
  title?     : string
  subtitle?  : string
  ctaLabel?  : string
  onCta?     : () => void
}

const EMPTY_STATE_DEFAULTS: Record<EmptyStateVariant, { title: string; subtitle: string }> = {
  'no-sessions' : { title: 'Aucune séance pour aujourd\'hui',     subtitle: 'Créez votre première séance terrain' },
  'no-players'  : { title: 'Aucun joueur dans ce groupe',         subtitle: 'Ajoutez des gardiens à votre groupe' },
  'no-stages'   : { title: 'Aucun stage planifié',                subtitle: 'Organisez votre prochain stage' },
  'no-clubs'    : { title: 'Aucun club dans l\'annuaire',         subtitle: 'Ajoutez des clubs partenaires' },
  'no-analytics': { title: 'Pas encore de données analytics',     subtitle: 'Les statistiques apparaîtront après vos premières séances' },
  'no-messages' : { title: 'Aucun message',                       subtitle: 'La messagerie est vide pour le moment' },
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG illustrations inline (stroke goldLight, fill none, 120×120)
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = colors.accent.goldLight // D6C98E

function NoSessionsSVG() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none"
         stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Terrain : rectangle */}
      <rect x="10" y="30" width="100" height="60" rx="4" />
      {/* Ligne médiane */}
      <line x1="60" y1="30" x2="60" y2="90" />
      {/* Cercle central */}
      <circle cx="60" cy="60" r="12" />
      {/* Cage gauche */}
      <rect x="10" y="46" width="10" height="28" rx="2" />
      {/* Cage droite */}
      <rect x="100" y="46" width="10" height="28" rx="2" />
      {/* Ballon */}
      <circle cx="60" cy="60" r="5" />
      <line x1="60" y1="55" x2="55" y2="62" />
      <line x1="60" y1="55" x2="65" y2="62" />
    </svg>
  )
}

function NoPlayersSVG() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none"
         stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Cages */}
      <rect x="15" y="35" width="90" height="55" rx="4" />
      <rect x="15" y="50" width="12" height="25" rx="2" />
      <rect x="93" y="50" width="12" height="25" rx="2" />
      {/* Silhouette gardien */}
      <circle cx="60" cy="52" r="8" />
      <path d="M45 80 Q60 70 75 80" />
      <line x1="60" y1="60" x2="60" y2="75" />
      <line x1="60" y1="65" x2="50" y2="72" />
      <line x1="60" y1="65" x2="70" y2="72" />
    </svg>
  )
}

function NoStagesSVG() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none"
         stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Calendrier */}
      <rect x="20" y="30" width="80" height="65" rx="6" />
      <line x1="20" y1="48" x2="100" y2="48" />
      {/* Anneaux */}
      <line x1="38" y1="22" x2="38" y2="38" />
      <line x1="60" y1="22" x2="60" y2="38" />
      <line x1="82" y1="22" x2="82" y2="38" />
      {/* Étoile centrale */}
      <polygon points="60,55 63,65 73,65 65,71 68,81 60,75 52,81 55,71 47,65 57,65"
               strokeWidth="1.2" />
    </svg>
  )
}

function NoClubsSVG() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none"
         stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Écusson */}
      <path d="M60 15 L90 28 L90 65 Q90 88 60 100 Q30 88 30 65 L30 28 Z" />
      {/* Point d'interrogation */}
      <text x="60" y="75" textAnchor="middle"
            fontFamily="Montserrat,sans-serif" fontWeight="700"
            fontSize="28" fill={GOLD} stroke="none">?</text>
    </svg>
  )
}

function NoAnalyticsSVG() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none"
         stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Axes */}
      <line x1="20" y1="90" x2="100" y2="90" />
      <line x1="20" y1="90" x2="20" y2="20" />
      {/* Bars vides */}
      <rect x="30" y="70" width="14" height="20" rx="2" strokeDasharray="4 2" />
      <rect x="50" y="55" width="14" height="35" rx="2" strokeDasharray="4 2" />
      <rect x="70" y="40" width="14" height="50" rx="2" strokeDasharray="4 2" />
      {/* Loupe */}
      <circle cx="82" cy="32" r="12" />
      <line x1="91" y1="41" x2="100" y2="50" />
    </svg>
  )
}

function NoMessagesSVG() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" fill="none"
         stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Bulle principale */}
      <path d="M20 30 Q20 20 30 20 L90 20 Q100 20 100 30 L100 70 Q100 80 90 80 L50 80 L35 95 L35 80 L30 80 Q20 80 20 70 Z" />
      {/* Lignes vides */}
      <line x1="38" y1="40" x2="82" y2="40" />
      <line x1="38" y1="52" x2="72" y2="52" />
      <line x1="38" y1="64" x2="60" y2="64" />
    </svg>
  )
}

const SVG_MAP: Record<EmptyStateVariant, React.FC> = {
  'no-sessions' : NoSessionsSVG,
  'no-players'  : NoPlayersSVG,
  'no-stages'   : NoStagesSVG,
  'no-clubs'    : NoClubsSVG,
  'no-analytics': NoAnalyticsSVG,
  'no-messages' : NoMessagesSVG,
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS animation float (web uniquement, injecté une seule fois)
// ─────────────────────────────────────────────────────────────────────────────

let cssInjected = false
function injectFloatCSS() {
  if (cssInjected || typeof document === 'undefined') return
  cssInjected = true
  const style = document.createElement('style')
  style.textContent = `
@keyframes aureak-float {
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
}
.aureak-float {
  animation: aureak-float 3s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .aureak-float { animation: none; }
}
`
  document.head.appendChild(style)
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function EmptyStateIllustrated({
  variant,
  title,
  subtitle,
  ctaLabel,
  onCta,
}: EmptyStateIllustratedProps) {
  const defaults = EMPTY_STATE_DEFAULTS[variant]
  const displayTitle    = title    ?? defaults.title
  const displaySubtitle = subtitle ?? defaults.subtitle

  if (Platform.OS === 'web') {
    injectFloatCSS()
    const SvgComp = SVG_MAP[variant]
    return (
      <div style={{
        display       : 'flex',
        flexDirection : 'column',
        alignItems    : 'center',
        justifyContent: 'center',
        padding       : `${space.xl * 2}px ${space.lg}px`,
        gap           : `${space.sm}px`,
        textAlign     : 'center',
      }}>
        <div className="aureak-float">
          <SvgComp />
        </div>
        <p style={{
          margin    : `${space.sm}px 0 0`,
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: '700',
          fontSize  : '16px',
          color     : colors.text.dark,
        }}>
          {displayTitle}
        </p>
        <p style={{
          margin   : '4px 0 0',
          fontFamily: 'Montserrat, sans-serif',
          fontSize : '13px',
          color    : colors.text.muted,
          maxWidth : '280px',
        }}>
          {displaySubtitle}
        </p>
        {ctaLabel && onCta && (
          <button
            onClick={onCta}
            style={{
              marginTop      : `${space.sm}px`,
              paddingLeft    : `${space.lg}px`,
              paddingRight   : `${space.lg}px`,
              paddingTop     : '10px',
              paddingBottom  : '10px',
              borderRadius   : `${radius.button}px`,
              backgroundColor: colors.accent.gold,
              border         : 'none',
              cursor         : 'pointer',
              fontFamily     : 'Montserrat, sans-serif',
              fontWeight     : '700',
              fontSize       : '13px',
              color          : colors.text.dark,
            }}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    )
  }

  // React Native fallback (pas de SVG natif sans lib externe)
  return (
    <View style={rn.container}>
      <View style={rn.iconBox}>
        <RnIcon variant={variant} />
      </View>
      <View style={rn.textBlock}>
        <View>
          <RnText style={rn.title}>{displayTitle}</RnText>
        </View>
        <View>
          <RnText style={rn.subtitle}>{displaySubtitle}</RnText>
        </View>
        {ctaLabel && onCta && (
          <RnPressable onPress={onCta} style={rn.cta}>
            <RnText style={rn.ctaText}>{ctaLabel}</RnText>
          </RnPressable>
        )}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// React Native fallback components (lazy imports pour éviter erreur web)
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RnText     = require('react-native').Text     as React.ComponentType<any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RnPressable = require('react-native').Pressable as React.ComponentType<any>

function RnIcon({ variant }: { variant: EmptyStateVariant }) {
  const icons: Record<EmptyStateVariant, string> = {
    'no-sessions' : '📅',
    'no-players'  : '🧤',
    'no-stages'   : '🏕️',
    'no-clubs'    : '🛡️',
    'no-analytics': '📊',
    'no-messages' : '💬',
  }
  return <RnText style={{ fontSize: 48 }}>{icons[variant]}</RnText>
}

const rn = StyleSheet.create({
  container: {
    alignItems    : 'center',
    justifyContent: 'center',
    paddingVertical: space.xl * 2,
    gap            : space.sm,
  },
  iconBox  : { marginBottom: space.sm },
  textBlock: { alignItems: 'center', gap: space.xs },
  title    : { fontSize: 16, fontWeight: '700', color: colors.text.dark, textAlign: 'center' as never },
  subtitle : { fontSize: 13, color: colors.text.muted, textAlign: 'center' as never, maxWidth: 280 },
  cta      : {
    marginTop       : space.sm,
    paddingHorizontal: space.lg,
    paddingVertical  : 10,
    borderRadius    : radius.button,
    backgroundColor : colors.accent.gold,
  },
  ctaText  : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },
})
