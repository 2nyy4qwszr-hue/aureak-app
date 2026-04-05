// Story 51.4 — Pastille de notification pour les items de navigation sidebar
import React from 'react'

interface NavBadgeProps {
  /** Si fourni et > 0 : affiche un badge chiffré (rouge/couleur) */
  count ?: number
  /** Si true : affiche un simple point (badge or séances) */
  dot   ?: boolean
  /** Couleur de fond du badge (token theme) */
  color  : string
}

/**
 * Badge de notification positionné en absolute par rapport à l'icône parente.
 * - dot = true  → point 8×8px (badge or "séance dans 24h")
 * - count > 0   → cercle 16×16px avec compteur (cap à 99+)
 * Doit être rendu dans un conteneur `position: relative`.
 */
export function NavBadge({ count, dot, color }: NavBadgeProps) {
  // Badge point simple
  if (dot) {
    return (
      <span
        style={{
          position       : 'absolute',
          top            : -4,
          right          : -2,
          width          : 8,
          height         : 8,
          borderRadius   : '50%',
          backgroundColor: color,
          display        : 'block',
          flexShrink     : 0,
        }}
        aria-hidden="true"
      />
    )
  }

  // Badge chiffré — masqué si count === 0 ou absent
  if (!count || count <= 0) return null

  const label = count > 99 ? '99+' : String(count)
  // Largeur adaptative : 2 chiffres → 20px, sinon 16px
  const width = label.length > 1 ? 20 : 16

  return (
    <span
      style={{
        position       : 'absolute',
        top            : -4,
        right          : -2,
        minWidth       : width,
        height         : 16,
        borderRadius   : 8,
        backgroundColor: color,
        color          : '#ffffff',
        fontSize       : 9,
        fontWeight     : 700,
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        lineHeight     : 1,
        paddingLeft    : label.length > 1 ? 3 : 0,
        paddingRight   : label.length > 1 ? 3 : 0,
        flexShrink     : 0,
      }}
      aria-label={`${count} élément${count > 1 ? 's' : ''} en attente`}
    >
      {label}
    </span>
  )
}
