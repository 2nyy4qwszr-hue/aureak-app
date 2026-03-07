import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { listActiveGrants, revokeGrant } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { AureakButton } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

type Grant = {
  id            : string
  coach_id      : string
  implantation_id: string
  granted_by    : string
  expires_at    : string
  created_at    : string
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: space.xl,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grantCard: {
    backgroundColor: colors.background.surface,
    borderRadius: 8,
    padding: space.md,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
  },
  grantMeta: {
    color: colors.text.secondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: space.xl,
  },
})

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleString('fr-BE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AccessGrantsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  const fetchGrants = async () => {
    setLoading(true)
    const { data } = await listActiveGrants()
    setGrants((data as Grant[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchGrants()
  }, [])

  const handleRevoke = async (grantId: string) => {
    if (!user?.id) return
    setRevoking(grantId)
    await revokeGrant(grantId, user.id)
    setRevoking(null)
    await fetchGrants()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AureakText variant="h2">Accès temporaires actifs</AureakText>
        <AureakButton
          label="Nouveau grant"
          onPress={() => router.push('/(admin)/access-grants/new' as never)}
          variant="primary"
        />
      </View>

      {loading && (
        <AureakText variant="body" style={styles.empty}>
          Chargement...
        </AureakText>
      )}

      {!loading && grants.length === 0 && (
        <AureakText variant="body" style={styles.empty}>
          Aucun accès temporaire actif.
        </AureakText>
      )}

      {grants.map((grant) => (
        <View key={grant.id} style={styles.grantCard}>
          <AureakText variant="label">
            Coach : {grant.coach_id}
          </AureakText>
          <AureakText variant="body" style={styles.grantMeta}>
            Implantation : {grant.implantation_id}
          </AureakText>
          <AureakText variant="caption" style={styles.grantMeta}>
            Expire : {formatExpiry(grant.expires_at)}
          </AureakText>
          <AureakButton
            label={revoking === grant.id ? 'Révocation...' : 'Révoquer'}
            onPress={() => handleRevoke(grant.id)}
            variant="secondary"
            loading={revoking === grant.id}
            disabled={revoking !== null}
          />
        </View>
      ))}
    </ScrollView>
  )
}
