import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { disableUser } from '@aureak/api-client'
import { AureakButton } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

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
    gap: space.lg,
    marginTop: space.xl,
  },
  dangerZone: {
    borderWidth: 1,
    borderColor: colors.status.absent,
    borderRadius: 8,
    padding: space.lg,
    gap: space.md,
  },
  errorBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
  successBanner: {
    backgroundColor: colors.light.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.present,
    borderRadius: 4,
    padding: space.md,
  },
})

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [isDisabling, setIsDisabling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)

  const handleDisable = () => {
    Alert.alert(
      'Désactiver ce compte ?',
      'L\'utilisateur sera immédiatement déconnecté et ne pourra plus se reconnecter. Cette action est réversible par un administrateur.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: confirmDisable,
        },
      ],
    )
  }

  const confirmDisable = async () => {
    if (!id) return
    setIsDisabling(true)
    setError(null)

    const { error: disableError } = await disableUser(id)

    setIsDisabling(false)

    if (disableError) {
      setError(typeof disableError === 'string' ? disableError : 'Erreur lors de la désactivation.')
      return
    }

    setDisabled(true)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <AureakButton
          label="Retour"
          onPress={() => router.back()}
          variant="ghost"
        />

        <AureakText variant="h2">Gestion du compte</AureakText>
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          ID : {id}
        </AureakText>

        {error && (
          <View style={styles.errorBanner}>
            <AureakText variant="body" style={{ color: colors.status.absent }}>
              {error}
            </AureakText>
          </View>
        )}

        {disabled && (
          <View style={styles.successBanner}>
            <AureakText variant="body" style={{ color: colors.status.present }}>
              Compte désactivé. Toutes les sessions actives ont été révoquées.
            </AureakText>
          </View>
        )}

        <View style={styles.dangerZone}>
          <AureakText variant="label" style={{ color: colors.status.absent }}>
            Zone dangereuse
          </AureakText>
          <AureakText variant="body">
            Désactiver ce compte révoque immédiatement toutes les sessions actives.
            L'utilisateur sera déconnecté au prochain accès à l'application.
          </AureakText>
          <AureakButton
            label={isDisabling ? 'Désactivation...' : 'Désactiver ce compte'}
            onPress={handleDisable}
            variant="secondary"
            disabled={disabled || isDisabling}
            loading={isDisabling}
          />
        </View>
      </View>
    </ScrollView>
  )
}
