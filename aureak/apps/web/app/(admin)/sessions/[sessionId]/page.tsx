import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Modal, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getSessionById, listSessionCoaches, listAttendancesBySession, cancelSessionRpc,
} from '@aureak/api-client'
import { AureakButton, AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Session, SessionCoach, Attendance } from '@aureak/types'

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: colors.background.primary },
  content         : { padding: space.xl, gap: space.lg },
  breadcrumb      : { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs },
  breadcrumbLink  : { color: colors.accent.gold, fontWeight: '600' },
  breadcrumbSep   : { color: colors.text.secondary },
  breadcrumbCurrent: { color: colors.text.secondary },
  card     : {
    backgroundColor: colors.background.surface,
    borderRadius: 8, padding: space.md,
    borderWidth: 1, borderColor: colors.accent.zinc, gap: space.sm,
  },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.accent.zinc, borderRadius: 6,
    padding: space.sm, color: colors.text.primary, backgroundColor: colors.background.primary,
    flex: 1,
  },
})

export default function SessionDetailPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [coaches, setCoaches] = useState<SessionCoach[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')

  const load = async () => {
    if (!sessionId) return
    const [s, c, a] = await Promise.all([
      getSessionById(sessionId),
      listSessionCoaches(sessionId),
      listAttendancesBySession(sessionId),
    ])
    setSession(s.data)
    setCoaches(c.data)
    setAttendances(a.data)
  }

  useEffect(() => { load() }, [sessionId])

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Le motif est obligatoire.')
      return
    }
    const { error } = await cancelSessionRpc(sessionId!, cancelReason.trim())
    if (error) {
      setCancelError((error as Error).message)
    } else {
      setShowCancelDialog(false)
      load()
    }
  }

  if (!session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <AureakText variant="body">Chargement...</AureakText>
      </View>
    )
  }

  const sessionDate = new Date(session.scheduledAt).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Pressable onPress={() => router.push('/sessions' as never)}>
          <AureakText variant="caption" style={styles.breadcrumbLink}>Séances</AureakText>
        </Pressable>
        <AureakText variant="caption" style={styles.breadcrumbSep}>/</AureakText>
        <AureakText variant="caption" style={styles.breadcrumbCurrent}>
          {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </AureakText>
      </View>

      <AureakText variant="h2">{sessionDate}</AureakText>

      {/* Infos session */}
      <View style={styles.card}>
        <View style={styles.row}>
          <AureakText variant="label">Statut :</AureakText>
          <Badge label={session.status} variant="zinc" />
        </View>
        <AureakText variant="body">
          Durée : {session.durationMinutes} min
        </AureakText>
        {session.location && (
          <AureakText variant="body">Lieu : {session.location}</AureakText>
        )}
        {session.cancellationReason && (
          <AureakText variant="body" style={{ color: colors.accent.gold }}>
            Motif annulation : {session.cancellationReason}
          </AureakText>
        )}
      </View>

      {/* Coaches */}
      <View style={styles.card}>
        <AureakText variant="label">Coaches</AureakText>
        {coaches.map(c => (
          <AureakText key={c.coachId} variant="body">
            {c.coachId.slice(0, 8)}… ({c.role})
          </AureakText>
        ))}
        {coaches.length === 0 && (
          <AureakText variant="caption" style={{ color: colors.text.secondary }}>
            Aucun coach assigné
          </AureakText>
        )}
      </View>

      {/* Présences */}
      <View style={styles.card}>
        <AureakText variant="label">Présences ({attendances.length})</AureakText>
        {attendances.map(a => (
          <AureakText key={a.id} variant="body">
            {a.childId.slice(0, 8)}… → {a.status}
          </AureakText>
        ))}
        {attendances.length === 0 && (
          <AureakText variant="caption" style={{ color: colors.text.secondary }}>
            Aucune présence enregistrée
          </AureakText>
        )}
      </View>

      {/* Actions */}
      {session.status === 'planifiée' || session.status === 'en_cours' ? (
        <AureakButton
          label="Annuler la séance"
          onPress={() => setShowCancelDialog(true)}
          variant="secondary"
        />
      ) : null}

      {/* Cancel dialog */}
      <Modal visible={showCancelDialog} transparent animationType="fade">
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center', alignItems: 'center', padding: space.xl,
        }}>
          <View style={[styles.card, { width: '100%', maxWidth: 400 }]}>
            <AureakText variant="h3">Annuler la séance</AureakText>
            <AureakText variant="body" style={{ color: colors.text.secondary }}>
              Le motif est obligatoire et sera communiqué aux parents.
            </AureakText>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="Motif d'annulation..."
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />
            </View>
            {cancelError ? (
              <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                {cancelError}
              </AureakText>
            ) : null}
            <View style={styles.row}>
              <AureakButton label="Confirmer" onPress={handleCancel} variant="primary" />
              <AureakButton
                label="Annuler"
                onPress={() => { setShowCancelDialog(false); setCancelReason(''); setCancelError('') }}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
