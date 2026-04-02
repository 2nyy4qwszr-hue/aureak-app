import React, { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from '@aureak/api-client'
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
  admin : '/(admin)',
  coach : '/(coach)',
  parent: '/(parent)',
  child : '/(child)',
  club  : '/(admin)',
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  title: {
    marginBottom: space.xl,
    textAlign: 'center',
  },
  form: {
    gap: space.md,
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

    const role = data.session?.user?.app_metadata?.role as UserRole | undefined
    const route = role ? ROLE_ROUTES[role] : null

    if (!route) {
      setAuthError('Rôle inconnu. Contactez votre administrateur.')
      return
    }

    router.replace(route as never)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AureakText variant="h1" style={styles.title}>
          AUREAK
        </AureakText>

        <View style={styles.form}>
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
                placeholder="coach@aureak.be"
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
    </KeyboardAvoidingView>
  )
}
