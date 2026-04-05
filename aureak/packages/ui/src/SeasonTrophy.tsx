// Story 59-10 — SeasonTrophy : SVG paramétrique trophée de fin de saison
// SVG 100% JSX React, 600×400px, aucune image externe (compatibilité canvas export).
// Polices : Arial/sans-serif en fallback pour l'export PNG via canvas.
// Ref transmis via forwardRef pour permettre l'export PNG par la tile parente.

import React from 'react'
import { gamification, colors } from '@aureak/theme'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SeasonTrophyProps {
  season      : { label: string; startDate: string; endDate: string }
  academyScore: number
  top3        : { rank: number; name: string; xp: number }[]
  badgeCount  : number
}

// ── Couleur trophée selon score (gamification.levels) ─────────────────────────

function trophyColor(score: number): string {
  if (score >= 90) return gamification.levels.diamond.color   // Élite — diamant
  if (score >= 80) return gamification.levels.platinum.color  // Excellence — platine
  if (score >= 60) return gamification.levels.gold.color      // Confirmée — or
  return gamification.levels.bronze.color                     // Débutante/Développement — bronze
}

// ── SVG Trophée central ───────────────────────────────────────────────────────

function TrophySVGShape({ color }: { color: string }) {
  return (
    <g>
      {/* Coupe */}
      <ellipse cx="300" cy="130" rx="50" ry="12" fill={color} opacity="0.3" />
      <path
        d="M 260 90 Q 255 140 270 155 Q 285 168 300 170 Q 315 168 330 155 Q 345 140 340 90 Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        opacity="0.9"
      />
      {/* Anses */}
      <path
        d="M 260 100 Q 235 120 240 145 Q 244 165 260 155"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 340 100 Q 365 120 360 145 Q 356 165 340 155"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Pied */}
      <rect x="285" y="170" width="30" height="8" rx="2" fill={color} />
      <rect x="275" y="178" width="50" height="6" rx="3" fill={color} opacity="0.8" />
      {/* Socle */}
      <rect x="270" y="184" width="60" height="10" rx="4" fill={color} opacity="0.7" />
      {/* Étoile centrale */}
      <text
        x="300"
        y="138"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="28"
        fontFamily="Arial, sans-serif"
      >
        ⭐
      </text>
    </g>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

export const SeasonTrophy = React.forwardRef<SVGSVGElement, SeasonTrophyProps>(
  function SeasonTrophy({ season, academyScore, top3, badgeCount }, ref) {
    const tc = trophyColor(academyScore)

    const endDateLabel = new Date(season.endDate).toLocaleDateString('fr-BE', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    // Podium positions : 1er centre, 2e gauche, 3e droite
    const PODIUM: Record<number, { x: number; barH: number; barColor: string }> = {
      1: { x: 300, barH: 60, barColor: gamification.levels.gold.color    },
      2: { x: 205, barH: 45, barColor: gamification.levels.silver.color  },
      3: { x: 395, barH: 35, barColor: gamification.levels.bronze.color  },
    }

    return (
      <svg
        ref={ref}
        width="600"
        height="400"
        viewBox="0 0 600 400"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', borderRadius: 16, overflow: 'hidden' }}
      >
        {/* Fond */}
        <rect width="600" height="400" fill={colors.light.primary} />

        {/* Cadre doré */}
        <rect
          x="8" y="8" width="584" height="384"
          rx="12" ry="12"
          fill="none"
          stroke={colors.accent.gold}
          strokeWidth="3"
        />
        {/* Cadre intérieur subtil */}
        <rect
          x="14" y="14" width="572" height="372"
          rx="10" ry="10"
          fill="none"
          stroke={colors.accent.gold}
          strokeWidth="0.5"
          opacity="0.4"
        />

        {/* Titre saison */}
        <text
          x="300"
          y="38"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
          fill={colors.text.muted}
          style={{ textTransform: 'uppercase' }}
          letterSpacing="2"
        >
          SAISON
        </text>
        <text
          x="300"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="900"
          fontFamily="Arial, sans-serif"
          fill={colors.text.dark}
        >
          {season.label}
        </text>

        {/* Trophée SVG central */}
        <TrophySVGShape color={tc} />

        {/* Score académie */}
        <text
          x="300"
          y="218"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontFamily="Arial, sans-serif"
          fill={colors.text.muted}
          letterSpacing="1"
        >
          Score académie
        </text>
        <text
          x="300"
          y="240"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="32"
          fontWeight="900"
          fontFamily="Arial, sans-serif"
          fill={tc}
        >
          {academyScore}
        </text>
        <text
          x="300"
          y="260"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fontFamily="Arial, sans-serif"
          fill={colors.text.subtle}
        >
          {endDateLabel}
        </text>

        {/* Séparateur */}
        <line x1="60" y1="278" x2="540" y2="278" stroke={colors.border.divider} strokeWidth="1" />

        {/* Label Champions */}
        <text
          x="300"
          y="295"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
          fill={colors.text.muted}
          letterSpacing="1.5"
        >
          CHAMPIONS DE LA SAISON
        </text>

        {/* Podium top 3 */}
        {top3.slice(0, 3).map(player => {
          const pod = PODIUM[player.rank]
          if (!pod) return null
          const barY = 378 - pod.barH
          return (
            <g key={player.rank}>
              {/* Barre podium */}
              <rect
                x={pod.x - 40}
                y={barY}
                width="80"
                height={pod.barH}
                rx="4"
                fill={pod.barColor}
                opacity="0.25"
              />
              {/* Rang */}
              <text
                x={pod.x}
                y={barY + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="900"
                fontFamily="Arial, sans-serif"
                fill={pod.barColor}
              >
                #{player.rank}
              </text>
              {/* Nom */}
              <text
                x={pod.x}
                y={barY + 34}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="700"
                fontFamily="Arial, sans-serif"
                fill={colors.text.dark}
              >
                {player.name.split(' ')[0].substring(0, 10)}
              </text>
              {/* XP */}
              <text
                x={pod.x}
                y={barY + 48}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fontFamily="Arial, sans-serif"
                fill={colors.text.muted}
              >
                {player.xp} XP
              </text>
            </g>
          )
        })}

        {/* État vide podium */}
        {top3.length === 0 && (
          <text
            x="300"
            y="350"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontFamily="Arial, sans-serif"
            fill={colors.text.subtle}
          >
            Aucun joueur classé
          </text>
        )}

        {/* Compteur badges */}
        <text
          x="540"
          y="42"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fontFamily="Arial, sans-serif"
          fill={colors.text.muted}
        >
          🏅 {badgeCount} badges
        </text>
      </svg>
    )
  }
)
