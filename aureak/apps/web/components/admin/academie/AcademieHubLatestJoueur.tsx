'use client'
// Hub Académie : tile "Nouvel arrivant" (mirror MethodologieHubSituationOfWeek)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { getAcademieLatestJoueur } from '@aureak/api-client'
import type { AcademieLatestJoueur } from '@aureak/api-client'

const RTF = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

function relativeTime(iso: string): string {
  const diffMs   = new Date(iso).getTime() - Date.now()
  const diffMin  = Math.round(diffMs / 60_000)
  const absMin   = Math.abs(diffMin)
  if (absMin < 60)          return RTF.format(diffMin, 'minute')
  if (absMin < 60 * 24)     return RTF.format(Math.round(diffMin / 60), 'hour')
  if (absMin < 60 * 24 * 7) return RTF.format(Math.round(diffMin / (60 * 24)), 'day')
  return RTF.format(Math.round(diffMin / (60 * 24 * 7)), 'week')
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACADÉMICIEN        : { label: '🎓 Académicien',  color: colors.accent.gold },
  NOUVEAU_ACADÉMICIEN: { label: '✨ Nouveau',       color: colors.status.successText },
  ANCIEN             : { label: '📦 Ancien',        color: colors.text.muted },
  STAGE_UNIQUEMENT   : { label: '🏕 Stage',         color: colors.text.muted },
  PROSPECT           : { label: '🔍 Prospect',     color: colors.status.warning },
}

export function AcademieHubLatestJoueur() {
  const router                = useRouter()
  const [data,    setData]    = useState<AcademieLatestJoueur | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getAcademieLatestJoueur()
        if (!cancelled) setData(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieHubLatestJoueur] error:', err)
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const statusMeta = data?.computedStatus ? STATUS_LABELS[data.computedStatus] : null
  const accentColor = statusMeta?.color ?? colors.accent.gold

  return (
    <View style={[styles.card, { boxShadow: shadows.sm } as never]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <AureakText style={styles.label as TextStyle}>
          {`NOUVEL ARRIVANT${data?.weekNumber ? ` — Semaine ${data.weekNumber}` : ''}`}
        </AureakText>

        {loading ? (
          <View>
            <View style={[styles.skelLine, { width: '60%' }]} />
            <View style={[styles.skelLine, { width: '90%', height: 20 }]} />
            <View style={[styles.skelLine, { width: '100%' }]} />
            <View style={[styles.skelLine, { width: '70%' }]} />
          </View>
        ) : data ? (
          <>
            <AureakText style={styles.title as TextStyle}>{data.displayName}</AureakText>
            {statusMeta ? (
              <View style={[styles.statusBadge, { backgroundColor: accentColor + '22' }]}>
                <AureakText style={[styles.statusBadgeText, { color: accentColor }] as unknown as TextStyle}>
                  {statusMeta.label}
                </AureakText>
              </View>
            ) : null}
            <AureakText style={styles.desc as TextStyle} numberOfLines={1}>
              {data.currentClub ?? 'Pas de club renseigné'} · inscrit {relativeTime(data.createdAt)}
            </AureakText>
            <Pressable
              style={styles.link}
              onPress={() => router.push(`/children/${data.childId}` as never)}
            >
              <AureakText style={[styles.linkText, { color: accentColor }] as unknown as TextStyle}>
                Voir le joueur →
              </AureakText>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyRow}>
            <AureakText style={styles.desc as TextStyle}>
              Aucun joueur inscrit —
            </AureakText>
            <Pressable onPress={() => router.push('/children/new' as never)}>
              <AureakText style={[styles.desc, { color: colors.accent.gold }] as unknown as TextStyle}>
                ajouter un joueur
              </AureakText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection  : 'row',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    overflow       : 'hidden' as never,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    minHeight      : 156,
  },
  accent: {
    width: 4,
  },
  body: {
    flex   : 1,
    padding: space.lg,
    gap    : space.xs,
  },
  label: {
    fontFamily   : fonts.body,
    fontSize     : 11,
    fontWeight   : '600',
    letterSpacing: 0.8,
    color        : colors.text.muted,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize  : 20,
    fontWeight: '700',
    color     : colors.text.dark,
    marginTop : space.xs,
  },
  desc: {
    fontFamily: fonts.body,
    fontSize  : 13,
    color     : colors.text.muted,
  },
  link: {
    marginTop: space.xs,
  },
  linkText: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf        : 'flex-start',
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
    marginTop        : 2,
  },
  statusBadgeText: {
    fontFamily: fonts.body,
    fontSize  : 10,
    fontWeight: '600',
  },
  emptyRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    alignItems   : 'center',
    gap          : 4,
  },
  skelLine: {
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    opacity        : 0.6,
    height         : 14,
    marginBottom   : 6,
  },
})
