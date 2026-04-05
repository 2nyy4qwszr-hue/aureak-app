// @aureak/types — Analytics types (Epic 60)

// ── Line Chart (Story 60.2) ───────────────────────────────────────────────────
export interface LineChartPoint {
  month: string
  value: number
  meta?: Record<string, unknown>
}

export interface LineChartSeries {
  id    : string
  label : string
  color : string
  points: LineChartPoint[]
}

export interface AttendanceMonthlyData {
  groupId     : string
  groupName   : string
  month       : string
  rate        : number
  sessionCount: number
}

// ── Heatmap (Story 60.3) ─────────────────────────────────────────────────────
export type HeatmapPeriod = 'month' | '3months' | '6months' | 'year'

export interface HeatmapCell {
  day   : number   // 0=Sun … 6=Sat
  hour  : number   // 0–23
  count : number
  groups: string[]
}

// ── Bar Chart / Implantation Rankings (Story 60.4) ───────────────────────────
export type BarChartPeriod = 'month' | 'quarter' | 'year'

export interface BarChartItem {
  id   : string
  label: string
  value: number
  rank : number
  meta?: Record<string, unknown>
}

export interface ImplantationRankingItem {
  id          : string
  name        : string
  value       : number
  rank        : number
  sessionCount: number
}
