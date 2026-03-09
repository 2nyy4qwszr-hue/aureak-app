'use client'
// Progression enfant — vue parent avec mastery overview
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getChildThemeProgression, supabase } from '@aureak/api-client'
import { colors } from '@aureak/theme'
import type { ThemeProgressEntry, MasteryStatus } from '@aureak/api-client'

const MASTERY_LABEL: Record<MasteryStatus, string> = {
  not_started: 'Non commencé',
  in_progress: 'En cours',
  acquired   : 'Acquis',
  revalidated: 'Revalidé',
}
const MASTERY_COLOR: Record<MasteryStatus, string> = {
  not_started: colors.text.muted,
  in_progress: colors.status.attention,
  acquired   : colors.status.present,
  revalidated: colors.accent.gold,
}
const MASTERY_BAR_PCT: Record<MasteryStatus, number> = {
  not_started: 0,
  in_progress: 40,
  acquired   : 100,
  revalidated: 100,
}
const RARITY_COLOR: Record<string, string> = {
  common   : colors.text.muted,
  rare     : colors.status.present,
  epic     : colors.status.attention,
  legendary: colors.accent.gold,
}
const RARITY_LABEL: Record<string, string> = {
  common: 'Commune', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire',
}

// ── Sub-nav ───────────────────────────────────────────────────────────────────
function SubNav({ childId, active }: { childId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Fiche',       href: `/parent/children/${childId}`          },
    { label: 'Séances',     href: `/parent/children/${childId}/sessions` },
    { label: 'Progression', href: `/parent/children/${childId}/progress` },
  ]
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 20 }}>
      {tabs.map(tab => (
        <button
          key={tab.href}
          style={{
            padding    : '10px 20px',
            background : 'none',
            border     : 'none',
            cursor     : 'pointer',
            fontWeight : 600,
            fontSize   : 13,
            color      : active === tab.label ? colors.accent.gold : colors.text.muted,
            borderBottom: `2px solid ${active === tab.label ? colors.accent.gold : 'transparent'}`,
            transition : 'color 0.15s',
          }}
          onClick={() => router.push(tab.href as never)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Mastery overview donut-style bar ─────────────────────────────────────────
function MasteryOverview({ themes }: { themes: ThemeProgressEntry[] }) {
  if (themes.length === 0) return null

  const acquired    = themes.filter(t => t.masteryStatus === 'acquired' || t.masteryStatus === 'revalidated').length
  const inProgress  = themes.filter(t => t.masteryStatus === 'in_progress').length
  const notStarted  = themes.filter(t => t.masteryStatus === 'not_started').length
  const total       = themes.length
  const masteryPct  = Math.round((acquired / total) * 100)

  const segments = [
    { count: acquired,   pct: (acquired   / total) * 100, color: colors.status.present  },
    { count: inProgress, pct: (inProgress  / total) * 100, color: colors.status.attention },
    { count: notStarted, pct: (notStarted  / total) * 100, color: colors.light.muted },
  ]

  return (
    <div style={PR.overviewCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Maîtrise globale
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: masteryPct >= 70 ? colors.status.present : masteryPct >= 40 ? colors.status.attention : colors.text.muted }}>
          {masteryPct}%
        </div>
      </div>

      {/* Segmented bar */}
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2, marginBottom: 14 }}>
        {segments.map((seg, i) => (
          seg.pct > 0 && (
            <div key={i} style={{ flex: seg.pct, backgroundColor: seg.color, borderRadius: 3, minWidth: 4, transition: 'flex 0.4s ease' }} />
          )
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20 }}>
        {[
          { label: 'Acquis',        count: acquired,   color: colors.status.present   },
          { label: 'En cours',      count: inProgress, color: colors.status.attention },
          { label: 'Non commencé',  count: notStarted, color: colors.text.muted   },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: colors.text.muted }}>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={PR.page}>
      <style>{`@keyframes pp{0%,100%{opacity:.15}50%{opacity:.42}} .ps{background:${colors.light.muted};border-radius:6px;animation:pp 1.8s ease-in-out infinite}`}</style>
      <div className="ps" style={{ height: 13, width: 120, marginBottom: 20 }} />
      <div className="ps" style={{ height: 26, width: 220, marginBottom: 24 }} />
      <div className="ps" style={{ height: 38, width: '100%', borderRadius: 0, marginBottom: 20 }} />
      <div className="ps" style={{ height: 110, borderRadius: 12, marginBottom: 20 }} />
      <div className="ps" style={{ height: 76, borderRadius: 10, marginBottom: 20 }} />
      {[0,1,2,3].map(i => <div key={i} className="ps" style={{ height: 100, borderRadius: 10, marginBottom: 8 }} />)}
    </div>
  )
}

export default function ChildProgressPage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const router      = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [themes,      setThemes]      = useState<ThemeProgressEntry[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const [themesRes, childRes] = await Promise.all([
        getChildThemeProgression(childId),
        supabase.from('profiles').select('display_name').eq('user_id', childId).single(),
      ])
      setDisplayName((childRes.data as { display_name: string } | null)?.display_name ?? '')
      setThemes(themesRes)
      setLoading(false)
    }
    load()
  }, [childId])

  if (loading) return <Skeleton />

  const reviewDueCount = themes.filter(t => t.reviewDue).length
  const allCards       = themes.flatMap(t => t.skillCards)

  return (
    <div style={PR.page}>
      <style>{`.pr-back:hover{color:${colors.accent.gold}} .pr-nav:hover{opacity:.8}`}</style>

      <button className="pr-back" style={PR.back} onClick={() => router.push('/parent/dashboard' as never)}>
        ← Dashboard
      </button>

      <h1 style={PR.title}>{displayName || '…'} — Progression</h1>

      <SubNav childId={childId} active="Progression" />

      {/* Mastery overview */}
      <MasteryOverview themes={themes} />

      {/* KPI row */}
      <div style={PR.kpiRow}>
        {[
          { value: themes.filter(t => t.masteryStatus === 'acquired' || t.masteryStatus === 'revalidated').length, label: 'Acquis',     color: colors.status.present  },
          { value: themes.filter(t => t.masteryStatus === 'in_progress').length,                                    label: 'En cours',   color: colors.status.attention },
          { value: reviewDueCount,                                                                                   label: 'À réviser',  color: reviewDueCount > 0 ? colors.status.attention : colors.text.muted },
          { value: allCards.length,                                                                                  label: 'Cartes',     color: colors.accent.gold      },
        ].map((kpi, i) => (
          <div key={i} style={PR.kpi}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div style={PR.kpiLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Review alert */}
      {reviewDueCount > 0 && (
        <div style={PR.reviewBanner}>
          <span style={{ fontSize: 13, color: colors.status.attention, fontWeight: 600 }}>
            ⚠ {reviewDueCount} thème{reviewDueCount > 1 ? 's' : ''} à réviser
          </span>
        </div>
      )}

      {/* Themes section */}
      <div style={{ fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Thèmes pédagogiques
      </div>

      {themes.length === 0 ? (
        <div style={{ color: colors.text.muted, fontSize: 14 }}>Aucun thème commencé pour le moment.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {themes.map(theme => {
            const barPct   = MASTERY_BAR_PCT[theme.masteryStatus]
            const barColor = MASTERY_COLOR[theme.masteryStatus]
            return (
              <div
                key={theme.id}
                style={{
                  ...PR.themeCard,
                  borderLeft: `3px solid ${barColor}`,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      {theme.name}
                      {theme.reviewDue && <span style={{ marginLeft: 6, fontSize: 12, color: colors.status.attention }}>⚠ révision</span>}
                    </div>
                    {theme.description && (
                      <div style={{ fontSize: 12, color: colors.text.muted }}>{theme.description}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize       : 11,
                    fontWeight     : 700,
                    color          : barColor,
                    padding        : '3px 8px',
                    borderRadius   : 5,
                    border         : `1px solid ${barColor + '40'}`,
                    backgroundColor: barColor + '12',
                    whiteSpace     : 'nowrap',
                    marginLeft     : 12,
                  }}>
                    {MASTERY_LABEL[theme.masteryStatus]}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${barPct}%`, backgroundColor: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                </div>

                {/* Skill cards */}
                {theme.skillCards.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {theme.skillCards.map(card => (
                      <div
                        key={card.id}
                        style={{
                          padding        : '3px 8px',
                          borderRadius   : 5,
                          border         : `1px solid ${RARITY_COLOR[card.rarity] + '50'}`,
                          backgroundColor: colors.light.muted,
                          display        : 'flex',
                          flexDirection  : 'column',
                          gap            : 1,
                        }}
                      >
                        <div style={{ fontSize: 9, fontWeight: 700, color: RARITY_COLOR[card.rarity], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {RARITY_LABEL[card.rarity]}
                        </div>
                        <div style={{ fontSize: 11, color: colors.text.dark }}>{card.name}</div>
                      </div>
                    ))}
                  </div>
                )}

                {theme.firstAcquiredAt && (
                  <div style={{ fontSize: 11, color: colors.text.muted, marginTop: 4 }}>
                    Acquis le {new Date(theme.firstAcquiredAt).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const PR: Record<string, React.CSSProperties> = {
  page        : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 780 },
  back        : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, transition: 'color 0.15s' },
  title       : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: '0 0 20px' },
  overviewCard: { backgroundColor: colors.light.surface, borderRadius: 12, padding: '18px 20px', border: `1px solid ${colors.border.light}`, marginBottom: 16 },
  kpiRow      : { display: 'flex', backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, overflow: 'hidden', marginBottom: 16 },
  kpi         : { flex: 1, padding: '14px 0', textAlign: 'center', borderRight: `1px solid ${colors.border.light}` },
  kpiLabel    : { fontSize: 10, color: colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 },
  reviewBanner: { padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(255,193,7,0.06)', border: `1px solid ${colors.status.attention}30`, marginBottom: 16 },
  themeCard   : { backgroundColor: colors.light.surface, borderRadius: '0 10px 10px 0', padding: '14px 16px', border: `1px solid ${colors.border.light}` },
}
