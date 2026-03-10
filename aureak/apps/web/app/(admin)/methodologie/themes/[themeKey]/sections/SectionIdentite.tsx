'use client'
import React, { useState } from 'react'
import type { Theme, ThemeGroup } from '@aureak/types'
import { updateTheme } from '@aureak/api-client'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  theme   : Theme
  groups  : ThemeGroup[]
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

export default function SectionIdentite({ theme, groups, onUpdate }: Props) {
  const [name,        setName]        = useState(theme.name)
  const [description, setDescription] = useState(theme.description ?? '')
  const [groupId,     setGroupId]     = useState<string | null>(theme.groupId)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { data, error: apiError } = await updateTheme({
      id         : theme.id,
      name,
      description: description || null,
      groupId,
    })
    setSaving(false)
    if (apiError || !data) {
      const msg = (apiError as { message?: string })?.message ?? 'Erreur inconnue'
      setError(`Impossible de sauvegarder : ${msg}`)
      return
    }
    onUpdate(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={SH}>Identité du thème</h2>
        <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
          Informations de base du thème pédagogique.
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

        {/* Bloc de thème */}
        {groups.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Bloc de thème</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* "Aucun bloc" chip */}
              <button
                onClick={() => setGroupId(null)}
                style={chipStyle(groupId === null)}
              >
                Aucun
              </button>
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGroupId(groupId === g.id ? null : g.id)}
                  style={chipStyle(groupId === g.id)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

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

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 20,
    border: `1.5px solid ${active ? colors.accent.gold : colors.border.light}`,
    backgroundColor: active ? colors.accent.gold + '15' : colors.light.surface,
    color: active ? colors.accent.gold : colors.text.muted,
    fontFamily: 'Geist, sans-serif',
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    outline: 'none',
  }
}
