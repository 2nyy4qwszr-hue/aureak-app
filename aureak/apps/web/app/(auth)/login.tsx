import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, getUserRoleFromProfile } from '@aureak/api-client'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { UserRole } from '@aureak/types'

const loginSchema = z.object({
  email   : z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(8, 'Mot de passe requis (8 caractères minimum)'),
})

type LoginForm = z.infer<typeof loginSchema>

const ROLE_ROUTES: Record<UserRole, string> = {
  admin     : '/dashboard',
  coach     : '/coach/dashboard',
  parent    : '/parent/dashboard',
  child     : '/child/dashboard',
  club      : '/(auth)/login',
  commercial: '/developpement/prospection',
  // manager et marketeur : routes dédiées à créer en Epic 88/91/92 (Story 86-1 : enum + types uniquement)
  manager   : '/(auth)/login',
  marketeur : '/(auth)/login',
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as never,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: space.xl,
    backgroundColor: colors.light.surface,
    borderRadius: radius.card,
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: space.sm,
    gap: 4,
  },
  goldStripe: {
    width: 40,
    height: 3,
    backgroundColor: colors.accent.gold,
    borderRadius: 2,
    marginTop: space.sm,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: radius.xs,
    padding: space.md,
  },
})

export default function LoginScreen() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async ({ email, password }: LoginForm) => {
    setAuthError(null)
    const { data, error } = await signIn({ email, password })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setAuthError('Email ou mot de passe incorrect.')
      } else if (error.message.includes('Email not confirmed')) {
        setAuthError('Votre compte n\'est pas encore activé. Vérifiez votre email.')
      } else {
        setAuthError(error.message)
      }
      return
    }

    // Role from JWT app_metadata (injected by Custom Access Token Hook).
    // Fallback: fetch directly from profiles if hook is not yet configured.
    let role = data.session?.user?.app_metadata?.role as UserRole | undefined

    if (!role && data.session?.user?.id) {
      const { data: profileRole } = await getUserRoleFromProfile(data.session.user.id)
      role = (profileRole ?? undefined) as UserRole | undefined
    }

    const route = role ? ROLE_ROUTES[role] : null

    if (!route) {
      setAuthError('Rôle inconnu. Contactez votre administrateur.')
      return
    }

    router.replace(route as never)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Brand header */}
        <View style={styles.brandBlock}>
          <AureakText
            variant="display"
            style={{ color: colors.text.dark, letterSpacing: 6, textAlign: 'center' }}
          >
            AUREAK
          </AureakText>
          <AureakText
            variant="caption"
            style={{ color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' as never, textAlign: 'center' }}
          >
            Académie · Espace sécurisé
          </AureakText>
          <View style={styles.goldStripe} />
        </View>

        {authError && (
          <View style={styles.errorBanner}>
            <AureakText variant="body" style={{ color: colors.status.absent }}>
              {authError}
            </AureakText>
          </View>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              placeholder="admin@aureak.be"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
              variant="light"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Mot de passe"
              value={value}
              onChangeText={onChange}
              placeholder="••••••••"
              secureTextEntry
              error={errors.password?.message}
              variant="light"
            />
          )}
        />

        <AureakButton
          label={isSubmitting ? 'Connexion...' : 'Se connecter'}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
        />

        <AureakText
          variant="caption"
          style={{ color: colors.text.subtle, textAlign: 'center', marginTop: 4 }}
        >
          © 2025 Aureak · Tous droits réservés
        </AureakText>
      </View>
    </ScrollView>
  )
}
