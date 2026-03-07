// Story 10.2 — Gestion des consentements parentaux
import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, Switch, StyleSheet, ActivityIndicator,
} from 'react-native'
import { listConsentsByChild, revokeConsent, grantConsent, supabase } from '@aureak/api-client'
import type { Consent, ConsentType } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const CONSENT_LABELS: Record<ConsentType, string> = {
  photos_videos : 'Photos et vidéos',
  data_processing: 'Traitement des données',
  marketing      : 'Communications marketing',
  sharing_clubs  : 'Partage avec clubs partenaires',
}

type ChildConsents = {
  childId  : string
  childName: string
  consents : Consent[]
}

export default function ConsentsScreen() {
  const user = useAuthStore(s => s.user)
  const [data, setData]       = useState<ChildConsents[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)

    // Récupérer les enfants du parent via parent_child_links
    const { data: links } = await supabase
      .from('parent_child_links')
      .select('child_id, profiles!child_id(first_name, last_name)')
      .eq('parent_id', user.id)
    const children = (links ?? []).map((l: Record<string, unknown>) => {
      const p = l.profiles as Record<string, string> | null
      return { id: l.child_id as string, name: p ? `${p.first_name} ${p.last_name}` : 'Enfant' }
    })

    // Pour chaque enfant, récupérer les consentements
    const result: ChildConsents[] = await Promise.all(
      children.map(async child => {
        const { data: consents } = await listConsentsByChild(child.id)
        return { childId: child.id, childName: child.name, consents: consents ?? [] }
      }),
    )
    setData(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  const handleToggle = async (childId: string, consentType: ConsentType, currentlyGranted: boolean) => {
    const key = `${childId}-${consentType}`
    setToggling(key)
    if (currentlyGranted) {
      await revokeConsent(childId, consentType)
    } else {
      await grantConsent(childId, consentType)
    }
    await load()
    setToggling(null)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent.gold} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Consentements</Text>

      <FlatList
        data={data}
        keyExtractor={item => item.childId}
        renderItem={({ item }) => (
          <View style={styles.childSection}>
            <Text style={styles.childName}>{item.childName}</Text>
            {(Object.keys(CONSENT_LABELS) as ConsentType[]).map(type => {
              const consent = item.consents.find(c => c.consent_type === type)
              const granted  = consent?.granted ?? false
              const key      = `${item.childId}-${type}`
              return (
                <View key={type} style={styles.consentRow}>
                  <View style={styles.consentInfo}>
                    <Text style={styles.consentLabel}>{CONSENT_LABELS[type]}</Text>
                    {consent?.revoked_at && (
                      <Text style={styles.revokedDate}>
                        Révoqué le {new Date(consent.revoked_at).toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                    {consent?.granted_at && granted && (
                      <Text style={styles.grantedDate}>
                        Accordé le {new Date(consent.granted_at).toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                  </View>
                  {toggling === key ? (
                    <ActivityIndicator size="small" color={colors.accent.gold} />
                  ) : (
                    <Switch
                      value={granted}
                      onValueChange={() => handleToggle(item.childId, type, granted)}
                      trackColor={{ false: colors.accent.zinc, true: colors.status.present }}
                      thumbColor={colors.text.primary}
                      disabled={type === 'data_processing'} // Obligatoire
                    />
                  )}
                </View>
              )
            })}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun enfant associé à votre compte.</Text>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.background.primary },
  center      : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary },
  list        : { padding: 16 },
  title       : { fontSize: 24, fontWeight: '700', color: colors.text.primary, padding: 20, paddingBottom: 8 },
  childSection: { backgroundColor: colors.background.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  childName   : { fontSize: 16, fontWeight: '700', color: colors.accent.gold, marginBottom: 12 },
  consentRow  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.accent.zinc },
  consentInfo : { flex: 1, marginRight: 12 },
  consentLabel: { fontSize: 14, color: colors.text.primary },
  revokedDate : { fontSize: 11, color: colors.status.absent, marginTop: 2 },
  grantedDate : { fontSize: 11, color: colors.status.present, marginTop: 2 },
  empty       : { color: colors.text.secondary, fontSize: 15, textAlign: 'center', paddingTop: 60 },
})
