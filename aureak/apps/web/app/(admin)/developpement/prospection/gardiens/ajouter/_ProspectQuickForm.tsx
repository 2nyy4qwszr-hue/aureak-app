// Story 89.1 — Formulaire d'ajout rapide prospect terrain (mobile-first)
// AC #6, #7, #8, #9, #10 — 6 champs, garde-fou doublon, submit avec try/finally
'use client'

import React, { useRef, useState } from 'react'
import { View, Pressable, StyleSheet, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import {
  createChildDirectoryEntry,
  findProspectDuplicates,
  listClubDirectory,
} from '@aureak/api-client'
import type { ChildDirectoryEntry } from '@aureak/types'
import { useToast } from '../../../../../../components/ToastContext'
import DuplicateWarningModal from './_DuplicateWarningModal'

// ── Props ────────────────────────────────────────────────────────────────────

export type ProspectQuickFormProps = {
  tenantId          : string
  initialFirstName? : string
}

// ── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

type FieldErrors = Partial<Record<
  'prenom' | 'nom' | 'birthYear' | 'parentEmail',
  string
>>

// ── Component ────────────────────────────────────────────────────────────────

export default function ProspectQuickForm({ tenantId, initialFirstName }: ProspectQuickFormProps) {
  const router = useRouter()
  const toast  = useToast()

  // Champs obligatoires
  const [prenom,    setPrenom]    = useState(initialFirstName ?? '')
  const [nom,       setNom]       = useState('')
  const [birthYear, setBirthYear] = useState('')

  // Champs optionnels
  const [currentClub,     setCurrentClub]     = useState('')
  const [clubDirectoryId, setClubDirectoryId] = useState<string | null>(null)
  const [parentEmail,     setParentEmail]     = useState('')
  const [parentTel,       setParentTel]       = useState('')
  const [notes,           setNotes]           = useState('')

  // Club autocomplete state
  const [clubResults, setClubResults] = useState<Array<{ id: string; nom: string; ville: string | null }>>([])
  const [clubLoading, setClubLoading] = useState(false)
  const clubDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clubGenRef      = useRef(0)

  // State submit
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [fieldErrors,  setFieldErrors]  = useState<FieldErrors>({})
  const [duplicates,   setDuplicates]   = useState<ChildDirectoryEntry[]>([])
  const [showDupModal, setShowDupModal] = useState(false)

  // ── Club autocomplete ──────────────────────────────────────────────────────

  const handleClubChange = (text: string) => {
    setCurrentClub(text)
    setClubDirectoryId(null)
    if (clubDebounceRef.current) clearTimeout(clubDebounceRef.current)
    if (text.trim().length < 2) { setClubResults([]); return }
    const gen = ++clubGenRef.current
    clubDebounceRef.current = setTimeout(async () => {
      setClubLoading(true)
      try {
        const { data } = await listClubDirectory({ search: text.trim(), actif: true, pageSize: 8 })
        if (gen === clubGenRef.current) {
          setClubResults(data.map(c => ({ id: c.id, nom: c.nom, ville: c.ville })))
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ProspectQuickForm] clubSearch:', err)
        if (gen === clubGenRef.current) setClubResults([])
      } finally {
        if (gen === clubGenRef.current) setClubLoading(false)
      }
    }, 300)
  }

  const handleClubSelect = (club: { id: string; nom: string; ville: string | null }) => {
    setCurrentClub(club.nom)
    setClubDirectoryId(club.id)
    setClubResults([])
    setClubLoading(false)
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): { ok: boolean; yearNum: number } {
    const errs: FieldErrors = {}
    if (!prenom.trim())     errs.prenom    = 'Prénom requis'
    if (!nom.trim())        errs.nom       = 'Nom requis'
    const yearNum = parseInt(birthYear, 10)
    if (!yearNum || yearNum < 1990 || yearNum > 2020 || !/^\d{4}$/.test(birthYear.trim())) {
      errs.birthYear = 'Année entre 1990 et 2020 (4 chiffres)'
    }
    if (parentEmail.trim() && !EMAIL_RE.test(parentEmail.trim())) {
      errs.parentEmail = 'Email invalide'
    }
    setFieldErrors(errs)
    return { ok: Object.keys(errs).length === 0, yearNum }
  }

  // ── Submit core (appelé 2x : avec / sans force) ───────────────────────────

  async function performSubmit(force: boolean) {
    const { ok, yearNum } = validate()
    if (!ok) return

    setSaving(true)
    setError(null)
    try {
      // 1. Garde-fou doublon sauf si force
      if (!force) {
        const dupes = await findProspectDuplicates({
          tenantId,
          prenom  : prenom.trim(),
          nom     : nom.trim(),
          birthYear: yearNum,
        })
        if (dupes.length > 0) {
          setDuplicates(dupes)
          setShowDupModal(true)
          return  // finally remet saving=false
        }
      }

      // 2. Insert
      const entry = await createChildDirectoryEntry({
        tenantId,
        displayName    : `${prenom.trim()} ${nom.trim()}`,
        prenom         : prenom.trim(),
        nom            : nom.trim(),
        birthDate      : `${yearNum}-01-01`,
        statut         : 'Prospect',
        prospectStatus : 'prospect',
        actif          : true,
        currentClub    : currentClub.trim() || null,
        clubDirectoryId: clubDirectoryId,
        parent1Email   : parentEmail.trim() || null,
        parent1Tel     : parentTel.trim()   || null,
        notesInternes  : notes.trim()       || null,
      })

      // 3. Succès — toast + redirection
      setShowDupModal(false)
      toast.success('Prospect ajouté')
      router.replace(`/children/${entry.id}` as never)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectQuickForm] submit:', err)
      setError('Impossible de créer le prospect — réessayez')
    } finally {
      setSaving(false)
    }
  }

  // ── Handlers modal doublon ─────────────────────────────────────────────────

  function handleViewExisting(entry: ChildDirectoryEntry) {
    setShowDupModal(false)
    router.push(`/children/${entry.id}` as never)
  }

  async function handleForceCreate() {
    setShowDupModal(false)
    await performSubmit(true)
  }

  function handleCancelDup() {
    setShowDupModal(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={st.form}>
      <AureakText style={st.formTitle as never}>Nouveau prospect</AureakText>
      <AureakText style={st.formSub as never}>
        Remplissez le strict minimum — vous compléterez la fiche plus tard.
      </AureakText>

      {/* Prénom */}
      <View style={st.fieldBlock}>
        <AureakText style={st.label as never}>Prénom *</AureakText>
        <TextInput
          style={[st.input, fieldErrors.prenom && st.inputError] as never}
          value={prenom}
          onChangeText={v => { setPrenom(v); if (fieldErrors.prenom) setFieldErrors({ ...fieldErrors, prenom: undefined }) }}
          placeholder="ex: Lucas"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="words"
          autoComplete="given-name"
          editable={!saving}
        />
        {fieldErrors.prenom && <AureakText style={st.errorText as never}>{fieldErrors.prenom}</AureakText>}
      </View>

      {/* Nom */}
      <View style={st.fieldBlock}>
        <AureakText style={st.label as never}>Nom *</AureakText>
        <TextInput
          style={[st.input, fieldErrors.nom && st.inputError] as never}
          value={nom}
          onChangeText={v => { setNom(v); if (fieldErrors.nom) setFieldErrors({ ...fieldErrors, nom: undefined }) }}
          placeholder="ex: Dupont"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="characters"
          autoComplete="family-name"
          editable={!saving}
        />
        {fieldErrors.nom && <AureakText style={st.errorText as never}>{fieldErrors.nom}</AureakText>}
      </View>

      {/* Année naissance */}
      <View style={st.fieldBlock}>
        <AureakText style={st.label as never}>Année de naissance *</AureakText>
        <TextInput
          style={[st.input, fieldErrors.birthYear && st.inputError] as never}
          value={birthYear}
          onChangeText={v => {
            const digits = v.replace(/[^\d]/g, '').slice(0, 4)
            setBirthYear(digits)
            if (fieldErrors.birthYear) setFieldErrors({ ...fieldErrors, birthYear: undefined })
          }}
          placeholder="ex: 2012"
          placeholderTextColor={colors.text.muted}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={4}
          editable={!saving}
        />
        {fieldErrors.birthYear && <AureakText style={st.errorText as never}>{fieldErrors.birthYear}</AureakText>}
      </View>

      {/* Club actuel (autocomplete) */}
      <View style={[st.fieldBlock, { zIndex: 20 }]}>
        <AureakText style={st.label as never}>Club actuel</AureakText>
        <View style={{ position: 'relative' as never, zIndex: 20 }}>
          <TextInput
            style={st.input as never}
            value={currentClub}
            onChangeText={handleClubChange}
            onBlur={() => setTimeout(() => setClubResults([]), 200)}
            placeholder="Nom du club (optionnel)"
            placeholderTextColor={colors.text.muted}
            autoComplete="off"
            autoCorrect={false}
            editable={!saving}
          />
          {clubLoading && (
            <AureakText style={st.clubLoading as never}>…</AureakText>
          )}
          {clubResults.length > 0 && (
            <View style={st.clubDropdown}>
              {clubResults.map(c => (
                <Pressable
                  key={c.id}
                  style={({ hovered, pressed }) => [
                    st.clubItem,
                    (hovered || pressed) && { backgroundColor: colors.light.hover },
                  ] as never}
                  onPress={() => handleClubSelect(c)}
                >
                  <AureakText style={st.clubItemText as never}>
                    {c.nom}{c.ville ? ` — ${c.ville}` : ''}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        {clubDirectoryId !== null && (
          <AureakText style={st.hintSuccess as never}>✓ Club lié à l'annuaire</AureakText>
        )}
      </View>

      {/* Email parent */}
      <View style={st.fieldBlock}>
        <AureakText style={st.label as never}>Email parent</AureakText>
        <TextInput
          style={[st.input, fieldErrors.parentEmail && st.inputError] as never}
          value={parentEmail}
          onChangeText={v => { setParentEmail(v); if (fieldErrors.parentEmail) setFieldErrors({ ...fieldErrors, parentEmail: undefined }) }}
          placeholder="parent@exemple.com (optionnel)"
          placeholderTextColor={colors.text.muted}
          keyboardType="email-address"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          editable={!saving}
        />
        {fieldErrors.parentEmail && <AureakText style={st.errorText as never}>{fieldErrors.parentEmail}</AureakText>}
      </View>

      {/* Téléphone parent */}
      <View style={st.fieldBlock}>
        <AureakText style={st.label as never}>Téléphone parent</AureakText>
        <TextInput
          style={st.input as never}
          value={parentTel}
          onChangeText={setParentTel}
          placeholder="+32… (optionnel)"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="tel"
          editable={!saving}
        />
      </View>

      {/* Notes terrain */}
      <View style={st.fieldBlock}>
        <AureakText style={st.label as never}>Notes terrain</AureakText>
        <TextInput
          style={[st.input, st.textArea] as never}
          value={notes}
          onChangeText={setNotes}
          placeholder="Impressions rapides, catégorie, club observé…"
          placeholderTextColor={colors.text.muted}
          multiline
          numberOfLines={3}
          editable={!saving}
        />
      </View>

      {/* Erreur globale */}
      {error && (
        <View style={st.errorBox}>
          <AureakText style={st.errorBoxText as never}>{error}</AureakText>
        </View>
      )}

      {/* Submit sticky plein largeur */}
      <Pressable
        style={[st.submitBtn, saving && st.submitBtnDisabled] as never}
        onPress={() => performSubmit(false)}
        disabled={saving}
      >
        <AureakText style={st.submitBtnText as never}>
          {saving ? 'Création…' : '+ Créer le prospect'}
        </AureakText>
      </Pressable>

      <DuplicateWarningModal
        visible={showDupModal}
        duplicates={duplicates}
        onViewExisting={handleViewExisting}
        onForceCreate={handleForceCreate}
        onCancel={handleCancelDup}
      />
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  form: {
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    padding         : space.md,
    gap             : space.md,
    // @ts-ignore RN Web boxShadow
    boxShadow       : shadows.sm,
  },
  formTitle: {
    color     : colors.text.dark,
    fontSize  : 16,
    fontWeight: '700',
  },
  formSub: {
    color   : colors.text.muted,
    fontSize: 12,
    marginTop: -4,
  },
  fieldBlock: { gap: 6 },
  label: {
    color        : colors.text.muted,
    fontSize     : 11,
    fontWeight   : '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    minHeight        : 44,
    paddingHorizontal: space.sm,
    paddingVertical  : space.sm,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
    color            : colors.text.dark,
    fontSize         : 14,
    outlineStyle     : 'none' as never,
  },
  inputError: {
    borderColor: colors.status.absent,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  errorText: {
    color   : colors.status.absent,
    fontSize: 11,
    marginTop: 2,
  },
  hintSuccess: {
    color   : colors.accent.gold,
    fontSize: 11,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: colors.status.errorBg,
    borderWidth    : 1,
    borderColor    : colors.status.errorBorder,
    borderRadius   : radius.xs,
    padding        : space.sm,
  },
  errorBoxText: {
    color   : colors.status.errorText,
    fontSize: 12,
  },
  submitBtn: {
    minHeight        : 48,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
    alignItems       : 'center',
    justifyContent   : 'center',
    paddingHorizontal: space.md,
    marginTop        : space.xs,
    // @ts-ignore RN Web boxShadow
    boxShadow        : shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitBtnText: {
    color     : colors.text.dark,
    fontSize  : 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Club autocomplete dropdown
  clubLoading: {
    position: 'absolute' as never,
    right   : 10,
    top     : 12,
    color   : colors.text.muted,
    fontSize: 14,
  },
  clubDropdown: {
    position        : 'absolute' as never,
    top             : '100%' as never,
    left            : 0,
    right           : 0,
    marginTop       : 2,
    backgroundColor : colors.light.surface,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    borderRadius    : radius.xs,
    zIndex          : 999,
    elevation       : 8,
    // @ts-ignore
    boxShadow       : shadows.md,
    overflow        : 'hidden',
  },
  clubItem: {
    paddingHorizontal: space.sm,
    paddingVertical  : 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  clubItemText: {
    color   : colors.text.dark,
    fontSize: 13,
  },
})
