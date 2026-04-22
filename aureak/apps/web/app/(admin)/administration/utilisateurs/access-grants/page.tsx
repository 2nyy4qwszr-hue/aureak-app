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
    backgroundColor: colors.light.primary,
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
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    padding: space.md,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  grantMeta: {
    color: colors.text.muted,
  },
  empty: {
    textAlign: 'center',
    color: colors.text.muted,
    marginTop: space.xl,
  },
  expiryAlert: {
    backgroundColor: colors.status.attention + '12',
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.status.attention + '40',
    gap            : 4,
  },
  grantCardExpiring: {
    borderColor    : colors.status.attention + '60',
    borderLeftWidth: 4,
    borderLeftColor: colors.status.attention,
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
    try {
      const { data } = await listActiveGrants()
      setGrants((data as Grant[]) ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AccessGrants] fetchGrants error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGrants()
  }, [])

  const handleRevoke = async (grantId: string) => {
    if (!user?.id) return
    setRevoking(grantId)
    try {
      await revokeGrant(grantId, user.id)
      await fetchGrants()
    } finally {
      setRevoking(null)
    }
  }

  // Grants expirant dans moins de 24h
  const now24h      = Date.now() + 24 * 60 * 60 * 1000
  const expiringSoon = grants.filter(g => new Date(g.expires_at).getTime() < now24h)

  function expiryWarning(iso: string): string | null {
    const ms = new Date(iso).getTime() - Date.now()
    if (ms < 0)      return 'Expiré'
    if (ms < 3600000) return `Expire dans ${Math.round(ms / 60000)} min`
    if (ms < 86400000) return `Expire dans ${Math.round(ms / 3600000)} h`
    return null
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

      {/* Alerte expiration imminente */}
      {!loading && expiringSoon.length > 0 && (
        <View style={styles.expiryAlert}>
          <AureakText variant="caption" style={{ color: colors.status.attention, fontWeight: '700' }}>
            Expiration imminente ({expiringSoon.length} grant{expiringSoon.length > 1 ? 's' : ''})
          </AureakText>
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            Ces accès expirent dans moins de 24h. Pensez à les renouveler si nécessaire.
          </AureakText>
        </View>
      )}

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

      {grants.map((grant) => {
        const warning = expiryWarning(grant.expires_at)
        const isExpiring = expiringSoon.some(g => g.id === grant.id)
        return (
          <View key={grant.id} style={[styles.grantCard, isExpiring && styles.grantCardExpiring]}>
            <AureakText variant="label">
              Coach : {grant.coach_id}
            </AureakText>
            <AureakText variant="body" style={styles.grantMeta}>
              Implantation : {grant.implantation_id}
            </AureakText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AureakText variant="caption" style={styles.grantMeta}>
                Expire : {formatExpiry(grant.expires_at)}
              </AureakText>
              {warning && (
                <AureakText variant="caption" style={{ color: colors.status.attention, fontWeight: '700' }}>
                  ({warning})
                </AureakText>
              )}
            </View>
            <AureakButton
              label={revoking === grant.id ? 'Révocation...' : 'Révoquer'}
              onPress={() => handleRevoke(grant.id)}
              variant="secondary"
              loading={revoking === grant.id}
              disabled={revoking !== null}
            />
          </View>
        )
      })}
    </ScrollView>
  )
}
