'use client'
// Story 87.2 — Module "Accès étendus" (conditionnel role === 'manager')
// Liste les sections overridées pour ce profil (max 5 + "et N autres").

import { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { countManagerOverrides } from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import { colors, fonts, space } from '@aureak/theme'
import { cardStyles } from '../_card'

type Snapshot = {
  count   : number
  sections: string[]
}

type AccesEtendusModuleProps = {
  profile: UserRow
}

export function AccesEtendusModule({ profile }: AccesEtendusModuleProps) {
  const router = useRouter()
  const [snap, setSnap]       = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile.userRole !== 'manager') return
    let cancelled = false
    setLoading(true)
    const run = async () => {
      try {
        const res = await countManagerOverrides(profile.userId)
        if (cancelled) return
        setSnap({ count: res.count, sections: res.sections })
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AccesEtendusModule] load error:', err)
        if (!cancelled) setSnap({ count: 0, sections: [] })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [profile.userId, profile.userRole])

  if (profile.userRole !== 'manager') return null

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Accès étendus</AureakText>

      {loading ? (
        <AureakText style={cardStyles.muted as TextStyle}>Chargement…</AureakText>
      ) : !snap || snap.count === 0 ? (
        <AureakText style={cardStyles.muted as TextStyle}>
          Aucun accès étendu — utilise les permissions par défaut du rôle manager.
        </AureakText>
      ) : (
        <>
          <View style={s.countRow}>
            <AureakText style={s.countValue as TextStyle}>{String(snap.count)}</AureakText>
            <AureakText style={cardStyles.fieldLabel as TextStyle}>OVERRIDES ACTIFS</AureakText>
          </View>
          <View style={s.chipsRow}>
            {snap.sections.map(section => (
              <View key={section} style={s.chip}>
                <AureakText style={s.chipLabel as TextStyle}>{section}</AureakText>
              </View>
            ))}
            {snap.count > snap.sections.length ? (
              <AureakText style={cardStyles.subLabel as TextStyle}>
                et {snap.count - snap.sections.length} autre{snap.count - snap.sections.length > 1 ? 's' : ''}
              </AureakText>
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push(`/settings/permissions?profile_id=${profile.userId}` as never)}
            style={({ pressed }) => [s.link, pressed && s.linkPressed] as never}
          >
            <AureakText style={s.linkLabel as TextStyle}>Voir dans Paramètres →</AureakText>
          </Pressable>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  countRow  : { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  countValue: { fontSize: 24, fontWeight: '900', color: colors.accent.gold, fontFamily: fonts.display },

  chipsRow: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap', alignItems: 'center' },
  chip    : { paddingHorizontal: 10, paddingVertical: 3, backgroundColor: colors.light.muted, borderRadius: 6, borderWidth: 1, borderColor: colors.border.light },
  chipLabel: { fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' },

  link       : { alignSelf: 'flex-start', paddingVertical: 4 },
  linkPressed: { opacity: 0.7 },
  linkLabel  : { fontSize: 12, color: colors.accent.gold, fontWeight: '700', letterSpacing: 0.4 },
})
