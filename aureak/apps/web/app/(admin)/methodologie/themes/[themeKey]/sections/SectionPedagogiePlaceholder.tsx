'use client'
import React from 'react'
import { colors, shadows, radius } from '@aureak/theme'

const ITEMS = [
  { label: 'Séquences pédagogiques',   icon: '📖' },
  { label: 'Métaphores',               icon: '🪄' },
  { label: 'Critères de réussite',     icon: '✅' },
  { label: 'Erreurs observées',        icon: '⚠️' },
  { label: 'Mini-exercices terrain',   icon: '⚡' },
  { label: 'Organisation pédagogique', icon: '🗂' },
]

export default function SectionPedagogiePlaceholder() {
  return (
    <div style={{
      backgroundColor: colors.light.surface,
      borderRadius   : radius.card,
      border         : `1px solid ${colors.border.light}`,
      boxShadow      : shadows.sm,
      padding        : '20px 24px',
    }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{
          fontSize      : 11,
          fontWeight    : 700,
          letterSpacing : 1.5,
          textTransform : 'uppercase',
          color         : colors.accent.gold,
          fontFamily    : 'Poppins, sans-serif',
          margin        : '0 0 4px',
        }}>
          🏗 Contenu pédagogique avancé
        </h2>
        <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
          Retrouvez les sections avancées dans l'onglet "Séquences pédagogiques" et "Organisation".
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ITEMS.map(item => (
          <div key={item.label} style={{
            display        : 'flex',
            alignItems     : 'center',
            justifyContent : 'space-between',
            padding        : '10px 14px',
            backgroundColor: colors.light.primary,
            borderRadius   : radius.xs,
            border         : `1px solid ${colors.border.light}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: colors.text.dark, fontFamily: 'Poppins, sans-serif' }}>
                {item.label}
              </span>
            </div>
            <span style={{
              fontSize        : 10,
              fontWeight      : 700,
              letterSpacing   : 0.5,
              textTransform   : 'uppercase',
              color           : colors.accent.gold,
              backgroundColor : colors.accent.gold + '15',
              border          : `1px solid ${colors.border.gold}`,
              borderRadius    : radius.xs,
              padding         : '2px 8px',
            }}>
              À venir
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
