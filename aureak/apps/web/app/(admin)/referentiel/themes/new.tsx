import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createTheme, listThemeGroups } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { ThemeGroup } from '@aureak/types'

const LEVELS = [
  { value: 'debutant' as const,      label: 'Débutant' },
  { value: 'intermediaire' as const, label: 'Intermédiaire' },
  { value: 'avance' as const,        label: 'Avancé' },
]

const AGE_GROUPS = [
  { value: 'U5' as const,     label: 'U5' },
  { value: 'U8' as const,     label: 'U8' },
  { value: 'U11' as const,    label: 'U11' },
  { value: 'Senior' as const, label: 'Senior' },
]

const themeSchema = z.object({
  themeKey   : z.string().min(1, 'Requis').regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets uniquement'),
  name       : z.string().min(1, 'Requis'),
  description: z.string().optional(),
  level      : z.enum(['debutant', 'intermediaire', 'avance']).optional(),
  ageGroup   : z.enum(['U5', 'U8', 'U11', 'Senior']).optional(),
  groupId    : z.string().uuid().optional().or(z.literal('')),
})

type ThemeForm = z.infer<typeof themeSchema>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    padding: space.xl,
    gap: space.md,
    marginTop: space.xl,
  },
  chipRow: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    cursor: 'pointer' as never,
  },
  chipSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.background.elevated,
  },
  successBanner: {
    backgroundColor: colors.background.elevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.present,
    borderRadius: 4,
    padding: space.md,
  },
  errorBanner: {
    backgroundColor: colors.background.elevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
})

export default function NewThemeScreen() {
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const [groups, setGroups] = useState<ThemeGroup[]>([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listThemeGroups().then(({ data }) => setGroups(data))
  }, [])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ThemeForm>({
    resolver: zodResolver(themeSchema),
    defaultValues: { themeKey: '', name: '', description: '', level: undefined, ageGroup: undefined, groupId: '' },
  })

  const onSubmit = async ({ themeKey, name, description, level, ageGroup, groupId }: ThemeForm) => {
    setError(null)
    setSuccess(false)
    if (!tenantId) { setError('Session invalide.'); return }

    const { error: err } = await createTheme({
      tenantId,
      themeKey,
      name,
      description : description || undefined,
      level,
      ageGroup,
      groupId     : groupId || undefined,
    })

    if (err) { setError('Erreur lors de la création du thème.'); return }
    setSuccess(true)
    reset()
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
        <AureakText variant="h2">Nouveau thème</AureakText>

        {success && (
          <View style={styles.successBanner}>
            <AureakText variant="body" style={{ color: colors.status.present }}>
              Thème créé avec succès.
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
          name="themeKey"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Clé du thème (slug)"
              value={value}
              onChangeText={onChange}
              placeholder="sortie-au-sol"
              autoCapitalize="none"
              error={errors.themeKey?.message}
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
              placeholder="Sortie au sol"
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
              placeholder="Description pédagogique..."
              autoCapitalize="sentences"
            />
          )}
        />

        {/* Niveau */}
        <View>
          <AureakText variant="label" style={{ marginBottom: space.sm }}>Niveau</AureakText>
          <Controller
            control={control}
            name="level"
            render={({ field: { onChange, value } }) => (
              <View style={styles.chipRow}>
                {LEVELS.map((l) => (
                  <View
                    key={l.value}
                    style={[styles.chip, value === l.value && styles.chipSelected]}
                    onTouchEnd={() => onChange(value === l.value ? undefined : l.value)}
                  >
                    <AureakText
                      variant="label"
                      style={{ color: value === l.value ? colors.accent.gold : colors.text.secondary }}
                    >
                      {l.label}
                    </AureakText>
                  </View>
                ))}
              </View>
            )}
          />
        </View>

        {/* Groupe d'âge */}
        <View>
          <AureakText variant="label" style={{ marginBottom: space.sm }}>Groupe d'âge</AureakText>
          <Controller
            control={control}
            name="ageGroup"
            render={({ field: { onChange, value } }) => (
              <View style={styles.chipRow}>
                {AGE_GROUPS.map((ag) => (
                  <View
                    key={ag.value}
                    style={[styles.chip, value === ag.value && styles.chipSelected]}
                    onTouchEnd={() => onChange(value === ag.value ? undefined : ag.value)}
                  >
                    <AureakText
                      variant="label"
                      style={{ color: value === ag.value ? colors.accent.gold : colors.text.secondary }}
                    >
                      {ag.label}
                    </AureakText>
                  </View>
                ))}
              </View>
            )}
          />
        </View>

        {/* Groupe de thèmes */}
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
            label={isSubmitting ? 'Création...' : 'Créer le thème'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  )
}
