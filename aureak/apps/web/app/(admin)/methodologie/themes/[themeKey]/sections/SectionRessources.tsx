'use client'
import React, { useState, useEffect } from 'react'
import { listThemeResources, createThemeResource, updateThemeResource, deleteThemeResource } from '@aureak/api-client'
import type { ThemeResource, ThemeResourceType } from '@aureak/types'
import { THEME_RESOURCE_TYPE_LABELS } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  themeId: string
  tenantId: string
}

const RESOURCE_ICONS: Record<ThemeResourceType, string> = {
  pdf_coach      : '📄',
  video_global   : '🎬',
  image_global   : '🖼️',
  audio          : '🔊',
  reference_media: '📎',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: 1,
  textTransform: 'uppercase', color: colors.text.muted,
  display: 'block', marginBottom: 6,
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: radius.xs,
  border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface,
  color: colors.text.dark, fontSize: 13, fontFamily: 'Geist, sans-serif',
  outline: 'none', boxSizing: 'border-box',
}

const BTN_GOLD: React.CSSProperties = {
  padding: '7px 14px', backgroundColor: colors.accent.gold, color: '#fff',
  border: 'none', borderRadius: radius.button, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Geist, sans-serif', transition: `all ${transitions.fast}`,
}

const BTN_GHOST: React.CSSProperties = {
  ...BTN_GOLD, backgroundColor: 'transparent', color: colors.text.muted,
  border: `1px solid ${colors.border.light}`,
}

const RESOURCE_TYPES: ThemeResourceType[] = ['pdf_coach', 'video_global', 'image_global', 'audio', 'reference_media']

export default function SectionRessources({ themeId, tenantId }: Props) {
  const [resources, setResources] = useState<ThemeResource[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState<ThemeResourceType>('pdf_coach')
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listThemeResources(themeId)
      setResources(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [themeId])

  const handleAdd = async () => {
    if (!newUrl.trim()) return
    setAdding(true)
    try {
      await createThemeResource(themeId, tenantId, {
        resourceType: newType,
        label: newLabel.trim() || null,
        url: newUrl.trim(),
        sortOrder: resources.length,
      })
      setNewLabel('')
      setNewUrl('')
      setNewType('pdf_coach')
      setShowAdd(false)
      await load()
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette ressource ?')) return
    await deleteThemeResource(id)
    await load()
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 56, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 8 }} />)}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
            Ressources pédagogiques
          </h2>
          <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
            PDF coach, vidéos globales, images de référence et autres médias.
          </p>
        </div>
        <button style={BTN_GOLD} onClick={() => setShowAdd(!showAdd)}>+ Ajouter</button>
      </div>

      {showAdd && (
        <div style={{ ...CARD_STYLE, marginBottom: 16, border: `2px solid ${colors.accent.gold}40` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={LABEL_STYLE}>Type de ressource</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as ThemeResourceType)}
                style={{ ...INPUT_STYLE, cursor: 'pointer' }}
              >
                {RESOURCE_TYPES.map(t => (
                  <option key={t} value={t}>{RESOURCE_ICONS[t]} {THEME_RESOURCE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Label (optionnel)</label>
              <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={INPUT_STYLE} placeholder="Ex: Guide du coach — Phase 1" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>URL *</label>
            <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)} style={INPUT_STYLE} placeholder="https://..." autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={BTN_GOLD} onClick={handleAdd} disabled={adding}>{adding ? '...' : 'Ajouter'}</button>
            <button style={BTN_GHOST} onClick={() => setShowAdd(false)}>Annuler</button>
          </div>
        </div>
      )}

      {resources.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucune ressource. Ajoutez vos PDF, vidéos et images de référence.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {resources.map(r => (
          <div key={r.id} style={{
            backgroundColor: colors.light.surface,
            borderRadius: radius.xs,
            border: `1px solid ${colors.border.light}`,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{RESOURCE_ICONS[r.resourceType]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: colors.text.dark, marginBottom: 2 }}>
                {r.label ?? THEME_RESOURCE_TYPE_LABELS[r.resourceType]}
              </div>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: colors.accent.gold, wordBreak: 'break-all' }}
              >
                {r.url.length > 80 ? r.url.slice(0, 80) + '...' : r.url}
              </a>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
              backgroundColor: colors.light.muted, color: colors.text.muted,
              padding: '2px 8px', borderRadius: 4, flexShrink: 0,
            }}>
              {THEME_RESOURCE_TYPE_LABELS[r.resourceType]}
            </span>
            <button
              style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11, color: colors.accent.red, borderColor: colors.accent.red + '40', flexShrink: 0 }}
              onClick={() => handleDelete(r.id)}
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: colors.light.surface,
  borderRadius: radius.card,
  border: `1px solid ${colors.border.light}`,
  boxShadow: shadows.sm,
  padding: '16px 20px',
}
