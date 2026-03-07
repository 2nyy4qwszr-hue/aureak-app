import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import {
  createSession, assignCoach,
  generateRecurrenceSessions,
} from '@aureak/api-client'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content  : { padding: space.xl, gap: space.lg },
  label    : { marginBottom: space.xs },
  input    : {
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    borderRadius   : 6,
    padding        : space.sm,
    color          : colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
})

export default function NewSessionPage() {
  const router = useRouter()
  // Form state
  const [implantationId, setImplantationId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('90')
  const [location, setLocation] = useState('')
  const [coachId, setCoachId] = useState('')

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceDay, setRecurrenceDay] = useState('wednesday')
  const [recurrenceCount, setRecurrenceCount] = useState('8')

  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!implantationId || !groupId || !scheduledAt) {
      setError('Implantation, groupe et date sont obligatoires.')
      return
    }

    try {
      if (isRecurring) {
        const startDate = scheduledAt.split('T')[0]
        const time = scheduledAt.split('T')[1]?.slice(0, 5) ?? '09:00'
        await generateRecurrenceSessions({
          rule           : { freq: 'weekly', day: recurrenceDay, count: parseInt(recurrenceCount) },
          implantationId,
          groupId,
          startDate,
          time,
          durationMinutes: parseInt(duration),
          location       : location || undefined,
          coaches        : coachId ? [{ coachId, role: 'lead' }] : [],
        })
      } else {
        const { data: session, error: sessionErr } = await createSession({
          tenantId      : '', // filled by RLS via current_tenant_id()
          implantationId,
          groupId,
          scheduledAt,
          durationMinutes: parseInt(duration),
          location      : location || undefined,
        })

        if (sessionErr || !session) {
          setError('Erreur lors de la création de la séance.')
          return
        }

        if (coachId) {
          await assignCoach(session.id, coachId, session.tenantId, 'lead')
        }
      }

      router.push('/(admin)/sessions' as never)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakButton label="← Retour" onPress={() => router.back()} variant="secondary" />
      <AureakText variant="h2">Nouvelle séance</AureakText>

      {error ? (
        <AureakText variant="body" style={{ color: colors.accent.gold }}>{error}</AureakText>
      ) : null}

      <View>
        <AureakText variant="label" style={styles.label}>Implantation</AureakText>
        <TextInput
          style={styles.input}
          placeholder="ID implantation"
          value={implantationId}
          onChangeText={setImplantationId}
        />
      </View>

      <View>
        <AureakText variant="label" style={styles.label}>Groupe</AureakText>
        <TextInput
          style={styles.input}
          placeholder="ID groupe"
          value={groupId}
          onChangeText={setGroupId}
        />
      </View>

      <View>
        <AureakText variant="label" style={styles.label}>Date et heure (ISO)</AureakText>
        <TextInput
          style={styles.input}
          placeholder="2026-03-10T09:00:00Z"
          value={scheduledAt}
          onChangeText={setScheduledAt}
        />
      </View>

      <View>
        <AureakText variant="label" style={styles.label}>Durée (minutes)</AureakText>
        <TextInput
          style={styles.input}
          placeholder="90"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />
      </View>

      <View>
        <AureakText variant="label" style={styles.label}>Lieu (optionnel)</AureakText>
        <TextInput
          style={styles.input}
          placeholder="Terrain A"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View>
        <AureakText variant="label" style={styles.label}>Coach lead (ID)</AureakText>
        <TextInput
          style={styles.input}
          placeholder="UUID du coach"
          value={coachId}
          onChangeText={setCoachId}
        />
      </View>

      <View style={styles.row}>
        <Switch value={isRecurring} onValueChange={setIsRecurring} />
        <AureakText variant="body">Séance récurrente</AureakText>
      </View>

      {isRecurring && (
        <View style={{ gap: space.sm }}>
          <View>
            <AureakText variant="label" style={styles.label}>Jour de la semaine</AureakText>
            <TextInput
              style={styles.input}
              placeholder="wednesday"
              value={recurrenceDay}
              onChangeText={setRecurrenceDay}
              autoCapitalize="none"
            />
          </View>
          <View>
            <AureakText variant="label" style={styles.label}>Nombre d'occurrences</AureakText>
            <TextInput
              style={styles.input}
              placeholder="8"
              value={recurrenceCount}
              onChangeText={setRecurrenceCount}
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      <AureakButton
        label={isRecurring ? 'Créer la série' : 'Créer la séance'}
        onPress={handleSubmit}
        variant="primary"
      />
    </ScrollView>
  )
}
