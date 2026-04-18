// Story 89.3 — Fiche détail gardien prospect avec section évaluations scout
'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { StarRating } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import {
  getChildDirectoryEntry,
} from '@aureak/api-client'
import type { ChildDirectoryEntry } from '@aureak/types'
import {
  CHILD_PROSPECT_STATUS_LABELS,
} from '@aureak/types'
import { childProspectStatusColors } from '@aureak/theme'
import { ScoutEvaluationSection } from '../_components/ScoutEvaluationSection'

export default function GardienProspectDetailPage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const router = useRouter()
  const [entry, setEntry]     = useState<ChildDirectoryEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!childId) return
    setLoading(true)
    try {
      const data = await getChildDirectoryEntry(childId)
      setEntry(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[GardienProspectDetail] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <View style={styles.centered}>
        <AureakText variant="body" style={{ color: colors.text.muted } as never}>Chargement...</AureakText>
      </View>
    )
  }

  if (!entry) {
    return (
      <View style={styles.centered}>
        <AureakText variant="body" style={{ color: colors.text.muted } as never}>Gardien introuvable.</AureakText>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AureakText style={styles.backBtnText}>Retour</AureakText>
        </Pressable>
      </View>
    )
  }

  const statusColor = entry.prospectStatus
    ? childProspectStatusColors[entry.prospectStatus]
    : null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Breadcrumb / back */}
      <Pressable style={styles.backLink} onPress={() => router.back()}>
        <AureakText style={styles.backLinkText}>{'← Pipeline Gardiens'}</AureakText>
      </Pressable>

      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <AureakText variant="h2" style={styles.name}>{entry.displayName}</AureakText>
            <View style={styles.metaRow}>
              {entry.currentClub && (
                <AureakText variant="body" style={styles.metaText}>{entry.currentClub}</AureakText>
              )}
              {entry.ageCategory && (
                <AureakText variant="body" style={styles.metaText}>{entry.ageCategory}</AureakText>
              )}
              {entry.niveauClub && (
                <AureakText variant="caption" style={styles.metaText}>{entry.niveauClub}</AureakText>
              )}
            </View>
          </View>
          {entry.prospectStatus && statusColor && (
            <View style={[styles.badge, { backgroundColor: statusColor.bg }] as never}>
              <AureakText variant="caption" style={{ color: statusColor.text, fontWeight: '600' } as never}>
                {CHILD_PROSPECT_STATUS_LABELS[entry.prospectStatus] ?? entry.prospectStatus}
              </AureakText>
            </View>
          )}
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          {entry.birthDate && (
            <InfoItem label="Date de naissance" value={new Date(entry.birthDate).toLocaleDateString('fr-BE')} />
          )}
          {entry.localite && (
            <InfoItem label="Localité" value={entry.localite} />
          )}
          {entry.parent1Nom && (
            <InfoItem label="Parent 1" value={entry.parent1Nom} sub={entry.parent1Tel ?? entry.parent1Email ?? undefined} />
          )}
          {entry.parent2Nom && (
            <InfoItem label="Parent 2" value={entry.parent2Nom} sub={entry.parent2Tel ?? entry.parent2Email ?? undefined} />
          )}
        </View>
      </View>

      {/* Evaluations scout section */}
      <ScoutEvaluationSection childId={childId!} tenantId={entry.tenantId} />
    </ScrollView>
  )
}

function InfoItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.infoItem}>
      <AureakText variant="caption" style={styles.infoLabel}>{label}</AureakText>
      <AureakText variant="body" style={styles.infoValue}>{value}</AureakText>
      {sub && <AureakText variant="caption" style={styles.infoSub}>{sub}</AureakText>}
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
    maxWidth: 900,
  },
  centered: {
    flex          : 1,
    alignItems    : 'center' as const,
    justifyContent: 'center' as const,
    padding       : space.xl,
  },

  // Back
  backLink: {
    marginBottom: space.md,
    alignSelf   : 'flex-start' as const,
  },
  backLinkText: {
    color   : colors.accent.gold,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  backBtn: {
    marginTop        : space.md,
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  backBtnText: {
    color   : colors.text.dark,
    fontSize: 13,
  },

  // Header card
  headerCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    boxShadow      : shadows.md,
    padding        : space.lg,
  },
  headerTop: {
    flexDirection : 'row' as const,
    alignItems    : 'flex-start' as const,
    marginBottom  : space.md,
  },
  name: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  metaRow: {
    flexDirection: 'row' as const,
    gap          : space.md,
    flexWrap     : 'wrap' as const,
  },
  metaText: {
    color  : colors.text.muted,
    fontSize: 14,
  },
  badge: {
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    alignSelf        : 'flex-start' as const,
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row' as const,
    flexWrap     : 'wrap' as const,
    gap          : space.lg,
    paddingTop   : space.md,
    borderTopWidth : 1,
    borderTopColor : colors.border.light,
  },
  infoItem: {
    minWidth: 160,
  },
  infoLabel: {
    color       : colors.text.muted,
    fontSize    : 11,
    fontWeight  : '600' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 2,
  },
  infoValue: {
    color   : colors.text.dark,
    fontSize: 14,
  },
  infoSub: {
    color   : colors.text.muted,
    fontSize: 12,
    marginTop: 1,
  },
})
