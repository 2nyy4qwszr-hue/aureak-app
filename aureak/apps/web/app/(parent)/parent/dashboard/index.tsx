'use client'
// Dashboard parent — suivi enfants premium
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { supabase, getChildProfile } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type EvalSignal = 'none' | 'positive' | 'attention'

type ChildData = {
  childId      : string
  displayName  : string
  totalSessions: number
  presentCount : number
  lastSessionAt: string | null
  latestEval   : {
    receptivite: EvalSignal
    gout_effort: EvalSignal
    attitude   : EvalSignal
    top_seance : 'star' | 'none'
  } | null
}

const PRESENT_STATUSES = new Set(['present', 'late', 'trial'])

const SIGNAL_COLOR: Record<EvalSignal, string> = {
  positive : colors.status.present,
  attention: colors.status.attention,
  none     : colors.text.muted,
}
const SIGNAL_BG: Record<EvalSignal, string> = {
  positive : 'rgba(76,175,80,0.12)',
  attention: 'rgba(255,193,7,0.12)',
  none     : colors.light.muted,
}
const SIGNAL_LABEL: Record<EvalSignal, string> = {
  positive : '✓',
  attention: '!',
  none     : '–',
}

function rateColor(pct: number): string {
  if (pct >= 80) return colors.status.present
  if (pct >= 60) return colors.status.attention
  return colors.status.absent
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={P.container}>
      <style>{`@keyframes pdp{0%,100%{opacity:.18}50%{opacity:.45}} .pds{background:${colors.light.muted};border-radius:${radius.xs}px;animation:pdp 1.8s ease-in-out infinite}`}</style>
      <div className="pds" style={{ height: 28, width: 260, marginBottom: 8 }} />
      <div className="pds" style={{ height: 14, width: 200, marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
        {[0,1].map(i => <div key={i} className="pds" style={{ height: 260, borderRadius: radius.card }} />)}
      </div>
    </div>
  )
}

// ── Signal chip ──────────────────────────────────────────────────────────────
function SignalChip({ label, value }: { label: string; value: EvalSignal }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        backgroundColor: SIGNAL_BG[value],
        border: `1px solid ${SIGNAL_COLOR[value]}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 4px',
        fontSize: 13, fontWeight: 700, color: SIGNAL_COLOR[value],
      }}>
        {SIGNAL_LABEL[value]}
      </div>
      <div style={{ fontSize: 10, color: colors.text.muted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
        {label}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ParentDashboardPage() {
  const router  = useRouter()
  const user    = useAuthStore(s => s.user)

  const [children, setChildren] = useState<ChildData[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const { data: links } = await supabase
        .from('parent_child_links')
        .select('child_id, profiles!child_id(display_name)')
        .eq('parent_id', user.id)

      if (!links || links.length === 0) {
        setLoading(false)
        return
      }

      type AttRow = { status: string; sessions?: { scheduled_at: string } | null }
      type EvalRow = { receptivite: string; gout_effort: string; attitude: string; top_seance: string }

      const results: ChildData[] = await Promise.all(
        links.map(async (link: Record<string, unknown>) => {
          const profile     = link.profiles as { display_name: string | null } | null
          const childId     = link.child_id as string
          const displayName = profile?.display_name ?? childId.slice(0, 8)

          const { attendances, evaluations } = await getChildProfile(childId, { months: 3 })
          const atts  = attendances as unknown as AttRow[]
          const evals = evaluations as unknown as EvalRow[]

          const presentCount  = atts.filter(a => PRESENT_STATUSES.has(a.status)).length
          const lastSessionAt = atts[0]?.sessions?.scheduled_at ?? null
          const latestEval    = evals.length > 0 ? {
            receptivite: (evals[0].receptivite ?? 'none') as EvalSignal,
            gout_effort: (evals[0].gout_effort ?? 'none') as EvalSignal,
            attitude   : (evals[0].attitude    ?? 'none') as EvalSignal,
            top_seance : (evals[0].top_seance === 'star' ? 'star' : 'none') as 'star' | 'none',
          } : null

          return { childId, displayName, totalSessions: atts.length, presentCount, lastSessionAt, latestEval }
        })
      )

      setChildren(results)
      setLoading(false)
    }
    load()
  }, [user?.id])

  if (loading) return <Skeleton />

  const firstName = user?.email?.split('@')[0] ?? ''

  return (
    <div style={P.container}>
      <style>{`
        @keyframes pdp{0%,100%{opacity:.18}50%{opacity:.45}}
        .pds{background:${colors.light.muted};border-radius:${radius.xs}px;animation:pdp 1.8s ease-in-out infinite}
        .p-btn:hover{opacity:.85}
        .p-nav:hover{background:${colors.light.muted}}
      `}</style>

      {/* ── Header ── */}
      <div style={P.header}>
        <h1 style={P.title}>Bonjour {firstName} 👋</h1>
        <p style={P.subtitle}>
          Suivez la progression de {children.length > 1 ? 'vos joueurs' : 'votre joueur'}
        </p>
      </div>

      {/* ── Empty state ── */}
      {children.length === 0 ? (
        <div style={P.emptyCard}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucun joueur associé</div>
          <div style={{ fontSize: 14, color: colors.text.muted }}>
            Contactez votre club pour lier un profil joueur à votre compte.
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: children.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: 20,
        }}>
          {children.map(child => {
            const rate    = child.totalSessions > 0
              ? Math.round((child.presentCount / child.totalSessions) * 100)
              : null
            const initial = child.displayName.charAt(0).toUpperCase()

            return (
              <div key={child.childId} style={P.childCard}>

                {/* ── Card header ── */}
                <div style={P.cardTop}>
                  <div style={P.avatar}>{initial}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: colors.text.dark }}>
                      {child.displayName}
                    </div>
                    {child.lastSessionAt && (
                      <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>
                        Dernière séance : {new Date(child.lastSessionAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                      </div>
                    )}
                  </div>
                  {child.latestEval?.top_seance === 'star' && (
                    <span style={{ fontSize: 20 }}>⭐</span>
                  )}
                </div>

                {/* ── KPI row ── */}
                <div style={P.kpiRow}>
                  <div style={P.kpi}>
                    <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: colors.accent.gold }}>
                      {child.totalSessions}
                    </div>
                    <div style={P.kpiLabel}>Séances</div>
                  </div>
                  <div style={P.kpiDivider} />
                  <div style={P.kpi}>
                    <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: colors.status.present }}>
                      {child.presentCount}
                    </div>
                    <div style={P.kpiLabel}>Présences</div>
                  </div>
                  <div style={P.kpiDivider} />
                  <div style={P.kpi}>
                    <div style={{
                      fontSize: 26, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif',
                      color: rate !== null ? rateColor(rate) : colors.text.muted,
                    }}>
                      {rate !== null ? `${rate}%` : '—'}
                    </div>
                    <div style={P.kpiLabel}>Assiduité</div>
                  </div>
                </div>

                {/* ── Attendance bar ── */}
                {child.totalSessions > 0 && (
                  <div style={{ padding: '0 20px 16px' }}>
                    <div style={{ height: 4, backgroundColor: colors.light.muted, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((child.presentCount / child.totalSessions) * 100)}%`,
                        backgroundColor: rate !== null ? rateColor(rate) : colors.border.light,
                        borderRadius: 2,
                        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                      }} />
                    </div>
                  </div>
                )}

                {/* ── Latest evaluation signals ── */}
                {child.latestEval && (
                  <div style={P.evalSection}>
                    <div style={P.evalLabel}>Dernière évaluation</div>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                      <SignalChip label="Réceptivité" value={child.latestEval.receptivite} />
                      <SignalChip label="Effort"      value={child.latestEval.gout_effort} />
                      <SignalChip label="Attitude"    value={child.latestEval.attitude} />
                    </div>
                  </div>
                )}

                {/* ── Navigation ── */}
                <div style={P.navRow}>
                  <button
                    className="p-nav p-btn"
                    style={P.navBtn}
                    onClick={() => router.push(`/parent/children/${child.childId}` as never)}
                  >
                    Fiche
                  </button>
                  <button
                    className="p-nav p-btn"
                    style={P.navBtn}
                    onClick={() => router.push(`/parent/children/${child.childId}/sessions` as never)}
                  >
                    Séances
                  </button>
                  <button
                    className="p-nav p-btn"
                    style={P.navBtn}
                    onClick={() => router.push(`/parent/children/${child.childId}/progress` as never)}
                  >
                    Progression
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

const P: Record<string, React.CSSProperties> = {
  container  : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 900 },
  header     : { marginBottom: 28 },
  title      : { fontSize: 26, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: 0, marginBottom: 4 },
  subtitle   : { fontSize: 13, color: colors.text.muted, margin: 0 },
  emptyCard  : { backgroundColor: colors.light.surface, borderRadius: radius.card, padding: '48px 32px', textAlign: 'center', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm },
  childCard  : { backgroundColor: colors.light.surface, borderRadius: radius.card, border: `1px solid ${colors.border.light}`, overflow: 'hidden', boxShadow: shadows.sm },
  cardTop    : { display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 16px' },
  avatar     : { width: 44, height: 44, borderRadius: '50%', backgroundColor: colors.accent.gold, color: colors.text.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 },
  kpiRow     : { display: 'flex', alignItems: 'center', borderTop: `1px solid ${colors.border.light}`, borderBottom: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted },
  kpi        : { flex: 1, padding: '14px 0', textAlign: 'center' as const },
  kpiLabel   : { fontSize: 11, color: colors.text.muted, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 2 },
  kpiDivider : { width: 1, height: 40, backgroundColor: colors.border.light, flexShrink: 0 },
  evalSection: { padding: '16px 20px', borderTop: `1px solid ${colors.border.light}`, textAlign: 'center' as const },
  evalLabel  : { fontSize: 11, color: colors.text.muted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 12 },
  navRow     : { display: 'flex', padding: '12px 16px', gap: 8, borderTop: `1px solid ${colors.border.light}` },
  navBtn     : { flex: 1, padding: '8px 12px', borderRadius: radius.xs, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.accent.gold, fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'center' as const, transition: transitions.fast },
}
