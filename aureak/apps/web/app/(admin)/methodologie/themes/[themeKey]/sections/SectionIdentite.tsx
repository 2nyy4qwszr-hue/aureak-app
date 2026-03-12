'use client'
import React, { useState } from 'react'
import type { Theme, ThemeGroup } from '@aureak/types'
import { updateTheme, updateThemePositionIndex } from '@aureak/api-client'
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
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [positionValue,  setPositionValue]  = useState<string>(theme.positionIndex != null ? String(theme.positionIndex) : '')
  const [positionError,  setPositionError]  = useState<string | null>(null)
  const [positionSaving, setPositionSaving] = useState(false)

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

  const handleSavePosition = async () => {
    setPositionError(null)
    const trimmed = positionValue.trim()
    // Cas vide → null (retirer la position)
    if (trimmed === '') {
      setPositionSaving(true)
      const { error: apiError } = await updateThemePositionIndex(theme.id, null)
      setPositionSaving(false)
      if (apiError) {
        setPositionError('Erreur lors de la sauvegarde')
      } else {
        onUpdate({ ...theme, positionIndex: null })
      }
      return
    }
    const asFloat = parseFloat(trimmed)
    const parsed  = parseInt(trimmed, 10)
    if (isNaN(parsed) || !Number.isInteger(asFloat) || parsed < 1 || parsed > 25) {
      setPositionError('La position doit être un entier entre 1 et 25')
      return
    }
    setPositionSaving(true)
    const { error: apiError } = await updateThemePositionIndex(theme.id, parsed)
    setPositionSaving(false)
    if (apiError) {
      const msg = String((apiError as { message?: string })?.message ?? '')
      if ((apiError as { code?: string })?.code === '23505' || msg.includes('uq_themes_group_position')) {
        setPositionError('Cette position est déjà utilisée dans ce Bloc')
      } else {
        setPositionError('Erreur lors de la sauvegarde')
      }
    } else {
      onUpdate({ ...theme, positionIndex: parsed })
    }
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

        {/* Position dans la grille */}
        <div style={{ marginBottom: 16 }}>
          <label style={LABEL_STYLE}>Position dans la grille (1 – 25)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              min={1}
              max={25}
              placeholder="Ex : 3"
              value={positionValue}
              onChange={e => { setPositionValue(e.target.value); setPositionError(null) }}
              style={{ ...INPUT_STYLE, width: 90 }}
            />
            <button
              onClick={handleSavePosition}
              disabled={positionSaving}
              style={{
                padding        : '9px 16px',
                borderRadius   : radius.xs,
                border         : `1px solid ${colors.border.light}`,
                backgroundColor: colors.light.muted,
                color          : colors.text.dark,
                fontFamily     : 'Geist, sans-serif',
                fontSize       : 12,
                fontWeight     : 500,
                cursor         : positionSaving ? 'not-allowed' : 'pointer',
                transition     : `all ${transitions.fast}`,
              }}
            >
              {positionSaving ? '…' : 'Enregistrer'}
            </button>
          </div>
          {positionError && (
            <div style={{ color: colors.accent.red, fontSize: 11, marginTop: 4 }}>{positionError}</div>
          )}
          <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 4 }}>
            Slot dans la grille 5×5 (1 = haut gauche, 25 = bas droite). Optionnel.
          </div>
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
