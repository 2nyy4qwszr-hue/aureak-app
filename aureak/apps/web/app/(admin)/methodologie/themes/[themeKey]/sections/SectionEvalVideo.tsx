'use client'
import React, { useState, useEffect } from 'react'
import {
  listThemeVideoEvalTemplates, createThemeVideoEvalTemplate,
  updateThemeVideoEvalTemplate, deleteThemeVideoEvalTemplate, setVideoEvalTemplateCriteria,
} from '@aureak/api-client'
import type { ThemeVideoEvalTemplate, Criterion } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  themeId: string
  tenantId: string
  criteria: Criterion[]
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

const BTN_GOLD: React.CSSProperties = {
  padding: '7px 14px', backgroundColor: colors.accent.gold, color: '#fff',
  border: 'none', borderRadius: radius.button, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Geist, sans-serif', transition: `all ${transitions.fast}`,
}

const BTN_GHOST: React.CSSProperties = {
  ...BTN_GOLD, backgroundColor: 'transparent', color: colors.text.muted,
  border: `1px solid ${colors.border.light}`,
}

export default function SectionEvalVideo({ themeId, tenantId, criteria }: Props) {
  const [templates, setTemplates] = useState<ThemeVideoEvalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newInstructions, setNewInstructions] = useState('')
  const [newCriteriaIds, setNewCriteriaIds] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editInstructions, setEditInstructions] = useState('')
  const [editCriteriaIds, setEditCriteriaIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listThemeVideoEvalTemplates(themeId)
      setTemplates(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [themeId])

  const toggleCriterion = (id: string) =>
    setNewCriteriaIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const tmpl = await createThemeVideoEvalTemplate(themeId, tenantId, {
        title: newTitle.trim(),
        instructions: newInstructions || null,
        exerciseId: null,
        sortOrder: templates.length,
      })
      if (newCriteriaIds.length > 0) {
        await setVideoEvalTemplateCriteria(tmpl.id, newCriteriaIds)
      }
      setNewTitle('')
      setNewInstructions('')
      setNewCriteriaIds([])
      setShowAdd(false)
      await load()
    } finally {
      setAdding(false)
    }
  }

  const handleStartEdit = (tmpl: ThemeVideoEvalTemplate) => {
    setEditingId(tmpl.id)
    setEditTitle(tmpl.title)
    setEditInstructions(tmpl.instructions ?? '')
    setEditCriteriaIds(tmpl.criteriaIds ? [...tmpl.criteriaIds] : [])
  }

  const handleSaveEdit = async (id: string) => {
    setSaving(true)
    try {
      await updateThemeVideoEvalTemplate(id, {
        title       : editTitle,
        instructions: editInstructions || null,
      })
      await setVideoEvalTemplateCriteria(id, editCriteriaIds)
      setEditingId(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const toggleEditCriterion = (id: string) =>
    setEditCriteriaIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce template d\'évaluation ?')) return
    await deleteThemeVideoEvalTemplate(id)
    await load()
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1,2].map(i => <div key={i} style={{ height: 80, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 12 }} />)}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
            Templates d'évaluation vidéo
          </h2>
          <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
            Configurez les grilles d'observation pour évaluer les joueurs par vidéo.
            Les évaluations réelles sont gérées dans la vue coach.
          </p>
        </div>
        <button style={BTN_GOLD} onClick={() => setShowAdd(!showAdd)}>+ Ajouter un template</button>
      </div>

      {showAdd && (
        <div style={{ ...CARD_STYLE, marginBottom: 16, border: `2px solid ${colors.accent.gold}40` }}>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Titre du template *</label>
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={INPUT_STYLE} placeholder="Ex: Évaluation sortie au sol..." autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Instructions d'observation</label>
            <textarea value={newInstructions} onChange={e => setNewInstructions(e.target.value)} rows={3} style={TEXTAREA_STYLE} placeholder="Ce que le coach doit observer..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Critères observés</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {criteria.length === 0 && <span style={{ fontSize: 12, color: colors.text.muted }}>Aucun critère disponible.</span>}
              {criteria.map(c => {
                const sel = newCriteriaIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCriterion(c.id)}
                    style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                      border: `1px solid ${sel ? colors.accent.gold : colors.border.light}`,
                      backgroundColor: sel ? colors.accent.gold + '20' : 'transparent',
                      color: sel ? colors.accent.gold : colors.text.muted,
                      transition: `all ${transitions.fast}`,
                    }}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={BTN_GOLD} onClick={handleAdd} disabled={adding}>{adding ? '...' : 'Créer'}</button>
            <button style={BTN_GHOST} onClick={() => setShowAdd(false)}>Annuler</button>
          </div>
        </div>
      )}

      {templates.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucun template d'évaluation vidéo. Créez vos grilles d'observation.
        </div>
      )}

      {templates.map(tmpl => (
        <div key={tmpl.id} style={{ ...CARD_STYLE, marginBottom: 12 }}>
          {editingId === tmpl.id ? (
            // Mode édition inline
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={LABEL_STYLE}>Titre *</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={INPUT_STYLE} autoFocus />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL_STYLE}>Instructions d'observation</label>
                <textarea value={editInstructions} onChange={e => setEditInstructions(e.target.value)} rows={3} style={TEXTAREA_STYLE} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL_STYLE}>Critères observés</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {criteria.length === 0 && <span style={{ fontSize: 12, color: colors.text.muted }}>Aucun critère disponible.</span>}
                  {criteria.map(c => {
                    const sel = editCriteriaIds.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleEditCriterion(c.id)}
                        style={{
                          padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                          border: `1px solid ${sel ? colors.accent.gold : colors.border.light}`,
                          backgroundColor: sel ? colors.accent.gold + '20' : 'transparent',
                          color: sel ? colors.accent.gold : colors.text.muted,
                          transition: `all ${transitions.fast}`,
                        }}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={BTN_GOLD} onClick={() => handleSaveEdit(tmpl.id)} disabled={saving}>
                  {saving ? '...' : 'Sauvegarder'}
                </button>
                <button style={BTN_GHOST} onClick={() => setEditingId(null)}>Annuler</button>
              </div>
            </div>
          ) : (
            // Mode lecture
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: colors.text.dark }}>
                  🎥 {tmpl.title}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }} onClick={() => handleStartEdit(tmpl)}>✎</button>
                  <button
                    style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11, color: colors.status.errorStrong, borderColor: colors.status.errorStrong + '40' }}
                    onClick={() => handleDelete(tmpl.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {tmpl.instructions && (
                <p style={{ fontSize: 12, color: colors.text.muted, margin: '4px 0 8px' }}>{tmpl.instructions}</p>
              )}

              {tmpl.criteriaIds && tmpl.criteriaIds.length > 0 && (
                <div>
                  <span style={{ fontSize: 11, color: colors.text.subtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Critères observés :
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {tmpl.criteriaIds.map(cid => {
                      const crit = criteria.find(c => c.id === cid)
                      return crit ? (
                        <span key={cid} style={{ fontSize: 11, backgroundColor: colors.accent.gold + '15', color: colors.accent.gold, padding: '2px 8px', borderRadius: 999, border: `1px solid ${colors.border.gold}` }}>
                          ⭐ {crit.label}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {(!tmpl.criteriaIds || tmpl.criteriaIds.length === 0) && (
                <p style={{ fontSize: 12, color: colors.text.subtle }}>Aucun critère observé défini.</p>
              )}
            </>
          )}
        </div>
      ))}
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
