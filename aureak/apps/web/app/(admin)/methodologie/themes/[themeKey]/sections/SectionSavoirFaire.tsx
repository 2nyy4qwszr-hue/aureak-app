'use client'
import React, { useState, useEffect } from 'react'
import {
  listThemeHomeExercises, createThemeHomeExercise,
  updateThemeHomeExercise, deleteThemeHomeExercise, setHomeExerciseCriteria,
} from '@aureak/api-client'
import type { ThemeHomeExercise, Criterion } from '@aureak/types'
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

const EMPTY_FORM = {
  title: '', objective: '', material: '', installation: '',
  parentChildInstructions: '', distanceMeters: '', intensity: '',
  repetitions: '', demoVideoUrl: '', requiredLevel: '',
  selectedCriteriaIds: [] as string[],
}

type FormState = typeof EMPTY_FORM

export default function SectionSavoirFaire({ themeId, tenantId, criteria }: Props) {
  const [exercises, setExercises] = useState<ThemeHomeExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listThemeHomeExercises(themeId)
      setExercises(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [themeId])

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const setEditField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEditForm(prev => ({ ...prev, [key]: e.target.value }))

  const toggleCriterion = (id: string) =>
    setForm(prev => ({
      ...prev,
      selectedCriteriaIds: prev.selectedCriteriaIds.includes(id)
        ? prev.selectedCriteriaIds.filter(c => c !== id)
        : [...prev.selectedCriteriaIds, id],
    }))

  const toggleEditCriterion = (id: string) =>
    setEditForm(prev => ({
      ...prev,
      selectedCriteriaIds: prev.selectedCriteriaIds.includes(id)
        ? prev.selectedCriteriaIds.filter(c => c !== id)
        : [...prev.selectedCriteriaIds, id],
    }))

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setAdding(true)
    try {
      const ex = await createThemeHomeExercise(themeId, tenantId, {
        title: form.title.trim(),
        objective: form.objective || null,
        material: form.material || null,
        installation: form.installation || null,
        parentChildInstructions: form.parentChildInstructions || null,
        distanceMeters: form.distanceMeters ? parseFloat(form.distanceMeters) : null,
        intensity: form.intensity || null,
        repetitions: form.repetitions ? parseInt(form.repetitions) : null,
        demoVideoUrl: form.demoVideoUrl || null,
        requiredLevel: form.requiredLevel || null,
        sortOrder: exercises.length,
      })
      if (form.selectedCriteriaIds.length > 0) {
        await setHomeExerciseCriteria(ex.id, form.selectedCriteriaIds)
      }
      setForm(EMPTY_FORM)
      setShowAdd(false)
      await load()
    } finally {
      setAdding(false)
    }
  }

  const handleStartEdit = (ex: ThemeHomeExercise) => {
    setEditingId(ex.id)
    setEditForm({
      title                 : ex.title,
      objective             : ex.objective ?? '',
      material              : ex.material ?? '',
      installation          : ex.installation ?? '',
      parentChildInstructions: ex.parentChildInstructions ?? '',
      distanceMeters        : ex.distanceMeters != null ? String(ex.distanceMeters) : '',
      intensity             : ex.intensity ?? '',
      repetitions           : ex.repetitions != null ? String(ex.repetitions) : '',
      demoVideoUrl          : ex.demoVideoUrl ?? '',
      requiredLevel         : ex.requiredLevel ?? '',
      selectedCriteriaIds   : ex.criteriaIds ? [...ex.criteriaIds] : [],
    })
    setExpandedId(null)
  }

  const handleSaveEdit = async (id: string) => {
    setSaving(true)
    try {
      await updateThemeHomeExercise(id, {
        title                  : editForm.title,
        objective              : editForm.objective || null,
        material               : editForm.material || null,
        installation           : editForm.installation || null,
        parentChildInstructions: editForm.parentChildInstructions || null,
        distanceMeters         : editForm.distanceMeters ? parseFloat(editForm.distanceMeters) : null,
        intensity              : editForm.intensity || null,
        repetitions            : editForm.repetitions ? parseInt(editForm.repetitions) : null,
        demoVideoUrl           : editForm.demoVideoUrl || null,
        requiredLevel          : editForm.requiredLevel || null,
      })
      if (editForm.selectedCriteriaIds.length > 0) {
        await setHomeExerciseCriteria(id, editForm.selectedCriteriaIds)
      }
      setEditingId(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet exercice ?')) return
    await deleteThemeHomeExercise(id)
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
            Savoir-faire — Exercices à domicile
          </h2>
          <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
            Exercices pratiques que les joueurs peuvent faire chez eux avec leurs parents.
          </p>
        </div>
        <button style={BTN_GOLD} onClick={() => setShowAdd(!showAdd)}>+ Ajouter</button>
      </div>

      {showAdd && (
        <div style={{ ...CARD_STYLE, marginBottom: 16, border: `2px solid ${colors.accent.gold}40` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL_STYLE}>Titre *</label>
              <input type="text" value={form.title} onChange={setField('title')} style={INPUT_STYLE} placeholder="Nom de l'exercice..." autoFocus />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL_STYLE}>Objectif</label>
              <textarea value={form.objective} onChange={setField('objective')} rows={2} style={TEXTAREA_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Matériel nécessaire</label>
              <input type="text" value={form.material} onChange={setField('material')} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Niveau requis</label>
              <input type="text" value={form.requiredLevel} onChange={setField('requiredLevel')} style={INPUT_STYLE} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL_STYLE}>Installation</label>
              <textarea value={form.installation} onChange={setField('installation')} rows={2} style={TEXTAREA_STYLE} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL_STYLE}>Instructions parent + enfant</label>
              <textarea value={form.parentChildInstructions} onChange={setField('parentChildInstructions')} rows={3} style={TEXTAREA_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Distance (mètres)</label>
              <input type="number" value={form.distanceMeters} onChange={setField('distanceMeters')} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Intensité</label>
              <input type="text" value={form.intensity} onChange={setField('intensity')} style={INPUT_STYLE} placeholder="Ex: faible, modérée, élevée" />
            </div>
            <div>
              <label style={LABEL_STYLE}>Répétitions</label>
              <input type="number" value={form.repetitions} onChange={setField('repetitions')} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Vidéo démo (URL)</label>
              <input type="text" value={form.demoVideoUrl} onChange={setField('demoVideoUrl')} style={INPUT_STYLE} />
            </div>
          </div>

          {/* Critères évalués */}
          <div style={{ marginTop: 16 }}>
            <label style={LABEL_STYLE}>Critères évalués</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {criteria.map(c => {
                const sel = form.selectedCriteriaIds.includes(c.id)
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

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={BTN_GOLD} onClick={handleAdd} disabled={adding}>{adding ? '...' : 'Créer'}</button>
            <button style={BTN_GHOST} onClick={() => { setShowAdd(false); setForm(EMPTY_FORM) }}>Annuler</button>
          </div>
        </div>
      )}

      {exercises.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucun exercice à domicile. Créez des exercices pour que les joueurs pratiquent chez eux.
        </div>
      )}

      {exercises.map(ex => (
        <div key={ex.id} style={{ ...CARD_STYLE, marginBottom: 12 }}>
          {editingId === ex.id ? (
            // Mode édition inline
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Titre *</label>
                  <input type="text" value={editForm.title} onChange={setEditField('title')} style={INPUT_STYLE} autoFocus />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Objectif</label>
                  <textarea value={editForm.objective} onChange={setEditField('objective')} rows={2} style={TEXTAREA_STYLE} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Matériel</label>
                  <input type="text" value={editForm.material} onChange={setEditField('material')} style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Niveau requis</label>
                  <input type="text" value={editForm.requiredLevel} onChange={setEditField('requiredLevel')} style={INPUT_STYLE} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Installation</label>
                  <textarea value={editForm.installation} onChange={setEditField('installation')} rows={2} style={TEXTAREA_STYLE} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>Instructions parent + enfant</label>
                  <textarea value={editForm.parentChildInstructions} onChange={setEditField('parentChildInstructions')} rows={3} style={TEXTAREA_STYLE} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Distance (mètres)</label>
                  <input type="number" value={editForm.distanceMeters} onChange={setEditField('distanceMeters')} style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Intensité</label>
                  <input type="text" value={editForm.intensity} onChange={setEditField('intensity')} style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Répétitions</label>
                  <input type="number" value={editForm.repetitions} onChange={setEditField('repetitions')} style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Vidéo démo (URL)</label>
                  <input type="text" value={editForm.demoVideoUrl} onChange={setEditField('demoVideoUrl')} style={INPUT_STYLE} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={LABEL_STYLE}>Critères évalués</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {criteria.map(c => {
                    const sel = editForm.selectedCriteriaIds.includes(c.id)
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
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button style={BTN_GOLD} onClick={() => handleSaveEdit(ex.id)} disabled={saving}>
                  {saving ? '...' : 'Sauvegarder'}
                </button>
                <button style={BTN_GHOST} onClick={() => setEditingId(null)}>Annuler</button>
              </div>
            </div>
          ) : (
            // Mode lecture
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div
                  style={{ flex: 1, cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: colors.text.dark, marginBottom: 4 }}>
                    🏠 {ex.title}
                  </div>
                  {ex.criteriaIds && ex.criteriaIds.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {ex.criteriaIds.map(cid => {
                        const crit = criteria.find(c => c.id === cid)
                        return crit ? (
                          <span key={cid} style={{ fontSize: 11, backgroundColor: colors.accent.gold + '15', color: colors.accent.gold, padding: '2px 8px', borderRadius: 999, border: `1px solid ${colors.border.gold}` }}>
                            {crit.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }} onClick={() => handleStartEdit(ex)}>✎</button>
                  <button
                    style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11, color: colors.accent.red, borderColor: colors.accent.red + '40' }}
                    onClick={() => handleDelete(ex.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {expandedId === ex.id && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${colors.border.divider}`, paddingTop: 12 }}>
                  {ex.objective && <InfoRow label="Objectif" value={ex.objective} />}
                  {ex.material && <InfoRow label="Matériel" value={ex.material} />}
                  {ex.installation && <InfoRow label="Installation" value={ex.installation} />}
                  {ex.parentChildInstructions && <InfoRow label="Instructions" value={ex.parentChildInstructions} />}
                  {ex.intensity && <InfoRow label="Intensité" value={ex.intensity} />}
                  {ex.distanceMeters != null && <InfoRow label="Distance" value={`${ex.distanceMeters} m`} />}
                  {ex.repetitions != null && <InfoRow label="Répétitions" value={String(ex.repetitions)} />}
                  {ex.demoVideoUrl && (
                    <div style={{ marginBottom: 6 }}>
                      <a href={ex.demoVideoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: colors.accent.gold }}>
                        📹 Voir la vidéo démo
                      </a>
                    </div>
                  )}
                </div>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p style={{ fontSize: 12, color: colors.text.muted, margin: '4px 0' }}>
      <strong style={{ color: colors.text.dark }}>{label} : </strong>{value}
    </p>
  )
}
