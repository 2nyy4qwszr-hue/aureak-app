import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClub } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const clubSchema = z.object({
  name       : z.string().min(1, 'Nom du club requis'),
  email      : z.string().min(1, 'Email requis').email('Email invalide'),
  accessLevel: z.enum(['partner', 'common'] as const, {
    errorMap: () => ({ message: 'Niveau d\'accès requis' }),
  }),
})

type ClubForm = z.infer<typeof clubSchema>

const ACCESS_LEVELS: Array<{ value: 'partner' | 'common'; label: string }> = [
  { value: 'partner', label: 'Partenaire — accès étendu (présences + rapports mi/fin saison)' },
  { value: 'common',  label: 'Commun — accès de base (présences uniquement)' },
]

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    padding: space.xl,
    gap: space.md,
    marginTop: space.xl,
  },
  levelOption: {
    padding: space.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    cursor: 'pointer' as never,
  },
  levelOptionSelected: {
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

export default function NewClubScreen() {
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const user = useAuthStore((s) => s.user)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClubForm>({
    resolver: zodResolver(clubSchema),
    defaultValues: { name: '', email: '', accessLevel: 'common' },
  })

  const onSubmit = async ({ name, email, accessLevel }: ClubForm) => {
    setError(null)
    setSuccess(false)

    if (!tenantId || !user?.id) {
      setError('Session invalide. Reconnectez-vous.')
      return
    }

    const { error: createError } = await createClub({
      name,
      email,
      accessLevel,
      tenantId,
      createdBy: user.id,
    })

    if (createError) {
      setError('Erreur lors de la création du club.')
      return
    }

    setSuccess(true)
    reset()
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />

        <AureakText variant="h2">Nouveau club</AureakText>

        {success && (
          <View style={styles.successBanner}>
            <AureakText variant="body" style={{ color: colors.status.present }}>
              Club créé. L'invitation a été envoyée par email.
            </AureakText>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <AureakText variant="body" style={{ color: colors.status.absent }}>
              {error}
            </AureakText>
          </View>
        )}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nom du club"
              value={value}
              onChangeText={onChange}
              placeholder="Club Sportif Example"
              autoCapitalize="words"
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email du compte club"
              value={value}
              onChangeText={onChange}
              placeholder="contact@club.be"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />

        <View>
          <AureakText variant="label" style={{ marginBottom: space.sm }}>
            Niveau d'accès
          </AureakText>
          <Controller
            control={control}
            name="accessLevel"
            render={({ field: { onChange, value } }) => (
              <View style={{ gap: space.sm }}>
                {ACCESS_LEVELS.map((level) => (
                  <View
                    key={level.value}
                    style={[styles.levelOption, value === level.value && styles.levelOptionSelected]}
                    onTouchEnd={() => onChange(level.value)}
                  >
                    <AureakText
                      variant="label"
                      style={{ color: value === level.value ? colors.accent.gold : colors.text.primary }}
                    >
                      {level.label}
                    </AureakText>
                  </View>
                ))}
              </View>
            )}
          />
          {errors.accessLevel && (
            <AureakText variant="caption" style={{ color: colors.status.absent, marginTop: 4 }}>
              {errors.accessLevel.message}
            </AureakText>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <AureakButton label="Annuler" onPress={() => router.back()} variant="secondary" />
          <AureakButton
            label={isSubmitting ? 'Création...' : 'Créer le club'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  )
}
