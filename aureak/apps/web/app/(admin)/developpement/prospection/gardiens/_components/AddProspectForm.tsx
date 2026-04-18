'use client'
// Story 89.2 — Formulaire ajout gardien prospect (mobile-first, React Hook Form + Zod)
import React, { useState } from 'react'
import { View, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { createProspectChild } from '@aureak/api-client'
import { FOOTBALL_AGE_CATEGORIES } from '@aureak/types'
import type { FootballAgeCategory } from '@aureak/types'
import { useAuthStore } from '@aureak/business-logic'

const schema = z.object({
  nom           : z.string().min(1, 'Nom requis'),
  prenom        : z.string().min(1, 'Prenom requis'),
  birthDate     : z.string().optional(),
  currentClub   : z.string().optional(),
  ageCategory   : z.string().optional(),
  parent1Tel    : z.string().optional(),
  parent1Email  : z.string().email('Email invalide').optional().or(z.literal('')),
  notesInternes : z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Props = {
  visible: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddProspectForm({ visible, onClose, onCreated }: Props) {
  const { tenantId } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '', prenom: '', birthDate: '', currentClub: '',
      ageCategory: '', parent1Tel: '', parent1Email: '', notesInternes: '',
    },
  })

  async function onSubmit(data: FormData) {
    if (!tenantId) return
    setSaving(true)
    try {
      await createProspectChild({
        tenantId,
        nom          : data.nom,
        prenom       : data.prenom,
        birthDate    : data.birthDate || null,
        currentClub  : data.currentClub || null,
        ageCategory  : (data.ageCategory as FootballAgeCategory) || null,
        parent1Tel   : data.parent1Tel || null,
        parent1Email : data.parent1Email || null,
        notesInternes: data.notesInternes || null,
      })
      setSuccessMsg(`${data.prenom} ${data.nom} a ete ajoute comme prospect.`)
      reset()
      onCreated()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AddProspectForm] create error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modal as object} onPress={e => e.stopPropagation()}>
        <ScrollView>
          <AureakText variant="h2" style={styles.title}>Ajouter un gardien prospect</AureakText>

          {successMsg && (
            <View style={styles.successBanner}>
              <AureakText style={styles.successText}>{successMsg}</AureakText>
            </View>
          )}

          {/* Prenom */}
          <AureakText style={styles.label}>Prenom *</AureakText>
          <Controller
            control={control}
            name="prenom"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.prenom && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Lucas"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />
          {errors.prenom && <AureakText style={styles.errorText}>{errors.prenom.message}</AureakText>}

          {/* Nom */}
          <AureakText style={styles.label}>Nom *</AureakText>
          <Controller
            control={control}
            name="nom"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.nom && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Dupont"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />
          {errors.nom && <AureakText style={styles.errorText}>{errors.nom.message}</AureakText>}

          {/* Date de naissance */}
          <AureakText style={styles.label}>Date de naissance</AureakText>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />

          {/* Club actuel */}
          <AureakText style={styles.label}>Club actuel</AureakText>
          <Controller
            control={control}
            name="currentClub"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="Ex: RSC Anderlecht"
                placeholderTextColor={colors.text.subtle}
              />
            )}
          />

          {/* Categorie d'age */}
          <AureakText style={styles.label}>Categorie d'age</AureakText>
          <Controller
            control={control}
            name="ageCategory"
            render={({ field: { onChange, value } }) => (
              <View style={styles.selectWrap}>
                <select
                  value={value ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: radius.xs,
                    border: `1px solid ${colors.border.light}`,
                    fontSize: 14,
                    fontFamily: fonts.body,
                    color: value ? colors.text.dark : colors.text.subtle,
                    backgroundColor: colors.light.surface,
                    cursor: 'pointer',
                  }}
                >
                  <option value="">-- Choisir --</option>
                  {FOOTBALL_AGE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </View>
            )}
          />

          {/* Telephone parent */}
          <AureakText style={styles.label}>Telephone parent</AureakText>
          <Controller
            control={control}
            name="parent1Tel"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder="+32 xxx xx xx xx"
                placeholderTextColor={colors.text.subtle}
                keyboardType="phone-pad"
              />
            )}
          />

          {/* Email parent */}
          <AureakText style={styles.label}>Email parent</AureakText>
          <Controller
            control={control}
            name="parent1Email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.parent1Email && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="parent@exemple.com"
                placeholderTextColor={colors.text.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.parent1Email && <AureakText style={styles.errorText}>{errors.parent1Email.message}</AureakText>}

          {/* Notes scout */}
          <AureakText style={styles.label}>Notes scout</AureakText>
          <Controller
            control={control}
            name="notesInternes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={value}
                onChangeText={onChange}
                placeholder="Observations terrain, potentiel, attitude..."
                placeholderTextColor={colors.text.subtle}
                multiline
                numberOfLines={4}
              />
            )}
          />

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={() => { reset(); setSuccessMsg(null); onClose() }}>
              <AureakText style={styles.cancelBtnText}>Annuler</AureakText>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={saving}
            >
              <AureakText style={styles.submitBtnText}>
                {saving ? 'Ajout...' : 'Ajouter'}
              </AureakText>
            </Pressable>
          </View>
        </ScrollView>
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    right          : 0,
    bottom         : 0,
    backgroundColor: colors.overlay.dark,
    justifyContent : 'center',
    alignItems     : 'center',
    zIndex         : 1000,
  },
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.xl,
    width          : '100%',
    maxWidth       : 520,
    maxHeight      : '90%',
    boxShadow      : shadows.lg,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.lg,
  },
  successBanner: {
    backgroundColor  : '#e6f9ed',
    borderRadius     : radius.xs,
    padding          : space.sm,
    marginBottom     : space.md,
  },
  successText: {
    color     : '#1a7a3a',
    fontSize  : 13,
    fontFamily: fonts.body,
    fontWeight: '600',
  },
  label: {
    fontSize    : 12,
    fontFamily  : fonts.body,
    fontWeight  : '600',
    color       : colors.text.dark,
    marginBottom: space.xs,
    marginTop   : space.md,
  },
  input: {
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : radius.xs,
    padding        : space.sm,
    fontSize       : 14,
    fontFamily     : fonts.body,
    color          : colors.text.dark,
    backgroundColor: colors.light.surface,
  },
  inputError: {
    borderColor: colors.status.absent,
  },
  textArea: {
    minHeight        : 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize  : 11,
    color     : colors.status.absent,
    fontFamily: fonts.body,
    marginTop : 2,
  },
  selectWrap: {
    // container for the native select element
  },
  actions: {
    flexDirection  : 'row',
    justifyContent : 'flex-end',
    gap            : space.sm,
    marginTop      : space.xl,
  },
  cancelBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  cancelBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.text.muted,
  },
  submitBtn: {
    paddingVertical  : space.sm,
    paddingHorizontal: space.lg,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.primary,
  },
})
