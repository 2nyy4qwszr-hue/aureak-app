'use client'
// Story 97.10 — Hub Événements : vue d'ensemble 5 cartes type (stages, tournois,
// fun-days, detect-days, séminaires). Chaque carte affiche un count + CTA "Voir".
// Le filtrage unifié précédent (Story 63.2) est remplacé par 5 sous-pages dédiées.
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { listEvents } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import type { EventType } from '@aureak/types'
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader'
import { EvenementsHeader } from '../../../components/admin/evenements/EvenementsHeader'

type TypeMeta = {
  key    : EventType
  label  : string
  picto  : string
  color  : string
  href   : string
}

const TYPES: TypeMeta[] = [
  { key: 'stage',      label: 'Stages',      picto: '🏕',  color: colors.accent.gold,     href: '/evenements/stages'      },
  { key: 'tournoi',    label: 'Tournois',    picto: '🏆', color: colors.entity.club,     href: '/evenements/tournois'    },
  { key: 'fun_day',    label: 'Fun Days',    picto: '🎉', color: colors.status.success,  href: '/evenements/fun-days'    },
  { key: 'detect_day', label: 'Detect Days', picto: '🔍', color: colors.accent.red,      href: '/evenements/detect-days' },
  { key: 'seminaire',  label: 'Séminaires',  picto: '📚', color: colors.text.subtle,     href: '/evenements/seminaires'  },
]

export default function EvenementsHubPage() {
  const router = useRouter()
  const [counts,  setCounts]  = useState<Record<EventType, number | null>>({
    stage      : null,
    tournoi    : null,
    fun_day    : null,
    detect_day : null,
    seminaire  : null,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all(
        TYPES.map(t => listEvents({ type: t.key }).then(data => [t.key, data.length] as const).catch(() => [t.key, 0] as const))
      )
      const next: Record<EventType, number | null> = {
        stage      : 0,
        tournoi    : 0,
        fun_day    : 0,
        detect_day : 0,
        seminaire  : 0,
      }
      for (const [key, val] of results) next[key] = val
      setCounts(next)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[evenements/hub] load counts error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <View style={s.container}>
      <AdminPageHeader title="Événements" />
      <EvenementsHeader />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        <View style={s.grid}>
          {TYPES.map(t => {
            const count = counts[t.key]
            return (
              <Pressable
                key={t.key}
                style={({ pressed }) => [s.card, pressed && s.cardPressed] as never}
                onPress={() => router.push(t.href as never)}
              >
                <View style={[s.accent, { backgroundColor: t.color }]} />
                <View style={s.cardBody}>
                  <AureakText style={s.picto}>{t.picto}</AureakText>
                  <AureakText style={s.label as never}>{t.label.toUpperCase()}</AureakText>
                  <AureakText style={s.value as never}>
                    {loading || count === null ? '—' : String(count)}
                  </AureakText>
                  <AureakText style={s.cta as never}>Voir →</AureakText>
                </View>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.md },

  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  card: {
    flex           : 1,
    minWidth       : 220,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  cardPressed: { opacity: 0.85 },
  accent     : { height: 3 },
  cardBody   : {
    padding   : space.md,
    alignItems: 'center',
    gap       : 6,
  },
  picto: {
    fontSize: 32,
  },
  label: {
    fontSize     : 11,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.muted,
    letterSpacing: 1,
    textAlign    : 'center',
  },
  value: {
    fontSize  : 32,
    fontWeight: '900',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  cta: {
    fontSize  : 11,
    fontWeight: '700',
    color     : colors.accent.gold,
    marginTop : 2,
  },
})
