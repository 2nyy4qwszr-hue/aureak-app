'use client'
// Story 87.1 — Page liste Commerciaux de l'Académie
// Stat cards + colonne PIPELINE alimentées par commercial_contacts (Epic 85).

import { useEffect, useState } from 'react'
import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { countActiveCommercialPipeline, countMonthlyClosedWon } from '@aureak/api-client'
import { colors, fonts } from '@aureak/theme'
import { PeopleListPage, StatCard, StatCardsRow } from '../_components/PeopleListPage'

type CommercialStats = {
  pipelineByCommercial: Record<string, number>
  pipelineTotal       : number
  pipelineAvailable   : boolean
  closedByCommercial  : Record<string, number>
  closedTotal         : number
  closedAvailable     : boolean
}

export default function AcademieCommerciauxPage() {
  const [stats, setStats] = useState<CommercialStats | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const [pipeline, closed] = await Promise.all([
          countActiveCommercialPipeline(),
          countMonthlyClosedWon(),
        ])
        if (cancelled) return
        setStats({
          pipelineByCommercial: pipeline.byCommercial,
          pipelineTotal       : pipeline.total,
          pipelineAvailable   : pipeline.available,
          closedByCommercial  : closed.byCommercial,
          closedTotal         : closed.total,
          closedAvailable     : closed.available,
        })
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieCommerciauxPage] stats load error:', err)
        if (!cancelled) setStats(null)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return (
    <PeopleListPage
      role={'commercial'}
      newButtonLabel={'+ Nouveau commercial'}
      newButtonHref={'/settings/permissions#invite-commercial'}
      emptyLabel={'Aucun commercial'}
      renderStatCards={(rows) => {
        const total  = rows.length
        const actifs = rows.filter(r => !r.deletedAt).length
        return (
          <StatCardsRow>
            <StatCard picto={'💼'} label={'COMMERCIAUX'} value={String(total)} />
            <StatCard picto={'✅'} label={'ACTIFS'}      value={String(actifs)} valueColor={colors.status.present} />
            <StatCard
              picto={'📈'}
              label={'PIPELINE EN COURS'}
              value={stats?.pipelineAvailable ? String(stats.pipelineTotal) : '—'}
              valueColor={colors.accent.gold}
              subLabel={stats && !stats.pipelineAvailable ? 'à venir' : undefined}
            />
            <StatCard
              picto={'🎯'}
              label={'CLOSING MOIS'}
              value={stats?.closedAvailable ? String(stats.closedTotal) : '—'}
              valueColor={colors.status.present}
              subLabel={stats && !stats.closedAvailable ? 'à venir' : undefined}
            />
          </StatCardsRow>
        )
      }}
      renderExtraColumn={{
        header: 'PIPELINE',
        width : 90,
        cell  : (row) => {
          if (!stats || !stats.pipelineAvailable) {
            return <AureakText variant="body" style={extraS.muted}>—</AureakText>
          }
          const count = stats.pipelineByCommercial[row.userId] ?? 0
          return (
            <View style={extraS.badge}>
              <AureakText style={extraS.badgeText as TextStyle}>{String(count)}</AureakText>
            </View>
          )
        },
      }}
    />
  )
}

const extraS = StyleSheet.create({
  muted: { color: colors.text.muted, fontSize: 13 },
  badge: {
    alignSelf        : 'flex-start',
    paddingHorizontal: 10,
    paddingVertical  : 2,
    borderRadius     : 12,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  badgeText: {
    fontSize  : 12,
    fontWeight: '700',
    fontFamily: fonts.body,
    color     : colors.text.dark,
  },
})
