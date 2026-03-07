import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { listClubs } from '@aureak/api-client'
import { AureakButton, Badge } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

type ClubRow = {
  user_id          : string
  name             : string
  club_access_level: 'partner' | 'common'
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
  clubCard: {
    backgroundColor: colors.background.surface,
    borderRadius: 8,
    padding: space.md,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clubInfo: {
    gap: space.xs,
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: space.xl,
  },
})

export default function ClubsPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<ClubRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listClubs().then(({ data }) => {
      setClubs((data as ClubRow[]) ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AureakText variant="h2">Clubs</AureakText>
        <AureakButton
          label="Nouveau club"
          onPress={() => router.push('/(admin)/clubs/new' as never)}
          variant="primary"
        />
      </View>

      {loading && (
        <AureakText variant="body" style={styles.empty}>Chargement...</AureakText>
      )}

      {!loading && clubs.length === 0 && (
        <AureakText variant="body" style={styles.empty}>Aucun club configuré.</AureakText>
      )}

      {clubs.map((club) => (
        <View key={club.user_id} style={styles.clubCard}>
          <View style={styles.clubInfo}>
            <AureakText variant="label">{club.name}</AureakText>
            <Badge
              label={club.club_access_level === 'partner' ? 'Partenaire' : 'Commun'}
              variant={club.club_access_level === 'partner' ? 'present' : 'zinc'}
            />
          </View>
          <AureakButton
            label="Gérer"
            onPress={() => router.push(`/(admin)/clubs/${club.user_id}` as never)}
            variant="secondary"
          />
        </View>
      ))}
    </ScrollView>
  )
}
