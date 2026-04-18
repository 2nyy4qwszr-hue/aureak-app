'use client'
// Story 92-3 — Dashboard KPI clubs partenaires (vue lecture seule)
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import { getPartnershipClubStats, listPartnerClubsSummary } from '@aureak/api-client'
import type { PartnershipClubStats, PartnerClubSummaryItem } from '@aureak/api-client'
import { ClubPartnerStatCards } from './components/ClubPartnerStats'
import { ClubPartnerList } from './components/ClubPartnerList'

export default function ClubsPartnerDashboard() {
  const router = useRouter()
  const [stats, setStats]   = useState<PartnershipClubStats | null>(null)
  const [clubs, setClubs]   = useState<PartnerClubSummaryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        const [s, c] = await Promise.all([
          getPartnershipClubStats(),
          listPartnerClubsSummary(),
        ])
        setStats(s)
        setClubs(c)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ClubsPartnerDashboard] load error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <View style={styles.container}>
      {/* Back */}
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        onPress={() => router.back()}
      >
        <AureakText style={styles.backText}>← Partenariats</AureakText>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <AureakText variant="h1" style={styles.title}>Clubs partenaires</AureakText>
        <AureakText variant="body" style={styles.sub}>
          Vue synthétique des partenariats clubs, revenus et renouvellements
        </AureakText>
      </View>

      {/* StatCards KPI */}
      <ClubPartnerStatCards stats={stats} loading={loading} />

      {/* Liste résumée */}
      <View style={styles.listSection}>
        <AureakText style={styles.listTitle}>Clubs partenaires</AureakText>
        <ClubPartnerList clubs={clubs} loading={loading} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
  header: {
    marginBottom: space.lg,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    color: colors.text.muted,
  },
  listSection: {
    marginTop: space.sm,
  },
  listTitle: {
    fontSize    : 14,
    fontWeight  : '700',
    color       : colors.text.dark,
    marginBottom: space.sm,
  },
  backBtn: {
    flexDirection    : 'row',
    alignItems       : 'center',
    alignSelf        : 'flex-start',
    marginBottom     : space.md,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.hover,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  backText: {
    color     : colors.text.muted,
    fontSize  : 13,
    fontWeight: '600',
  } as never,
})
