'use client'
import React, { useState, useEffect } from 'react'
import {
  listThemeBadgeLevels, createThemeBadgeLevel, updateThemeBadgeLevel, deleteThemeBadgeLevel,
} from '@aureak/api-client'
import type { ThemeBadgeLevel, BadgeStage } from '@aureak/types'
import { BADGE_STAGES } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  themeId: string
  tenantId: string
}

const BADGE_COLORS: Record<BadgeStage, string> = {
  Bronze : '#CD7F32',
  Argent : '#A8A9AD',
  Or     : '#C1AC5C',
  Elite  : '#4FC3F7',
  Master : '#CE93D8',
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

export default function SectionBadge({ themeId, tenantId }: Props) {
  const [levels, setLevels] = useState<ThemeBadgeLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creatingStage, setCreatingStage] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, { progressionRule: string; requiredCriteriaCount: string; badgeImageUrl: string }>>({})

  const load = async () => {
    setLoading(true)
    try {
      const data = await listThemeBadgeLevels(themeId)
      setLevels(data)
      const initialForms: typeof forms = {}
      data.forEach(l => {
        initialForms[l.stage] = {
          progressionRule: l.progressionRule ?? '',
          requiredCriteriaCount: l.requiredCriteriaCount != null ? String(l.requiredCriteriaCount) : '',
          badgeImageUrl: l.badgeImageUrl ?? '',
        }
      })
      setForms(initialForms)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [themeId])

  const setField = (stage: string, key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForms(prev => ({ ...prev, [stage]: { ...prev[stage], [key]: e.target.value } }))

  const getLevelByStage = (stage: BadgeStage) => levels.find(l => l.stage === stage)

  const handleCreate = async (stage: BadgeStage, levelNumber: number) => {
    setCreatingStage(stage)
    try {
      await createThemeBadgeLevel(themeId, tenantId, {
        levelNumber,
        stage,
        badgeImageUrl: null,
        progressionRule: null,
        requiredCriteriaCount: null,
        sortOrder: levelNumber - 1,
      })
      await load()
    } finally {
      setCreatingStage(null)
    }
  }

  const handleSave = async (stage: BadgeStage) => {
    const level = getLevelByStage(stage)
    if (!level) return
    const f = forms[stage]
    if (!f) return
    setSavingId(level.id)
    try {
      await updateThemeBadgeLevel(level.id, {
        progressionRule: f.progressionRule || null,
        requiredCriteriaCount: f.requiredCriteriaCount ? parseInt(f.requiredCriteriaCount) : null,
        badgeImageUrl: f.badgeImageUrl || null,
      })
      await load()
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce niveau de badge ?')) return
    await deleteThemeBadgeLevel(id)
    await load()
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {BADGE_STAGES.map(s => <div key={s} style={{ flex: 1, height: 200, backgroundColor: colors.border.divider, borderRadius: 12 }} />)}
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent.gold, fontFamily: 'Geist, sans-serif', margin: '0 0 4px' }}>
          Badge & Progression
        </h2>
        <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
          Configurez les 5 niveaux de progression pour ce thème (Bronze → Master).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {BADGE_STAGES.map((stage, idx) => {
          const level = getLevelByStage(stage)
          const color = BADGE_COLORS[stage]
          const f = forms[stage] ?? { progressionRule: '', requiredCriteriaCount: '', badgeImageUrl: '' }

          return (
            <div key={stage} style={{
              backgroundColor: colors.light.surface,
              borderRadius: radius.card,
              border: `1px solid ${color}40`,
              boxShadow: shadows.sm,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {/* Badge header */}
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: color + '20',
                  border: `2px solid ${color}`,
                  margin: '0 auto 6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  🏅
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color, fontFamily: 'Montserrat, sans-serif', letterSpacing: 0.5 }}>
                  {stage}
                </div>
                <div style={{ fontSize: 11, color: colors.text.muted }}>Niveau {idx + 1}</div>
              </div>

              {level ? (
                <>
                  <div>
                    <label style={LABEL_STYLE}>Règle de progression</label>
                    <textarea
                      value={f.progressionRule}
                      onChange={setField(stage, 'progressionRule')}
                      rows={3}
                      style={{ ...TEXTAREA_STYLE, fontSize: 12 }}
                      placeholder="Ex: Maîtriser 3 critères sur 5..."
                    />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Critères requis</label>
                    <input
                      type="number"
                      value={f.requiredCriteriaCount}
                      onChange={setField(stage, 'requiredCriteriaCount')}
                      style={{ ...INPUT_STYLE, fontSize: 12 }}
                      placeholder="Ex: 3"
                    />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Image badge (URL)</label>
                    <input
                      type="text"
                      value={f.badgeImageUrl}
                      onChange={setField(stage, 'badgeImageUrl')}
                      style={{ ...INPUT_STYLE, fontSize: 12 }}
                    />
                  </div>
                  <button
                    onClick={() => handleSave(stage)}
                    disabled={savingId === level.id}
                    style={{
                      padding: '7px 0', width: '100%',
                      backgroundColor: savingId === level.id ? colors.border.divider : color,
                      color: '#fff', border: 'none', borderRadius: radius.button,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                      transition: `all ${transitions.fast}`,
                    }}
                  >
                    {savingId === level.id ? '...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={() => handleDelete(level.id)}
                    style={{ padding: '5px 0', width: '100%', backgroundColor: 'transparent', color: colors.accent.red, border: `1px solid ${colors.accent.red}40`, borderRadius: radius.button, fontSize: 11, cursor: 'pointer' }}
                  >
                    Supprimer
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleCreate(stage, idx + 1)}
                  disabled={creatingStage === stage}
                  style={{
                    padding: '8px 0', width: '100%',
                    backgroundColor: 'transparent', color,
                    border: `1px dashed ${color}`,
                    borderRadius: radius.button, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                    transition: `all ${transitions.fast}`,
                  }}
                >
                  {creatingStage === stage ? '...' : 'Configurer ce niveau'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
