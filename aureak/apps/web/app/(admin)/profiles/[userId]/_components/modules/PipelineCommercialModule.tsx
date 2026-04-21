'use client'
// Story 87.2 — Module Pipeline commercial (conditionnel role === 'commercial')
// Réutilise countActiveCommercialPipeline + countMonthlyClosedWon (story 87.1).
// Fallback "CRM non déployé" si la table commercial_contacts est absente.

import { useEffect, useState } from 'react'
import { View, Pressable, StyleSheet, type TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { countActiveCommercialPipeline, countMonthlyClosedWon } from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import { colors, fonts, space } from '@aureak/theme'
import { cardStyles } from '../_card'

type Snapshot = {
  pipelineActive  : number | null
  closingMois     : number | null
  totalMois       : number
  crmAvailable    : boolean
}

type PipelineCommercialModuleProps = {
  profile: UserRow
}

export function PipelineCommercialModule({ profile }: PipelineCommercialModuleProps) {
  const router = useRouter()
  const [snap, setSnap]       = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile.userRole !== 'commercial') return
    let cancelled = false
    setLoading(true)
    const run = async () => {
      try {
        const [pipeline, closed] = await Promise.all([
          countActiveCommercialPipeline(),
          countMonthlyClosedWon(),
        ])
        if (cancelled) return

        const crmAvailable = pipeline.available && closed.available
        const pipelineActive = crmAvailable ? (pipeline.byCommercial[profile.userId] ?? 0) : null
        const closingMois    = crmAvailable ? (closed.byCommercial[profile.userId]   ?? 0) : null
        const totalMois      = crmAvailable ? closed.total : 0

        setSnap({ pipelineActive, closingMois, totalMois, crmAvailable })
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PipelineCommercialModule] load error:', err)
        if (!cancelled) setSnap({ pipelineActive: null, closingMois: null, totalMois: 0, crmAvailable: false })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [profile.userId, profile.userRole])

  if (profile.userRole !== 'commercial') return null

  const conversionPct = (() => {
    if (!snap || !snap.crmAvailable) return '—'
    if (snap.totalMois === 0) return '—'
    const ratio = ((snap.closingMois ?? 0) / snap.totalMois) * 100
    return `${Math.round(ratio)} %`
  })()

  return (
    <View style={cardStyles.card}>
      <AureakText style={cardStyles.title as TextStyle}>Pipeline commercial</AureakText>

      {loading ? (
        <AureakText style={cardStyles.muted as TextStyle}>Chargement…</AureakText>
      ) : (
        <>
          <View style={s.statsRow}>
            <Mini label={'EN COURS'}          value={snap?.crmAvailable ? String(snap.pipelineActive ?? 0) : '—'} />
            <Mini label={'GAGNÉS CE MOIS'}    value={snap?.crmAvailable ? String(snap.closingMois ?? 0)    : '—'} />
            <Mini label={'TAUX CONVERSION'}   value={conversionPct} />
          </View>
          {snap && !snap.crmAvailable ? (
            <AureakText style={cardStyles.subLabel as TextStyle}>CRM non déployé</AureakText>
          ) : null}
          {snap && snap.crmAvailable ? (
            <Pressable
              onPress={() => router.push(`/developpement/prospection?assigned_to=${profile.userId}` as never)}
              style={({ pressed }) => [s.link, pressed && s.linkPressed] as never}
            >
              <AureakText style={s.linkLabel as TextStyle}>Voir pipeline complet →</AureakText>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.mini}>
      <AureakText style={s.miniLabel as TextStyle}>{label}</AureakText>
      <AureakText style={s.miniValue as TextStyle}>{value}</AureakText>
    </View>
  )
}

const s = StyleSheet.create({
  statsRow : { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  mini     : { flex: 1, minWidth: 120, alignItems: 'center', gap: 4 },
  miniLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.text.muted, textTransform: 'uppercase' },
  miniValue: { fontSize: 24, fontWeight: '900', color: colors.text.dark, fontFamily: fonts.display },

  link       : { alignSelf: 'flex-start', paddingVertical: 4 },
  linkPressed: { opacity: 0.7 },
  linkLabel  : { fontSize: 12, color: colors.accent.gold, fontWeight: '700', letterSpacing: 0.4 },
})
