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

// ── Player Rankings (Story 60.6) ──────────────────────────────────────────────

export type RankingMetric = 'attendance' | 'progression' | 'xp'

export interface PlayerRankingItem {
  childId     : string
  displayName : string
  groupName   : string
  value       : number   // % pour attendance/progression, points pour xp
  rank        : number
  weeklyDelta : number   // positif = monté, négatif = descendu, 0 = stable
}

// ── Monthly Report (Story 60.7) ───────────────────────────────────────────────

export interface MonthlyReportGroupRow {
  groupId      : string
  groupName    : string
  sessionCount : number
  attendanceRate: number   // 0–100
  masteryAvg   : number   // 0–5
}

export interface MonthlyReportTopPlayer {
  rank       : number
  displayName: string
  groupName  : string
  rate       : number   // taux de présence 0–100
}

export interface MonthlyReportData {
  month             : string   // 'YYYY-MM'
  implantationName  : string   // 'Toutes' si null
  totalSessions     : number
  activePlayers     : number
  avgAttendanceRate : number   // 0–100
  groups            : MonthlyReportGroupRow[]
  topPlayers        : MonthlyReportTopPlayer[]
}

export interface ReportOptions {
  month          : string        // 'YYYY-MM'
  implantationId : string | null // null = toutes
  sections       : { presences: boolean; progression: boolean; topPlayers: boolean }
  filename       : string
}
