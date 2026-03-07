import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, supabase } from '@aureak/api-client'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { UserRole } from '@aureak/types'

const loginSchema = z.object({
  email   : z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(8, 'Mot de passe requis (8 caractères minimum)'),
})

type LoginForm = z.infer<typeof loginSchema>

const ROLE_ROUTES: Record<UserRole, string> = {
  admin : '/dashboard',
  coach : '/coach/dashboard',
  parent: '/parent/dashboard',
  child : '/child/dashboard',
  club  : '/(auth)/login',
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: space.xl,
    backgroundColor: colors.background.surface,
    borderRadius: 12,
    gap: space.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: space.md,
  },
  errorBanner: {
    backgroundColor: colors.background.elevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('user_id', data.session.user.id)
        .single()
      role = profile?.user_role as UserRole | undefined
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
        <AureakText variant="h1" style={styles.title}>
          AUREAK
        </AureakText>

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
            />
          )}
        />

        <AureakButton
          label={isSubmitting ? 'Connexion...' : 'Se connecter'}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
        />
      </View>
    </ScrollView>
  )
}
