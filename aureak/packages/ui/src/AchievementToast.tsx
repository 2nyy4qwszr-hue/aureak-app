// Story 59-9 — AchievementToast : notification badge débloqué temps réel
// Animation slide-in/out CSS pure — aucune dépendance externe.
// RÈGLE : aucune couleur hardcodée — tout via @aureak/theme tokens.

import { useEffect, useState } from 'react'
import { colors, shadows, radius, transitions, typography } from '@aureak/theme'

export interface AchievementToastProps {
  playerName   : string
  badgeLabel   : string
  badgeIconUrl?: string
  onDismiss    : () => void
}

export function AchievementToast({
  playerName,
  badgeLabel,
  badgeIconUrl,
  onDismiss,
}: AchievementToastProps) {
  const [visible,  setVisible]  = useState(false)
  const [leaving,  setLeaving]  = useState(false)

  // Slide-in au montage
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Auto-dismiss après 5 secondes
  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      handleDismiss()
    }, 5000)
    return () => clearTimeout(dismissTimer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = () => {
    setLeaving(true)
    setTimeout(() => onDismiss(), 300)  // durée du slide-out
  }

  return (
    <div
      style={{
        position      : 'fixed',
        bottom        : 24,
        right         : 24,
        zIndex        : 9000,
        minWidth      : 280,
        maxWidth      : 380,
        backgroundColor: colors.light.surface,
        borderLeft    : `4px solid ${colors.accent.gold}`,
        borderRadius  : radius.card,
        boxShadow     : shadows.gold,
        overflow      : 'hidden',
        transform     : leaving
          ? 'translateX(calc(100% + 24px))'
          : visible
            ? 'translateX(0)'
            : 'translateX(calc(100% + 24px))',
        transition    : leaving
          ? `transform ${transitions.normal}`
          : `transform ${transitions.normal}`,
        opacity       : visible && !leaving ? 1 : 0.95,
      }}
    >
      <style>{`
        @keyframes toast-progress-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* Contenu principal */}
      <div style={{
        display    : 'flex',
        alignItems : 'center',
        gap        : 12,
        padding    : '14px 16px',
        paddingRight: 40,
      }}>
        {/* Icône badge */}
        <div style={{ flexShrink: 0 }}>
          {badgeIconUrl ? (
            <img
              src={badgeIconUrl}
              alt={badgeLabel}
              style={{ width: 36, height: 36, borderRadius: radius.xs, objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width          : 36,
              height         : 36,
              borderRadius   : radius.xs,
              backgroundColor: colors.accent.gold,
              display        : 'flex',
              alignItems     : 'center',
              justifyContent : 'center',
              fontSize       : 20,
            }}>
              🏆
            </div>
          )}
        </div>

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily  : 'Montserrat, sans-serif',
            fontWeight  : 600,
            fontSize    : typography.body.size,
            color       : colors.text.dark,
            lineHeight  : `${typography.body.lineHeight}px`,
            overflow    : 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace  : 'nowrap',
          }}>
            🏆 {playerName} vient de débloquer
          </div>
          <div style={{
            fontFamily  : 'Montserrat, sans-serif',
            fontWeight  : 700,
            fontSize    : typography.body.size,
            color       : colors.accent.gold,
            overflow    : 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace  : 'nowrap',
          }}>
            {badgeLabel}
          </div>
        </div>
      </div>

      {/* Bouton × */}
      <button
        onClick={handleDismiss}
        aria-label="Fermer"
        style={{
          position        : 'absolute',
          top             : 8,
          right           : 8,
          background      : 'none',
          border          : 'none',
          cursor          : 'pointer',
          fontSize        : 16,
          color           : colors.text.subtle,
          padding         : '4px 6px',
          lineHeight      : 1,
          borderRadius    : radius.xs,
        }}
      >
        ×
      </button>

      {/* Barre de progression 5s */}
      <div style={{
        height         : 3,
        backgroundColor: colors.border.divider,
        overflow       : 'hidden',
      }}>
        <div
          style={{
            height         : '100%',
            backgroundColor: colors.accent.goldLight,
            animation      : 'toast-progress-shrink 5s linear forwards',
            transformOrigin: 'left center',
          }}
        />
      </div>
    </div>
  )
}
