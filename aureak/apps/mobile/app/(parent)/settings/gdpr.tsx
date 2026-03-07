// Story 10.3 — Droits RGPD Parent
import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native'
import { submitGdprRequest, listMyGdprRequests } from '@aureak/api-client'
import type { GdprRequest, GdprRequestType } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const REQUEST_TYPES: { type: GdprRequestType; label: string; description: string }[] = [
  {
    type       : 'access',
    label      : 'Accès à mes données',
    description: 'Recevoir une copie de toutes vos données personnelles.',
  },
  {
    type       : 'rectification',
    label      : 'Rectification',
    description: 'Corriger des données incorrectes ou incomplètes.',
  },
  {
    type       : 'erasure',
    label      : 'Effacement',
    description: 'Demander la suppression de votre compte et données (délai 30 jours).',
  },
  {
    type       : 'portability',
    label      : 'Portabilité',
    description: 'Exporter vos données dans un format réutilisable.',
  },
]

const STATUS_COLORS: Record<string, string> = {
  pending   : colors.accent.gold,
  processing: colors.accent.gold,
  completed : colors.status.present,
  rejected  : colors.status.absent,
}

const STATUS_LABELS: Record<string, string> = {
  pending   : 'En attente',
  processing: 'En cours',
  completed : 'Traité',
  rejected  : 'Rejeté',
}

export default function GdprScreen() {
  const user = useAuthStore(s => s.user)
  const [requests, setRequests] = useState<GdprRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState<GdprRequestType | null>(null)

  const load = async () => {
    setLoading(true)
    const result = await listMyGdprRequests()
    setRequests(result.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  const handleSubmit = async (type: GdprRequestType) => {
    if (!user) return
    setSubmitting(type)
    await submitGdprRequest(user.id, type)
    await load()
    setSubmitting(null)
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
      <Text style={styles.title}>Mes Droits RGPD</Text>

      {/* Types de demandes */}
      <View style={styles.section}>
        {REQUEST_TYPES.map(rt => {
          const pending = requests.some(r => r.request_type === rt.type && r.status === 'pending')
          return (
            <View key={rt.type} style={styles.typeCard}>
              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>{rt.label}</Text>
                <Text style={styles.typeDesc}>{rt.description}</Text>
              </View>
              <TouchableOpacity
                style={pending || submitting === rt.type ? { ...styles.submitBtn, opacity: 0.5 } : styles.submitBtn}
                onPress={() => handleSubmit(rt.type)}
                disabled={pending || submitting !== null}
              >
                {submitting === rt.type
                  ? <ActivityIndicator size="small" color={colors.background.primary} />
                  : <Text style={styles.submitText}>{pending ? 'En attente' : 'Demander'}</Text>
                }
              </TouchableOpacity>
            </View>
          )
        })}
      </View>

      {/* Historique */}
      <Text style={styles.historyTitle}>Historique des demandes</Text>
      {requests.length === 0 ? (
        <Text style={styles.empty}>Aucune demande effectuée.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.historyRow}>
              <Text style={styles.historyType}>{REQUEST_TYPES.find(t => t.type === item.request_type)?.label ?? item.request_type}</Text>
              <Text style={[styles.historyStatus, { color: STATUS_COLORS[item.status] ?? colors.text.secondary }]}>
                {STATUS_LABELS[item.status] ?? item.status}
              </Text>
              <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
              {item.file_url && item.status === 'completed' && (
                <Text style={styles.fileLink}>Fichier disponible</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.background.primary, padding: 16 },
  center      : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary },
  title       : { fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 20 },
  section     : { marginBottom: 24 },
  typeCard    : { backgroundColor: colors.background.surface, borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeInfo    : { flex: 1 },
  typeLabel   : { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  typeDesc    : { fontSize: 12, color: colors.text.secondary, lineHeight: 16 },
  submitBtn   : { backgroundColor: colors.accent.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  submitText  : { color: colors.text.primary, fontWeight: '600', fontSize: 13 },
  historyTitle: { fontSize: 17, fontWeight: '600', color: colors.accent.gold, marginBottom: 12 },
  empty       : { color: colors.text.secondary, fontSize: 14 },
  historyRow  : { backgroundColor: colors.background.surface, borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyType : { flex: 1, fontSize: 13, color: colors.text.secondary },
  historyStatus: { fontSize: 12, fontWeight: '600' },
  historyDate : { fontSize: 12, color: colors.text.secondary },
  fileLink    : { fontSize: 12, color: colors.accent.gold, fontWeight: '600' },
})
