'use client'
// Story 92-2 — Formulaire création / édition sponsor
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows, fonts } from '@aureak/theme'
import { createSponsor, updateSponsor, listChildDirectory } from '@aureak/api-client'
import type { Sponsor, CreateSponsorParams, SponsorshipType, CapsuleStatus } from '@aureak/types'
import { SPONSORSHIP_TYPES, SPONSORSHIP_TYPE_LABELS, CAPSULE_STATUSES, CAPSULE_STATUS_LABELS } from '@aureak/types'

type Props = {
  sponsor? : Sponsor | null
  onDone   : () => void
  onCancel : () => void
}

type ChildOption = { id: string; displayName: string }

export function SponsorForm({ sponsor, onDone, onCancel }: Props) {
  const isEdit = !!sponsor

  const [name, setName]                 = useState(sponsor?.name ?? '')
  const [contactName, setContactName]   = useState(sponsor?.contactName ?? '')
  const [contactEmail, setContactEmail] = useState(sponsor?.contactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(sponsor?.contactPhone ?? '')
  const [type, setType]                 = useState<SponsorshipType>(sponsor?.sponsorshipType ?? 'individual')
  const [amount, setAmount]             = useState(sponsor?.amount?.toString() ?? '')
  const [currency, setCurrency]         = useState(sponsor?.currency ?? 'EUR')
  const [startDate, setStartDate]       = useState(sponsor?.startDate ?? new Date().toISOString().split('T')[0])
  const [endDate, setEndDate]           = useState(sponsor?.endDate ?? '')
  const [linkedChildId, setLinkedChildId] = useState(sponsor?.linkedChildId ?? '')
  const [capsuleStatus, setCapsuleStatus] = useState<CapsuleStatus>(sponsor?.capsuleStatus ?? 'not_started')
  const [notes, setNotes]               = useState(sponsor?.notes ?? '')

  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [children, setChildren] = useState<ChildOption[]>([])
  const [childSearch, setChildSearch] = useState('')

  // Load children for searchable select
  useEffect(() => {
    listChildDirectory({ search: childSearch || undefined, pageSize: 30 })
      .then(res => {
        setChildren(res.data.map(c => ({ id: c.id, displayName: c.displayName })))
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[SponsorForm] listChildren error:', err)
      })
  }, [childSearch])

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom est requis'); return }
    if (!contactName.trim()) { setError('Le nom du contact est requis'); return }
    if (!contactEmail.trim()) { setError('L\'email du contact est requis'); return }

    const params: CreateSponsorParams = {
      name,
      contactName,
      contactEmail,
      contactPhone,
      sponsorshipType: type,
      amount         : amount ? parseFloat(amount) : null,
      currency,
      startDate,
      endDate        : endDate || null,
      linkedChildId  : linkedChildId || null,
      capsuleStatus,
      notes          : notes || null,
    }

    setSaving(true)
    try {
      if (isEdit && sponsor) {
        await updateSponsor(sponsor.id, params)
      } else {
        await createSponsor(params)
      }
      onDone()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SponsorForm] save error:', err)
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakText style={styles.heading}>
        {isEdit ? 'Modifier le sponsor' : 'Nouveau sponsor'}
      </AureakText>

      {/* Nom */}
      <Field label="Nom *">
        <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Nom du sponsor" />
      </Field>

      {/* Contact */}
      <View style={styles.row}>
        <Field label="Contact *" flex>
          <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} style={inputStyle} placeholder="Nom du contact" />
        </Field>
        <Field label="Email *" flex>
          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={inputStyle} placeholder="email@example.com" />
        </Field>
        <Field label="Téléphone" flex>
          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={inputStyle} placeholder="+32..." />
        </Field>
      </View>

      {/* Type */}
      <Field label="Type de sponsoring *">
        <select value={type} onChange={e => setType(e.target.value as SponsorshipType)} style={inputStyle}>
          {SPONSORSHIP_TYPES.map(t => (
            <option key={t} value={t}>{SPONSORSHIP_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </Field>

      {/* Montant + devise */}
      <View style={styles.row}>
        <Field label="Montant" flex>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} placeholder="0" step="0.01" />
        </Field>
        <Field label="Devise" flex>
          <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} style={inputStyle} />
        </Field>
      </View>

      {/* Dates */}
      <View style={styles.row}>
        <Field label="Date début *" flex>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Date fin" flex>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
        </Field>
      </View>

      {/* Enfant lié — searchable select */}
      <Field label="Joueur lié (optionnel)">
        <input
          type="text"
          value={childSearch}
          onChange={e => setChildSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: 4 }}
          placeholder="Rechercher un joueur..."
        />
        <select
          value={linkedChildId}
          onChange={e => setLinkedChildId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Aucun —</option>
          {children.map(c => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </select>
      </Field>

      {/* Capsule vidéo */}
      <Field label="Statut capsule vidéo">
        <select value={capsuleStatus} onChange={e => setCapsuleStatus(e.target.value as CapsuleStatus)} style={inputStyle}>
          {CAPSULE_STATUSES.map(s => (
            <option key={s} value={s}>{CAPSULE_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </Field>

      {/* Notes */}
      <Field label="Notes">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 64, resize: 'vertical' as never }} placeholder="Notes internes..." rows={3} />
      </Field>

      {error && <AureakText style={styles.errorText}>{error}</AureakText>}

      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
          onPress={onCancel}
        >
          <AureakText style={styles.cancelBtnText}>Annuler</AureakText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.7 }, saving && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <AureakText style={styles.submitBtnText}>
            {saving ? 'Sauvegarde...' : isEdit ? 'Enregistrer' : 'Créer'}
          </AureakText>
        </Pressable>
      </View>
    </ScrollView>
  )
}

// ── Field wrapper ──────────────────────────────────────────────────────────

function Field({ label, children: ch, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={[styles.fieldGroup, flex && { flex: 1 }]}>
      <AureakText style={styles.label}>{label}</AureakText>
      {ch}
    </View>
  )
}

const inputStyle: React.CSSProperties = {
  width       : '100%',
  padding     : '8px 12px',
  borderRadius: 8,
  border      : `1px solid ${colors.border.light}`,
  fontFamily  : 'inherit',
  fontSize    : 14,
  outline     : 'none',
  boxSizing   : 'border-box',
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    // @ts-ignore
    boxShadow      : shadows.sm,
    maxWidth       : 640,
  },
  content: {
    padding: space.lg,
  },
  heading: {
    fontSize    : 18,
    fontWeight  : '700',
    fontFamily  : fonts.display,
    color       : colors.text.dark,
    marginBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    gap          : space.sm,
  },
  fieldGroup: {
    marginBottom: space.md,
  },
  label: {
    fontSize    : 12,
    fontWeight  : '600',
    color       : colors.text.muted,
    marginBottom: 4,
    fontFamily  : fonts.body,
  },
  errorText: {
    color       : colors.accent.red,
    fontSize    : 13,
    marginBottom: space.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap          : space.sm,
    marginTop    : space.sm,
  },
  cancelBtn: {
    flex           : 1,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.button,
    paddingVertical: space.sm,
    alignItems     : 'center',
  },
  cancelBtnText: {
    color     : colors.text.muted,
    fontWeight: '600',
    fontSize  : 14,
    fontFamily: fonts.body,
  },
  submitBtn: {
    flex           : 2,
    backgroundColor: colors.accent.gold,
    borderRadius   : radius.button,
    paddingVertical: space.sm,
    alignItems     : 'center',
  },
  submitBtnText: {
    color     : colors.text.primary,
    fontWeight: '700',
    fontSize  : 14,
    fontFamily: fonts.display,
  },
})
