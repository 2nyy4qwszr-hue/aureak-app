import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSituation, listThemeGroups, listSituationGroups } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input, AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { ThemeGroup, SituationGroup } from '@aureak/types'

const situationSchema = z.object({
  situationKey: z.string().min(1, 'Requis').regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets uniquement'),
  name        : z.string().min(1, 'Requis'),
  description : z.string().optional(),
  blocId      : z.string().uuid().optional().or(z.literal('')),
  groupId     : z.string().uuid().optional().or(z.literal('')),
})

type SituationForm = z.infer<typeof situationSchema>

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary, alignItems: 'center' },
  card: { width: '100%', maxWidth: 560, padding: space.xl, gap: space.md, marginTop: space.xl },
  chipRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: space.md, paddingVertical: space.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border.light,
  },
  chipSelected: { borderColor: colors.accent.gold, backgroundColor: colors.light.muted },
  errorBanner: {
    backgroundColor: colors.light.muted, borderLeftWidth: 3,
    borderLeftColor: colors.status.absent, borderRadius: 4, padding: space.md,
  },
})

export default function NewSituationScreen() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const [blocs,  setBlocs]  = useState<ThemeGroup[]>([])
  const [groups, setGroups] = useState<SituationGroup[]>([])
  const [error,  setError]  = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listThemeGroups(), listSituationGroups()]).then(([b, g]) => {
      // listThemeGroups ne garantit pas l'ordre — tri explicite par sortOrder
      setBlocs([...b.data].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)))
      setGroups(g.data) // listSituationGroups est déjà trié côté DB
    })
  }, [])

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SituationForm>({
    resolver: zodResolver(situationSchema),
    defaultValues: { situationKey: '', name: '', description: '', blocId: '', groupId: '' },
  })

  const onSubmit = async ({ situationKey, name, description, blocId, groupId }: SituationForm) => {
    setError(null)
    if (!tenantId) { setError('Session invalide.'); return }

    const { error: err } = await createSituation({
      tenantId,
      situationKey,
      name,
      description: description || undefined,
      blocId     : blocId  || undefined,
      groupId    : groupId || undefined,
    })

    if (err) {
      const pgErr = err as { code?: string }
      if (pgErr?.code === '23505') {
        setError(`La clé "${situationKey}" existe déjà. Choisissez un slug différent.`)
      } else {
        setError('Erreur lors de la création de la situation.')
      }
      return
    }

    router.push(`/(admin)/methodologie/situations/${situationKey}` as never)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
        <AureakText variant="h2">Nouvelle situation</AureakText>

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
              multiline
              numberOfLines={3}
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
                    <Pressable
                      key={b.id}
                      style={[styles.chip, value === b.id && styles.chipSelected]}
                      onPress={() => onChange(value === b.id ? '' : b.id)}
                    >
                      <AureakText
                        variant="label"
                        style={{ color: value === b.id ? colors.accent.gold : colors.text.muted }}
                      >
                        {b.name}
                      </AureakText>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        {groups.length > 0 && (
          <View>
            <AureakText variant="label" style={{ marginBottom: space.sm }}>Groupe de situation (optionnel)</AureakText>
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
