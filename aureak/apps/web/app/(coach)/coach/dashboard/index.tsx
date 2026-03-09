'use client'
// Coach Dashboard — centre de contrôle premium
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { listSessionsByCoach, supabase } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'
import type { Session } from '@aureak/types'

// ── helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString('fr-FR', opts)
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={S.container}>
      <style>{`@keyframes cdp{0%,100%{opacity:.18}50%{opacity:.45}} .cds{background:${colors.light.muted};border-radius:6px;animation:cdp 1.8s ease-in-out infinite}`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div className="cds" style={{ height: 28, width: 220, marginBottom: 8 }} />
          <div className="cds" style={{ height: 14, width: 180 }} />
        </div>
        <div className="cds" style={{ height: 36, width: 140 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[0,1,2,3].map(i => <div key={i} className="cds" style={{ height: 90 }} />)}
      </div>
      {[0,1,2,3,4].map(i => <div key={i} className="cds" style={{ height: 52, marginBottom: 8 }} />)}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ value, label, accent, dim = false }: {
  value: number; label: string; accent: string; dim?: boolean
}) {
  return (
    <div style={{ ...S.kpiCard, borderTop: `3px solid ${accent}` }}>
      <div style={{
        fontSize: 34, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif',
        color: dim ? colors.text.muted : colors.text.dark, lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11, color: colors.text.muted, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6,
      }}>
        {label}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CoachDashboardPage() {
  const router = useRouter()
  const user   = useAuthStore(s => s.user)

  const [sessions,     setSessions]     = useState<Session[]>([])
  const [missingEvals, setMissingEvals] = useState<string[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const { data } = await listSessionsByCoach(user.id)
      const all = (data ?? []) as Session[]
      setSessions(all)

      // Missing evaluations: closed sessions in the last 30 days
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const recentClosed = all
        .filter(s => s.status === 'terminée' && new Date(s.scheduledAt) >= cutoff)
        .map(s => s.id)

      if (recentClosed.length > 0) {
        const { data: evData } = await supabase
          .from('session_evaluations_merged')
          .select('session_id')
          .in('session_id', recentClosed)
        const evaluated = new Set(
          (evData ?? []).map((e: Record<string, string>) => e.session_id)
        )
        setMissingEvals(recentClosed.filter(id => !evaluated.has(id)))
      }

      setLoading(false)
    }
    load()
  }, [user?.id])

  if (loading) return <Skeleton />

  const now        = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd   = new Date(todayStart.getTime() + 86400000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstName  = user?.email?.split('@')[0] ?? ''

  const upcoming = sessions
    .filter(s => s.status === 'planifiée' && new Date(s.scheduledAt) >= now)
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))

  const ongoing        = sessions.filter(s => s.status === 'en_cours')
  const completedMonth = sessions.filter(s =>
    s.status === 'terminée' && new Date(s.scheduledAt) >= monthStart
  )

  const isToday = (d: Date) => d >= todayStart && d < todayEnd

  return (
    <div style={S.container}>
      <style>{`
        @keyframes cdp{0%,100%{opacity:.18}50%{opacity:.45}}
        .cds{background:${colors.light.muted};border-radius:6px;animation:cdp 1.8s ease-in-out infinite}
        .cd-btn:hover{opacity:.85}
        .cd-row:hover{background:rgba(255,255,255,0.03)}
      `}</style>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Bonjour {firstName} 👋</h1>
          <p style={S.subtitle}>
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          className="cd-btn"
          style={S.btnSecondary}
          onClick={() => router.push('/coach/sessions' as never)}
        >
          Toutes mes séances →
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div style={S.kpiGrid}>
        <KpiCard value={upcoming.length}        label="À venir"           accent={colors.accent.gold} />
        <KpiCard value={ongoing.length}         label="En cours"          accent={colors.status.present} />
        <KpiCard value={completedMonth.length}  label="Terminées ce mois" accent={colors.text.muted} dim />
        <KpiCard
          value={missingEvals.length}
          label="Évals manquantes"
          accent={missingEvals.length > 0 ? colors.status.attention : colors.border.light}
        />
      </div>

      {/* ── Alert: missing evaluations ── */}
      {missingEvals.length > 0 && (
        <div style={S.alertBand}>
          <span style={{ fontSize: 13, color: colors.status.attention }}>
            ⚠ {missingEvals.length} séance{missingEvals.length > 1 ? 's' : ''} clôturée{missingEvals.length > 1 ? 's' : ''} sans évaluation enregistrée
          </span>
          <button
            className="cd-btn"
            style={S.alertAction}
            onClick={() => router.push('/coach/sessions' as never)}
          >
            Voir les séances →
          </button>
        </div>
      )}

      {/* ── Ongoing sessions ── */}
      {ongoing.length > 0 && (
        <>
          <div style={S.sectionLabel}>En cours maintenant</div>
          {ongoing.map(s => {
            const d = new Date(s.scheduledAt)
            return (
              <div key={s.id} style={{ ...S.liveCard }}>
                <div style={S.liveDot} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: colors.accent.gold }}>
                    {fmtDate(d, { weekday: 'long', day: '2-digit', month: 'long' })} · {fmtTime(d)}
                  </div>
                  <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                    {s.durationMinutes} min{s.location ? ` · ${s.location}` : ''}
                  </div>
                </div>
                <button
                  className="cd-btn"
                  style={S.btnPrimary}
                  onClick={() => router.push(`/coach/sessions/${s.id}/attendance` as never)}
                >
                  Feuille de présence →
                </button>
              </div>
            )
          })}
        </>
      )}

      {/* ── Upcoming sessions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
        <div style={S.sectionLabel}>Prochaines séances</div>
        {upcoming.length > 6 && (
          <button
            className="cd-btn"
            style={S.linkBtn}
            onClick={() => router.push('/coach/sessions' as never)}
          >
            Voir toutes ({upcoming.length}) →
          </button>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div style={S.emptyCard}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, color: colors.text.muted }}>Aucune séance planifiée</div>
        </div>
      ) : (
        <div style={S.sessionTable}>
          <div style={S.tableHead}>
            <span style={{ ...S.th, flex: 2 }}>Date & heure</span>
            <span style={{ ...S.th, flex: 1 }}>Durée</span>
            <span style={{ ...S.th, flex: 1 }}>Lieu</span>
            <span style={{ ...S.th, width: 120, textAlign: 'right' as const }}>Actions</span>
          </div>
          {upcoming.slice(0, 7).map((s, idx) => {
            const d     = new Date(s.scheduledAt)
            const today = isToday(d)
            return (
              <div
                key={s.id}
                className="cd-row"
                style={{
                  ...S.tableRow,
                  ...(idx % 2 === 1 ? S.tableRowAlt : {}),
                  ...(today ? { background: 'rgba(193,172,92,0.04)' } : {}),
                }}
              >
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: today ? colors.accent.gold : colors.text.dark }}>
                    {fmtDate(d, { weekday: 'short', day: '2-digit', month: 'short' })}
                  </span>
                  <span style={{ fontSize: 13, color: colors.text.muted }}>{fmtTime(d)}</span>
                  {today && <span style={S.todayBadge}>Aujourd'hui</span>}
                </div>
                <span style={{ flex: 1, fontSize: 13, color: colors.text.muted }}>{s.durationMinutes} min</span>
                <span style={{ flex: 1, fontSize: 13, color: colors.text.muted }}>{s.location ?? '—'}</span>
                <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    className="cd-btn"
                    style={S.actionBtn}
                    onClick={() => router.push(`/coach/sessions/${s.id}/attendance` as never)}
                  >
                    Présences
                  </button>
                  <button
                    className="cd-btn"
                    style={S.actionBtn}
                    onClick={() => router.push(`/coach/sessions/${s.id}/evaluations` as never)}
                  >
                    Évals
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  container    : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 960 },
  header       : { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title        : { fontSize: 26, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: 0, marginBottom: 4 },
  subtitle     : { fontSize: 13, color: colors.text.muted, margin: 0 },
  kpiGrid      : { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  kpiCard      : { backgroundColor: colors.light.surface, borderRadius: 10, padding: '16px 18px', border: `1px solid ${colors.border.light}` },
  alertBand    : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderRadius: 8, backgroundColor: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)', marginBottom: 24 },
  alertAction  : { fontSize: 12, color: colors.status.attention, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  sectionLabel : { fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 4 },
  liveCard     : { display: 'flex', alignItems: 'center', gap: 16, backgroundColor: 'rgba(193,172,92,0.05)', borderRadius: 10, padding: '16px 18px', border: `1px solid ${colors.accent.gold}`, marginBottom: 10 },
  liveDot      : { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.status.present, flexShrink: 0 },
  sessionTable : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, overflow: 'hidden', marginBottom: 20 },
  tableHead    : { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted },
  th           : { fontSize: 11, color: colors.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  tableRow     : { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${colors.border.light}`, gap: 8, transition: 'background 0.15s' },
  tableRowAlt  : { backgroundColor: colors.light.muted },
  todayBadge   : { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, backgroundColor: 'rgba(193,172,92,0.15)', color: colors.accent.gold },
  emptyCard    : { backgroundColor: colors.light.surface, borderRadius: 10, padding: '40px', textAlign: 'center', border: `1px solid ${colors.border.light}`, marginBottom: 20 },
  btnPrimary   : { padding: '8px 16px', borderRadius: 7, border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnSecondary : { padding: '8px 16px', borderRadius: 7, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  actionBtn    : { padding: '5px 8px', borderRadius: 5, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  linkBtn      : { fontSize: 12, color: colors.accent.gold, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
}
