import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSituation, listThemeGroups } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { ThemeGroup } from '@aureak/types'

const situationSchema = z.object({
  situationKey: z.string().min(1, 'Requis').regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets uniquement'),
  name        : z.string().min(1, 'Requis'),
  description : z.string().optional(),
  blocId      : z.string().uuid().optional().or(z.literal('')),
})

type SituationForm = z.infer<typeof situationSchema>

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary, alignItems: 'center' },
  card: { width: '100%', maxWidth: 560, padding: space.xl, gap: space.md, marginTop: space.xl },
  chipRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: space.md, paddingVertical: space.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border.light,
    cursor: 'pointer' as never,
  },
  chipSelected: { borderColor: colors.accent.gold, backgroundColor: colors.light.muted },
  successBanner: {
    backgroundColor: colors.light.muted, borderLeftWidth: 3,
    borderLeftColor: colors.status.present, borderRadius: 4, padding: space.md,
  },
  errorBanner: {
    backgroundColor: colors.light.muted, borderLeftWidth: 3,
    borderLeftColor: colors.status.absent, borderRadius: 4, padding: space.md,
  },
})

export default function NewSituationScreen() {
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const [blocs, setBlocs] = useState<ThemeGroup[]>([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listThemeGroups().then(({ data }) => setBlocs(data))
  }, [])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SituationForm>({
    resolver: zodResolver(situationSchema),
    defaultValues: { situationKey: '', name: '', description: '', blocId: '' },
  })

  const onSubmit = async ({ situationKey, name, description, blocId }: SituationForm) => {
    setError(null)
    setSuccess(false)
    if (!tenantId) { setError('Session invalide.'); return }

    const { error: err } = await createSituation({
      tenantId,
      situationKey,
      name,
      description: description || undefined,
      blocId     : blocId || undefined,
    })

    if (err) { setError('Erreur lors de la création de la situation.'); return }
    setSuccess(true)
    reset()
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
        <AureakText variant="h2">Nouvelle situation</AureakText>

        {success && (
          <View style={styles.successBanner}>
            <AureakText variant="body" style={{ color: colors.status.present }}>
              Situation créée avec succès.
            </AureakText>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <AureakText variant="body" style={{ color: colors.status.absent }}>{error}</AureakText>
          </View>
        )}

        <Controller
          control={control}
          name="situationKey"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Clé de la situation (slug)"
              value={value}
              onChangeText={onChange}
              placeholder="phase-defensive-4-3-3"
              autoCapitalize="none"
              error={errors.situationKey?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nom affiché"
              value={value}
              onChangeText={onChange}
              placeholder="Phase défensive 4-3-3"
              autoCapitalize="words"
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description (optionnelle)"
              value={value ?? ''}
              onChangeText={onChange}
              placeholder="Description de la situation..."
              autoCapitalize="sentences"
            />
          )}
        />

        {blocs.length > 0 && (
          <View>
            <AureakText variant="label" style={{ marginBottom: space.sm }}>Bloc (optionnel)</AureakText>
            <Controller
              control={control}
              name="blocId"
              render={({ field: { onChange, value } }) => (
                <View style={styles.chipRow}>
                  {blocs.map((b) => (
                    <View
                      key={b.id}
                      style={[styles.chip, value === b.id && styles.chipSelected]}
                      onTouchEnd={() => onChange(value === b.id ? '' : b.id)}
                    >
                      <AureakText
                        variant="label"
                        style={{ color: value === b.id ? colors.accent.gold : colors.text.muted }}
                      >
                        {b.name}
                      </AureakText>
                    </View>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <AureakButton label="Annuler" onPress={() => router.back()} variant="secondary" />
          <AureakButton
            label={isSubmitting ? 'Création...' : 'Créer la situation'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  )
}
