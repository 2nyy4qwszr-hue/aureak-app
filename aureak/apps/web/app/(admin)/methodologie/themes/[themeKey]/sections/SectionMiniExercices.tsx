'use client'
import React, { useState, useEffect } from 'react'
import { listThemeMiniExercises, createThemeMiniExercise, updateThemeMiniExercise, deleteThemeMiniExercise } from '@aureak/api-client'
import type { ThemeMiniExercise, Criterion, ThemeSequence } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  themeId  : string
  tenantId : string
  criteria : Criterion[]
  sequences: ThemeSequence[]
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: 1,
  textTransform: 'uppercase', color: colors.text.muted,
  display: 'block', marginBottom: 6,
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: radius.xs,
  border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface,
  color: colors.text.dark, fontSize: 13, fontFamily: 'Poppins, sans-serif',
  outline: 'none', boxSizing: 'border-box',
}

const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, resize: 'vertical' }

const BTN_GOLD: React.CSSProperties = {
  padding: '7px 14px', backgroundColor: colors.accent.gold, color: '#fff',
  border: 'none', borderRadius: radius.button, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'Poppins, sans-serif', transition: `all ${transitions.fast}`,
}

const BTN_GHOST: React.CSSProperties = {
  ...BTN_GOLD, backgroundColor: 'transparent', color: colors.text.muted,
  border: `1px solid ${colors.border.light}`,
}

const EMPTY_FORM = {
  title: '', purpose: '', situation: '', cue: '',
  videoUrl: '', imageUrl: '', criterionId: '', sequenceId: '', sortOrder: 0,
}

export default function SectionMiniExercices({ themeId, tenantId, criteria, sequences }: Props) {
  const [exercises, setExercises] = useState<ThemeMiniExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listThemeMiniExercises(themeId)
      setExercises(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionMiniExercices] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [themeId])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const setEdit = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setEditForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleAdd = async () => {
    if (!form.title.trim()) return
    setAdding(true)
    try {
      await createThemeMiniExercise(themeId, tenantId, {
        title: form.title.trim(),
        purpose: form.purpose || null,
        situation: form.situation || null,
        cue: form.cue || null,
        videoUrl: form.videoUrl || null,
        imageUrl: form.imageUrl || null,
        criterionId: form.criterionId || null,
        sequenceId: form.sequenceId || null,
        sortOrder: exercises.length,
      })
      setForm(EMPTY_FORM)
      setShowAdd(false)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionMiniExercices] handleAdd error:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleEdit = (ex: ThemeMiniExercise) => {
    setEditingId(ex.id)
    setEditForm({
      title: ex.title, purpose: ex.purpose ?? '', situation: ex.situation ?? '',
      cue: ex.cue ?? '', videoUrl: ex.videoUrl ?? '', imageUrl: ex.imageUrl ?? '',
      criterionId: ex.criterionId ?? '', sequenceId: ex.sequenceId ?? '', sortOrder: ex.sortOrder,
    })
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await updateThemeMiniExercise(id, {
        title: editForm.title.trim(),
        purpose: editForm.purpose || null,
        situation: editForm.situation || null,
        cue: editForm.cue || null,
        videoUrl: editForm.videoUrl || null,
        imageUrl: editForm.imageUrl || null,
        criterionId: editForm.criterionId || null,
        sequenceId: editForm.sequenceId || null,
      })
      setEditingId(null)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionMiniExercices] handleSaveEdit error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce mini-exercice ?')) return
    try {
      await deleteThemeMiniExercise(id)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionMiniExercices] handleDelete error:', err)
    }
  }

  const getCriterionLabel = (id: string | null) =>
    id ? (criteria.find(c => c.id === id)?.label ?? id) : null

  const getSequenceLabel = (id: string | null) =>
    id ? (sequences.find(s => s.id === id)?.name ?? id) : null

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1,2].map(i => <div key={i} style={{ height: 80, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 12 }} />)}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Poppins, sans-serif', margin: '0 0 4px' }}>
            Mini-exercices terrain
          </h2>
          <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
            Exercices courts à réaliser directement sur le terrain, ciblant un critère.
          </p>
        </div>
        <button style={BTN_GOLD} onClick={() => setShowAdd(true)}>+ Ajouter</button>
      </div>

      {showAdd && (
        <ExerciseForm
          form={form} setField={set} criteria={criteria} sequences={sequences}
          onSubmit={handleAdd} onCancel={() => { setShowAdd(false); setForm(EMPTY_FORM) }}
          submitting={adding} submitLabel="Créer"
        />
      )}

      {exercises.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucun mini-exercice. Ajoutez des exercices courts liés à vos critères.
        </div>
      )}

      {exercises.map(ex => (
        <div key={ex.id} style={{ ...CARD_STYLE, marginBottom: 12 }}>
          {editingId === ex.id ? (
            <ExerciseForm
              form={editForm} setField={setEdit} criteria={criteria} sequences={sequences}
              onSubmit={() => handleSaveEdit(ex.id)} onCancel={() => setEditingId(null)}
              submitting={false} submitLabel="Sauvegarder"
            />
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: colors.text.dark }}>⚡ {ex.title}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }} onClick={() => handleEdit(ex)}>✎</button>
                  <button style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11, color: colors.accent.red, borderColor: colors.accent.red + '40' }} onClick={() => handleDelete(ex.id)}>🗑</button>
                </div>
              </div>
              {(ex.criterionId || ex.sequenceId) && (
                <div style={{ marginBottom: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ex.criterionId && (
                    <span style={{ fontSize: 11, backgroundColor: colors.accent.gold + '15', color: colors.accent.gold, padding: '2px 8px', borderRadius: 999, border: `1px solid ${colors.border.gold}` }}>
                      Critère : {getCriterionLabel(ex.criterionId)}
                    </span>
                  )}
                  {ex.sequenceId && (
                    <span style={{ fontSize: 11, backgroundColor: colors.accent.gold + '15', color: colors.accent.gold, padding: '2px 8px', borderRadius: 999, border: `1px solid ${colors.border.gold}` }}>
                      Séquence : {getSequenceLabel(ex.sequenceId)}
                    </span>
                  )}
                </div>
              )}
              {ex.purpose && <p style={{ fontSize: 12, color: colors.text.muted, margin: '4px 0' }}><strong>Objectif :</strong> {ex.purpose}</p>}
              {ex.situation && <p style={{ fontSize: 12, color: colors.text.muted, margin: '4px 0' }}><strong>Situation :</strong> {ex.situation}</p>}
              {ex.cue && <p style={{ fontSize: 12, color: colors.text.muted, margin: '4px 0' }}><strong>Cue :</strong> "{ex.cue}"</p>}
              {ex.videoUrl && <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: colors.accent.gold }}>📹 Vidéo</a>}
            </div>
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

function ExerciseForm({
  form, setField, criteria, sequences, onSubmit, onCancel, submitting, submitLabel,
}: {
  form: Record<string, string | number>
  setField: (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  criteria: Criterion[]
  sequences: ThemeSequence[]
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  submitLabel: string
}) {
  const LABEL_STYLE: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: 1,
    textTransform: 'uppercase', color: colors.text.muted,
    display: 'block', marginBottom: 6,
  }
  const INPUT_STYLE: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: radius.xs,
    border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface,
    color: colors.text.dark, fontSize: 13, fontFamily: 'Poppins, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }
  const TEXTAREA_STYLE: React.CSSProperties = { ...INPUT_STYLE, resize: 'vertical' }

  return (
    <div style={{ ...CARD_STYLE, marginBottom: 16, border: `2px solid ${colors.accent.gold}40` }}>
      <div style={{ marginBottom: 12 }}>
        <label style={LABEL_STYLE}>Titre *</label>
        <input type="text" value={form.title as string} onChange={setField('title')} style={INPUT_STYLE} placeholder="Nom de l'exercice..." autoFocus />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={LABEL_STYLE}>Objectif / But</label>
        <textarea value={form.purpose as string} onChange={setField('purpose')} rows={2} style={TEXTAREA_STYLE} placeholder="Ce que le joueur doit développer..." />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={LABEL_STYLE}>Situation de jeu</label>
        <textarea value={form.situation as string} onChange={setField('situation')} rows={2} style={TEXTAREA_STYLE} placeholder="Contexte / mise en place..." />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={LABEL_STYLE}>Mot-clé (cue)</label>
        <input type="text" value={form.cue as string} onChange={setField('cue')} style={INPUT_STYLE} placeholder="Ex: 'Mains à la fenêtre'" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={LABEL_STYLE}>Vidéo (URL)</label>
          <input type="text" value={form.videoUrl as string} onChange={setField('videoUrl')} style={INPUT_STYLE} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Image (URL)</label>
          <input type="text" value={form.imageUrl as string} onChange={setField('imageUrl')} style={INPUT_STYLE} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={LABEL_STYLE}>Critère ciblé</label>
          <select value={form.criterionId as string} onChange={setField('criterionId')} style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
            <option value="">— Aucun critère —</option>
            {criteria.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={LABEL_STYLE}>Séquence liée</label>
          <select value={form.sequenceId as string} onChange={setField('sequenceId')} style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
            <option value="">— Aucune séquence —</option>
            {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ padding: '7px 14px', backgroundColor: colors.accent.gold, color: '#fff', border: 'none', borderRadius: radius.button, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={onSubmit} disabled={submitting}>
          {submitting ? '...' : submitLabel}
        </button>
        <button style={{ padding: '7px 14px', backgroundColor: 'transparent', color: colors.text.muted, border: `1px solid ${colors.border.light}`, borderRadius: radius.button, fontSize: 12, cursor: 'pointer' }} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  )
}
