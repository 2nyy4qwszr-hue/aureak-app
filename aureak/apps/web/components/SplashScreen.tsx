// Story 61.6 — SplashScreen animé admin web
// Affiché pendant le chargement initial (auth + config)
// RÈGLE : constantes locales SPLASH_BG, SPLASH_MIN_MS, SPLASH_TIMEOUT_MS
// RÈGLE : cleanup timeout OBLIGATOIRE dans le return du useEffect
import React from 'react'
import { colors, fonts } from '@aureak/theme'

// ── Constantes ────────────────────────────────────────────────────────────────

export const SPLASH_BG         = colors.dark.background
export const SPLASH_MIN_MS     = 1500
export const SPLASH_TIMEOUT_MS = 5000

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SplashScreenProps {
  /** Si true, déclenche le fade-out */
  dismiss?: boolean
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function SplashScreen({ dismiss = false }: SplashScreenProps) {
  return (
    <>
      {/* Keyframes CSS inline */}
      <style>{`
        @keyframes aureak-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes aureak-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aureak-draw {
          from { stroke-dashoffset: 1000; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes aureak-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes aureak-fade-out {
          from { opacity: 1; pointer-events: all; }
          to   { opacity: 0; pointer-events: none; }
        }
        .aureak-splash {
          position       : fixed;
          top            : 0; left: 0; right: 0; bottom: 0;
          z-index        : 9999;
          background     : ${SPLASH_BG};
          display        : flex;
          flex-direction : column;
          align-items    : center;
          justify-content: center;
          overflow       : hidden;
        }
        .aureak-splash.dismissing {
          animation: aureak-fade-out 0.3s ease forwards;
        }
        .aureak-splash-logo {
          font-family  : ${fonts.display}, sans-serif;
          font-size    : 40px;
          font-weight  : 900;
          color        : ${colors.accent.gold};
          letter-spacing: 8px;
          animation    : aureak-fade-in 0.6s ease forwards;
          opacity      : 0;
        }
        .aureak-splash-subtitle {
          font-family  : ${fonts.body}, sans-serif;
          font-size    : 14px;
          font-weight  : 400;
          color        : ${colors.accent.goldLight};
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top   : 10px;
          animation    : aureak-slide-up 0.4s ease 0.2s forwards;
          opacity      : 0;
        }
        .aureak-splash-terrain {
          margin-top: 40px;
          opacity   : 0.15;
        }
        .aureak-splash-terrain path,
        .aureak-splash-terrain circle,
        .aureak-splash-terrain line,
        .aureak-splash-terrain rect {
          stroke-dasharray : 1000;
          stroke-dashoffset: 1000;
          animation        : aureak-draw 0.8s ease 0.4s forwards;
        }
        .aureak-splash-progress-bar {
          position  : absolute;
          bottom    : 0;
          left      : 0;
          height    : 2px;
          background: ${colors.accent.gold};
          animation : aureak-progress 1.5s linear forwards;
          width     : 0%;
        }
      `}</style>

      <div className={`aureak-splash${dismiss ? ' dismissing' : ''}`} aria-label="Chargement Aureak">

        {/* Logo AUREAK */}
        <div className="aureak-splash-logo">AUREAK</div>

        {/* Sous-titre */}
        <div className="aureak-splash-subtitle">Académie de gardiens</div>

        {/* SVG Terrain (AC3) */}
        <svg
          className="aureak-splash-terrain"
          viewBox="0 0 300 200"
          width="240"
          height="160"
          fill="none"
        >
          {/* Ligne médiane */}
          <line
            x1="150" y1="10" x2="150" y2="190"
            stroke={colors.accent.gold}
            strokeWidth="1"
          />
          {/* Cercle central */}
          <circle
            cx="150" cy="100" r="40"
            stroke={colors.accent.gold}
            strokeWidth="1.5"
          />
          {/* Surface de réparation gauche */}
          <rect
            x="10" y="65" width="60" height="70"
            stroke={colors.accent.gold}
            strokeWidth="1.5"
          />
          {/* Surface de réparation droite */}
          <rect
            x="230" y="65" width="60" height="70"
            stroke={colors.accent.gold}
            strokeWidth="1.5"
          />
          {/* Contour terrain */}
          <rect
            x="10" y="10" width="280" height="180"
            stroke={colors.accent.gold}
            strokeWidth="1.5"
          />
        </svg>

        {/* Barre de progression (AC4) */}
        <div className="aureak-splash-progress-bar" />

      </div>
    </>
  )
}
