import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { linkChildToClub, unlinkChildFromClub, updateClubAccessLevel } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { supabase } from '@aureak/api-client'
import { AureakButton, Input } from '@aureak/ui'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

type ChildLink = {
  child_id  : string
  created_at: string
  profiles  : { display_name: string | null }
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
  section: {
    gap: space.md,
  },
  linkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderRadius: 8,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
  },
  accessRow: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  accessChip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accent.zinc,
    cursor: 'pointer' as never,
  },
  accessChipSelected: {
    borderColor: colors.accent.gold,
    backgroundColor: colors.background.elevated,
  },
  errorBanner: {
    backgroundColor: colors.background.elevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.absent,
    borderRadius: 4,
    padding: space.md,
  },
})

export default function ClubDetailPage() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>()
  const router = useRouter()
  const tenantId = useAuthStore((s) => s.tenantId)
  const user = useAuthStore((s) => s.user)

  const [links, setLinks] = useState<ChildLink[]>([])
  const [accessLevel, setAccessLevel] = useState<'partner' | 'common'>('common')
  const [newChildId, setNewChildId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!clubId) return
    setLoading(true)

    const [clubRes, linksRes] = await Promise.all([
      supabase.from('clubs').select('club_access_level').eq('user_id', clubId).single(),
      supabase
        .from('club_child_links')
        .select('child_id, created_at, profiles(display_name)')
        .eq('club_id', clubId),
    ])

    if (clubRes.data) setAccessLevel(clubRes.data.club_access_level)
    setLinks((linksRes.data as unknown as ChildLink[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [clubId])

  const handleUpdateAccessLevel = async (level: 'partner' | 'common') => {
    if (!clubId || !tenantId || !user?.id) return
    const { error: err } = await updateClubAccessLevel({
      clubId,
      accessLevel: level,
      tenantId,
      updatedBy: user.id,
    })
    if (err) {
      setError('Erreur lors de la mise à jour du niveau d\'accès.')
      return
    }
    setAccessLevel(level)
  }

  const handleLink = async () => {
    if (!newChildId || !clubId || !tenantId || !user?.id) return
    setError(null)
    const { error: err } = await linkChildToClub({
      clubId,
      childId: newChildId,
      tenantId,
      linkedBy: user.id,
    })
    if (err) {
      setError('Erreur lors de l\'ajout de l\'enfant.')
      return
    }
    setNewChildId('')
    await fetchData()
  }

  const handleUnlink = async (childId: string) => {
    if (!clubId || !tenantId || !user?.id) return
    setError(null)
    const { error: err } = await unlinkChildFromClub({
      clubId,
      childId,
      tenantId,
      unlinkedBy: user.id,
    })
    if (err) {
      setError('Erreur lors de la suppression du lien.')
      return
    }
    await fetchData()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakButton label="Retour" onPress={() => router.back()} variant="ghost" />
      <AureakText variant="h2">Gestion du club</AureakText>

      {error && (
        <View style={styles.errorBanner}>
          <AureakText variant="body" style={{ color: colors.status.absent }}>{error}</AureakText>
        </View>
      )}

      {/* Niveau d'accès */}
      <View style={styles.section}>
        <AureakText variant="label">Niveau d'accès</AureakText>
        <View style={styles.accessRow}>
          {(['common', 'partner'] as const).map((level) => (
            <View
              key={level}
              style={[styles.accessChip, accessLevel === level && styles.accessChipSelected]}
              onTouchEnd={() => handleUpdateAccessLevel(level)}
            >
              <AureakText
                variant="label"
                style={{ color: accessLevel === level ? colors.accent.gold : colors.text.secondary }}
              >
                {level === 'partner' ? 'Partenaire' : 'Commun'}
              </AureakText>
            </View>
          ))}
        </View>
        <AureakText variant="caption" style={{ color: colors.text.secondary }}>
          Changement effectif immédiatement (aucun reissue de token requis).
        </AureakText>
      </View>

      {/* Lier un enfant */}
      <View style={styles.section}>
        <AureakText variant="label">Lier un enfant</AureakText>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Input
            value={newChildId}
            onChangeText={setNewChildId}
            placeholder="UUID de l'enfant"
            autoCapitalize="none"
            style={{ flex: 1 }}
          />
          <AureakButton label="Lier" onPress={handleLink} variant="primary" />
        </View>
      </View>

      {/* Enfants liés */}
      <View style={styles.section}>
        <AureakText variant="label">
          Enfants liés ({links.length})
        </AureakText>
        {loading && (
          <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
        )}
        {links.map((link) => (
          <View key={link.child_id} style={styles.linkCard}>
            <AureakText variant="body">
              {link.profiles?.display_name ?? link.child_id}
            </AureakText>
            <AureakButton
              label="Retirer"
              onPress={() => handleUnlink(link.child_id)}
              variant="secondary"
            />
          </View>
        ))}
        {!loading && links.length === 0 && (
          <AureakText variant="body" style={{ color: colors.text.secondary }}>
            Aucun enfant lié.
          </AureakText>
        )}
      </View>
    </ScrollView>
  )
}
