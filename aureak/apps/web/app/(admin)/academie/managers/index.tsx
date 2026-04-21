'use client'
// Story 87.1 — Page liste Managers de l'Académie
// Remplace le stub "Bientôt disponible" par la page complète via PeopleListPage.

import { useEffect, useState } from 'react'
import { countManagersWithOverrides } from '@aureak/api-client'
import { colors } from '@aureak/theme'
import { PeopleListPage, StatCard, StatCardsRow } from '../_components/PeopleListPage'
import { formatRelativeDate } from '../_components/formatRelativeDate'

export default function AcademieManagersPage() {
  const [overridesCount, setOverridesCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await countManagersWithOverrides()
        if (cancelled) return
        setOverridesCount(res.available ? res.count : null)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AcademieManagersPage] overrides count error:', err)
        if (!cancelled) setOverridesCount(null)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return (
    <PeopleListPage
      role={'manager'}
      newButtonLabel={'+ Nouveau manager'}
      newButtonHref={'/academie/managers/new'}
      emptyLabel={'Aucun manager'}
      renderStatCards={(rows) => {
        const total       = rows.length
        const actifs      = rows.filter(r => !r.deletedAt).length
        const newestIso   = rows.reduce<string | null>((acc, r) => {
          if (!r.createdAt) return acc
          if (!acc || r.createdAt > acc) return r.createdAt
          return acc
        }, null)
        return (
          <StatCardsRow>
            <StatCard picto={'👔'} label={'MANAGERS'}           value={String(total)} />
            <StatCard picto={'✅'} label={'ACTIFS'}             value={String(actifs)} valueColor={colors.status.present} />
            <StatCard picto={'🔓'} label={'AVEC ACCÈS ÉTENDUS'} value={overridesCount === null ? '—' : String(overridesCount)} valueColor={colors.accent.gold} />
            <StatCard picto={'🕒'} label={'DERNIER AJOUT'}      value={formatRelativeDate(newestIso)} />
          </StatCardsRow>
        )
      }}
    />
  )
}
