import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createTheme, listThemeGroups, getThemeByKey } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { ThemeGroup } from '@aureak/types'

const themeSchema = z.object({
  themeKey   : z.string().min(1, 'Requis').regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets uniquement'),
  name       : z.string().min(1, 'Requis'),
  description: z.string().optional(),
  groupId    : z.string().uuid().optional().or(z.literal('')),
})

type ThemeForm = z.infer<typeof themeSchema>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,
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
    borderColor: colors.border.light,
    cursor: 'pointer' as never,
  },
  chipSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.light.muted,
  },
  errorBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
})

export default function NewThemeScreen() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const [groups, setGroups] = useState<ThemeGroup[]>([])
  const [error,  setError]  = useState<string | null>(null)

  useEffect(() => {
    listThemeGroups().then(({ data }) => setGroups(data))
  }, [])

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ThemeForm>({
    resolver: zodResolver(themeSchema),
    defaultValues: { themeKey: '', name: '', description: '', groupId: '' },
  })

  const onSubmit = async ({ themeKey, name, description, groupId }: ThemeForm) => {
    setError(null)
    if (!tenantId) { setError('Session invalide — rechargez la page.'); return }

    const { data: existing } = await getThemeByKey(themeKey)
    if (existing) {
      setError('Cette clé de thème existe déjà. Merci de choisir une autre clé.')
      return
    }

    const { data, error: supabaseError } = await createTheme({
      tenantId,
      themeKey,
      name,
      description: description || undefined,
      groupId    : groupId || undefined,
    })

    if (supabaseError || !data) {
      console.error('[createTheme] Supabase error:', supabaseError)
      const msg = supabaseError instanceof Error
        ? supabaseError.message
        : (supabaseError as { message?: string })?.message ?? 'Erreur inconnue'
      setError(`Erreur lors de la création : ${msg}`)
      return
    }

    router.replace(`/methodologie/themes/${data.themeKey}` as never)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
        <AureakText variant="h2">Nouveau thème</AureakText>

        {error && (
          <View style={styles.errorBanner}>
            <AureakText variant="body" style={{ color: colors.status.absent }}>{error}</AureakText>
          </View>
        )}

        {/* Clé slug */}
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

        {/* Nom */}
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

        {/* Description */}
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

        {/* Bloc de thème */}
        <View>
          <AureakText variant="label" style={{ marginBottom: space.sm }}>
            Bloc de thème (optionnel)
          </AureakText>
          {groups.length === 0 ? (
            <AureakText variant="caption" style={{ color: colors.text.muted }}>
              Aucun bloc défini — créez-en d'abord dans Méthodologie › Blocs.
            </AureakText>
          ) : (
            <Controller
              control={control}
              name="groupId"
              render={({ field: { onChange, value } }) => (
                <View style={styles.chipRow}>
                  {groups.map((g) => (
                    <Pressable
                      key={g.id}
                      style={[styles.chip, value === g.id && styles.chipSelected]}
                      onPress={() => onChange(value === g.id ? '' : g.id)}
                    >
                      <AureakText
                        variant="label"
                        style={{ color: value === g.id ? colors.accent.gold : colors.text.muted }}
                      >
                        {g.name}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          )}
        </View>

        {/* Actions */}
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
