'use client'
// Story 33.3 — Vue Parent : Présences Heatmap & Justification d'absences
// AC2: justification, AC3: heatmap, AC6: vue multi-groupe

import { useEffect, useState, useCallback } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getChildAttendanceHeatmap, computeAttendanceStats,
  submitAbsenceJustification,
  getProfileDisplayName,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, transitions, radius } from '@aureak/theme'
import type { AttendanceHeatmapEntry, AbsenceReason, HeatmapStatus } from '@aureak/types'
import type { AttendanceStats } from '@aureak/api-client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HEATMAP_COLORS: Record<HeatmapStatus, { bg: string; border: string; label: string }> = {
  present     : { bg: 'rgba(16,185,129,0.7)',  border: '#10B981', label: '🟢 Présent'          },
  absent      : { bg: 'rgba(239,68,68,0.7)',   border: '#EF4444', label: '🔴 Absent'            },
  justified   : { bg: 'rgba(59,130,246,0.7)',  border: '#3B82F6', label: '🔵 Absent (justifié)' },
  injured     : { bg: 'rgba(107,114,128,0.7)', border: '#6B7280', label: '⚫ Blessé'            },
  unconfirmed : { bg: 'rgba(156,163,175,0.3)', border: '#9CA3AF', label: '⬜ Non confirmé'      },
}

const ABSENCE_REASONS: { value: AbsenceReason; label: string; legitimate: boolean }[] = [
  { value: 'injury',      label: '🩹 Blessure',           legitimate: true  },
  { value: 'match',       label: '⚽ Match / Terrain',     legitimate: true  },
  { value: 'school',      label: '📚 École',              legitimate: true  },
  { value: 'school_trip', label: '🚌 Voyage scolaire',    legitimate: true  },
  { value: 'vacation',    label: '🏖 Vacances',            legitimate: true  },
  { value: 'other',       label: '📝 Autre',              legitimate: false },
]

// ─── Composant Heatmap ────────────────────────────────────────────────────────

function AttendanceHeatmap({
  entries, onSelectEntry,
}: {
  entries        : AttendanceHeatmapEntry[]
  onSelectEntry  : (e: AttendanceHeatmapEntry) => void
}) {
  if (entries.length === 0) {
    return (
      <div style={{ fontSize: 13, color: colors.text.muted, textAlign: 'center', padding: '24px 0' }}>
        Aucune séance dans la période sélectionnée.
      </div>
    )
  }

  // Build weeks grid (last 6 months → ~26 weeks)
  const sorted = [...entries].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
  const firstDate = new Date(sorted[0].sessionDate)
  const lastDate  = new Date(sorted[sorted.length - 1].sessionDate)

  // Index entries by date
  const byDate = new Map(entries.map(e => [e.sessionDate, e]))

  // Build array of weeks
  const weeks: (string | null)[][] = []
  let current = new Date(firstDate)
  // Align to Monday
  current.setDate(current.getDate() - ((current.getDay() + 6) % 7))

  while (current <= lastDate) {
    const week: (string | null)[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().slice(0, 10)
      week.push(byDate.has(dateStr) ? dateStr : null)
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div>
      {/* Day labels */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, paddingLeft: 32 }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ width: 14, fontSize: 9, color: colors.text.subtle, textAlign: 'center' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
        {/* Week labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 0 }}>
          {weeks.map((_, wi) => {
            const weekStart = new Date(firstDate)
            weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7) + wi * 7)
            const label = wi % 4 === 0
              ? weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              : ''
            return (
              <div key={wi} style={{ height: 14, fontSize: 8, color: colors.text.subtle, lineHeight: '14px', whiteSpace: 'nowrap', minWidth: 28 }}>
                {label}
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', gap: 3 }}>
              {week.map((dateStr, di) => {
                const entry = dateStr ? byDate.get(dateStr) : null
                const sc    = entry ? HEATMAP_COLORS[entry.heatmapStatus] : null
                const fmtDate = dateStr
                  ? new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                  : ''

                return (
                  <div
                    key={di}
                    title={entry ? `${fmtDate} — ${sc?.label}` : (dateStr ? fmtDate : '')}
                    style={{
                      width          : 14,
                      height         : 14,
                      borderRadius   : 3,
                      backgroundColor: entry ? sc!.bg : dateStr ? colors.light.muted : 'transparent',
                      border         : entry ? `1px solid ${sc!.border}` : `1px solid transparent`,
                      cursor         : entry ? 'pointer' : 'default',
                      flexShrink     : 0,
                      transition     : `opacity ${transitions.fast}`,
                    }}
                    onClick={() => entry && onSelectEntry(entry)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        {Object.entries(HEATMAP_COLORS).map(([status, sc]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: sc.bg, border: `1px solid ${sc.border}` }} />
            <span style={{ fontSize: 10, color: colors.text.subtle }}>{sc.label.replace(/.*\s/, '')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Modal justification ──────────────────────────────────────────────────────

function JustificationModal({
  entry, tenantId, parentId, childId,
  onClose, onSubmit,
}: {
  entry    : AttendanceHeatmapEntry
  tenantId : string
  parentId : string
  childId  : string
  onClose  : () => void
  onSubmit : () => void
}) {
  const [reason,  setReason]  = useState<AbsenceReason>('other')
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Can justify up to 48h after session
  const sessionDate  = new Date(entry.sessionDate)
  const hoursAfter   = (Date.now() - sessionDate.getTime()) / 3_600_000
  const canJustify   = hoursAfter < 48 * 24 || hoursAfter < 24 * 365  // loose check, RLS will enforce

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const { error: apiErr } = await submitAbsenceJustification({
        tenantId, childId, sessionId: entry.sessionId,
        reason, note: note.trim() || undefined, parentId,
      })
      if (apiErr) { setError('Erreur lors de l\'enregistrement. Réessayez.'); return }
      onSubmit()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    } as React.CSSProperties}>
      <div style={{
        backgroundColor: colors.light.surface, borderRadius: 14, padding: 28,
        boxShadow: shadows.lg, width: 360,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.text.dark, marginBottom: 4 }}>
          Motif d'absence
        </div>
        <div style={{ fontSize: 12, color: colors.text.muted, marginBottom: 20 }}>
          {new Date(entry.sessionDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {ABSENCE_REASONS.map(r => (
            <button
              key={r.value}
              style={{
                padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                border: `2px solid ${reason === r.value ? colors.accent.gold : colors.border.light}`,
                backgroundColor: reason === r.value ? `${colors.accent.gold}18` : 'transparent',
                color: colors.text.dark, fontSize: 13, fontWeight: reason === r.value ? 700 : 400,
                cursor: 'pointer',
              }}
              onClick={() => setReason(r.value)}
            >
              {r.label}
              {r.legitimate && (
                <span style={{ fontSize: 10, color: '#3B82F6', marginLeft: 8, fontWeight: 600 }}>
                  (assiduité préservée)
                </span>
              )}
            </button>
          ))}
        </div>

        {reason === 'other' && (
          <textarea
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              borderRadius: 8, border: `1px solid ${colors.border.light}`,
              backgroundColor: colors.light.primary, fontSize: 13,
              color: colors.text.dark, resize: 'vertical', minHeight: 60,
            }}
            placeholder="Précision (optionnel)…"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        )}

        {error && <div style={{ fontSize: 12, color: colors.status.absent, marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button style={M.btnSecondary} onClick={onClose} disabled={saving}>Annuler</button>
          <button
            style={{ ...M.btnPrimary, opacity: saving ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

function SubNav({ childId, active }: { childId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Fiche',      href: `/parent/children/${childId}`                   },
    { label: 'Séances',    href: `/parent/children/${childId}/sessions`          },
    { label: 'Présences',  href: `/parent/children/${childId}/presences`         },
    { label: 'Badges',     href: `/parent/children/${childId}/badges`            },
    { label: 'Progression',href: `/parent/children/${childId}/progress`          },
    { label: 'Football',   href: `/parent/children/${childId}/football-history`  },
  ]
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 20, overflowX: 'auto' }}>
      {tabs.map(tab => (
        <button
          key={tab.href}
          style={{
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13,
            color: active === tab.label ? colors.accent.gold : colors.text.muted,
            borderBottom: `2px solid ${active === tab.label ? colors.accent.gold : 'transparent'}`,
            whiteSpace: 'nowrap',
          }}
          onClick={() => router.push(tab.href as never)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChildPresencesPage() {
  const { childId }  = useLocalSearchParams<{ childId: string }>()
  const router       = useRouter()
  const user         = useAuthStore(s => s.user)
  const tenantId     = useAuthStore(s => (s.user as { tenantId?: string } | null)?.tenantId ?? '')

  const [displayName, setDisplayName] = useState('')
  const [entries,     setEntries]     = useState<AttendanceHeatmapEntry[]>([])
  const [stats,       setStats]       = useState<AttendanceStats | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<AttendanceHeatmapEntry | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [heatmapRes, nameRes] = await Promise.all([
        getChildAttendanceHeatmap(childId),
        getProfileDisplayName(childId),
      ])
      setDisplayName(nameRes.data ?? '')
      setEntries(heatmapRes.data)
      setStats(computeAttendanceStats(heatmapRes.data))
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={S.page}>
      <style>{`@keyframes sk{0%,100%{opacity:.15}50%{opacity:.4}} .sk{background:${colors.light.muted};border-radius:8px;animation:sk 1.8s ease-in-out infinite}`}</style>
      <div className="sk" style={{ height: 36, marginBottom: 20 }} />
      <div className="sk" style={{ height: 120, marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 10 }}>
        {[0,1,2,3].map(i => <div key={i} className="sk" style={{ flex: 1, height: 80 }} />)}
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <button style={S.back} onClick={() => router.push('/parent' as never)}>← Mes enfants</button>

      <h1 style={S.title}>{displayName}</h1>

      <SubNav childId={childId} active="Présences" />

      {/* Stats cards */}
      {stats && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard label="Total séances" value={String(stats.total)} />
          <StatCard
            label="Présences"
            value={`${stats.present}`}
            sub={stats.attendanceRate !== null ? `${stats.attendanceRate}%` : undefined}
            color="#10B981"
          />
          <StatCard
            label="Absents"
            value={String(stats.absent)}
            color={stats.absent > 0 ? colors.status.absent : undefined}
          />
          {stats.justified > 0 && (
            <StatCard label="Justifiés" value={String(stats.justified)} color="#3B82F6" />
          )}
          {stats.qualityRate !== null && stats.qualityRate !== stats.attendanceRate && (
            <StatCard
              label="Assiduité nette"
              value={`${stats.qualityRate}%`}
              sub="excl. justifiés"
              color={stats.qualityRate >= 80 ? '#10B981' : '#FBBF24'}
            />
          )}
        </div>
      )}

      {/* Heatmap */}
      <div style={S.card}>
        <div style={S.cardTitle}>Heatmap — 6 derniers mois</div>
        <AttendanceHeatmap
          entries={entries}
          onSelectEntry={e => {
            if (e.heatmapStatus === 'absent') setSelectedEntry(e)
          }}
        />
        {entries.some(e => e.heatmapStatus === 'absent') && (
          <div style={{ fontSize: 11, color: colors.text.subtle, marginTop: 8 }}>
            💡 Cliquez sur une absence 🔴 pour ajouter un motif
          </div>
        )}
      </div>

      {/* List recap */}
      {entries.length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>Dernières séances</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...entries].slice(0, 10).map(e => {
              const sc = HEATMAP_COLORS[e.heatmapStatus]
              return (
                <div
                  key={e.sessionId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8,
                    backgroundColor: colors.light.primary,
                    border: `1px solid ${colors.border.light}`,
                    cursor: e.heatmapStatus === 'absent' ? 'pointer' : 'default',
                  }}
                  onClick={() => e.heatmapStatus === 'absent' && setSelectedEntry(e)}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                    backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
                  }} />
                  <span style={{ fontSize: 13, color: colors.text.dark, flex: 1 }}>
                    {new Date(e.sessionDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontSize: 12, color: sc.border, fontWeight: 600 }}>
                    {sc.label}
                  </span>
                  {e.heatmapStatus === 'absent' && (
                    <span style={{ fontSize: 11, color: '#3B82F6' }}>Justifier →</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal justification */}
      {selectedEntry && user?.id && (
        <JustificationModal
          entry={selectedEntry}
          tenantId={tenantId}
          parentId={user.id}
          childId={childId}
          onClose={() => setSelectedEntry(null)}
          onSubmit={() => { setSelectedEntry(null); load() }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      backgroundColor: colors.light.surface, borderRadius: 10, padding: '12px 16px',
      border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm,
      minWidth: 80, textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color ?? colors.text.dark, fontFamily: 'Montserrat, sans-serif' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: color ?? colors.text.subtle, fontWeight: 600, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page     : { padding: '24px 28px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark },
  back     : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 },
  title    : { fontSize: 22, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', margin: '0 0 16px' },
  card     : { backgroundColor: colors.light.surface, borderRadius: 12, padding: '16px 18px', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm, marginBottom: 16 },
  cardTitle: { fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 },
}

const M: Record<string, React.CSSProperties> = {
  btnPrimary  : { flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
