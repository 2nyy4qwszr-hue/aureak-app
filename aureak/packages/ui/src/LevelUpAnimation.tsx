// Story 59-2 — Composant LevelUpAnimation
// Overlay plein écran déclenché au level-up : flash doré 0.8s + spring bounce badge.
// Web-first — aucune dépendance externe animation (CSS keyframes pur).
// Storybook-ready : props pures, zéro dépendance Supabase.
//
// Usage minimal :
// ```tsx
// const { level, isLevelUp, clearLevelUp } = useLevelUp(playerXp)
// <LevelUpAnimation visible={isLevelUp} level={level} onDismiss={clearLevelUp} />
// ```

import React, { memo, useEffect, useRef, useCallback } from 'react'
import { gamification, colors, typography } from '@aureak/theme'

// ── Types ─────────────────────────────────────────────────────────────────────

export type LevelTier = keyof typeof gamification.levels

export type LevelUpAnimationProps = {
  /** Tier de niveau atteint ('bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legend') */
  level       : LevelTier
  /** Affiche ou masque l'overlay */
  visible     : boolean
  /** Callback appelé après dismissal (auto après 800ms ou via Escape) */
  onDismiss   : () => void
  /** Active le son de level-up (défaut false) */
  soundEnabled?: boolean
}

// ── CSS keyframes injectés une seule fois ─────────────────────────────────────

const STYLE_ID = 'aureak-levelup-kf'

function injectKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes au-levelup-fade {
      0%   { opacity: 0;    }
      18%  { opacity: 0.85; }
      68%  { opacity: 0.85; }
      100% { opacity: 0;    }
    }
    @keyframes au-levelup-spring {
      0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
      55%  { transform: scale(1.18) rotate(4deg);  opacity: 1; }
      75%  { transform: scale(0.93) rotate(-2deg); }
      90%  { transform: scale(1.05) rotate(1deg);  }
      100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
    }
    @keyframes au-levelup-pulse {
      0%,100% { box-shadow: 0 0 24px rgba(193,172,92,0.4); }
      50%     { box-shadow: 0 0 48px rgba(193,172,92,0.8); }
    }
  `
  document.head.appendChild(style)
}

// ── Composant principal ───────────────────────────────────────────────────────

export const LevelUpAnimation = memo(function LevelUpAnimation({
  level,
  visible,
  onDismiss,
  soundEnabled = false,
}: LevelUpAnimationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const levelData = gamification.levels[level]

  // Injecter les keyframes une seule fois côté client
  useEffect(() => { injectKeyframes() }, [])

  // Auto-dismiss après 800ms (= durée animation levelUp)
  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    onDismiss()
  }, [onDismiss])

  useEffect(() => {
    if (!visible) return

    // Son optionnel — catch silencieux intentionnel :
    // l'absence du fichier son ou un NotAllowedError du navigateur ne doit pas crasher le composant.
    if (soundEnabled && typeof window !== 'undefined') {
      new Audio('/sounds/level-up.mp3').play().catch(() => {
        // catch silencieux explicitement documenté — son non bloquant
      })
    }

    timerRef.current = setTimeout(() => {
      handleDismiss()
    }, 800)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, soundEnabled, handleDismiss])

  // Fermeture via Escape
  useEffect(() => {
    if (!visible) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleDismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible, handleDismiss])

  if (!visible) return null

  // Fond semi-transparent teinté avec la couleur du niveau
  const overlayBg = `${levelData.color}22`  // ~13% opacité

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label={`Félicitations ! Niveau ${levelData.label} atteint.`}
      onClick={handleDismiss}
      style={{
        position       : 'fixed',
        inset          : 0,
        zIndex         : 9999,
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        flexDirection  : 'column',
        gap            : 24,
        background     : overlayBg,
        backdropFilter : 'blur(4px)',
        animation      : `au-levelup-fade ${gamification.animations.levelUp} ease-in-out forwards`,
        cursor         : 'pointer',
      }}
    >
      {/* Badge de niveau avec spring */}
      <div
        aria-hidden="true"
        style={{
          width         : 120,
          height        : 120,
          borderRadius  : '50%',
          background    : `radial-gradient(circle at 35% 35%, ${levelData.color}CC, ${levelData.color})`,
          display       : 'flex',
          alignItems    : 'center',
          justifyContent: 'center',
          animation     : `au-levelup-spring ${gamification.animations.levelUp} cubic-bezier(0.34, 1.56, 0.64, 1) forwards, au-levelup-pulse 0.4s 0.4s ease-in-out`,
          boxShadow     : `0 0 24px ${levelData.color}66`,
        }}
      >
        <span
          style={{
            fontSize  : 56,
            lineHeight: 1,
          }}
          role="img"
          aria-label={levelData.label}
        >
          {TIER_EMOJI[level] ?? '⭐'}
        </span>
      </div>

      {/* Label du niveau */}
      <div
        style={{
          textAlign  : 'center',
          color      : colors.light.surface,
          textShadow : `0 2px 8px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          style={{
            fontSize    : typography.display.size,
            fontWeight  : typography.display.weight,
            fontFamily  : typography.display.family,
            letterSpacing: typography.display.letterSpacing,
            color       : levelData.color,
            textShadow  : `0 0 20px ${levelData.color}88`,
          }}
        >
          {levelData.label.toUpperCase()}
        </div>
        <div
          style={{
            fontSize  : typography.h3.size,
            fontWeight: '600',
            fontFamily: typography.h3.family,
            color     : colors.text.primary,
            marginTop : 8,
          }}
        >
          Niveau atteint !
        </div>
      </div>
    </div>
  )
})

// ── Emoji par tier ─────────────────────────────────────────────────────────────

const TIER_EMOJI: Record<LevelTier, string> = {
  bronze  : '🥉',
  silver  : '🥈',
  gold    : '🥇',
  platinum: '💎',
  diamond : '💠',
  legend  : '👑',
}
