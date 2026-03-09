'use client'
import React, { useState } from 'react'
import type { Theme } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  theme: Theme
  onUpdate: (t: Theme) => void
}

const SH: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
  textTransform: 'uppercase', color: colors.accent.gold,
  fontFamily: 'Geist, sans-serif', margin: '0 0 4px',
}

const CARD: React.CSSProperties = {
  backgroundColor: colors.light.surface,
  borderRadius: radius.card,
  border: `1px solid ${colors.border.light}`,
  boxShadow: shadows.sm,
  padding: '20px',
  marginBottom: 16,
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: 1,
  textTransform: 'uppercase', color: colors.text.muted,
  display: 'block', marginBottom: 6,
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: radius.xs,
  border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface,
  color: colors.text.dark, fontSize: 13, fontFamily: 'Geist, sans-serif',
  outline: 'none', boxSizing: 'border-box',
}

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, resize: 'vertical',
}

export default function SectionIdentite({ theme, onUpdate }: Props) {
  const [name, setName] = useState(theme.name)
  const [description, setDescription] = useState(theme.description ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Note: updateTheme n'existe pas encore dans l'API client existant (pas de PUT /themes).
  // Le système de versioning utilise createNewThemeVersion pour les modifications majeures.
  // Pour l'instant les champs sont affichés en lecture / édition locale.
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      // Optimistic local update — en attendant une fonction updateTheme dans l'API
      onUpdate({ ...theme, name, description: description || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Impossible de sauvegarder.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={SH}>Identité du thème</h2>
        <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
          Informations de base du thème pédagogique.
          Pour créer une nouvelle version, utilisez le bouton dans l'ancienne vue.
        </p>
      </div>

      <div style={CARD}>
        {/* Clé (lecture seule) */}
        <div style={{ marginBottom: 16 }}>
          <label style={LABEL_STYLE}>Clé du thème (slug invariant)</label>
          <div style={{
            ...INPUT_STYLE,
            backgroundColor: colors.light.muted,
            color: colors.text.muted,
            fontFamily: 'Geist Mono, monospace',
          }}>
            {theme.themeKey}
          </div>
        </div>

        {/* Nom */}
        <div style={{ marginBottom: 16 }}>
          <label style={LABEL_STYLE}>Nom du thème</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>

        {/* Description / objectif */}
        <div style={{ marginBottom: 16 }}>
          <label style={LABEL_STYLE}>Objectif général / description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            style={TEXTAREA_STYLE}
          />
        </div>

        {/* Métadonnées lecture seule */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={LABEL_STYLE}>Version</label>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text.dark }}>v{theme.version}</div>
          </div>
          {theme.level && (
            <div>
              <label style={LABEL_STYLE}>Niveau</label>
              <div style={{ fontSize: 14, color: colors.text.dark }}>{theme.level}</div>
            </div>
          )}
          {theme.ageGroup && (
            <div>
              <label style={LABEL_STYLE}>Groupe d'âge</label>
              <div style={{ fontSize: 14, color: colors.text.dark }}>{theme.ageGroup}</div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: colors.accent.red, fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: saved ? colors.status.success : colors.accent.gold,
            color: '#fff',
            border: 'none',
            borderRadius: radius.button,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
            transition: `all ${transitions.fast}`,
          }}
        >
          {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  )
}
