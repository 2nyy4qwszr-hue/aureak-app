'use client'
import React, { useState, useEffect } from 'react'
import {
  createCriterion, listCriteriaByTheme,
  updateCriterionExtended, deleteCriterionById,
  createFault, updateFaultExtended, deleteFaultById,
  listFaultsByTheme,
} from '@aureak/api-client'
import type { Criterion, Fault, ThemeSequence, ThemeMetaphor } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  themeId          : string
  tenantId         : string
  criteria         : Criterion[]
  onCriteriaChange : (c: Criterion[]) => void
  sequences        : ThemeSequence[]
  metaphors        : ThemeMetaphor[]
}

type FaultWithEdit = Fault & { _editing?: boolean }
type CriterionWithFaults = Criterion & {
  faults: FaultWithEdit[]
  _open?: boolean
  _editing?: boolean
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

const BTN_DANGER: React.CSSProperties = {
  ...BTN_GHOST, color: colors.status.errorStrong, borderColor: colors.status.errorStrong + '40',
}

const BADGE_SEQ: React.CSSProperties = {
  fontSize: 11, fontWeight: 600,
  backgroundColor: colors.accent.gold + '15',
  color: colors.accent.gold,
  border: `1px solid ${colors.border.gold}`,
  borderRadius: 999, padding: '3px 10px',
}

const BADGE_META: React.CSSProperties = {
  fontSize: 11, fontWeight: 600,
  backgroundColor: colors.status.info + '20',
  color: colors.status.info,
  border: `1px solid ${colors.status.info}40`,
  borderRadius: 999, padding: '3px 10px',
}

export default function SectionCriteres({ themeId, tenantId, criteria, onCriteriaChange, sequences, metaphors }: Props) {
  const [tree, setTree] = useState<CriterionWithFaults[]>([])
  const [freeFaults, setFreeFaults] = useState<FaultWithEdit[]>([])
  const [loading, setLoading] = useState(true)

  // Add criterion form
  const [showAddCrit, setShowAddCrit]         = useState(false)
  const [newCritLabel, setNewCritLabel]       = useState('')
  const [newCritSeqId, setNewCritSeqId]       = useState('')
  const [newCritMetaId, setNewCritMetaId]     = useState('')
  const [addingCrit, setAddingCrit]           = useState(false)

  // Add fault: per criterion
  const [showAddFault, setShowAddFault]   = useState<Record<string, boolean>>({})
  const [newFaultLabel, setNewFaultLabel] = useState<Record<string, string>>({})
  const [addingFault, setAddingFault]     = useState<Record<string, boolean>>({})

  // Add free fault form
  const [showAddFreeFault, setShowAddFreeFault] = useState(false)
  const [newFreeFaultLabel, setNewFreeFaultLabel] = useState('')
  const [newFreeFaultCritId, setNewFreeFaultCritId] = useState('')
  const [addingFreeFault, setAddingFreeFault] = useState(false)

  const loadTree = async () => {
    setLoading(true)
    try {
      const crits = await listCriteriaByTheme(themeId)
      const allFaults = await listFaultsByTheme(themeId)
      const faultsByCrit = new Map<string, typeof allFaults>()
      for (const f of allFaults) {
        if (f.criterionId) {
          const arr = faultsByCrit.get(f.criterionId) ?? []
          arr.push(f)
          faultsByCrit.set(f.criterionId, arr)
        }
      }
      const withFaults: CriterionWithFaults[] = crits.map(c => ({
        ...c,
        faults  : faultsByCrit.get(c.id) ?? [],
        _open   : false,
        _editing: false,
      }))
      setTree(withFaults)
      setFreeFaults(allFaults.filter(f => f.criterionId === null))
      onCriteriaChange(crits)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] loadTree error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTree() }, [themeId])

  const toggleOpen = (id: string) =>
    setTree(prev => prev.map(c => c.id === id ? { ...c, _open: !c._open } : c))

  const toggleEdit = (id: string) =>
    setTree(prev => prev.map(c => c.id === id ? { ...c, _editing: !c._editing } : c))

  const toggleEditFault = (critId: string, faultId: string) =>
    setTree(prev => prev.map(c => c.id === critId
      ? { ...c, faults: c.faults.map(f => f.id === faultId ? { ...f, _editing: !f._editing } : f) }
      : c
    ))

  const updateLocalCrit = (id: string, data: Partial<Criterion>) =>
    setTree(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))

  const updateLocalFault = (critId: string, faultId: string, data: Partial<Fault>) =>
    setTree(prev => prev.map(c => c.id === critId
      ? { ...c, faults: c.faults.map(f => f.id === faultId ? { ...f, ...data } : f) }
      : c
    ))

  const handleAddCriterion = async () => {
    if (!newCritLabel.trim()) return
    setAddingCrit(true)
    try {
      const { error } = await createCriterion({
        tenantId,
        themeId,
        label     : newCritLabel.trim(),
        sortOrder : tree.length,
        sequenceId: newCritSeqId || null,
        metaphorId: newCritMetaId || null,
      })
      if (error) throw error
      setNewCritLabel('')
      setNewCritSeqId('')
      setNewCritMetaId('')
      setShowAddCrit(false)
      await loadTree()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] handleAddCriterion error:', err)
    } finally {
      setAddingCrit(false)
    }
  }

  const handleSaveCriterion = async (c: CriterionWithFaults) => {
    try {
      await updateCriterionExtended(c.id, {
        label                : c.label,
        description          : c.description ?? undefined,
        whyImportant         : c.whyImportant,
        minLevel             : c.minLevel,
        logicalOrder         : c.logicalOrder,
        goodExecutionVideoUrl: c.goodExecutionVideoUrl,
        goodExecutionImageUrl: c.goodExecutionImageUrl,
        sequenceId           : c.sequenceId,
        metaphorId           : c.metaphorId,
      })
      toggleEdit(c.id)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] handleSaveCriterion error:', err)
    }
  }

  const handleDeleteCriterion = async (id: string) => {
    if (!window.confirm('Supprimer ce critère ? Les erreurs associées resteront disponibles dans la liste des erreurs libres.')) return
    try {
      await deleteCriterionById(id)
      await loadTree()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] handleDeleteCriterion error:', err)
    }
  }

  const handleAddFault = async (criterionId: string) => {
    const label = newFaultLabel[criterionId]?.trim()
    if (!label) return
    setAddingFault(prev => ({ ...prev, [criterionId]: true }))
    try {
      const { error } = await createFault({ tenantId, themeId, criterionId, label })
      if (error) throw error
      setNewFaultLabel(prev => ({ ...prev, [criterionId]: '' }))
      setShowAddFault(prev => ({ ...prev, [criterionId]: false }))
      await loadTree()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] handleAddFault error:', err)
    } finally {
      setAddingFault(prev => ({ ...prev, [criterionId]: false }))
    }
  }

  const handleAddFreeFault = async () => {
    const label = newFreeFaultLabel.trim()
    if (!label) return
    setAddingFreeFault(true)
    try {
      const { error } = await createFault({
        tenantId,
        themeId,
        criterionId: newFreeFaultCritId || null,
        label,
      })
      if (error) throw error
      setNewFreeFaultLabel('')
      setNewFreeFaultCritId('')
      setShowAddFreeFault(false)
      await loadTree()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] handleAddFreeFault error:', err)
    } finally {
      setAddingFreeFault(false)
    }
  }

  const handleLinkFaultToCriterion = async (faultId: string, criterionId: string) => {
    try {
      await updateFaultExtended(faultId, { criterionId: criterionId || null })
      await loadTree()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] handleLinkFaultToCriterion error:', err)
    }
  }

  const handleSaveFault = async (critId: string, f: FaultWithEdit) => {
    try {
      await updateFaultExtended(f.id, {
        label              : f.label,
        description        : f.description ?? undefined,
        visibleSign        : f.visibleSign,
        probableCause      : f.probableCause,
        correctionWording  : f.correctionWording,
        coachingPhrase     : f.coachingPhrase,
        practicalAdjustment: f.practicalAdjustment,
        correctiveVideoUrl : f.correctiveVideoUrl,
        correctiveImageUrl : f.correctiveImageUrl,
      })
      toggleEditFault(critId, f.id)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] handleSaveFault error:', err)
    }
  }

  const handleDeleteFault = async (faultId: string) => {
    if (!window.confirm('Supprimer cette erreur ?')) return
    try {
      await deleteFaultById(faultId)
      await loadTree()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionCriteres] handleDeleteFault error:', err)
    }
  }

  const getSeqLabel  = (id: string) => sequences.find(s => s.id === id)?.name ?? id
  const getMetaLabel = (id: string) => metaphors.find(m => m.id === id)?.title ?? id

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 64, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 12 }} />
      ))}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
            Critères de réussite
          </h2>
          <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
            Colonne vertébrale du dossier pédagogique. Chaque critère peut contenir des erreurs fréquentes.
          </p>
        </div>
        <button style={BTN_GOLD} onClick={() => setShowAddCrit(true)}>
          + Ajouter un critère
        </button>
      </div>

      {/* Formulaire ajout critère */}
      {showAddCrit && (
        <div style={{ ...CARD_STYLE, marginBottom: 16, border: `2px solid ${colors.accent.gold}40` }}>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Libellé du critère *</label>
            <input
              type="text"
              value={newCritLabel}
              onChange={e => setNewCritLabel(e.target.value)}
              style={INPUT_STYLE}
              placeholder="Ex: Le gardien maintient ses mains en position de base..."
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAddCriterion()}
            />
          </div>

          {/* Sélecteur séquence — exclusif avec métaphore */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Lier à une séquence (optionnel)</label>
            <select
              value={newCritSeqId}
              onChange={e => { setNewCritSeqId(e.target.value); if (e.target.value) setNewCritMetaId('') }}
              style={SELECT_STYLE}
            >
              <option value="">— Aucune séquence —</option>
              {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Sélecteur métaphore — exclusif avec séquence */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Lier à une métaphore (optionnel)</label>
            <select
              value={newCritMetaId}
              onChange={e => { setNewCritMetaId(e.target.value); if (e.target.value) setNewCritSeqId('') }}
              style={SELECT_STYLE}
            >
              <option value="">— Aucune métaphore —</option>
              {metaphors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={BTN_GOLD} onClick={handleAddCriterion} disabled={addingCrit}>
              {addingCrit ? 'Ajout...' : 'Ajouter'}
            </button>
            <button style={BTN_GHOST} onClick={() => { setShowAddCrit(false); setNewCritLabel(''); setNewCritSeqId(''); setNewCritMetaId('') }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {tree.length === 0 && !showAddCrit && freeFaults.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucun critère défini. Ajoutez votre premier critère de réussite.
        </div>
      )}

      {tree.map((crit, idx) => (
        <div key={crit.id} style={{ ...CARD_STYLE, marginBottom: 12 }}>
          {/* Header critère */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleOpen(crit.id)}
          >
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              backgroundColor: colors.accent.gold + '20',
              color: colors.accent.gold, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {idx + 1}
            </span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: colors.text.dark }}>
              {crit.label}
            </span>
            {/* Badge liaison */}
            {!crit._editing && crit.sequenceId && (
              <span style={BADGE_SEQ}>{getSeqLabel(crit.sequenceId)}</span>
            )}
            {!crit._editing && crit.metaphorId && (
              <span style={BADGE_META}>{getMetaLabel(crit.metaphorId)}</span>
            )}
            {crit.faults.length > 0 && (
              <span style={{ fontSize: 11, color: colors.text.muted }}>
                {crit.faults.length} erreur{crit.faults.length > 1 ? 's' : ''}
              </span>
            )}
            <button
              style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }}
              onClick={e => { e.stopPropagation(); toggleEdit(crit.id) }}
            >
              ✎
            </button>
            <button
              style={{ ...BTN_DANGER, padding: '4px 8px', fontSize: 11 }}
              onClick={e => { e.stopPropagation(); handleDeleteCriterion(crit.id) }}
            >
              🗑
            </button>
            <span style={{ color: colors.text.muted, fontSize: 12 }}>{crit._open ? '▲' : '▼'}</span>
          </div>

          {/* Body critère */}
          {crit._open && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${colors.border.divider}`, paddingTop: 16 }}>
              {crit._editing ? (
                <div>
                  <Field label="Libellé">
                    <input type="text" value={crit.label} onChange={e => updateLocalCrit(crit.id, { label: e.target.value })} style={INPUT_STYLE} />
                  </Field>
                  <Field label="Description">
                    <textarea value={crit.description ?? ''} onChange={e => updateLocalCrit(crit.id, { description: e.target.value })} rows={2} style={TEXTAREA_STYLE} />
                  </Field>
                  <Field label="Pourquoi important ?">
                    <textarea value={crit.whyImportant ?? ''} onChange={e => updateLocalCrit(crit.id, { whyImportant: e.target.value })} rows={2} style={TEXTAREA_STYLE} />
                  </Field>
                  <Field label="Niveau minimum requis">
                    <input type="text" value={crit.minLevel ?? ''} onChange={e => updateLocalCrit(crit.id, { minLevel: e.target.value })} style={INPUT_STYLE} />
                  </Field>
                  <Field label="Ordre logique">
                    <input type="number" value={crit.logicalOrder} onChange={e => updateLocalCrit(crit.id, { logicalOrder: parseInt(e.target.value) || 0 })} style={{ ...INPUT_STYLE, width: 80 }} />
                  </Field>
                  <Field label="Vidéo bonne exécution (URL)">
                    <input type="text" value={crit.goodExecutionVideoUrl ?? ''} onChange={e => updateLocalCrit(crit.id, { goodExecutionVideoUrl: e.target.value })} style={INPUT_STYLE} />
                  </Field>
                  <Field label="Image bonne exécution (URL)">
                    <input type="text" value={crit.goodExecutionImageUrl ?? ''} onChange={e => updateLocalCrit(crit.id, { goodExecutionImageUrl: e.target.value })} style={INPUT_STYLE} />
                  </Field>

                  {/* Sélecteur séquence — exclusif avec métaphore */}
                  <Field label="Lier à une séquence">
                    <select
                      value={crit.sequenceId ?? ''}
                      onChange={e => updateLocalCrit(crit.id, {
                        sequenceId: e.target.value || null,
                        ...(e.target.value ? { metaphorId: null } : {}),
                      })}
                      style={SELECT_STYLE}
                    >
                      <option value="">— Aucune séquence —</option>
                      {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>

                  {/* Sélecteur métaphore — exclusif avec séquence */}
                  <Field label="Lier à une métaphore">
                    <select
                      value={crit.metaphorId ?? ''}
                      onChange={e => updateLocalCrit(crit.id, {
                        metaphorId: e.target.value || null,
                        ...(e.target.value ? { sequenceId: null } : {}),
                      })}
                      style={SELECT_STYLE}
                    >
                      <option value="">— Aucune métaphore —</option>
                      {metaphors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </Field>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button style={BTN_GOLD} onClick={() => handleSaveCriterion(crit)}>Sauvegarder</button>
                    <button style={BTN_GHOST} onClick={() => toggleEdit(crit.id)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {crit.description && <p style={{ fontSize: 13, color: colors.text.muted, margin: '0 0 8px' }}>{crit.description}</p>}
                  {crit.whyImportant && <InfoRow label="Pourquoi" value={crit.whyImportant} />}
                  {crit.minLevel && <InfoRow label="Niveau min" value={crit.minLevel} />}
                  {crit.goodExecutionVideoUrl && <InfoRow label="Vidéo exécution" value={crit.goodExecutionVideoUrl} isUrl />}
                  {crit.goodExecutionImageUrl && <InfoRow label="Image exécution" value={crit.goodExecutionImageUrl} isUrl />}
                </div>
              )}

              {/* Erreurs fréquentes */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.text.subtle }}>
                    Erreurs fréquentes
                  </span>
                  <button
                    style={{ ...BTN_GHOST, padding: '4px 10px', fontSize: 11 }}
                    onClick={() => setShowAddFault(prev => ({ ...prev, [crit.id]: true }))}
                  >
                    + Ajouter une erreur
                  </button>
                </div>

                {showAddFault[crit.id] && (
                  <div style={{ backgroundColor: colors.light.muted, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${colors.border.light}` }}>
                    <label style={LABEL_STYLE}>Libellé de l'erreur</label>
                    <input
                      type="text"
                      value={newFaultLabel[crit.id] ?? ''}
                      onChange={e => setNewFaultLabel(prev => ({ ...prev, [crit.id]: e.target.value }))}
                      style={INPUT_STYLE}
                      placeholder="Ex: Mains trop basses lors de la sortie..."
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleAddFault(crit.id)}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button style={{ ...BTN_GOLD, fontSize: 11, padding: '5px 10px' }} onClick={() => handleAddFault(crit.id)} disabled={addingFault[crit.id]}>
                        {addingFault[crit.id] ? '...' : 'Ajouter'}
                      </button>
                      <button style={{ ...BTN_GHOST, fontSize: 11, padding: '5px 10px' }} onClick={() => setShowAddFault(prev => ({ ...prev, [crit.id]: false }))}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {crit.faults.map(fault => (
                  <div key={fault.id} style={{
                    backgroundColor: colors.light.muted,
                    borderRadius: 8, padding: 12, marginBottom: 8,
                    border: `1px solid ${colors.border.light}`,
                    marginLeft: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: fault._editing ? 12 : 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark }}>
                        ⚠ {fault.label}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...BTN_GHOST, padding: '3px 7px', fontSize: 11 }} onClick={() => toggleEditFault(crit.id, fault.id)}>✎</button>
                        <button style={{ ...BTN_DANGER, padding: '3px 7px', fontSize: 11 }} onClick={() => handleDeleteFault(fault.id)}>🗑</button>
                      </div>
                    </div>

                    {fault._editing ? (
                      <div>
                        <Field label="Libellé">
                          <input type="text" value={fault.label} onChange={e => updateLocalFault(crit.id, fault.id, { label: e.target.value })} style={INPUT_STYLE} />
                        </Field>
                        <Field label="Description">
                          <textarea value={fault.description ?? ''} onChange={e => updateLocalFault(crit.id, fault.id, { description: e.target.value })} rows={2} style={TEXTAREA_STYLE} />
                        </Field>
                        <Field label="Signe visible">
                          <input type="text" value={fault.visibleSign ?? ''} onChange={e => updateLocalFault(crit.id, fault.id, { visibleSign: e.target.value })} style={INPUT_STYLE} />
                        </Field>
                        <Field label="Cause probable">
                          <textarea value={fault.probableCause ?? ''} onChange={e => updateLocalFault(crit.id, fault.id, { probableCause: e.target.value })} rows={2} style={TEXTAREA_STYLE} />
                        </Field>
                        <Field label="Formulation correction">
                          <textarea value={fault.correctionWording ?? ''} onChange={e => updateLocalFault(crit.id, fault.id, { correctionWording: e.target.value })} rows={2} style={TEXTAREA_STYLE} />
                        </Field>
                        <Field label="Mot-clé coach (phrase coaching)">
                          <input type="text" value={fault.coachingPhrase ?? ''} onChange={e => updateLocalFault(crit.id, fault.id, { coachingPhrase: e.target.value })} style={INPUT_STYLE} />
                        </Field>
                        <Field label="Ajustement pratique">
                          <textarea value={fault.practicalAdjustment ?? ''} onChange={e => updateLocalFault(crit.id, fault.id, { practicalAdjustment: e.target.value })} rows={2} style={TEXTAREA_STYLE} />
                        </Field>
                        <Field label="Vidéo corrective (URL)">
                          <input type="text" value={fault.correctiveVideoUrl ?? ''} onChange={e => updateLocalFault(crit.id, fault.id, { correctiveVideoUrl: e.target.value })} style={INPUT_STYLE} />
                        </Field>
                        <Field label="Image corrective (URL)">
                          <input type="text" value={fault.correctiveImageUrl ?? ''} onChange={e => updateLocalFault(crit.id, fault.id, { correctiveImageUrl: e.target.value })} style={INPUT_STYLE} />
                        </Field>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button style={{ ...BTN_GOLD, fontSize: 11, padding: '5px 10px' }} onClick={() => handleSaveFault(crit.id, fault)}>Sauvegarder</button>
                          <button style={{ ...BTN_GHOST, fontSize: 11, padding: '5px 10px' }} onClick={() => toggleEditFault(crit.id, fault.id)}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                        {fault.visibleSign && <InfoRow label="Signe visible" value={fault.visibleSign} />}
                        {fault.probableCause && <InfoRow label="Cause" value={fault.probableCause} />}
                        {fault.correctionWording && <InfoRow label="Correction" value={fault.correctionWording} />}
                        {fault.coachingPhrase && <InfoRow label="Phrase coach" value={`"${fault.coachingPhrase}"`} />}
                        {fault.practicalAdjustment && <InfoRow label="Ajustement" value={fault.practicalAdjustment} />}
                        {fault.correctiveVideoUrl && <InfoRow label="Vidéo" value={fault.correctiveVideoUrl} isUrl />}
                      </div>
                    )}
                  </div>
                ))}

                {crit.faults.length === 0 && !showAddFault[crit.id] && (
                  <p style={{ fontSize: 12, color: colors.text.subtle, marginLeft: 16 }}>Aucune erreur définie.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ── Erreurs libres ─────────────────────────────────────────────────────── */}
      {freeFaults.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
            textTransform: 'uppercase', color: colors.status.errorStrong,
            marginBottom: 12 }}>
            ⚠ Erreurs libres ({freeFaults.length})
          </div>
          {freeFaults.map(fault => (
            <div key={fault.id} style={{
              ...CARD_STYLE,
              marginBottom: 8,
              border: `1px solid ${colors.status.errorStrong}30`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark }}>
                  ⚠ {fault.label}
                </span>
                <button
                  style={{ ...BTN_DANGER, padding: '3px 7px', fontSize: 11 }}
                  onClick={() => handleDeleteFault(fault.id)}
                >
                  🗑
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value=""
                  onChange={e => { if (e.target.value) handleLinkFaultToCriterion(fault.id, e.target.value) }}
                  style={{ ...SELECT_STYLE, width: 'auto', minWidth: 200, fontSize: 12 }}
                >
                  <option value="">— Lier à un critère —</option>
                  {tree.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Ajouter une erreur libre ──────────────────────────────────────────── */}
      {showAddFreeFault ? (
        <div style={{ ...CARD_STYLE, marginTop: 12, border: `2px solid ${colors.status.errorStrong}30` }}>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Libellé de l'erreur libre *</label>
            <input
              type="text"
              value={newFreeFaultLabel}
              onChange={e => setNewFreeFaultLabel(e.target.value)}
              style={INPUT_STYLE}
              placeholder="Ex: Mains trop basses lors de la sortie..."
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAddFreeFault()}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Lier à un critère (optionnel)</label>
            <select
              value={newFreeFaultCritId}
              onChange={e => setNewFreeFaultCritId(e.target.value)}
              style={SELECT_STYLE}
            >
              <option value="">— Aucun critère —</option>
              {tree.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={BTN_GOLD} onClick={handleAddFreeFault} disabled={addingFreeFault}>
              {addingFreeFault ? 'Ajout...' : 'Ajouter'}
            </button>
            <button style={BTN_GHOST} onClick={() => { setShowAddFreeFault(false); setNewFreeFaultLabel(''); setNewFreeFaultCritId('') }}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          style={{ ...BTN_GHOST, marginTop: 12, fontSize: 12 }}
          onClick={() => setShowAddFreeFault(true)}
        >
          + Ajouter une erreur libre
        </button>
      )}
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
    <div style={{ marginBottom: 12 }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ label, value, isUrl }: { label: string; value: string; isUrl?: boolean }) {
  return (
    <div style={{ fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: colors.text.muted, fontWeight: 600 }}>{label}: </span>
      {isUrl ? (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent.gold }}>
          {value.length > 50 ? value.slice(0, 50) + '...' : value}
        </a>
      ) : (
        <span style={{ color: colors.text.dark }}>{value}</span>
      )}
    </div>
  )
}
