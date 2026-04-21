'use client'
// Story 87.4 — Formulaire slim d'invitation pour commercial/manager/marketeur.
// 4 champs + toggle Invitation/Fiche locale. Aucun upload avatar (différé).
// Garde admin : redirect dashboard + toast si non-admin.

import { useEffect, useMemo, useState } from 'react'
import { View, Pressable, TextInput, StyleSheet, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@aureak/business-logic'
import { invitePerson } from '@aureak/api-client'
import type { InvitePersonMode, InvitePersonRole } from '@aureak/api-client'
import { AureakText, ROLE_LABELS } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import { useToast } from '../../ToastContext'

const EMAIL_REGEX = /^\S+@\S+\.\S+$/

type FormField = 'firstName' | 'lastName' | 'email' | 'phone'

type Errors = Partial<Record<FormField, string>>

function pluralizeRole(role: InvitePersonRole): string {
  return role === 'commercial' ? 'commerciaux' : role === 'manager' ? 'managers' : 'marketeurs'
}

type NewPersonFormProps = {
  role: InvitePersonRole
}

export function NewPersonForm({ role }: NewPersonFormProps) {
  const router = useRouter()
  const toast  = useToast()
  const { role: authRole, tenantId } = useAuthStore()

  const [mode,       setMode]       = useState<InvitePersonMode>('invite')
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [errors,     setErrors]     = useState<Errors>({})
  const [serverErr,  setServerErr]  = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  // Garde admin — redirect silencieux si non-admin
  useEffect(() => {
    if (authRole && authRole !== 'admin') {
      toast.error('Accès refusé')
      router.replace('/dashboard' as never)
    }
  }, [authRole, router, toast])

  const validate = useMemo(() => (): Errors => {
    const next: Errors = {}
    if (!firstName.trim()) next.firstName = 'Prénom requis'
    if (!lastName.trim())  next.lastName  = 'Nom requis'
    if (mode === 'invite') {
      const trimmed = email.trim()
      if (!trimmed) next.email = 'Email requis pour une invitation'
      else if (!EMAIL_REGEX.test(trimmed)) next.email = 'Format email invalide'
    }
    return next
  }, [firstName, lastName, email, mode])

  const isValid = Object.keys(validate()).length === 0

  const submit = async () => {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    if (!tenantId) {
      setServerErr('Tenant manquant — recharge la page')
      return
    }

    setServerErr('')
    setSubmitting(true)
    try {
      const result = await invitePerson({
        mode,
        role,
        tenantId,
        firstName: firstName.trim(),
        lastName : lastName.trim(),
        email    : email.trim() || undefined,
        phone    : phone.trim() || undefined,
      })

      if (result.ok !== true) {
        const message = result.message
        setServerErr(message)
        toast.error(`Erreur : ${message}`)
        return
      }

      const successMsg = mode === 'invite'
        ? `Invitation envoyée à ${email.trim()}`
        : `Fiche créée : ${firstName.trim()} ${lastName.trim()}`
      toast.success(successMsg)
      router.replace(`/academie/${pluralizeRole(role)}` as never)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[NewPersonForm] submit error:', err)
      setServerErr('Exception inattendue')
    } finally {
      setSubmitting(false)
    }
  }

  const title = `Nouveau ${ROLE_LABELS[role].toLowerCase()}`

  return (
    <View style={s.page}>
      <View style={s.card}>
        <AureakText style={s.title as TextStyle}>{title}</AureakText>

        {/* Toggle mode */}
        <View style={s.toggleRow}>
          <Pressable
            onPress={() => setMode('invite')}
            style={[s.pill, mode === 'invite' ? s.pillActive : s.pillInactive] as never}
          >
            <AureakText style={[s.pillLabel, mode === 'invite' ? s.pillLabelActive : s.pillLabelInactive] as never}>
              INVITATION
            </AureakText>
          </Pressable>
          <Pressable
            onPress={() => setMode('fiche')}
            style={[s.pill, mode === 'fiche' ? s.pillActive : s.pillInactive] as never}
          >
            <AureakText style={[s.pillLabel, mode === 'fiche' ? s.pillLabelActive : s.pillLabelInactive] as never}>
              FICHE LOCALE
            </AureakText>
          </Pressable>
        </View>

        <Field label={'Prénom'} required error={errors.firstName}>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Thomas"
            placeholderTextColor={colors.text.muted}
            style={[s.input, errors.firstName && s.inputError] as never}
          />
        </Field>

        <Field label={'Nom'} required error={errors.lastName}>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Dupont"
            placeholderTextColor={colors.text.muted}
            style={[s.input, errors.lastName && s.inputError] as never}
          />
        </Field>

        <Field
          label={`Email${mode === 'invite' ? '' : ' (optionnel)'}`}
          required={mode === 'invite'}
          error={errors.email}
        >
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="thomas@example.com"
            placeholderTextColor={colors.text.muted}
            style={[s.input, errors.email && s.inputError] as never}
          />
        </Field>

        <Field label={'Téléphone (optionnel)'}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+32 470 12 34 56"
            placeholderTextColor={colors.text.muted}
            style={s.input as never}
          />
        </Field>

        {serverErr ? (
          <AureakText style={s.serverErr as TextStyle}>{serverErr}</AureakText>
        ) : null}

        <View style={s.actions}>
          <Pressable
            disabled={submitting}
            onPress={() => router.back()}
            style={({ pressed }) => [s.secondaryBtn, pressed && s.btnPressed] as never}
          >
            <AureakText style={s.secondaryBtnLabel as TextStyle}>Annuler</AureakText>
          </Pressable>
          <Pressable
            disabled={!isValid || submitting}
            onPress={submit}
            style={({ pressed }) => [
              s.primaryBtn,
              (!isValid || submitting) && s.primaryBtnDisabled,
              pressed && s.btnPressed,
            ] as never}
          >
            <AureakText style={s.primaryBtnLabel as TextStyle}>
              {submitting
                ? 'En cours…'
                : mode === 'invite' ? "Envoyer l'invitation" : 'Créer la fiche'}
            </AureakText>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

// ── Field helper ────────────────────────────────────────────────────────────
function Field({
  label, required, error, children,
}: {
  label    : string
  required?: boolean
  error?   : string
  children : React.ReactNode
}) {
  return (
    <View style={s.field}>
      <AureakText style={s.fieldLabel as TextStyle}>
        {label}{required ? ' *' : ''}
      </AureakText>
      {children}
      {error ? <AureakText style={s.fieldError as TextStyle}>{error}</AureakText> : null}
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', padding: space.xl, backgroundColor: colors.light.primary },
  card: {
    width           : '100%',
    maxWidth        : 480,
    padding         : space.xl,
    backgroundColor : colors.light.surface,
    borderRadius    : 12,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    gap             : space.md,
  },
  title: { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark },

  // Toggle mode
  toggleRow: { flexDirection: 'row', gap: 0, borderRadius: radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.light, alignSelf: 'flex-start' },
  pill        : { paddingVertical: 8, paddingHorizontal: space.md },
  pillActive  : { backgroundColor: colors.accent.gold },
  pillInactive: { backgroundColor: colors.light.hover },
  pillLabel   : { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  pillLabelActive  : { color: colors.text.dark },
  pillLabelInactive: { color: colors.text.muted },

  // Field
  field     : { gap: 4 },
  fieldLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    paddingHorizontal: space.md,
    paddingVertical  : 10,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.primary,
    color            : colors.text.dark,
    fontSize         : 13,
    fontFamily       : fonts.body,
  },
  inputError: { borderColor: colors.status.absent },
  fieldError: { fontSize: 12, color: colors.status.absent },

  serverErr: { fontSize: 13, color: colors.status.absent, fontStyle: 'italic' },

  // Actions
  actions : { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.sm },

  primaryBtn        : { paddingHorizontal: space.lg, paddingVertical: 10, borderRadius: radius.xs, backgroundColor: colors.accent.gold },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnLabel   : { color: colors.text.dark, fontWeight: '700', fontSize: 13 },

  secondaryBtn     : { paddingHorizontal: space.md, paddingVertical: 10, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.light, backgroundColor: 'transparent' },
  secondaryBtnLabel: { color: colors.text.muted, fontWeight: '700', fontSize: 13 },

  btnPressed: { opacity: 0.8 },
})
