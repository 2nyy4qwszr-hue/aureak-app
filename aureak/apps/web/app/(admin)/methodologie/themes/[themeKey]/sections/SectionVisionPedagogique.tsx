'use client'
import React, { useState, useEffect } from 'react'
import { getThemeVision, upsertThemeVision } from '@aureak/api-client'
import type { ThemeVision } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = {
  themeId: string
  tenantId: string
}

const SH: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
  textTransform: 'uppercase', color: colors.accent.gold,
  fontFamily: 'Geist, sans-serif', margin: '0 0 4px',
}

const CARD: React.CSSProperties = {
  backgroundColor: colors.light.surface,
  borderRadius: radius.card,
  border: `1px solid ${colors.border.light}`,
  boxShadow: shadows.sm,
  padding: '20px',
  marginBottom: 16,
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: 1,
  textTransform: 'uppercase', color: colors.text.muted,
  display: 'block', marginBottom: 6,
}

const TEXTAREA_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: radius.xs,
  border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.surface,
  color: colors.text.dark, fontSize: 13, fontFamily: 'Geist, sans-serif',
  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
}

type FormState = {
  pourquoi: string
  quandEnMatch: string
  ceQueComprend: string
  ideeMaitresse: string
  criteresPrioritaires: string
}

export default function SectionVisionPedagogique({ themeId, tenantId }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    pourquoi: '',
    quandEnMatch: '',
    ceQueComprend: '',
    ideeMaitresse: '',
    criteresPrioritaires: '',
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getThemeVision(themeId)
        if (data) {
          setForm({
            pourquoi: data.pourquoi ?? '',
            quandEnMatch: data.quandEnMatch ?? '',
            ceQueComprend: data.ceQueComprend ?? '',
            ideeMaitresse: data.ideeMaitresse ?? '',
            criteresPrioritaires: data.criteresPrioritaires ?? '',
          })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [themeId])

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await upsertThemeVision(themeId, tenantId, {
        pourquoi: form.pourquoi || null,
        quandEnMatch: form.quandEnMatch || null,
        ceQueComprend: form.ceQueComprend || null,
        ideeMaitresse: form.ideeMaitresse || null,
        criteresPrioritaires: form.criteresPrioritaires || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SectionVisionPedagogique] save error:', err)
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: 20 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ height: 80, backgroundColor: colors.border.divider, borderRadius: 8, marginBottom: 16 }} />
      ))}
    </div>
  )

  const fields: { key: keyof FormState; label: string; rows: number; hint?: string }[] = [
    { key: 'pourquoi', label: 'Pourquoi enseigne-t-on ce thème ?', rows: 3 },
    { key: 'quandEnMatch', label: 'Quand le rencontre-t-on en match ?', rows: 3 },
    { key: 'ceQueComprend', label: 'Ce que le gardien / joueur doit comprendre', rows: 4 },
    { key: 'ideeMaitresse', label: "L'idée maîtresse", rows: 3 },
    { key: 'criteresPrioritaires', label: "Critères prioritaires à installer dès l'entraînement", rows: 3 },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={SH}>Vision pédagogique</h2>
        <p style={{ fontSize: 12, color: colors.text.muted, margin: 0 }}>
          Fondement conceptuel du thème — pourquoi et comment l'enseigner.
        </p>
      </div>

      <div style={CARD}>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 20 }}>
            <label style={LABEL_STYLE}>{f.label}</label>
            <textarea
              value={form[f.key]}
              onChange={set(f.key)}
              rows={f.rows}
              style={TEXTAREA_STYLE}
              placeholder={`Saisissez ${f.label.toLowerCase()}...`}
            />
          </div>
        ))}

        {error && (
          <div style={{ color: colors.status.errorStrong, fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: saved ? colors.status.success : colors.accent.gold,
            color: '#fff',
            border: 'none',
            borderRadius: radius.button,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif',
            transition: `all ${transitions.fast}`,
          }}
        >
          {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
