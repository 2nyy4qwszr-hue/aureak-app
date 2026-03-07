// Story 9.3 — Classement côté client (anonymisé — métriques par implantation)
export type ImplantationStat = {
  implantation_id  : string
  implantation_name: string
  sessions_total   : number
  sessions_closed  : number
  attendance_rate_pct: number
  mastery_rate_pct : number
}

export type RankedStat = ImplantationStat & {
  rank   : number
  isFirst: boolean
  isLast : boolean
}

export function computeRankings(data: ImplantationStat[], metricKey: keyof ImplantationStat): RankedStat[] {
  const sorted = [...data].sort((a, b) =>
    ((b[metricKey] as number) ?? 0) - ((a[metricKey] as number) ?? 0)
  )
  return sorted.map((item, index) => ({
    ...item,
    rank   : index + 1,
    isFirst: index === 0,
    isLast : index === sorted.length - 1,
  }))
}
