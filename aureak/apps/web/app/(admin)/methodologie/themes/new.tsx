import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createTheme, listThemeGroups } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { ThemeGroup } from '@aureak/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const themeSchema = z.object({
  themeKey   : z.string().min(1, 'Requis').regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets uniquement'),
  name       : z.string().min(1, 'Requis'),
  description: z.string().optional(),
  groupId    : z.string().uuid().optional().or(z.literal('')),
})

type ThemeForm = z.infer<typeof themeSchema>

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,
  },
  inner: {
    alignItems: 'center',
    paddingVertical: space.xl,
    paddingHorizontal: space.md,
  },
  header: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  breadcrumb: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.light.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: space.xl,
    gap: space.md,
    // shadow via style prop (web only)
  },
  chipRow: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
    marginTop: space.xs,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: 'transparent',
    cursor: 'pointer' as never,
  },
  chipSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: `${colors.accent.gold}18`,
  },
  errorBanner: {
    backgroundColor: `${colors.status.absent}12`,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
  footer: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.xs,
  },
})

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewThemeScreen() {
  const router   = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [groups,       setGroups]       = useState<ThemeGroup[]>([])
  const [groupsLoading,setGroupsLoading]= useState(true)
  const [groupsError,  setGroupsError]  = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [slugManual,   setSlugManual]   = useState(false)

  useEffect(() => {
    listThemeGroups()
      .then(({ data, error: err }) => {
        if (err) setGroupsError(true)
        else setGroups(data ?? [])
      })
      .catch(() => setGroupsError(true))
      .finally(() => setGroupsLoading(false))
  }, [])

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ThemeForm>({
    resolver: zodResolver(themeSchema),
    defaultValues: { themeKey: '', name: '', description: '', groupId: '' },
  })

  // Auto-generate slug from name unless user has manually edited it
  const handleNameChange = useCallback((name: string, onChange: (v: string) => void) => {
    onChange(name)
    if (!slugManual) {
      setValue('themeKey', slugify(name), { shouldValidate: false })
    }
  }, [slugManual, setValue])

  const onSubmit = async ({ themeKey, name, description, groupId }: ThemeForm) => {
    setError(null)
    if (!tenantId) { setError('Session invalide — rechargez la page.'); return }

    const { data, error: supabaseError } = await createTheme({
      tenantId,
      themeKey,
      name,
      description: description || undefined,
      groupId    : groupId || undefined,
    })

    if (supabaseError || !data) {
      const raw = supabaseError as { message?: string; code?: string } | null
      if (raw?.code === '23505' || raw?.message?.includes('unique')) {
        setError('Cette clé de thème existe déjà. Choisissez une autre clé.')
      } else {
        setError(`Erreur lors de la création : ${raw?.message ?? 'Erreur inconnue'}`)
      }
      return
    }

    router.replace(`/methodologie/themes/${data.themeKey}` as never)
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.light.primary }}>
      <View style={S.inner}>

        {/* Header : back + breadcrumb */}
        <View style={S.header}>
          <AureakButton label="← Retour" onPress={() => router.back()} variant="ghost" />
          <View style={S.breadcrumb}>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Méthodologie</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>›</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>Thèmes</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>›</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' }}>Nouveau</AureakText>
          </View>
        </View>

        {/* Card */}
        <View style={[S.card, { boxShadow: shadows.sm } as never]}>
          <AureakText variant="h2">Nouveau thème</AureakText>

          {error && (
            <View style={S.errorBanner}>
              <AureakText variant="body" style={{ color: colors.status.absent }}>{error}</AureakText>
            </View>
          )}

          {/* Nom — first so slug auto-fills */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nom affiché"
                variant="light"
                value={value}
                onChangeText={(v) => handleNameChange(v, onChange)}
                placeholder="Sortie au sol"
                autoCapitalize="words"
                error={errors.name?.message}
              />
            )}
          />

          {/* Slug — auto-générée, éditable */}
          <Controller
            control={control}
            name="themeKey"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Clé du thème (slug)"
                variant="light"
                value={value}
                onChangeText={(v) => {
                  setSlugManual(true)
                  // Force lowercase + tirets à la saisie
                  onChange(v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
                }}
                placeholder="sortie-au-sol"
                autoCapitalize="none"
                error={errors.themeKey?.message}
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
                variant="light"
                value={value ?? ''}
                onChangeText={onChange}
                placeholder="Description pédagogique..."
                autoCapitalize="sentences"
              />
            )}
          />

          {/* Bloc de thème */}
          <View>
            <AureakText variant="label" style={{ marginBottom: space.xs, color: colors.text.muted }}>
              Bloc de thème (optionnel)
            </AureakText>

            {groupsLoading ? (
              <ActivityIndicator size="small" color={colors.accent.gold} />
            ) : groupsError ? (
              <AureakText variant="caption" style={{ color: colors.status.absent }}>
                Erreur lors du chargement des blocs.
              </AureakText>
            ) : groups.length === 0 ? (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Aucun bloc défini — créez-en d'abord dans Méthodologie › Blocs.
              </AureakText>
            ) : (
              <Controller
                control={control}
                name="groupId"
                render={({ field: { onChange, value } }) => (
                  <View style={S.chipRow}>
                    {groups.map((g) => {
                      const selected = value === g.id
                      return (
                        <Pressable
                          key={g.id}
                          style={[S.chip, selected && S.chipSelected]}
                          onPress={() => onChange(selected ? '' : g.id)}
                        >
                          <AureakText
                            variant="body"
                            style={{
                              fontSize  : 13,
                              fontWeight: '600',
                              color     : selected ? colors.accent.gold : colors.text.muted,
                            }}
                          >
                            {g.name}
                          </AureakText>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
              />
            )}
          </View>

          {/* Actions */}
          <View style={S.footer}>
            <AureakButton label="Annuler" onPress={() => router.back()} variant="secondary" />
            <AureakButton
              label={isSubmitting ? 'Création...' : 'Créer le thème'}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
            />
          </View>
        </View>

      </View>
    </ScrollView>
  )
}
