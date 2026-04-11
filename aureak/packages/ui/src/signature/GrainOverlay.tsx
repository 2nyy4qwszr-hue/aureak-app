import React from 'react'
import { Platform } from 'react-native'

// Story 83-5 — SVG grain overlay, web-only (no-op sur mobile RN)
// Réf. DESIGN-SYSTEM-HOMEPAGE.md §6

export function GrainOverlay() {
  if (Platform.OS !== 'web') return null

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)"/>
    </svg>
  `
  const dataUri = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`

  const style: Record<string, unknown> = {
    position     : 'fixed',
    top          : 0,
    left         : 0,
    right        : 0,
    bottom       : 0,
    pointerEvents: 'none',
    opacity      : 0.022,
    zIndex       : 50,
    backgroundImage: dataUri,
  }

  return React.createElement('div', {
    'aria-hidden': 'true',
    style,
  })
}
