'use client'
// Hub Méthodologie : tile "Situation de la semaine" (pendant du thème de la semaine)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows, methodologyMethodColors } from '@aureak/theme'
import { getHubSituationOfWeek } from '@aureak/api-client'
import type { HubMethodologySituationOfWeek } from '@aureak/api-client'

function methodColor(method: string | null): string {
  if (!method) return colors.accent.gold
  return (methodologyMethodColors as Record<string, string>)[method] ?? colors.accent.gold
}

export function MethodologieHubSituationOfWeek() {
  const router                 = useRouter()
  const [data,    setData]     = useState<HubMethodologySituationOfWeek | null>(null)
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const result = await getHubSituationOfWeek()
        if (!cancelled) setData(result)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[MethoHubSituationOfWeek] error:', err)
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const accentColor = methodColor(data?.method ?? null)

  return (
    <View style={[styles.card, { boxShadow: shadows.sm } as never]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <AureakText style={styles.label as TextStyle}>
          {`SITUATION DE LA SEMAINE${data?.weekNumber ? ` — Semaine ${data.weekNumber}` : ''}`}
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
            <AureakText style={styles.title as TextStyle}>{data.title}</AureakText>
            {data.method ? (
              <View style={[styles.methodBadge, { backgroundColor: accentColor + '22' }]}>
                <AureakText style={[styles.methodBadgeText, { color: accentColor }] as unknown as TextStyle}>
                  {data.method}
                </AureakText>
              </View>
            ) : null}
            {data.description ? (
              <AureakText style={styles.desc as TextStyle} numberOfLines={2}>
                {data.description}
              </AureakText>
            ) : null}
            <Pressable
              style={styles.link}
              onPress={() => router.push(`/methodologie/situations/${data.situationId}` as never)}
            >
              <AureakText style={[styles.linkText, { color: accentColor }] as unknown as TextStyle}>
                Voir la situation →
              </AureakText>
            </Pressable>
          </>
        ) : (
          <View style={styles.emptyRow}>
            <AureakText style={styles.desc as TextStyle}>
              Aucune situation active —
            </AureakText>
            <Pressable onPress={() => router.push('/methodologie/situations/new' as never)}>
              <AureakText style={[styles.desc, { color: colors.accent.gold }] as unknown as TextStyle}>
                créer une situation
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
  methodBadge: {
    alignSelf        : 'flex-start',
    borderRadius     : radius.badge,
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
    marginTop        : 2,
  },
  methodBadgeText: {
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
