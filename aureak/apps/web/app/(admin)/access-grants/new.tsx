import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createGrant } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

// expires_at doit être dans le futur
const grantSchema = z.object({
  coachId       : z.string().uuid('UUID coach requis'),
  implantationId: z.string().uuid('UUID implantation requis'),
  expiresAt     : z.string().refine(
    (val) => new Date(val) > new Date(),
    'La date d\'expiration doit être dans le futur',
  ),
})

type GrantForm = z.infer<typeof grantSchema>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    padding: space.xl,
    gap: space.md,
    marginTop: space.xl,
  },
  successBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.present,
    borderRadius: 4,
    padding: space.md,
  },
  errorBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
  hint: {
    color: colors.text.muted,
  },
})

export default function NewAccessGrantScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const tenantId = useAuthStore((s) => s.tenantId)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GrantForm>({
    resolver: zodResolver(grantSchema),
    defaultValues: { coachId: '', implantationId: '', expiresAt: '' },
  })

  const onSubmit = async ({ coachId, implantationId, expiresAt }: GrantForm) => {
    setError(null)
    setSuccess(false)

    if (!tenantId || !user?.id) {
      setError('Session invalide. Reconnectez-vous.')
      return
    }

    const { error: createError } = await createGrant({
      coachId,
      implantationId,
      expiresAt: new Date(expiresAt).toISOString(),
      tenantId,
      grantedBy: user.id,
    })

    if (createError) {
      setError('Erreur lors de la création du grant.')
      return
    }

    setSuccess(true)
    reset()
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <AureakButton
          label="Retour"
          onPress={() => router.back()}
          variant="ghost"
        />

        <AureakText variant="h2">Nouveau accès temporaire</AureakText>
        <AureakText variant="body" style={styles.hint}>
          Accorde à un coach un accès temporaire à une implantation tierce.
          L'accès expire automatiquement à la date choisie.
        </AureakText>

        {success && (
          <View style={styles.successBanner}>
            <AureakText variant="body" style={{ color: colors.status.present }}>
              Accès temporaire créé et journalisé dans l'audit trail.
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
          name="coachId"
          render={({ field: { onChange, value } }) => (
            <Input
              label="UUID du Coach"
              value={value}
              onChangeText={onChange}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoCapitalize="none"
              error={errors.coachId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="implantationId"
          render={({ field: { onChange, value } }) => (
            <Input
              label="UUID de l'Implantation"
              value={value}
              onChangeText={onChange}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoCapitalize="none"
              error={errors.implantationId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="expiresAt"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Date d'expiration (YYYY-MM-DD HH:MM)"
              value={value}
              onChangeText={onChange}
              placeholder="2026-03-15 18:00"
              autoCapitalize="none"
              error={errors.expiresAt?.message}
            />
          )}
        />

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <AureakButton
            label="Annuler"
            onPress={() => router.back()}
            variant="secondary"
          />
          <AureakButton
            label={isSubmitting ? 'Création...' : 'Créer le grant'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  )
}
