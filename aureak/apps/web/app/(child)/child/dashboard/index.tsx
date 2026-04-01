'use client'
// Child Dashboard — espace joueur premium gamifié
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  getPlayerProgress, listActiveQuests,
  getChildThemeProgression, getSkillCardCollection,
  getChildDashboardExtra,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'
import type { PlayerProgress } from '@aureak/types'
import type { PlayerQuest, ThemeProgressEntry, SkillCardCollectionEntry } from '@aureak/api-client'

// ── Constants & helpers ────────────────────────────────────────────────────────
const LEVEL_XP = 500
function getLevel(pts: number) { return Math.floor(pts / LEVEL_XP) + 1 }
function getLevelProgress(pts: number) { return pts % LEVEL_XP }

const LEVEL_TITLES = [
  'Recrue', 'Apprenti', 'Combattant', 'Guerrier', 'Champion',
  'Expert', 'Maître', 'Grand Maître', 'Légende', 'Immortel',
]
function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? 'Immortel'
}

function getMotivation(streak: number, pts: number, acquired: number): { msg: string; icon: string } {
  const hour = new Date().getHours()
  if (pts === 0)         return { msg: 'Prêt(e) pour ta première aventure ?',     icon: '🚀' }
  if (streak >= 10)      return { msg: 'Tu es en feu — rien ne t\'arrête !',       icon: '🔥' }
  if (streak >= 5)       return { msg: 'Série impressionnante, continue !',         icon: '⚡' }
  if (streak >= 3)       return { msg: 'Tu enchaînes les séances, bravo !',         icon: '💪' }
  if (acquired >= 5)     return { msg: 'Tu maîtrises de plus en plus !',            icon: '🎯' }
  if (hour < 12)         return { msg: 'Belle matinée pour progresser !',           icon: '🌅' }
  if (hour >= 20)        return { msg: 'Dernière session de la journée !',          icon: '🌙' }
  return { msg: 'Chaque séance te rend meilleur(e) !', icon: '⭐' }
}

const RARITY_COLOR: Record<string, string> = {
  common: colors.text.muted, rare: colors.status.present,
  epic: colors.status.attention, legendary: colors.accent.gold,
}
const RARITY_LABEL: Record<string, string> = {
  common: 'Commune', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire',
}
const SIGNAL_ICON : Record<string, string> = { positive: '✓', attention: '!', none: '–' }
const SIGNAL_COLOR: Record<string, string> = {
  positive: colors.status.present, attention: colors.status.attention, none: colors.text.muted,
}
const SIGNAL_BG: Record<string, string> = {
  positive: 'rgba(76,175,80,0.14)', attention: 'rgba(255,193,7,0.14)', none: colors.light.muted,
}
const EVAL_LABEL: Record<string, string> = {
  receptivite: 'Récep.', gout_effort: 'Effort', attitude: 'Attitude',
}

type NextSession = { scheduled_at: string; duration_minutes: number | null; location: string | null }
type RecentEval  = { receptivite: string; gout_effort: string; attitude: string; top_seance: string }

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={D.page}>
      <style>{`
        @keyframes dsh{0%,100%{opacity:.13}50%{opacity:.36}}
        .ds{background:${colors.light.muted};border-radius:6px;animation:dsh 1.8s ease-in-out infinite}
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="ds" style={{ height: 30, width: 220, marginBottom: 8 }} />
          <div className="ds" style={{ height: 13, width: 160 }} />
        </div>
        <div className="ds" style={{ height: 64, width: 72, borderRadius: 12 }} />
      </div>
      <div className="ds" style={{ height: 170, borderRadius: 16, marginBottom: 14 }} />
      <div className="ds" style={{ height: 70, borderRadius: 12, marginBottom: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        {[0,1,2,3].map(i => <div key={i} className="ds" style={{ height: 90, borderRadius: 12 }} />)}
      </div>
      <div className="ds" style={{ height: 80, borderRadius: 12, marginBottom: 8 }} />
      <div className="ds" style={{ height: 80, borderRadius: 12 }} />
    </div>
  )
}

// ── Empty first-time state ─────────────────────────────────────────────────────
function EmptyFirst({ firstName }: { firstName: string }) {
  const router = useRouter()
  return (
    <div style={D.emptyHero}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🥋</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', marginBottom: 8 }}>
        Bienvenue, {firstName} !
      </div>
      <div style={{ fontSize: 14, color: colors.text.muted, lineHeight: 1.6, marginBottom: 24 }}>
        Ton aventure commence ici.<br />Fais ton premier quiz pour débloquer tes points et monter en niveau !
      </div>
      <button style={D.btnStart} onClick={() => router.push('/child/quiz' as never)}>
        Commencer mon premier quiz →
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ChildDashboardPage() {
  const router = useRouter()
  const user   = useAuthStore(s => s.user)

  const [progress,    setProgress]    = useState<PlayerProgress | null>(null)
  const [quests,      setQuests]      = useState<PlayerQuest[]>([])
  const [themes,      setThemes]      = useState<ThemeProgressEntry[]>([])
  const [cards,       setCards]       = useState<SkillCardCollectionEntry[]>([])
  const [nextSession, setNextSession] = useState<NextSession | null>(null)
  const [lastEval,    setLastEval]    = useState<RecentEval | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      try {
        // Parallel primary data
        const [progResult, questsResult, themesData, cardsData] = await Promise.all([
          getPlayerProgress(user.id),
          listActiveQuests(user.id),
          getChildThemeProgression(user.id),
          getSkillCardCollection(user.id),
        ])

        // Prochaine séance + dernière évaluation (ARCH-1 conforme)
        const { data: extra } = await getChildDashboardExtra(user.id)
        if (extra?.nextSession) {
          setNextSession({
            scheduled_at    : extra.nextSession.scheduledAt,
            duration_minutes: extra.nextSession.durationMinutes,
            location        : extra.nextSession.location,
          })
        }
        if (extra?.lastEval) {
          setLastEval({
            receptivite: extra.lastEval.receptivite,
            gout_effort: extra.lastEval.goutEffort,
            attitude   : extra.lastEval.attitude,
            top_seance : extra.lastEval.topSeance,
          })
        }

        setProgress(progResult.data ?? null)
        setQuests((questsResult.data ?? []).slice(0, 3))
        setThemes(themesData)
        setCards(cardsData.filter(c => c.collected).slice(0, 5))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[child/dashboard] load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  if (loading) return <Skeleton />

  const pts            = progress?.totalPoints ?? 0
  const streak         = progress?.currentStreak ?? 0
  const themesAcquired = progress?.themesAcquiredCount ?? 0
  const level          = getLevel(pts)
  const levelPts       = getLevelProgress(pts)
  const levelPct       = Math.round((levelPts / LEVEL_XP) * 100)
  const levelTitle     = getLevelTitle(level)
  const firstName      = user?.email?.split('@')[0] ?? 'Joueur'
  const motivation     = getMotivation(streak, pts, themesAcquired)
  const reviewDue      = themes.filter(t => t.reviewDue).length
  const inProgress     = themes.filter(t => t.masteryStatus === 'in_progress').length
  const acquired       = themes.filter(t => t.masteryStatus === 'acquired' || t.masteryStatus === 'revalidated').length
  const isNewPlayer    = pts === 0 && themes.length === 0

  const daysUntil = nextSession
    ? Math.ceil((new Date(nextSession.scheduled_at).getTime() - Date.now()) / 86400000)
    : null

  const NAV_ITEMS = [
    { label: 'Quiz',        icon: '🎯', href: '/child/quiz',     badge: reviewDue > 0 ? reviewDue : null },
    { label: 'Progression', icon: '📈', href: '/child/progress', badge: acquired > 0 ? acquired : null   },
    { label: 'Badges',      icon: '🏆', href: '/child/badges',   badge: null                              },
    { label: 'Avatar',      icon: '🎭', href: '/child/avatar',   badge: null                              },
  ] as const

  return (
    <div style={D.page}>
      <style>{`
        @keyframes dsh{0%,100%{opacity:.13}50%{opacity:.36}}
        .ds{background:${colors.light.muted};border-radius:6px;animation:dsh 1.8s ease-in-out infinite}

        @keyframes xpfill{from{width:0}to{width:${levelPct}%}}
        .xp-fill{animation:xpfill 1.1s cubic-bezier(0.4,0,0.2,1) 0.35s both}

        @keyframes streak-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
        .streak-icon{display:inline-block;animation:streak-pulse 2.2s ease-in-out infinite}

        @keyframes card-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .card-in{animation:card-in 0.4s ease both}

        .nav-btn{transition:all 0.18s ease;cursor:pointer}
        .nav-btn:hover{transform:translateY(-3px);border-color:${colors.accent.gold}!important;background:rgba(193,172,92,0.08)!important}
        .nav-btn:active{transform:translateY(0)}

        .quest-row{transition:background 0.13s}
        .quest-row:hover{background:rgba(255,255,255,0.03)!important}

        .d-btn:hover{opacity:.85;cursor:pointer}
        .d-btn:active{opacity:.7}

        @keyframes shimmer-x{0%{background-position:-400px 0}100%{background-position:400px 0}}
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={D.header}>
        <div>
          <h1 style={D.title}>
            <span className="streak-icon" style={{ marginRight: 6 }}>{motivation.icon}</span>
            Bonjour {firstName} !
          </h1>
          <p style={D.subtitle}>{motivation.msg}</p>
        </div>

        {/* Streak badge */}
        {streak >= 2 && (
          <div style={D.streakBadge}>
            <span className="streak-icon" style={{ fontSize: 26, lineHeight: 1 }}>🔥</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: colors.accent.gold, lineHeight: 1 }}>
                {streak}
              </div>
              <div style={{ fontSize: 9, color: colors.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                jours
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Empty — nouveau joueur ───────────────────────────────────── */}
      {isNewPlayer && <EmptyFirst firstName={firstName} />}

      {/* ── Hero XP card ────────────────────────────────────────────────── */}
      {!isNewPlayer && (
        <div style={D.xpHero} className="card-in">
          {/* Subtle gold glow top-right */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(193,172,92,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Level title + points + circle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.accent.gold, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>
                {levelTitle}
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: colors.text.dark, lineHeight: 1 }}>
                {pts.toLocaleString('fr-FR')}
                <span style={{ fontSize: 18, color: colors.text.muted, fontWeight: 500, marginLeft: 6 }}>pts</span>
              </div>
              <div style={{ fontSize: 12, color: colors.text.muted, marginTop: 3 }}>
                Niveau {level} · encore {(LEVEL_XP - levelPts).toLocaleString('fr-FR')} pts
              </div>
            </div>

            {/* Circular badge */}
            <div style={D.levelCircle}>
              <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: colors.accent.gold, lineHeight: 1 }}>
                {level}
              </div>
              <div style={{ fontSize: 8, color: colors.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                niv.
              </div>
            </div>
          </div>

          {/* XP gradient bar */}
          <div style={{ height: 10, backgroundColor: colors.light.muted, borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
            <div
              className="xp-fill"
              style={{
                height: '100%',
                width: `${levelPct}%`,
                background: `linear-gradient(90deg, ${colors.accent.gold}99, ${colors.accent.gold} 80%, #E8D080)`,
                borderRadius: 5,
                boxShadow: `0 0 8px ${colors.accent.gold}66`,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontSize: 10, color: colors.text.muted }}>Niv. {level}</span>
            <span style={{ fontSize: 10, color: colors.accent.gold, fontWeight: 700 }}>{levelPct}%</span>
            <span style={{ fontSize: 10, color: colors.text.muted }}>Niv. {level + 1}</span>
          </div>

          {/* 4 mini KPIs */}
          <div style={{ display: 'flex', borderTop: `1px solid ${colors.border.light}`, paddingTop: 14, gap: 0 }}>
            {[
              { val: streak,      label: 'Série',   color: streak > 0 ? colors.status.present : colors.text.muted },
              { val: acquired,    label: 'Acquis',  color: acquired > 0 ? colors.accent.gold : colors.text.muted  },
              { val: inProgress,  label: 'En cours', color: inProgress > 0 ? colors.status.attention : colors.text.muted },
              { val: themes.length, label: 'Thèmes', color: colors.text.muted },
            ].map((k, i, arr) => (
              <div key={k.label} style={{ flex: 1, textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${colors.border.light}` : 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: k.color, lineHeight: 1 }}>
                  {k.val}
                </div>
                <div style={{ fontSize: 9, color: colors.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>
                  {k.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Alert révision ─────────────────────────────────────────────── */}
      {reviewDue > 0 && (
        <div style={D.alert}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span>{reviewDue} thème{reviewDue > 1 ? 's' : ''} à réviser pour ne pas perdre ta maîtrise !</span>
          </span>
          <button className="d-btn" style={D.alertBtn} onClick={() => router.push('/child/quiz' as never)}>
            Réviser →
          </button>
        </div>
      )}

      {/* ── Prochaine séance ──────────────────────────────────────────── */}
      {nextSession ? (
        <>
          <div style={D.sectionLabel}>Prochaine séance</div>
          <div style={D.sessionCard}>
            <div style={{ fontSize: 32, marginRight: 14, flexShrink: 0 }}>📅</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.text.dark, marginBottom: 3 }}>
                {new Date(nextSession.scheduled_at).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </div>
              <div style={{ fontSize: 12, color: colors.text.muted }}>
                {new Date(nextSession.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {nextSession.duration_minutes ? ` · ${nextSession.duration_minutes} min` : ''}
                {nextSession.location ? ` · ${nextSession.location}` : ''}
              </div>
            </div>
            <div style={D.dayBadge}>
              {daysUntil === 0 ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: colors.status.present }}>Aujourd'hui !</span>
              ) : daysUntil === 1 ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: colors.accent.gold }}>Demain</span>
              ) : (
                <>
                  <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: colors.accent.gold, lineHeight: 1 }}>
                    {daysUntil}
                  </div>
                  <div style={{ fontSize: 9, color: colors.text.muted, fontWeight: 700, textTransform: 'uppercase' }}>jours</div>
                </>
              )}
            </div>
          </div>
        </>
      ) : !isNewPlayer ? (
        <div style={{ ...D.sessionCard, opacity: 0.5 }}>
          <div style={{ fontSize: 32, marginRight: 14 }}>📅</div>
          <div style={{ fontSize: 13, color: colors.text.muted }}>Aucune séance planifiée pour l'instant.</div>
        </div>
      ) : null}

      {/* ── Quick nav ─────────────────────────────────────────────────── */}
      <div style={D.sectionLabel}>Mon espace</div>
      <div style={D.navGrid}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.href}
            className="nav-btn"
            style={D.navCard}
            onClick={() => router.push(item.href as never)}
          >
            {item.badge !== null && (
              <div style={D.navBadge}>{item.badge}</div>
            )}
            <span style={{ fontSize: 30, display: 'block', marginBottom: 8, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: colors.text.dark }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Quêtes actives ────────────────────────────────────────────── */}
      {quests.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={D.sectionLabel}>Quêtes en cours</div>
            <button className="d-btn" style={D.linkBtn} onClick={() => router.push('/child/badges' as never)}>
              Voir tout →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {quests.map(q => {
              const def = q.quest_definitions
              const pct = q.target_value > 0
                ? Math.min(100, Math.round((q.current_value / q.target_value) * 100))
                : 0
              const hot = pct >= 80
              return (
                <div
                  key={q.id}
                  className="quest-row"
                  style={{
                    ...D.questCard,
                    borderColor: hot ? `${colors.accent.gold}55` : colors.border.light,
                    background : hot ? 'rgba(193,172,92,0.05)' : colors.light.surface,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, marginRight: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
                        {hot ? '⚡ ' : ''}{def?.name ?? 'Quête'}
                      </div>
                      {def?.description && (
                        <div style={{ fontSize: 12, color: colors.text.muted }}>{def.description}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', color: pct >= 100 ? colors.status.present : colors.accent.gold, lineHeight: 1 }}>
                        {pct}%
                      </div>
                      <div style={{ fontSize: 10, color: colors.text.muted }}>
                        {q.current_value}/{q.target_value}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 8, backgroundColor: colors.light.muted, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: pct >= 100
                        ? `linear-gradient(90deg, ${colors.status.present}99, ${colors.status.present})`
                        : `linear-gradient(90deg, ${colors.accent.gold}88, ${colors.accent.gold})`,
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                      boxShadow: hot ? `0 0 6px ${colors.accent.gold}55` : 'none',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : !isNewPlayer ? (
        <div style={D.emptySection}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucune quête active</div>
          <div style={{ fontSize: 12, color: colors.text.muted }}>Les quêtes apparaissent au fil des séances.</div>
        </div>
      ) : null}

      {/* ── Dernier avis du coach ──────────────────────────────────────── */}
      {lastEval && (
        <>
          <div style={D.sectionLabel}>Dernier avis du coach</div>
          <div style={D.evalCard}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: lastEval.top_seance === 'star' ? 16 : 0 }}>
              {(['receptivite', 'gout_effort', 'attitude'] as const).map(key => {
                const val = lastEval[key] as string
                return (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      backgroundColor: SIGNAL_BG[val] ?? colors.light.muted,
                      border: `2px solid ${SIGNAL_COLOR[val] ?? colors.border.light}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px',
                      fontSize: 18, fontWeight: 800,
                      color: SIGNAL_COLOR[val] ?? colors.text.muted,
                    }}>
                      {SIGNAL_ICON[val] ?? '–'}
                    </div>
                    <div style={{ fontSize: 10, color: colors.text.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {EVAL_LABEL[key]}
                    </div>
                  </div>
                )
              })}
            </div>
            {lastEval.top_seance === 'star' && (
              <div style={{ textAlign: 'center', paddingTop: 12, borderTop: `1px solid ${colors.border.light}` }}>
                <span style={{ fontSize: 24 }}>⭐</span>
                <div style={{ fontSize: 12, color: colors.accent.gold, fontWeight: 700, marginTop: 4 }}>
                  Top séance — ton coach t'a mis en avant !
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Cartes de compétence récentes ─────────────────────────────── */}
      {cards.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={D.sectionLabel}>Mes cartes débloquées</div>
            <button className="d-btn" style={D.linkBtn} onClick={() => router.push('/child/progress' as never)}>
              Collection →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            {cards.map(card => {
              const rc = RARITY_COLOR[card.rarity] ?? colors.text.muted
              return (
                <div
                  key={card.id}
                  style={{
                    flexShrink: 0,
                    width: 94,
                    backgroundColor: colors.light.surface,
                    borderRadius: 10,
                    border: `1.5px solid ${rc}55`,
                    padding: '10px 8px',
                    textAlign: 'center',
                    boxShadow: card.rarity !== 'common' ? `0 0 14px ${rc}22` : 'none',
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, color: rc, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    {RARITY_LABEL[card.rarity]}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.text.dark, lineHeight: 1.4 }}>
                    {card.name}
                  </div>
                  {card.collected_at && (
                    <div style={{ fontSize: 9, color: colors.text.muted, marginTop: 6 }}>
                      {new Date(card.collected_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const D: Record<string, React.CSSProperties> = {
  page       : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 780 },
  header     : { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title      : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center' },
  subtitle   : { fontSize: 13, color: colors.text.muted, margin: 0 },
  streakBadge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    backgroundColor: colors.light.surface,
    borderRadius: 12, padding: '12px 16px',
    border: `1px solid rgba(193,172,92,0.35)`,
    boxShadow: '0 0 16px rgba(193,172,92,0.08)',
  },
  xpHero     : {
    backgroundColor: colors.light.surface,
    borderRadius: 16, padding: '20px 20px 16px',
    border: `1px solid ${colors.border.light}`,
    marginBottom: 14,
    position: 'relative', overflow: 'hidden',
  },
  levelCircle: {
    width: 68, height: 68, borderRadius: '50%',
    background: `radial-gradient(circle, rgba(193,172,92,0.15), rgba(193,172,92,0.05))`,
    border: `2px solid rgba(193,172,92,0.4)`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  alert      : {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 16px', borderRadius: 10, marginBottom: 16,
    backgroundColor: 'rgba(193,172,92,0.08)', border: '1px solid rgba(193,172,92,0.28)',
    fontSize: 13, color: colors.accent.gold, fontWeight: 700,
  },
  alertBtn   : { fontSize: 12, fontWeight: 800, color: colors.accent.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' },
  sessionCard: {
    display: 'flex', alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderRadius: 12, padding: '14px 18px',
    border: `1px solid ${colors.border.light}`,
    marginBottom: 20,
  },
  dayBadge   : { textAlign: 'center', minWidth: 48, flexShrink: 0 },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, marginTop: 4 },
  navGrid    : { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 },
  navCard    : {
    padding: '18px 8px 14px', borderRadius: 12,
    border: `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.surface,
    textAlign: 'center' as const, position: 'relative',
  },
  navBadge   : {
    position: 'absolute', top: 8, right: 8,
    fontSize: 10, fontWeight: 800,
    backgroundColor: colors.accent.gold, color: colors.text.dark,
    borderRadius: 10, minWidth: 18, height: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
  },
  questCard  : { borderRadius: 12, padding: '14px 16px', border: '1px solid', transition: 'background 0.13s' },
  evalCard   : {
    backgroundColor: colors.light.surface,
    borderRadius: 12, padding: '20px',
    border: `1px solid ${colors.border.light}`,
    marginBottom: 20,
  },
  emptySection: {
    textAlign: 'center', padding: '24px',
    backgroundColor: colors.light.surface,
    borderRadius: 12, border: `1px solid ${colors.border.light}`,
    marginBottom: 20,
  },
  emptyHero  : {
    textAlign: 'center', padding: '40px 28px',
    backgroundColor: colors.light.surface,
    borderRadius: 16, border: `1px solid ${colors.border.light}`,
    marginBottom: 20,
  },
  btnStart   : {
    padding: '12px 28px', borderRadius: 8, border: 'none',
    backgroundColor: colors.accent.gold, color: colors.text.dark,
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
  },
  linkBtn    : { fontSize: 12, color: colors.accent.gold, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
}
