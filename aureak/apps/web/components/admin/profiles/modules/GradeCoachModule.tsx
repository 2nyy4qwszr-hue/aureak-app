'use client'
// Story 87.2 — Module "Grade coach" (conditionnel role === 'coach')
// Affiche le grade courant + lien vers la fiche coach spécialisée.

import { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { getCoachCurrentGrade } from '@aureak/api-client'
import type { CoachGrade, CoachGradeLevel, UserRow } from '@aureak/api-client'
import { colors, fonts, space, radius } from '@aureak/theme'
import { cardStyles } from '../card'

const GRADE_LABELS: Record<CoachGradeLevel, string> = {
  bronze  : 'Bronze',
  silver  : 'Argent',
  gold    : 'Or',
  platinum: 'Platine',
}

const GRADE_COLORS: Record<CoachGradeLevel, string> = {
  bronze  : colors.status.warning,
  silver  : colors.text.muted,
  gold    : colors.accent.gold,
  platinum: colors.status.present,
}

type GradeCoachModuleProps = {
  profile: UserRow
}

export function GradeCoachModule({ profile }: GradeCoachModuleProps) {
  const router = useRouter()
  const [grade, setGrade]     = useState<CoachGrade | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile.userRole !== 'coach') return
    let cancelled = false
    setLoading(true)
    const run = async () => {
      try {
        const res = await getCoachCurrentGrade(profile.userId)
        if (cancelled) return
        setGrade(res.data)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[GradeCoachModule] load error:', err)
        if (!cancelled) setGrade(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [profile.userId, profile.userRole])

  if (profile.userRole !== 'coach') return null

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Grade coach</AureakText>
      {loading ? (
        <AureakText style={cardStyles.muted as TextStyle}>Chargement…</AureakText>
      ) : !grade ? (
        <AureakText style={cardStyles.muted as TextStyle}>Aucun grade attribué</AureakText>
      ) : (
        <View style={[s.badge, { borderColor: GRADE_COLORS[grade.grade_level] }]}>
          <AureakText style={[s.badgeLabel, { color: GRADE_COLORS[grade.grade_level] }] as never}>
            {GRADE_LABELS[grade.grade_level]}
          </AureakText>
        </View>
      )}
      <Pressable
        onPress={() => router.push(`/academie/coachs/${profile.userId}` as never)}
        style={({ pressed }) => [s.link, pressed && s.linkPressed] as never}
      >
        <AureakText style={s.linkLabel as TextStyle}>Voir fiche coach complète →</AureakText>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  badge: {
    alignSelf        : 'flex-start',
    paddingHorizontal: 12,
    paddingVertical  : 4,
    borderRadius     : radius.xs,
    borderWidth      : 2,
  },
  badgeLabel : { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, fontFamily: fonts.display, textTransform: 'uppercase' },
  link       : { alignSelf: 'flex-start', paddingVertical: 4 },
  linkPressed: { opacity: 0.7 },
  linkLabel  : { fontSize: 12, color: colors.accent.gold, fontWeight: '700', letterSpacing: 0.4 },
})
