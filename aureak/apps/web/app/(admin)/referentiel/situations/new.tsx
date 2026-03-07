import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSituation, listSituationGroups } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { SituationGroup } from '@aureak/types'

const situationSchema = z.object({
  situationKey: z.string().min(1, 'Requis').regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets uniquement'),
  name        : z.string().min(1, 'Requis'),
  description : z.string().optional(),
  groupId     : z.string().uuid().optional().or(z.literal('')),
})

type SituationForm = z.infer<typeof situationSchema>

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, alignItems: 'center' },
  card: { width: '100%', maxWidth: 560, padding: space.xl, gap: space.md, marginTop: space.xl },
  chipRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: space.md, paddingVertical: space.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.accent.zinc,
    cursor: 'pointer' as never,
  },
  chipSelected: { borderColor: colors.accent.gold, backgroundColor: colors.background.elevated },
  successBanner: {
    backgroundColor: colors.background.elevated, borderLeftWidth: 3,
    borderLeftColor: colors.status.present, borderRadius: 4, padding: space.md,
  },
  errorBanner: {
    backgroundColor: colors.background.elevated, borderLeftWidth: 3,
    borderLeftColor: colors.status.absent, borderRadius: 4, padding: space.md,
  },
})

export default function NewSituationScreen() {
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const [groups, setGroups] = useState<SituationGroup[]>([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listSituationGroups().then(({ data }) => setGroups(data))
  }, [])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SituationForm>({
    resolver: zodResolver(situationSchema),
    defaultValues: { situationKey: '', name: '', description: '', groupId: '' },
  })

  const onSubmit = async ({ situationKey, name, description, groupId }: SituationForm) => {
    setError(null)
    setSuccess(false)
    if (!tenantId) { setError('Session invalide.'); return }

    const { error: err } = await createSituation({
      tenantId,
      situationKey,
      name,
      description: description || undefined,
      groupId    : groupId || undefined,
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

        {groups.length > 0 && (
          <View>
            <AureakText variant="label" style={{ marginBottom: space.sm }}>Groupe (optionnel)</AureakText>
            <Controller
              control={control}
              name="groupId"
              render={({ field: { onChange, value } }) => (
                <View style={styles.chipRow}>
                  {groups.map((g) => (
                    <View
                      key={g.id}
                      style={[styles.chip, value === g.id && styles.chipSelected]}
                      onTouchEnd={() => onChange(value === g.id ? '' : g.id)}
                    >
                      <AureakText
                        variant="label"
                        style={{ color: value === g.id ? colors.accent.gold : colors.text.secondary }}
                      >
                        {g.name}
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
