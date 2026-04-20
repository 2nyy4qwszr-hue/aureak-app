'use client'
import React, { useState, useEffect, useMemo } from 'react'
import {
  listSequencesByTheme, listMetaphorsByTheme, listCriteriaByTheme,
  listFaultsByTheme, listThemeMiniExercises,
  updateThemeMetaphor, updateCriterionExtended, updateFaultExtended,
  updateThemeMiniExercise,
} from '@aureak/api-client'
import type { ThemeSequence, ThemeMetaphor, Criterion, Fault, ThemeMiniExercise } from '@aureak/types'
import { colors, shadows, radius } from '@aureak/theme'

type Props = {
  themeId          : string
  onFreeCountChange: (n: number) => void
}

type CriterionNode = Criterion & { faults: Fault[] }
// M2 fix: MetaphorNode carries its criteria sub-tree
type MetaphorNode  = ThemeMetaphor & { criteria: CriterionNode[] }
type SequenceNode  = ThemeSequence & {
  metaphors    : MetaphorNode[]
  criteria     : CriterionNode[]
  miniExercises: ThemeMiniExercise[]
}
type HierarchyData = {
  sequences        : SequenceNode[]
  freeMetaphors    : MetaphorNode[]   // métaphores sans séquence (peuvent avoir des critères liés)
  freeCriteria     : CriterionNode[]  // critères sans sequenceId ET sans metaphorId
  freeMiniExercises: ThemeMiniExercise[]
  freeFaults       : Fault[]          // erreurs sans criterionId
}

// H1 fix: criteria with metaphorId but no sequenceId are placed under their metaphor
function buildHierarchy(
  sequences    : ThemeSequence[],
  metaphors    : ThemeMetaphor[],
  criteria     : Criterion[],
  faults       : Fault[],
  miniExercises: ThemeMiniExercise[],
): HierarchyData {
  const seqMap = new Map<string, SequenceNode>()
  for (const seq of sequences) {
    seqMap.set(seq.id, { ...seq, metaphors: [], criteria: [], miniExercises: [] })
  }

  const critMap = new Map<string, CriterionNode>()
  for (const c of criteria) {
    critMap.set(c.id, { ...c, faults: [] })
  }
  for (const f of faults) {
    if (f.criterionId && critMap.has(f.criterionId)) {
      critMap.get(f.criterionId)!.faults.push(f)
    }
  }

  // Build MetaphorNodes and a map for criterion assignment
  const metaphorMap = new Map<string, MetaphorNode>()
  const freeMetaphors: MetaphorNode[] = []
  for (const m of metaphors) {
    const mn: MetaphorNode = { ...m, criteria: [] }
    metaphorMap.set(m.id, mn)
    if (m.sequenceId && seqMap.has(m.sequenceId)) {
      seqMap.get(m.sequenceId)!.metaphors.push(mn)
    } else {
      freeMetaphors.push(mn)
    }
  }

  // Distribute criteria: sequenceId > metaphorId > free
  const freeCriteria: CriterionNode[] = []
  for (const [, cn] of critMap) {
    if (cn.sequenceId && seqMap.has(cn.sequenceId)) {
      seqMap.get(cn.sequenceId)!.criteria.push(cn)
    } else if (cn.metaphorId && metaphorMap.has(cn.metaphorId)) {
      metaphorMap.get(cn.metaphorId)!.criteria.push(cn)
    } else {
      freeCriteria.push(cn)
    }
  }

  const freeMiniExercises: ThemeMiniExercise[] = []
  for (const me of miniExercises) {
    if (me.sequenceId && seqMap.has(me.sequenceId)) {
      seqMap.get(me.sequenceId)!.miniExercises.push(me)
    } else {
      freeMiniExercises.push(me)
    }
  }

  const freeFaults = faults.filter(f => !f.criterionId)

  return {
    sequences        : [...seqMap.values()],
    freeMetaphors,
    freeCriteria,
    freeMiniExercises,
    freeFaults,
  }
}

export default function SectionOrganisation({ themeId, onFreeCountChange }: Props) {
  const [sequences,     setSequences]     = useState<ThemeSequence[]>([])
  const [metaphors,     setMetaphors]     = useState<ThemeMetaphor[]>([])
  const [criteria,      setCriteria]      = useState<Criterion[]>([])
  const [faults,        setFaults]        = useState<Fault[]>([])
  const [miniExercises, setMiniExercises] = useState<ThemeMiniExercise[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: seqs }, metas, crits, faultsData, exos] = await Promise.all([
        listSequencesByTheme(themeId),
        listMetaphorsByTheme(themeId),
        listCriteriaByTheme(themeId),
        listFaultsByTheme(themeId),
        listThemeMiniExercises(themeId),
      ])
      setSequences(seqs ?? [])
      setMetaphors(metas)
      setCriteria(crits)
      setFaults(faultsData)
      setMiniExercises(exos)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionOrganisation] load error:', err)
      setError('Erreur lors du chargement des données pédagogiques.')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [themeId])

  const hierarchy = useMemo(
    () => buildHierarchy(sequences, metaphors, criteria, faults, miniExercises),
    [sequences, metaphors, criteria, faults, miniExercises],
  )

  const freeCount = hierarchy.freeMetaphors.length + hierarchy.freeCriteria.length +
    hierarchy.freeMiniExercises.length + hierarchy.freeFaults.length

  useEffect(() => { onFreeCountChange(freeCount) }, [freeCount, onFreeCountChange])

  // M2 fix: surgical rollback — reverts only the specific item, not the entire array
  const reassignMetaphor = async (id: string, newSeqId: string | null) => {
    const originalSeqId = metaphors.find(m => m.id === id)?.sequenceId ?? null
    setMetaphors(ms => ms.map(m => m.id === id ? { ...m, sequenceId: newSeqId } : m))
    try {
      await updateThemeMetaphor(id, { sequenceId: newSeqId })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionOrganisation] reassignMetaphor error:', err)
      setMetaphors(ms => ms.map(m => m.id === id ? { ...m, sequenceId: originalSeqId } : m))
    }
  }

  const reassignCriterion = async (id: string, newSeqId: string | null) => {
    const original = criteria.find(c => c.id === id)
    const originalSeqId  = original?.sequenceId  ?? null
    const originalMetId  = original?.metaphorId  ?? null
    // L1 fix: clear metaphorId when explicitly assigning to a sequence
    const clearMetaphor = newSeqId !== null && !!original?.metaphorId
    setCriteria(cs => cs.map(c => c.id === id
      ? { ...c, sequenceId: newSeqId, ...(clearMetaphor ? { metaphorId: null } : {}) }
      : c
    ))
    try {
      await updateCriterionExtended(id, {
        sequenceId: newSeqId,
        ...(clearMetaphor ? { metaphorId: null } : {}),
      })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionOrganisation] reassignCriterion error:', err)
      setCriteria(cs => cs.map(c => c.id === id
        ? { ...c, sequenceId: originalSeqId, ...(clearMetaphor ? { metaphorId: originalMetId } : {}) }
        : c
      ))
    }
  }

  // M1 fix: reassign criterion's metaphorId
  const reassignCriterionMetaphor = async (id: string, newMetId: string | null) => {
    const originalMetId = criteria.find(c => c.id === id)?.metaphorId ?? null
    setCriteria(cs => cs.map(c => c.id === id ? { ...c, metaphorId: newMetId } : c))
    try {
      await updateCriterionExtended(id, { metaphorId: newMetId })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionOrganisation] reassignCriterionMetaphor error:', err)
      setCriteria(cs => cs.map(c => c.id === id ? { ...c, metaphorId: originalMetId } : c))
    }
  }

  const reassignFault = async (id: string, newCritId: string | null) => {
    const originalCritId = faults.find(f => f.id === id)?.criterionId ?? null
    setFaults(fs => fs.map(f => f.id === id ? { ...f, criterionId: newCritId } : f))
    try {
      await updateFaultExtended(id, { criterionId: newCritId })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionOrganisation] reassignFault error:', err)
      setFaults(fs => fs.map(f => f.id === id ? { ...f, criterionId: originalCritId } : f))
    }
  }

  const reassignMiniExercise = async (id: string, newSeqId: string | null) => {
    const originalSeqId = miniExercises.find(m => m.id === id)?.sequenceId ?? null
    setMiniExercises(ms => ms.map(m => m.id === id ? { ...m, sequenceId: newSeqId } : m))
    try {
      await updateThemeMiniExercise(id, { sequenceId: newSeqId })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionOrganisation] reassignMiniExercise error:', err)
      setMiniExercises(ms => ms.map(m => m.id === id ? { ...m, sequenceId: originalSeqId } : m))
    }
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 120, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 16 }} />
      ))}
    </div>
  )

  if (error) return (
    <div style={{ padding: 20, color: colors.accent.red, fontSize: 13 }}>
      {error}
    </div>
  )

  const seqOptions: React.ReactNode[] = [
    <option key="__none" value="">— Sans séquence —</option>,
    ...sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>),
  ]

  const critOptions: React.ReactNode[] = [
    <option key="__none" value="">— Sans critère —</option>,
    ...criteria.map(c => <option key={c.id} value={c.id}>{c.label}</option>),
  ]

  const metOptions: React.ReactNode[] = [
    <option key="__none" value="">— Sans métaphore —</option>,
    ...metaphors.map(m => <option key={m.id} value={m.id}>{m.title}</option>),
  ]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Poppins, sans-serif', margin: '0 0 4px' }}>
          Organisation pédagogique
        </h2>
        <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
          Vue hiérarchique complète. Déplacez les éléments via les sélecteurs inline. La création se fait dans les sections dédiées.
        </p>
      </div>

      {sequences.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: colors.text.muted, fontSize: 13 }}>
          Aucune séquence pédagogique. Créez-en une dans l'onglet "Séquences pédagogiques".
        </div>
      )}

      {hierarchy.sequences.map(seq => (
        <div key={seq.id} style={{ ...CARD, marginBottom: 20 }}>
          <div style={SEQ_HEADER}>
            <span style={{ fontSize: 14 }}>📖</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: colors.text.dark }}>{seq.name}</span>
          </div>

          {seq.metaphors.length > 0 && (
            <SubSection label="Métaphores" icon="💡" count={seq.metaphors.length}>
              {seq.metaphors.map(m => (
                <div key={m.id}>
                  <ItemRow label={m.title} icon="💡">
                    <InlineSelect label="Séquence" value={m.sequenceId ?? ''} options={seqOptions}
                      onChange={v => reassignMetaphor(m.id, v || null)} />
                  </ItemRow>
                  {m.criteria.map(cn => (
                    <CriterionWithFaults key={cn.id} cn={cn} nested
                      seqOptions={seqOptions} metOptions={metOptions} critOptions={critOptions}
                      onReassignCriterion={reassignCriterion} onReassignCriterionMetaphor={reassignCriterionMetaphor}
                      onReassignFault={reassignFault} />
                  ))}
                </div>
              ))}
            </SubSection>
          )}

          {seq.criteria.length > 0 && (
            <SubSection label="Critères" icon="🎯" count={seq.criteria.length}>
              {seq.criteria.map(cn => (
                <CriterionWithFaults key={cn.id} cn={cn}
                  seqOptions={seqOptions} metOptions={metOptions} critOptions={critOptions}
                  onReassignCriterion={reassignCriterion} onReassignCriterionMetaphor={reassignCriterionMetaphor}
                  onReassignFault={reassignFault} />
              ))}
            </SubSection>
          )}

          {seq.miniExercises.length > 0 && (
            <SubSection label="Mini-exercices" icon="⚡" count={seq.miniExercises.length}>
              {seq.miniExercises.map(me => (
                <ItemRow key={me.id} label={me.title} icon="⚡">
                  <InlineSelect label="Séquence" value={me.sequenceId ?? ''} options={seqOptions}
                    onChange={v => reassignMiniExercise(me.id, v || null)} />
                </ItemRow>
              ))}
            </SubSection>
          )}

          {seq.metaphors.length === 0 && seq.criteria.length === 0 && seq.miniExercises.length === 0 && (
            <p style={{ fontSize: 12, color: colors.text.muted, margin: '12px 0 4px', fontStyle: 'italic' }}>
              Aucun élément lié à cette séquence.
            </p>
          )}
        </div>
      ))}

      {freeCount > 0 && (
        <div style={{ ...CARD, border: `1.5px dashed ${colors.accent.red}60`, marginBottom: 20 }}>
          <div style={{ ...SEQ_HEADER, marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>🔗</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: colors.accent.red }}>Éléments libres</span>
            <span style={{ fontSize: 11, backgroundColor: colors.accent.red + '18', color: colors.accent.red, padding: '2px 8px', borderRadius: 999 }}>
              {freeCount} non liés
            </span>
          </div>

          {hierarchy.freeMetaphors.length > 0 && (
            <SubSection label="Métaphores libres" icon="💡" count={hierarchy.freeMetaphors.length}>
              {hierarchy.freeMetaphors.map(m => (
                <div key={m.id}>
                  <ItemRow label={m.title} icon="💡">
                    <InlineSelect label="Séquence" value="" options={seqOptions}
                      onChange={v => reassignMetaphor(m.id, v || null)} />
                  </ItemRow>
                  {m.criteria.map(cn => (
                    <CriterionWithFaults key={cn.id} cn={cn} nested
                      seqOptions={seqOptions} metOptions={metOptions} critOptions={critOptions}
                      onReassignCriterion={reassignCriterion} onReassignCriterionMetaphor={reassignCriterionMetaphor}
                      onReassignFault={reassignFault} />
                  ))}
                </div>
              ))}
            </SubSection>
          )}

          {hierarchy.freeCriteria.length > 0 && (
            <SubSection label="Critères libres" icon="🎯" count={hierarchy.freeCriteria.length}>
              {hierarchy.freeCriteria.map(cn => (
                <CriterionWithFaults key={cn.id} cn={cn}
                  seqOptions={seqOptions} metOptions={metOptions} critOptions={critOptions}
                  onReassignCriterion={reassignCriterion} onReassignCriterionMetaphor={reassignCriterionMetaphor}
                  onReassignFault={reassignFault} />
              ))}
            </SubSection>
          )}

          {hierarchy.freeMiniExercises.length > 0 && (
            <SubSection label="Mini-exercices libres" icon="⚡" count={hierarchy.freeMiniExercises.length}>
              {hierarchy.freeMiniExercises.map(me => (
                <ItemRow key={me.id} label={me.title} icon="⚡">
                  <InlineSelect label="Séquence" value="" options={seqOptions}
                    onChange={v => reassignMiniExercise(me.id, v || null)} />
                </ItemRow>
              ))}
            </SubSection>
          )}

          {hierarchy.freeFaults.length > 0 && (
            <SubSection label="Erreurs sans critère" icon="⚠️" count={hierarchy.freeFaults.length}>
              {hierarchy.freeFaults.map(f => (
                <ItemRow key={f.id} label={f.label} icon="⚠️">
                  <InlineSelect label="Critère" value="" options={critOptions}
                    onChange={v => reassignFault(f.id, v || null)} />
                </ItemRow>
              ))}
            </SubSection>
          )}
        </div>
      )}

      {freeCount === 0 && sequences.length > 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: colors.status.success, fontSize: 12, fontWeight: 600 }}>
          ✓ Tous les éléments sont organisés dans des séquences.
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CriterionWithFaults({
  cn, nested = false, seqOptions, metOptions, critOptions,
  onReassignCriterion, onReassignCriterionMetaphor, onReassignFault,
}: {
  cn                         : CriterionNode
  nested?                    : boolean
  seqOptions                 : React.ReactNode[]
  metOptions                 : React.ReactNode[]
  critOptions                : React.ReactNode[]
  onReassignCriterion        : (id: string, seqId: string | null) => void
  onReassignCriterionMetaphor: (id: string, metId: string | null) => void
  onReassignFault            : (id: string, critId: string | null) => void
}) {
  return (
    <div>
      <ItemRow label={cn.label} icon="🎯" nested={nested}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          <InlineSelect label="Séquence" value={cn.sequenceId ?? ''} options={seqOptions}
            onChange={v => onReassignCriterion(cn.id, v || null)} />
          <InlineSelect label="Métaphore" value={cn.metaphorId ?? ''} options={metOptions}
            onChange={v => onReassignCriterionMetaphor(cn.id, v || null)} />
        </div>
      </ItemRow>
      {cn.faults.map(f => (
        <ItemRow key={f.id} label={f.label} icon="⚠️" nested>
          <InlineSelect label="Critère" value={f.criterionId ?? ''} options={critOptions}
            onChange={v => onReassignFault(f.id, v || null)} />
        </ItemRow>
      ))}
    </div>
  )
}

function SubSection({ label, icon, count, children }: {
  label   : string
  icon    : string
  count   : number
  children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: colors.text.muted }}>
          {label}
        </span>
        <span style={{ fontSize: 10, backgroundColor: colors.light.muted, color: colors.text.muted, padding: '1px 6px', borderRadius: 999 }}>
          {count}
        </span>
      </div>
      <div style={{ paddingLeft: 12, borderLeft: `2px solid ${colors.border.light}` }}>
        {children}
      </div>
    </div>
  )
}

function ItemRow({ label, icon, nested = false, children }: {
  label   : string
  icon    : string
  nested? : boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      display   : 'flex',
      alignItems: 'center',
      gap       : 10,
      padding   : '5px 0',
      marginLeft : nested ? 16 : 0,
      borderLeft : nested ? `2px solid ${colors.border.divider}` : 'none',
      paddingLeft: nested ? 10 : 0,
    }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: colors.text.dark, fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  )
}

function InlineSelect({ label, value, options, onChange }: {
  label   : string
  value   : string
  options : React.ReactNode[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: colors.text.muted, whiteSpace: 'nowrap' as const }}>{label} :</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding        : '3px 8px',
          borderRadius   : radius.xs,
          border         : `1px solid ${colors.border.light}`,
          backgroundColor: colors.light.surface,
          color          : colors.text.dark,
          fontSize       : 11,
          fontFamily     : 'Poppins, sans-serif',
          cursor         : 'pointer',
          maxWidth       : 200,
        }}
      >
        {options}
      </select>
    </div>
  )
}

const CARD: React.CSSProperties = {
  backgroundColor: colors.light.surface,
  borderRadius   : radius.card,
  border         : `1px solid ${colors.border.light}`,
  boxShadow      : shadows.sm,
  padding        : '16px 20px',
}

const SEQ_HEADER: React.CSSProperties = {
  display    : 'flex',
  alignItems : 'center',
  gap        : 8,
  marginBottom: 4,
}
