'use client'
// Story 87.1 — Page liste Marketeurs de l'Académie
// Stat card CONTENUS PUBLIÉS = placeholder — les tables marketing (Epic 91) ne
// sont pas déployées, donc on affiche "—" + label "à venir".

import { colors } from '@aureak/theme'
import { PeopleListPage, StatCard, StatCardsRow } from '../../../../components/admin/academie/PeopleListPage'
import { formatRelativeDate } from '../../../../components/admin/academie/formatRelativeDate'

export default function AcademieMarketeursPage() {
  return (
    <PeopleListPage
      role={'marketeur'}
      title={'Marketeurs'}
      newButtonLabel={'+ Nouveau marketeur'}
      newButtonHref={'/academie/marketeurs/new'}
      emptyLabel={'Aucun marketeur'}
      renderStatCards={(rows) => {
        const total     = rows.length
        const actifs    = rows.filter(r => !r.deletedAt).length
        const newestIso = rows.reduce<string | null>((acc, r) => {
          if (!r.createdAt) return acc
          if (!acc || r.createdAt > acc) return r.createdAt
          return acc
        }, null)
        return (
          <StatCardsRow>
            <StatCard picto={'🎨'} label={'MARKETEURS'}        value={String(total)} />
            <StatCard picto={'✅'} label={'ACTIFS'}            value={String(actifs)} valueColor={colors.status.present} />
            <StatCard picto={'📣'} label={'CONTENUS PUBLIÉS'}  value={'—'} subLabel={'à venir'} />
            <StatCard picto={'🕒'} label={'DERNIER AJOUT'}     value={formatRelativeDate(newestIso)} />
          </StatCardsRow>
        )
      }}
    />
  )
}
