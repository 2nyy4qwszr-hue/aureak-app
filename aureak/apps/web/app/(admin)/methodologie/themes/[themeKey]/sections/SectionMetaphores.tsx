'use client'
import React, { useState, useEffect } from 'react'
import {
  listMetaphorsByTheme, createThemeMetaphor, updateThemeMetaphor, deleteThemeMetaphor,
} from '@aureak/api-client'
import type { ThemeMetaphor, ThemeSequence } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  themeId  : string
  tenantId : string
  sequences: ThemeSequence[]
}

type MetaphorWithMeta = ThemeMetaphor & {
  _editing: boolean
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

const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, resize: 'vertical' }

const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE, cursor: 'pointer' }

const BTN_GOLD: React.CSSProperties = {
  padding: '7px 14px', backgroundColor: colors.accent.gold, color: '#fff',
  border: 'none', borderRadius: radius.button, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Geist, sans-serif', transition: `all ${transitions.fast}`,
}

const BTN_GHOST: React.CSSProperties = {
  ...BTN_GOLD, backgroundColor: 'transparent', color: colors.text.muted,
  border: `1px solid ${colors.border.light}`,
}

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  border         : `1px solid ${colors.border.light}`,
  boxShadow      : shadows.sm,
  padding        : '16px 20px',
}

const EMPTY_FORM = { title: '', description: '', sequenceId: '' }

export default function SectionMetaphores({ themeId, tenantId, sequences }: Props) {
  const [metaphors, setMetaphors] = useState<MetaphorWithMeta[]>([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [adding, setAdding]       = useState(false)
  const [savingId, setSavingId]   = useState<string | null>(null)
  const [movingId, setMovingId]   = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listMetaphorsByTheme(themeId)
      setMetaphors(data.map(m => ({ ...m, _editing: false })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [themeId])

  const updateLocal = (id: string, patch: Partial<MetaphorWithMeta>) =>
    setMetaphors(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setAdding(true)
    try {
      await createThemeMetaphor({
        tenantId,
        themeId,
        title      : form.title.trim(),
        description: form.description.trim() || null,
        sequenceId : form.sequenceId || null,
        sortOrder  : metaphors.length,
      })
      setForm(EMPTY_FORM)
      setShowAdd(false)
      await load()
    } finally {
      setAdding(false)
    }
  }

  const handleSave = async (id: string) => {
    const m = metaphors.find(x => x.id === id)
    if (!m) return
    setSavingId(id)
    try {
      await updateThemeMetaphor(id, {
        title      : m.title,
        description: m.description,
        sequenceId : m.sequenceId,
      })
      updateLocal(id, { _editing: false })
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette métaphore ? Les critères liés (Story 24.4) conserveront leur lien via metaphor_id = NULL.')) return
    setDeletingId(id)
    try {
      await deleteThemeMetaphor(id)
      await load()
    } finally {
      setDeletingId(null)
    }
  }

  const handleMoveUp = async (id: string) => {
    const idx = metaphors.findIndex(m => m.id === id)
    if (idx <= 0 || movingId) return
    setMovingId(id)
    try {
      const curr = metaphors[idx]
      const prev = metaphors[idx - 1]
      await Promise.all([
        updateThemeMetaphor(curr.id, { sortOrder: prev.sortOrder }),
        updateThemeMetaphor(prev.id, { sortOrder: curr.sortOrder }),
      ])
      await load()
    } finally {
      setMovingId(null)
    }
  }

  const handleMoveDown = async (id: string) => {
    const idx = metaphors.findIndex(m => m.id === id)
    if (idx < 0 || idx >= metaphors.length - 1 || movingId) return
    setMovingId(id)
    try {
      const curr = metaphors[idx]
      const next = metaphors[idx + 1]
      await Promise.all([
        updateThemeMetaphor(curr.id, { sortOrder: next.sortOrder }),
        updateThemeMetaphor(next.id, { sortOrder: curr.sortOrder }),
      ])
      await load()
    } finally {
      setMovingId(null)
    }
  }

  const getSeqLabel = (seqId: string) =>
    sequences.find(s => s.id === seqId)?.name ?? seqId

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1, 2].map(i => (
        <div key={i} style={{ height: 56, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 12 }} />
      ))}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
            Métaphores pédagogiques
          </h2>
          <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
            Images conceptuelles qui enrichissent la compréhension du thème.
          </p>
        </div>
        <button style={BTN_GOLD} onClick={() => setShowAdd(true)}>+ Ajouter</button>
      </div>

      {/* Formulaire création */}
      {showAdd && (
        <div style={{ ...CARD_STYLE, marginBottom: 16, border: `2px solid ${colors.accent.gold}40` }}>
          <label style={LABEL_STYLE}>Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={INPUT_STYLE}
            placeholder="Ex: Le joueur est un chef d'orchestre..."
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <label style={{ ...LABEL_STYLE, marginTop: 10 }}>Description (optionnelle)</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            style={TEXTAREA_STYLE}
            placeholder="Développement de la métaphore..."
          />
          <label style={{ ...LABEL_STYLE, marginTop: 10 }}>Séquence liée (optionnelle)</label>
          <select
            value={form.sequenceId}
            onChange={e => setForm(f => ({ ...f, sequenceId: e.target.value }))}
            style={SELECT_STYLE}
          >
            <option value="">— Aucune séquence —</option>
            {sequences.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={BTN_GOLD} onClick={handleAdd} disabled={adding}>
              {adding ? 'Ajout...' : 'Créer'}
            </button>
            <button style={BTN_GHOST} onClick={() => { setShowAdd(false); setForm(EMPTY_FORM) }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {metaphors.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucune métaphore. Créez votre première métaphore pédagogique.
        </div>
      )}

      {/* Liste */}
      {metaphors.map((m, idx) => (
        <div key={m.id} style={{ ...CARD_STYLE, marginBottom: 12 }}>
          {/* Row header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              backgroundColor: colors.accent.gold + '20', color: colors.accent.gold,
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {idx + 1}
            </span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: colors.text.dark }}>{m.title}</span>
            {/* Badge séquence liée */}
            {m.sequenceId && !m._editing && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                backgroundColor: colors.accent.gold + '15',
                color: colors.accent.gold,
                border: `1px solid ${colors.border.gold}`,
                borderRadius: 999, padding: '3px 10px',
              }}>
                {getSeqLabel(m.sequenceId)}
              </span>
            )}
            {/* Boutons réordonnement */}
            {idx > 0 && (
              <button
                style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }}
                onClick={() => handleMoveUp(m.id)}
                disabled={!!movingId || !!deletingId}
                title="Monter"
              >↑</button>
            )}
            {idx < metaphors.length - 1 && (
              <button
                style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }}
                onClick={() => handleMoveDown(m.id)}
                disabled={!!movingId || !!deletingId}
                title="Descendre"
              >↓</button>
            )}
            <button
              style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }}
              onClick={() => updateLocal(m.id, { _editing: !m._editing })}
            >
              ✎ Éditer
            </button>
            <button
              style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11, color: colors.status.errorStrong, borderColor: colors.status.errorStrong + '40' }}
              onClick={() => handleDelete(m.id)}
              disabled={deletingId === m.id || !!movingId}
              title="Supprimer"
            >
              {deletingId === m.id ? '...' : '🗑'}
            </button>
          </div>

          {/* Description en lecture */}
          {!m._editing && m.description && (
            <p style={{ fontSize: 13, color: colors.text.muted, margin: '10px 0 0', lineHeight: 1.5 }}>
              {m.description}
            </p>
          )}

          {/* Mode édition inline */}
          {m._editing && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${colors.border.divider}`, paddingTop: 14 }}>
              <Field label="Titre">
                <input
                  type="text"
                  value={m.title}
                  onChange={e => updateLocal(m.id, { title: e.target.value })}
                  style={INPUT_STYLE}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={m.description ?? ''}
                  onChange={e => updateLocal(m.id, { description: e.target.value || null })}
                  rows={2}
                  style={TEXTAREA_STYLE}
                />
              </Field>
              <Field label="Séquence liée">
                <select
                  value={m.sequenceId ?? ''}
                  onChange={e => updateLocal(m.id, { sequenceId: e.target.value || null })}
                  style={SELECT_STYLE}
                >
                  <option value="">— Aucune séquence —</option>
                  {sequences.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={BTN_GOLD}
                  onClick={() => handleSave(m.id)}
                  disabled={savingId === m.id}
                >
                  {savingId === m.id ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button style={BTN_GHOST} onClick={() => updateLocal(m.id, { _editing: false })}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  )
}
