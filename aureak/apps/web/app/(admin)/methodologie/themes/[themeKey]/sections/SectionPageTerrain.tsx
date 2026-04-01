'use client'
import React, { useState, useEffect, useRef } from 'react'
import { getThemePageTerrain, upsertThemePageTerrain } from '@aureak/api-client'
import type { Theme, Criterion } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  theme: Theme
  criteria: Criterion[]
  tenantId: string
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

export default function SectionPageTerrain({ theme, criteria, tenantId }: Props) {
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sequencesCourt, setSequencesCourt] = useState('')
  const [metaphorsCourt, setMetaphorsCourt] = useState('')
  const [criteriaSummary, setCriteriaSummary] = useState('')
  const [cues, setCues] = useState<string[]>([])
  const [newCue, setNewCue] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getThemePageTerrain(theme.id)
        if (data) {
          setSequencesCourt(data.sequencesCourt ?? '')
          setMetaphorsCourt(data.metaphorsCourt ?? '')
          setCriteriaSummary(data.criteriaSummary ?? '')
          setCues(data.cues ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [theme.id])

  const handleAddCue = () => {
    if (!newCue.trim()) return
    setCues(prev => [...prev, newCue.trim()])
    setNewCue('')
  }

  const handleRemoveCue = (idx: number) =>
    setCues(prev => prev.filter((_, i) => i !== idx))

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertThemePageTerrain(theme.id, tenantId, {
        sequencesCourt: sequencesCourt || null,
        metaphorsCourt: metaphorsCourt || null,
        criteriaSummary: criteriaSummary || null,
        cues,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 80, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 12 }} />)}
    </div>
  )

  return (
    <div>
      {/* CSS print styles */}
      <style>{`
        @media print {
          body > *:not(#print-page-terrain) { display: none !important; }
          #print-page-terrain { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
            Page Terrain
          </h2>
          <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
            Mémo imprimable pour le coach sur le terrain. Synthèse du thème en un coup d'œil.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }} className="no-print">
          <button
            onClick={() => setPreview(!preview)}
            style={{
              padding: '7px 14px', backgroundColor: 'transparent', color: colors.text.muted,
              border: `1px solid ${colors.border.light}`, borderRadius: radius.button, fontSize: 12,
              fontWeight: 600, cursor: 'pointer', fontFamily: 'Geist, sans-serif',
              transition: `all ${transitions.fast}`,
            }}
          >
            {preview ? '✎ Éditer' : '👁 Prévisualiser'}
          </button>
          {preview && (
            <button
              onClick={() => window.print()}
              style={{
                padding: '7px 14px', backgroundColor: colors.accent.gold, color: '#fff',
                border: 'none', borderRadius: radius.button, fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'Geist, sans-serif',
              }}
            >
              🖨️ Imprimer
            </button>
          )}
        </div>
      </div>

      {preview ? (
        // Mode prévisualisation
        <div
          id="print-page-terrain"
          style={{
            backgroundColor: '#fff',
            border: `2px solid ${colors.accent.gold}`,
            borderRadius: radius.card,
            padding: '24px',
            fontFamily: 'Geist, sans-serif',
            maxWidth: 700,
          }}
        >
          {/* Header */}
          <div style={{
            borderBottom: `3px solid ${colors.accent.gold}`,
            paddingBottom: 12, marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: colors.accent.gold }}>
              AUREAK — PAGE TERRAIN
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: colors.text.dark, marginTop: 4 }}>
              {theme.name}
            </div>
            {theme.level && (
              <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>
                Niveau : {theme.level} {theme.ageGroup ? `• ${theme.ageGroup}` : ''}
              </div>
            )}
          </div>

          {/* Corps : 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.muted, marginBottom: 8 }}>
                SÉQUENCES (RÉSUMÉ)
              </div>
              <p style={{ fontSize: 13, color: colors.text.dark, lineHeight: 1.6, margin: 0 }}>
                {sequencesCourt || '—'}
              </p>
              {metaphorsCourt && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.muted, marginBottom: 8, marginTop: 16 }}>
                    MÉTAPHORES
                  </div>
                  <p style={{ fontSize: 13, color: colors.text.dark, fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                    {metaphorsCourt}
                  </p>
                </>
              )}
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.muted, marginBottom: 8 }}>
                MOTS-CLÉS TERRAIN
              </div>
              {cues.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cues.map((c, i) => (
                    <span key={i} style={{
                      backgroundColor: colors.accent.gold + '20', color: colors.accent.gold,
                      border: `1px solid ${colors.border.gold}`, borderRadius: 999,
                      padding: '4px 12px', fontSize: 12, fontWeight: 600,
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              ) : <span style={{ fontSize: 13, color: colors.text.muted }}>—</span>}
            </div>
          </div>

          {/* Critères */}
          <div style={{ borderTop: `1px solid ${colors.border.light}`, paddingTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text.muted, marginBottom: 10 }}>
              CRITÈRES DE RÉUSSITE ({criteria.length})
            </div>
            {criteria.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                {criteria.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                    <span style={{ color: colors.accent.gold, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ color: colors.text.dark, lineHeight: 1.4 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: colors.text.muted }}>Aucun critère défini.</p>
            )}

            {criteriaSummary && (
              <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: colors.light.muted, borderRadius: 6, borderLeft: `3px solid ${colors.accent.gold}` }}>
                <p style={{ fontSize: 12, color: colors.text.muted, margin: 0, fontStyle: 'italic' }}>{criteriaSummary}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${colors.border.light}`, marginTop: 16, paddingTop: 10, fontSize: 10, color: colors.text.subtle, display: 'flex', justifyContent: 'space-between' }}>
            <span>AUREAK Academy — Confidentiel coach</span>
            <span>v{theme.version} • {new Date().toLocaleDateString('fr-BE')}</span>
          </div>
        </div>
      ) : (
        // Mode édition
        <div style={{
          backgroundColor: colors.light.surface, borderRadius: radius.card,
          border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm, padding: '20px',
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Séquences (résumé court pour terrain)</label>
            <textarea value={sequencesCourt} onChange={e => setSequencesCourt(e.target.value)} rows={4} style={TEXTAREA_STYLE} placeholder="Résumé concis des séquences..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Métaphores courtes</label>
            <textarea value={metaphorsCourt} onChange={e => setMetaphorsCourt(e.target.value)} rows={3} style={TEXTAREA_STYLE} placeholder="Métaphores pour ancrer les apprentissages..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Mots-clés terrain</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {cues.map((c, i) => (
                <span key={i} style={{
                  backgroundColor: colors.accent.gold + '20', color: colors.accent.gold,
                  border: `1px solid ${colors.border.gold}`, borderRadius: 999,
                  padding: '3px 10px', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {c}
                  <button onClick={() => handleRemoveCue(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 12, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newCue}
                onChange={e => setNewCue(e.target.value)}
                style={{ ...INPUT_STYLE, flex: 1 }}
                placeholder="Ajouter un mot-clé (Ex: 'Mains en porte')"
                onKeyDown={e => e.key === 'Enter' && handleAddCue()}
              />
              <button
                onClick={handleAddCue}
                style={{
                  padding: '8px 14px', backgroundColor: 'transparent', color: colors.text.muted,
                  border: `1px solid ${colors.border.light}`, borderRadius: radius.xs, fontSize: 13, cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={LABEL_STYLE}>Résumé critères (note de bas de page terrain)</label>
            <textarea value={criteriaSummary} onChange={e => setCriteriaSummary(e.target.value)} rows={3} style={TEXTAREA_STYLE} placeholder="Synthèse des critères de réussite..." />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: saved ? colors.status.success : colors.accent.gold,
              color: '#fff', border: 'none', borderRadius: radius.button,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Geist, sans-serif',
              transition: `all ${transitions.fast}`,
            }}
          >
            {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
          </button>
        </div>
      )}
    </div>
  )
}
