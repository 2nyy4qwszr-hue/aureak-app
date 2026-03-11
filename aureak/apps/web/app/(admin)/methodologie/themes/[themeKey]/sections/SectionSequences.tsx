'use client'
import React, { useState, useEffect } from 'react'
import {
  listSequencesByTheme, createThemeSequence, updateThemeSequence,
  setSequenceCriteria, listCriteriaLinksBySequenceIds,
} from '@aureak/api-client'
import type { ThemeSequence, Criterion } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  themeId: string
  tenantId: string
  criteria: Criterion[]
}

type SeqWithMeta = ThemeSequence & {
  criteriaIds: string[]
  _open: boolean
  _editing: boolean
  _cues: string[]
  _newCue: string
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

export default function SectionSequences({ themeId, tenantId, criteria }: Props) {
  const [sequences, setSequences] = useState<SeqWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadSequences = async () => {
    setLoading(true)
    const { data: seqs } = await listSequencesByTheme(themeId)
    const allLinks = await listCriteriaLinksBySequenceIds(seqs.map(s => s.id))
    const linksBySeq = new Map<string, string[]>()
    for (const l of allLinks) {
      const arr = linksBySeq.get(l.sequenceId) ?? []
      arr.push(l.criterionId)
      linksBySeq.set(l.sequenceId, arr)
    }
    const withMeta: SeqWithMeta[] = seqs.map(s => ({
      ...s,
      criteriaIds: linksBySeq.get(s.id) ?? [],
      _open      : false,
      _editing   : false,
      _cues      : (s as ThemeSequence).shortCues ?? [],
      _newCue    : '',
    }))
    setSequences(withMeta)
    setLoading(false)
  }

  useEffect(() => { loadSequences() }, [themeId])

  const handleAddSeq = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createThemeSequence({ tenantId, themeId, name: newName.trim(), sortOrder: sequences.length })
      setNewName('')
      setShowAdd(false)
      await loadSequences()
    } finally {
      setAdding(false)
    }
  }

  const toggleOpen = (id: string) =>
    setSequences(prev => prev.map(s => s.id === id ? { ...s, _open: !s._open } : s))

  const toggleEdit = (id: string) =>
    setSequences(prev => prev.map(s => s.id === id ? { ...s, _editing: !s._editing } : s))

  const handleSaveEdit = async (seqId: string) => {
    const seq = sequences.find(s => s.id === seqId)
    if (!seq) return
    setSavingId(seqId)
    try {
      await updateThemeSequence(seqId, {
        description  : seq.description ?? null,
        coachVideoUrl: (seq as SeqWithMeta & { coachVideoUrl?: string }).coachVideoUrl ?? null,
      })
      updateLocal(seqId, { _editing: false })
    } finally {
      setSavingId(null)
    }
  }

  const updateLocal = (id: string, data: Partial<SeqWithMeta>) =>
    setSequences(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))

  const handleToggleCriterion = async (seqId: string, critId: string) => {
    const seq = sequences.find(s => s.id === seqId)
    if (!seq) return
    const newIds = seq.criteriaIds.includes(critId)
      ? seq.criteriaIds.filter(id => id !== critId)
      : [...seq.criteriaIds, critId]
    await setSequenceCriteria(seqId, newIds)
    updateLocal(seqId, { criteriaIds: newIds })
  }

  const handleAddCue = async (seqId: string) => {
    const seq = sequences.find(s => s.id === seqId)
    if (!seq || !seq._newCue.trim()) return
    const newCues = [...seq._cues, seq._newCue.trim()]
    updateLocal(seqId, { _cues: newCues, _newCue: '' })
    await updateThemeSequence(seqId, { shortCues: newCues })
  }

  const handleRemoveCue = async (seqId: string, idx: number) => {
    const seq = sequences.find(s => s.id === seqId)
    if (!seq) return
    const newCues = seq._cues.filter((_, i) => i !== idx)
    updateLocal(seqId, { _cues: newCues })
    await updateThemeSequence(seqId, { shortCues: newCues })
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1,2].map(i => (
        <div key={i} style={{ height: 64, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 12 }} />
      ))}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
            Séquences pédagogiques
          </h2>
          <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
            Les séquences structurent la progression d'apprentissage du thème.
          </p>
        </div>
        <button style={BTN_GOLD} onClick={() => setShowAdd(true)}>+ Ajouter</button>
      </div>

      {showAdd && (
        <div style={{ ...CARD_STYLE, marginBottom: 16, border: `2px solid ${colors.accent.gold}40` }}>
          <label style={LABEL_STYLE}>Nom de la séquence</label>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} style={INPUT_STYLE} placeholder="Ex: Phase d'annonce..." autoFocus onKeyDown={e => e.key === 'Enter' && handleAddSeq()} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button style={BTN_GOLD} onClick={handleAddSeq} disabled={adding}>{adding ? 'Ajout...' : 'Créer'}</button>
            <button style={BTN_GHOST} onClick={() => { setShowAdd(false); setNewName('') }}>Annuler</button>
          </div>
        </div>
      )}

      {sequences.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucune séquence. Créez votre première séquence pédagogique.
        </div>
      )}

      {sequences.map((seq, idx) => (
        <div key={seq.id} style={{ ...CARD_STYLE, marginBottom: 12 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleOpen(seq.id)}
          >
            <span style={{
              width: 28, height: 28, borderRadius: 6,
              backgroundColor: colors.accent.gold + '20', color: colors.accent.gold,
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {idx + 1}
            </span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: colors.text.dark }}>{seq.name}</span>
            {seq.criteriaIds.length > 0 && (
              <span style={{ fontSize: 11, color: colors.text.muted }}>{seq.criteriaIds.length} critère{seq.criteriaIds.length > 1 ? 's' : ''}</span>
            )}
            <button
              style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }}
              onClick={e => { e.stopPropagation(); toggleEdit(seq.id) }}
            >
              ✎ Éditer
            </button>
            <span style={{ color: colors.text.muted, fontSize: 12 }}>{seq._open ? '▲' : '▼'}</span>
          </div>

          {seq._open && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${colors.border.divider}`, paddingTop: 16 }}>
              {seq._editing && (
                <div style={{ marginBottom: 16 }}>
                  <Field label="Métaphore (court)">
                    <textarea value={seq.description ?? ''} onChange={e => updateLocal(seq.id, { description: e.target.value })} rows={2} style={TEXTAREA_STYLE} />
                  </Field>
                  <Field label="Texte coach (court)">
                    <textarea value={(seq as SeqWithMeta & { coachVideoUrl?: string }).coachVideoUrl ?? ''} onChange={e => updateLocal(seq.id, { coachVideoUrl: e.target.value } as Partial<SeqWithMeta>)} rows={2} style={TEXTAREA_STYLE} placeholder="URL vidéo coach..." />
                  </Field>

                  {/* Mots-clés terrain */}
                  <Field label="Mots-clés terrain">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {seq._cues.map((cue, i) => (
                        <span key={i} style={{
                          backgroundColor: colors.accent.gold + '20', color: colors.accent.gold,
                          border: `1px solid ${colors.border.gold}`,
                          borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {cue}
                          <button onClick={() => handleRemoveCue(seq.id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 12, padding: 0 }}>×</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={seq._newCue}
                        onChange={e => updateLocal(seq.id, { _newCue: e.target.value })}
                        style={{ ...INPUT_STYLE, flex: 1 }}
                        placeholder="Ajouter un mot-clé..."
                        onKeyDown={e => e.key === 'Enter' && handleAddCue(seq.id)}
                      />
                      <button style={{ ...BTN_GHOST, flexShrink: 0 }} onClick={() => handleAddCue(seq.id)}>+</button>
                    </div>
                  </Field>
                </div>
              )}

              {/* Critères ciblés */}
              <Field label="Critères ciblés par cette séquence">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {criteria.length === 0 && (
                    <span style={{ fontSize: 12, color: colors.text.muted }}>Aucun critère disponible.</span>
                  )}
                  {criteria.map(crit => {
                    const selected = seq.criteriaIds.includes(crit.id)
                    return (
                      <button
                        key={crit.id}
                        onClick={() => handleToggleCriterion(seq.id, crit.id)}
                        style={{
                          padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                          border: `1px solid ${selected ? colors.accent.gold : colors.border.light}`,
                          backgroundColor: selected ? colors.accent.gold + '20' : 'transparent',
                          color: selected ? colors.accent.gold : colors.text.muted,
                          transition: `all ${transitions.fast}`,
                        }}
                      >
                        {crit.label}
                      </button>
                    )
                  })}
                </div>
              </Field>

              {seq._editing && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={BTN_GOLD}
                    onClick={() => handleSaveEdit(seq.id)}
                    disabled={savingId === seq.id}
                  >
                    {savingId === seq.id ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button style={BTN_GHOST} onClick={() => toggleEdit(seq.id)}>Annuler</button>
                </div>
              )}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  )
}
