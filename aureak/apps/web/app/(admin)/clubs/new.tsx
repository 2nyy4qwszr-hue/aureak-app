import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { createClubDirectoryEntry } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { BelgianProvince, ClubRelationType } from '@aureak/types'
import { BELGIAN_PROVINCES } from '@aureak/types'
import { RelationTypeSelector } from './_components'

// ── Field components ─────────────────────────────────────────────────────────

function FormField({
  label, value, onChange, placeholder, required, keyboardType, multiline,
}: {
  label       : string
  value       : string
  onChange    : (v: string) => void
  placeholder?: string
  required?   : boolean
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url'
  multiline?  : boolean
}) {
  return (
    <View style={ff.wrapper}>
      <AureakText variant="caption" style={ff.label}>
        {label}{required ? ' *' : ''}
      </AureakText>
      <TextInput
        style={[ff.input, multiline && ff.textarea]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        autoCapitalize={keyboardType === 'email-address' || keyboardType === 'url' ? 'none' : 'sentences'}
      />
    </View>
  )
}
const ff = StyleSheet.create({
  wrapper : { gap: 4 },
  label   : { color: colors.text.muted, fontSize: 11, fontWeight: '600' },
  input   : {
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 7,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    color            : colors.text.dark,
    fontSize         : 13,
    fontFamily       : 'System',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' as never },
})

// ── Province selector ─────────────────────────────────────────────────────────

function ProvinceSelector({ value, onChange }: { value: BelgianProvince | null; onChange: (v: BelgianProvince | null) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, fontWeight: '600' }}>Province</AureakText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Pressable style={[chip.base, value === null && chip.active]} onPress={() => onChange(null)}>
          <AureakText variant="caption" style={{ color: value === null ? colors.accent.gold : colors.text.muted, fontSize: 11 }}>—</AureakText>
        </Pressable>
        {BELGIAN_PROVINCES.map(p => (
          <Pressable key={p} style={[chip.base, value === p && chip.active]} onPress={() => onChange(p)}>
            <AureakText variant="caption" style={{ color: value === p ? colors.accent.gold : colors.text.muted, fontSize: 11 }}>{p}</AureakText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
const chip = StyleSheet.create({
  base  : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  active: { borderColor: colors.accent.gold, backgroundColor: colors.light.surface },
})

// ── Section wrapper ───────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <AureakText
      variant="caption"
      style={{
        color        : colors.text.muted,
        fontSize     : 10,
        fontWeight   : '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase' as never,
        paddingTop   : space.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border.divider,
      }}
    >
      {title}
    </AureakText>
  )
}

// ── Toggle chip ───────────────────────────────────────────────────────────────

function ToggleChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable style={[chip.base, value && chip.active]} onPress={() => onChange(!value)}>
      <AureakText variant="caption" style={{ color: value ? colors.accent.gold : colors.text.muted }}>
        {label}
      </AureakText>
    </Pressable>
  )
}

// ── Form state ────────────────────────────────────────────────────────────────

type Form = {
  nom                         : string
  matricule                   : string
  label                       : string
  province                    : BelgianProvince | null
  adresseRue                  : string
  codePostal                  : string
  ville                       : string
  siteInternet                : string
  correspondant               : string
  emailPrincipal              : string
  telephonePrincipal          : string
  responsableSportif          : string
  emailResponsableSportif     : string
  telephoneResponsableSportif : string
  clubRelationType            : ClubRelationType
  actif                       : boolean
  notesInternes               : string
}

const EMPTY_FORM: Form = {
  nom                         : '',
  matricule                   : '',
  label                       : '',
  province                    : null,
  adresseRue                  : '',
  codePostal                  : '',
  ville                       : '',
  siteInternet                : '',
  correspondant               : '',
  emailPrincipal              : '',
  telephonePrincipal          : '',
  responsableSportif          : '',
  emailResponsableSportif     : '',
  telephoneResponsableSportif : '',
  clubRelationType            : 'normal',
  actif                       : true,
  notesInternes               : '',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewClubScreen() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const user     = useAuthStore((s) => s.user)

  const [form,       setForm]       = useState<Form>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const setField = (key: keyof Form, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (!form.nom.trim()) {
      setError('Le nom du club est obligatoire.')
      return
    }
    if (!tenantId || !user?.id) {
      setError('Session invalide. Reconnectez-vous.')
      return
    }

    setError(null)
    setSubmitting(true)

    const { data, error: err } = await createClubDirectoryEntry({
      tenantId : tenantId,
      createdBy: user.id,
      nom                         : form.nom.trim(),
      matricule                   : form.matricule.trim() || null,
      label                       : form.label.trim() || null,
      province                    : form.province,
      adresseRue                  : form.adresseRue.trim() || null,
      codePostal                  : form.codePostal.trim() || null,
      ville                       : form.ville.trim() || null,
      siteInternet                : form.siteInternet.trim() || null,
      correspondant               : form.correspondant.trim() || null,
      emailPrincipal              : form.emailPrincipal.trim() || null,
      telephonePrincipal          : form.telephonePrincipal.trim() || null,
      responsableSportif          : form.responsableSportif.trim() || null,
      emailResponsableSportif     : form.emailResponsableSportif.trim() || null,
      telephoneResponsableSportif : form.telephoneResponsableSportif.trim() || null,
      clubRelationType            : form.clubRelationType,
      actif                       : form.actif,
      notesInternes               : form.notesInternes.trim() || null,
    })

    setSubmitting(false)

    if (err || !data) {
      setError('Erreur lors de la création du club.')
      return
    }

    router.replace(`/clubs/${data.id}` as never)
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>

        {/* Header */}
        <View style={styles.cardHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>← Retour</AureakText>
          </Pressable>
          <AureakText variant="h2" color={colors.accent.gold}>Nouveau club</AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            Ajoutez un club à l'annuaire. Les champs marqués * sont obligatoires.
          </AureakText>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <AureakText variant="body" style={{ color: '#f87171' }}>{error}</AureakText>
          </View>
        )}

        {/* ── Identité ── */}
        <SectionTitle title="Identité" />
        <FormField label="Nom du club" value={form.nom} onChange={v => setField('nom', v)} placeholder="RFC Liège" required />
        <FormField label="Matricule"   value={form.matricule} onChange={v => setField('matricule', v)} placeholder="0001" />
        <FormField label="Label"       value={form.label} onChange={v => setField('label', v)} placeholder="ex: Académie, U15…" />
        <ProvinceSelector value={form.province} onChange={v => setField('province', v)} />

        {/* ── Adresse ── */}
        <SectionTitle title="Adresse" />
        <FormField label="Rue et numéro" value={form.adresseRue}   onChange={v => setField('adresseRue', v)}   placeholder="Rue de l'Académie 12" />
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <FormField label="Code postal" value={form.codePostal} onChange={v => setField('codePostal', v)} placeholder="4000" />
          </View>
          <View style={{ flex: 2 }}>
            <FormField label="Ville" value={form.ville} onChange={v => setField('ville', v)} placeholder="Liège" />
          </View>
        </View>
        <FormField label="Site internet" value={form.siteInternet} onChange={v => setField('siteInternet', v)} placeholder="https://www.club.be" keyboardType="url" />

        {/* ── Contact général ── */}
        <SectionTitle title="Contact général" />
        <FormField label="Correspondant"   value={form.correspondant}     onChange={v => setField('correspondant', v)}     placeholder="Jean Dupont" />
        <FormField label="Email principal" value={form.emailPrincipal}    onChange={v => setField('emailPrincipal', v)}    placeholder="contact@club.be" keyboardType="email-address" />
        <FormField label="Téléphone"       value={form.telephonePrincipal} onChange={v => setField('telephonePrincipal', v)} placeholder="+32 4 xx xx xx xx" keyboardType="phone-pad" />

        {/* ── Responsable sportif ── */}
        <SectionTitle title="Responsable sportif" />
        <FormField label="Nom"       value={form.responsableSportif}          onChange={v => setField('responsableSportif', v)}          placeholder="Marie Martin" />
        <FormField label="Email"     value={form.emailResponsableSportif}     onChange={v => setField('emailResponsableSportif', v)}     placeholder="sport@club.be" keyboardType="email-address" />
        <FormField label="Téléphone" value={form.telephoneResponsableSportif} onChange={v => setField('telephoneResponsableSportif', v)} placeholder="+32 4 xx xx xx xx" keyboardType="phone-pad" />

        {/* ── Statut ── */}
        <SectionTitle title="Statut" />
        <RelationTypeSelector value={form.clubRelationType} onChange={v => setField('clubRelationType', v)} />
        <View style={{ flexDirection: 'row', gap: space.md, flexWrap: 'wrap', marginTop: 4 }}>
          <ToggleChip label="Actif" value={form.actif} onChange={v => setField('actif', v)} />
        </View>

        {/* ── Notes internes ── */}
        <SectionTitle title="Notes internes" />
        <FormField label="" value={form.notesInternes} onChange={v => setField('notesInternes', v)} placeholder="Notes visibles uniquement par l'admin…" multiline />

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Annuler</AureakText>
          </Pressable>
          <Pressable style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '700' }}>
              {submitting ? 'Création en cours…' : 'Créer le club'}
            </AureakText>
          </Pressable>
        </View>

      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container  : { flex: 1, backgroundColor: colors.light.primary },
  content    : { alignItems: 'center', paddingVertical: space.xl, paddingHorizontal: space.md },
  card       : {
    width           : '100%',
    maxWidth        : 640,
    backgroundColor : colors.light.surface,
    borderRadius    : 12,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    padding         : space.xl,
    gap             : space.md,
  },
  cardHeader : { gap: space.xs },
  backBtn    : { paddingBottom: space.xs },

  twoCol     : { flexDirection: 'row', gap: space.sm },

  errorBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: '#f87171',
    borderRadius   : 4,
    padding        : space.md,
  },

  actions    : { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm, paddingTop: space.sm },
  cancelBtn  : {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  submitBtn  : {
    paddingHorizontal: space.xl,
    paddingVertical  : space.xs + 2,
    borderRadius     : 7,
    backgroundColor  : colors.accent.gold,
  },
  submitBtnDisabled: { opacity: 0.6 },
})
