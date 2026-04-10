// Story 59-7 — MilestoneCelebration : overlay plein écran confetti CSS pur
// ⚠️ Exception documentée : les couleurs confetti sont injecting dans les keyframes CSS
//    via des chaînes (pas de constantes tokens directement dans les @keyframes).
//    Les valeurs sont dérivées des tokens @aureak/theme importés ci-dessous.
//    Aucune dépendance externe animation — confetti 100% CSS.

import { useEffect, useRef, useState } from 'react'
import { colors, radius, shadows, typography } from '@aureak/theme'

// Couleurs confetti dérivées des tokens (exception documentée — cf. commentaire en-tête)
// '#FFFFFF' (blanc pur) = exception justifiée : aucun token blanc pur n'existe dans la palette
const CONFETTI_COLORS = [
  colors.accent.gold,
  colors.accent.goldLight,
  colors.status.success,
  colors.status.errorStrong,
  colors.light.surface,  // blanc surface (= #FFFFFF)
]

const CONFETTI_COUNT = 60

interface ConfettiPiece {
  id       : number
  left     : number   // 0–100 %
  delay    : number   // 0–2s
  duration : number   // 1–3s
  rotation : number   // 0–360 deg
  color    : string
  size     : number   // 6–12px
}

/** Génère les confetti au montage avec seed aléatoire fixé (pas de re-render) */
function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id      : i,
    left    : Math.random() * 100,
    delay   : Math.random() * 2,
    duration: 1 + Math.random() * 2,
    rotation: Math.random() * 360,
    color   : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size    : 6 + Math.floor(Math.random() * 7),
  }))
}

interface MilestoneCelebrationProps {
  label     : string
  emoji?    : string
  date?     : string  // ISO 8601
  onDismiss : () => void
}

export function MilestoneCelebration({
  label,
  emoji     = '🏆',
  date,
  onDismiss,
}: MilestoneCelebrationProps) {
  // Confetti générés une seule fois au montage
  const confetti   = useRef<ConfettiPiece[]>(generateConfetti()).current
  const [fadeOut, setFadeOut] = useState(false)

  const dateLabel = date
    ? new Date(date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })

  // Auto-dismiss après 3 secondes avec fade-out
  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500)
    const dismissTimer = setTimeout(() => onDismiss(), 3200)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(dismissTimer)
    }
  }, [onDismiss])

  return (
    <div
      onClick={onDismiss}
      style={{
        position       : 'fixed',
        inset          : 0,
        zIndex         : 9999,
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        opacity        : fadeOut ? 0 : 1,
        transition     : 'opacity 0.7s ease',
        cursor         : 'pointer',
      }}
    >
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes milestone-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .milestone-card {
          animation: milestone-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Confetti */}
      {confetti.map(piece => (
        <div
          key={piece.id}
          style={{
            position     : 'fixed',
            top          : '-20px',
            left         : `${piece.left}%`,
            width        : piece.size,
            height       : piece.size,
            backgroundColor: piece.color,
            borderRadius   : Math.random() > 0.5 ? '50%' : '2px',
            animation    : `confetti-fall ${piece.duration}s ${piece.delay}s linear forwards`,
            transform    : `rotate(${piece.rotation}deg)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Carte centrale */}
      <div
        className="milestone-card"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: colors.light.surface,
          borderRadius   : radius.cardLg,
          boxShadow      : shadows.gold,
          border         : `3px solid ${colors.accent.gold}`,
          padding        : '40px 48px',
          textAlign      : 'center',
          maxWidth       : 440,
          width          : '90%',
          position       : 'relative',
          zIndex         : 1,
        }}
      >
        {/* Emoji + Label */}
        <div style={{
          fontSize    : 56,
          lineHeight  : 1,
          marginBottom: 16,
        }}>
          {emoji}
        </div>
        <div style={{
          fontFamily  : 'Montserrat, sans-serif',
          fontWeight  : typography.display.weight,
          fontSize    : typography.display.size,
          color       : colors.text.dark,
          lineHeight  : 1.2,
          marginBottom: 12,
        }}>
          {label}
        </div>
        <div style={{
          fontSize  : typography.body.size,
          color     : colors.text.muted,
          fontFamily: 'Montserrat, sans-serif',
          marginBottom: 20,
        }}>
          Académie Aureak — {dateLabel}
        </div>

        {/* Badge collectif doré */}
        <div style={{
          display        : 'inline-flex',
          alignItems     : 'center',
          gap            : 8,
          backgroundColor: colors.accent.gold,
          borderRadius   : radius.badge,
          padding        : '8px 20px',
          color          : colors.text.dark,
          fontFamily     : 'Montserrat, sans-serif',
          fontWeight     : 700,
          fontSize       : 13,
          letterSpacing  : 0.5,
        }}>
          🏅 Jalon collectif débloqué
        </div>

        {/* Indication cliquable */}
        <div style={{
          marginTop : 16,
          fontSize  : 11,
          color     : colors.text.subtle,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          Cliquer pour fermer
        </div>
      </div>
    </div>
  )
}
