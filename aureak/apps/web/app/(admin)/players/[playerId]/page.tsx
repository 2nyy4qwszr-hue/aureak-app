'use client'
// Story 18.1 — Fiche Joueur 360° Admin : présences, évaluations, progression, gamification, administratif
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getAdminPlayerProfile, getPlayerAttendanceHistory,
  getChildAcademyStatus,
  getChildThemeProgression, getSkillCardCollection,
  listActiveQuests,
  getPlayerProgress,
  getPlayerAvatar,
} from '@aureak/api-client'
import type {
  AdminPlayerProfile, PlayerAttendanceRecord,
} from '@aureak/api-client'
import type { EvaluationSignal } from '@aureak/types'
import { colors, space, radius } from '@aureak/theme'

// ─── Constants ────────────────────────────────────────────────────────────────

type TabId = 'presences' | 'evaluations' | 'progression' | 'administratif'
const TABS: { id: TabId; label: string }[] = [
  { id: 'presences',     label: 'Présences'    },
  { id: 'evaluations',   label: 'Évaluations'  },
  { id: 'progression',   label: 'Progression'  },
  { id: 'administratif', label: 'Administratif' },
]

const STATUS_COLOR: Record<string, string> = {
  present: colors.status.present,
  late   : colors.status.attention,
  trial  : colors.accent.gold,
  absent : colors.status.absent,
  injured: '#CE93D8',
}
const STATUS_LABEL: Record<string, string> = {
  present: 'Présent', late: 'Retard', trial: 'Essai', absent: 'Absent', injured: 'Blessé',
}

const SIGNAL_COLOR: Record<EvaluationSignal, string> = {
  positive : colors.status.present,
  attention: colors.status.attention,
  none     : colors.text.muted,
}
const SIGNAL_BG: Record<EvaluationSignal, string> = {
  positive : 'rgba(76,175,80,0.14)',
  attention: 'rgba(255,193,7,0.14)',
  none     : colors.light.muted,
}
const SIGNAL_ICON: Record<EvaluationSignal, string> = { positive: '✓', attention: '!', none: '–' }
const SIGNAL_LABEL: Record<string, string> = {
  receptivite: 'Réceptivité', goutEffort: 'Effort', attitude: 'Attitude',
}

const MASTERY_COLOR: Record<string, string> = {
  acquired   : colors.status.present,
  revalidated: colors.status.present,
  in_progress: colors.status.attention,
  not_started: colors.text.muted,
}
const MASTERY_LABEL: Record<string, string> = {
  acquired   : 'Acquis',        revalidated: 'Révalidé',
  in_progress: 'En cours',      not_started: 'Non commencé',
}
const MASTERY_ICON: Record<string, string> = {
  acquired: '✓', revalidated: '✓', in_progress: '~', not_started: '○',
}

const PRESENT_SET = new Set(['present', 'late', 'trial'])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
}
function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ─── Mini-chart présences ─────────────────────────────────────────────────────

function AttMiniChart({ records }: { records: PlayerAttendanceRecord[] }) {
  const last20 = [...records].slice(0, 20).reverse()
  if (last20.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {last20.map((r, i) => {
        const color = STATUS_COLOR[r.status] ?? colors.text.muted
        return (
          <div
            key={r.attendanceId ?? i}
            title={`${r.scheduledAt ? fmt(r.scheduledAt) + ' — ' : ''}${STATUS_LABEL[r.status] ?? r.status}`}
            style={{
              width: 12, height: 24, borderRadius: 3,
              backgroundColor: color + '33',
              border: `1px solid ${color}`,
              position: 'relative', cursor: 'default',
            }}
          >
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: PRESENT_SET.has(r.status) ? '100%' : r.status === 'absent' ? '30%' : '55%',
              backgroundColor: color, borderRadius: 2, opacity: 0.7,
            }} />
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Présences ───────────────────────────────────────────────────────────

function TabPresences({ playerId }: { playerId: string }) {
  const [records,  setRecords]  = useState<PlayerAttendanceRecord[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getPlayerAttendanceHistory(playerId, { limit: 30 })
      .then(r => { setRecords(r.data) })
      .catch(err => { if (process.env.NODE_ENV !== 'production') console.error('[TabPresences] load error:', err) })
      .finally(() => { setLoading(false) })
  }, [playerId])

  if (loading) return <div style={P.tabLoading}>Chargement…</div>

  const presentCount = records.filter(r => PRESENT_SET.has(r.status)).length
  const absentCount  = records.filter(r => r.status === 'absent').length
  const lateCount    = records.filter(r => r.status === 'late').length
  const total        = records.length
  const rate         = total > 0 ? Math.round((presentCount / total) * 100) : 0
  const rateColor    = rate >= 80 ? colors.status.present : rate >= 50 ? colors.status.attention : colors.status.absent

  return (
    <div>
      {/* KPI row */}
      <div style={{ ...P.kpiRow, marginBottom: 20 }}>
        {[
          { value: total,        label: 'Séances',   color: colors.accent.gold       },
          { value: presentCount, label: 'Présents',  color: colors.status.present    },
          { value: absentCount,  label: 'Absents',   color: colors.status.absent     },
          { value: lateCount,    label: 'Retards',   color: colors.status.attention  },
          { value: `${rate}%`,   label: 'Taux',      color: rateColor                },
        ].map((kpi, i) => (
          <div key={i} style={P.kpi}>
            <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={P.kpiLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Mini-chart */}
      {records.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={P.sectionLabel}>20 dernières séances</div>
          <AttMiniChart records={records} />
          <div style={{ height: 4, backgroundColor: colors.light.muted, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ height: '100%', width: `${rate}%`, backgroundColor: rateColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* List */}
      <div style={P.sectionLabel}>Historique ({total} séances)</div>
      {records.length === 0 ? (
        <div style={{ color: colors.text.muted, fontSize: 14 }}>Aucune présence enregistrée.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {records.map((r, idx) => {
            const color = STATUS_COLOR[r.status] ?? colors.text.muted
            const hasEval = r.receptivite || r.goutEffort || r.attitude
            return (
              <div key={r.attendanceId ?? idx} style={{ ...P.listRow, borderLeft: `3px solid ${color}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark }}>
                    {r.scheduledAt ? fmt(r.scheduledAt) : '–'}
                  </div>
                  {r.groupName && (
                    <div style={{ fontSize: 11, color: colors.text.muted }}>{r.groupName}</div>
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color, padding: '3px 8px', borderRadius: 5, border: `1px solid ${color + '40'}`, backgroundColor: color + '12' }}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
                {hasEval && (
                  <div style={{ display: 'flex', gap: 3 }}>
                    {(['receptivite', 'goutEffort', 'attitude'] as const).map(key => {
                      const sig = r[key] as EvaluationSignal | null
                      if (!sig) return null
                      return (
                        <div key={key} title={SIGNAL_LABEL[key]} style={{
                          width: 20, height: 20, borderRadius: '50%',
                          backgroundColor: SIGNAL_BG[sig],
                          border: `1px solid ${SIGNAL_COLOR[sig]}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: SIGNAL_COLOR[sig],
                        }}>
                          {SIGNAL_ICON[sig]}
                        </div>
                      )
                    })}
                    {r.topSeance === 'star' && <span style={{ fontSize: 13 }}>⭐</span>}
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

// ─── Tab: Évaluations ─────────────────────────────────────────────────────────

function TabEvaluations({ playerId }: { playerId: string }) {
  const [records,  setRecords]  = useState<PlayerAttendanceRecord[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getPlayerAttendanceHistory(playerId, { limit: 50 })
      .then(r => { setRecords(r.data.filter(a => a.receptivite || a.goutEffort || a.attitude)) })
      .catch(err => { if (process.env.NODE_ENV !== 'production') console.error('[TabEvaluations] load error:', err) })
      .finally(() => { setLoading(false) })
  }, [playerId])

  if (loading) return <div style={P.tabLoading}>Chargement…</div>

  if (records.length === 0) {
    return <div style={{ color: colors.text.muted, fontSize: 14 }}>Aucune évaluation disponible.</div>
  }

  // Compute averages
  type SigKey = 'receptivite' | 'goutEffort' | 'attitude'
  const sigKeys: SigKey[] = ['receptivite', 'goutEffort', 'attitude']
  const avgSignal = (key: SigKey) => {
    const vals = records.filter(r => r[key] !== null).map(r => r[key] as EvaluationSignal)
    if (vals.length === 0) return null
    const score = (sig: EvaluationSignal) => sig === 'positive' ? 2 : sig === 'attention' ? 1 : 0
    const avg = vals.reduce((a, v) => a + score(v), 0) / vals.length
    return avg >= 1.5 ? 'positive' : avg >= 0.5 ? 'attention' : 'none'
  }

  const topCount = records.filter(r => r.topSeance === 'star').length

  return (
    <div>
      {/* Moyennes */}
      <div style={P.sectionLabel}>Moyennes sur la période</div>
      <div style={{ ...P.kpiRow, marginBottom: 20 }}>
        {sigKeys.map(key => {
          const avg = avgSignal(key)
          return (
            <div key={key} style={{ flex: 1, textAlign: 'center', padding: '14px 0' }}>
              {avg ? (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: SIGNAL_BG[avg],
                  border: `2px solid ${SIGNAL_COLOR[avg]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: SIGNAL_COLOR[avg],
                  margin: '0 auto 6px',
                }}>
                  {SIGNAL_ICON[avg]}
                </div>
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: colors.light.muted, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: colors.text.muted }}>–</span>
                </div>
              )}
              <div style={P.kpiLabel}>{SIGNAL_LABEL[key]}</div>
            </div>
          )
        })}
        <div style={{ flex: 1, textAlign: 'center', padding: '14px 0' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: colors.accent.gold, marginBottom: 4 }}>
            ⭐ {topCount}
          </div>
          <div style={P.kpiLabel}>Top Séance</div>
          <div style={{ fontSize: 10, color: colors.text.muted }}>/ {records.length} éval.</div>
        </div>
      </div>

      {/* Timeline */}
      <div style={P.sectionLabel}>10 dernières évaluations</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {records.slice(0, 10).map((r, idx) => (
          <div key={r.attendanceId ?? idx} style={P.listRow}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.text.dark }}>
              {r.scheduledAt ? fmt(r.scheduledAt) : '–'}
              {r.groupName && <div style={{ fontSize: 11, color: colors.text.muted, fontWeight: 400 }}>{r.groupName}</div>}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {sigKeys.map(key => {
                const sig = r[key] as EvaluationSignal | null
                return (
                  <div key={key} title={SIGNAL_LABEL[key]} style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: sig ? SIGNAL_BG[sig] : colors.light.muted,
                    border: `1px solid ${sig ? SIGNAL_COLOR[sig] : colors.border.light}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: sig ? SIGNAL_COLOR[sig] : colors.text.muted,
                  }}>
                    {sig ? SIGNAL_ICON[sig] : '–'}
                  </div>
                )
              })}
              {r.topSeance === 'star' && <span style={{ fontSize: 14 }}>⭐</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Progression ─────────────────────────────────────────────────────────

function TabProgression({ playerId }: { playerId: string }) {
  const [themes,     setThemes]     = useState<Awaited<ReturnType<typeof getChildThemeProgression>>>([])
  const [quests,     setQuests]     = useState<Awaited<ReturnType<typeof listActiveQuests>>['data']>([])
  type ProgressState = Awaited<ReturnType<typeof getPlayerProgress>>
  const [progress,   setProgress]   = useState<ProgressState | null>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      getChildThemeProgression(playerId),
      listActiveQuests(playerId),
      getPlayerProgress(playerId),
    ])
      .then(([t, q, p]) => {
        setThemes(t)
        setQuests(q.data)
        setProgress(p)
      })
      .catch(err => { if (process.env.NODE_ENV !== 'production') console.error('[TabProgression] load error:', err) })
      .finally(() => { setLoading(false) })
  }, [playerId])

  if (loading) return <div style={P.tabLoading}>Chargement…</div>

  const acquiredCount    = themes.filter(t => t.masteryStatus === 'acquired' || t.masteryStatus === 'revalidated').length
  const inProgressCount  = themes.filter(t => t.masteryStatus === 'in_progress').length
  const notStartedCount  = themes.filter(t => t.masteryStatus === 'not_started').length
  const masteryRate      = themes.length > 0 ? Math.round((acquiredCount / themes.length) * 100) : 0
  const pp               = progress?.data

  return (
    <div>
      {/* XP / Level */}
      {pp && (
        <div style={{ ...P.card, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: colors.accent.gold }}>{pp.totalPoints} pts</div>
              <div style={{ fontSize: 11, color: colors.text.muted }}>{pp.themesAcquiredCount} thème{pp.themesAcquiredCount !== 1 ? 's' : ''} acquis</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.text.dark }}>🔥 {pp.currentStreak} j.</div>
              <div style={{ fontSize: 11, color: colors.text.muted }}>Max : {pp.maxStreak} j.</div>
            </div>
          </div>
        </div>
      )}

      {/* Mastery summary */}
      <div style={P.sectionLabel}>Maîtrise thèmes ({themes.length})</div>
      <div style={{ ...P.kpiRow, marginBottom: 16 }}>
        {[
          { value: acquiredCount,   label: 'Acquis',        color: colors.status.present   },
          { value: inProgressCount, label: 'En cours',      color: colors.status.attention },
          { value: notStartedCount, label: 'Non commencé',  color: colors.text.muted       },
          { value: `${masteryRate}%`, label: 'Maîtrise',   color: colors.accent.gold      },
        ].map((kpi, i) => (
          <div key={i} style={P.kpi}>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={P.kpiLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, backgroundColor: colors.light.muted, borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${masteryRate}%`, backgroundColor: colors.status.present, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>

      {/* Themes list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
        {themes.map(t => {
          const color = MASTERY_COLOR[t.masteryStatus]
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', backgroundColor: colors.light.surface, borderRadius: 8, border: `1px solid ${colors.border.light}` }}>
              <span style={{ color, fontWeight: 700, fontSize: 14, width: 16 }}>{MASTERY_ICON[t.masteryStatus]}</span>
              <div style={{ flex: 1, fontSize: 13, color: colors.text.dark }}>{t.name}</div>
              <span style={{ fontSize: 11, color, fontWeight: 600 }}>{MASTERY_LABEL[t.masteryStatus]}</span>
            </div>
          )
        })}
      </div>

      {/* Active quests */}
      {quests.length > 0 && (
        <>
          <div style={P.sectionLabel}>Quêtes actives ({quests.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {quests.map(q => {
              const pct = q.target_value > 0 ? Math.round((q.current_value / q.target_value) * 100) : 0
              return (
                <div key={q.id} style={{ ...P.card }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark }}>
                      {q.quest_definitions?.name ?? 'Quête'}
                    </div>
                    <div style={{ fontSize: 12, color: colors.accent.gold, fontWeight: 700 }}>
                      {q.current_value}/{q.target_value}
                    </div>
                  </div>
                  <div style={{ height: 4, backgroundColor: colors.light.muted, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: colors.accent.gold, borderRadius: 2 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab: Administratif ───────────────────────────────────────────────────────

function TabAdministratif({ profile }: { profile: AdminPlayerProfile }) {
  const INVITE_LABEL: Record<string, string> = {
    not_invited: 'Non invité', invited: 'Invité', active: 'Actif',
  }
  const INVITE_COLOR: Record<string, string> = {
    not_invited: colors.text.muted, invited: colors.status.attention, active: colors.status.present,
  }
  const STATUS_LABEL_ADMIN: Record<string, string> = {
    pending: 'En attente', active: 'Actif', suspended: 'Suspendu', deleted: 'Supprimé',
  }

  const field = (label: string, value: string | null | undefined) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: value ? colors.text.dark : colors.text.muted, fontStyle: value ? 'normal' : 'italic' }}>{value || '—'}</div>
    </div>
  )

  return (
    <div>
      {/* Compte */}
      <div style={{ ...P.card, marginBottom: 16 }}>
        <div style={P.cardTitle}>Compte</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {field('Email', profile.email)}
          {field('Téléphone', profile.phone)}
          {field('Statut compte', STATUS_LABEL_ADMIN[profile.status] ?? profile.status)}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Invitation</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: INVITE_COLOR[profile.inviteStatus] ?? colors.text.muted, padding: '3px 8px', borderRadius: 5, border: `1px solid ${(INVITE_COLOR[profile.inviteStatus] ?? colors.text.muted) + '40'}`, backgroundColor: (INVITE_COLOR[profile.inviteStatus] ?? colors.text.muted) + '12' }}>
              {INVITE_LABEL[profile.inviteStatus] ?? profile.inviteStatus}
            </span>
          </div>
          {field('Créé le', profile.createdAt ? fmtFull(profile.createdAt) : null)}
          {field('Dernière connexion', profile.lastSignInAt ? fmtFull(profile.lastSignInAt) : null)}
        </div>
        {profile.internalNotes && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notes internes</div>
            <div style={{ fontSize: 13, color: colors.text.dark, backgroundColor: colors.light.muted, borderRadius: 6, padding: '10px 12px', lineHeight: 1.5 }}>
              {profile.internalNotes}
            </div>
          </div>
        )}
      </div>

      {/* Parent 1 */}
      {(profile.parentFirstName || profile.parentEmail) && (
        <div style={{ ...P.card, marginBottom: 16 }}>
          <div style={P.cardTitle}>Parent / Contact 1</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {field('Prénom', profile.parentFirstName)}
            {field('Nom', profile.parentLastName)}
            {field('Email', profile.parentEmail)}
            {field('Téléphone', profile.parentPhone)}
          </div>
        </div>
      )}

      {/* Parent 2 */}
      {(profile.parent2FirstName || profile.parent2Email) && (
        <div style={{ ...P.card, marginBottom: 16 }}>
          <div style={P.cardTitle}>Parent / Contact 2</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {field('Prénom', profile.parent2FirstName)}
            {field('Nom', profile.parent2LastName)}
            {field('Email', profile.parent2Email)}
            {field('Téléphone', profile.parent2Phone)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlayerPage() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>()
  const router       = useRouter()

  const [profile,     setProfile]     = useState<AdminPlayerProfile | null>(null)
  const [academySt,   setAcademySt]   = useState<string | null>(null)
  const [activeTab,   setActiveTab]   = useState<TabId>('presences')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, academyRes] = await Promise.all([
          getAdminPlayerProfile(playerId),
          getChildAcademyStatus(playerId),
        ])
        setProfile(profileRes.data)
        setAcademySt((academyRes.data as { status?: string } | null)?.status ?? null)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[PlayerPage] load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [playerId])

  if (loading) {
    return (
      <div style={P.page}>
        <style>{`@keyframes cp{0%,100%{opacity:.15}50%{opacity:.42}} .cs{background:${colors.light.muted};border-radius:8px;animation:cp 1.8s ease-in-out infinite}`}</style>
        <div className="cs" style={{ height: 14, width: 80, marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div className="cs" style={{ width: 60, height: 60, borderRadius: 30 }} />
          <div>
            <div className="cs" style={{ height: 28, width: 200, marginBottom: 8 }} />
            <div className="cs" style={{ height: 14, width: 140 }} />
          </div>
        </div>
        <div className="cs" style={{ height: 44, marginBottom: 20 }} />
        <div className="cs" style={{ height: 200, borderRadius: 12 }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={P.page}>
        <button style={P.back} onClick={() => router.back()}>← Retour</button>
        <div style={{ color: colors.text.muted }}>Joueur introuvable.</div>
      </div>
    )
  }

  const initial      = profile.displayName.charAt(0).toUpperCase() || '?'
  const accountColor = profile.status === 'active' ? colors.status.present : profile.status === 'suspended' ? colors.status.absent : colors.text.muted

  return (
    <div style={P.page}>
      <style>{`.tab-btn:hover{color:${colors.accent.gold}} .back-btn:hover{color:${colors.accent.gold}}`}</style>

      {/* Back */}
      <button className="back-btn" style={P.back} onClick={() => router.back()}>
        ← Présences
      </button>

      {/* ── Hero ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent.gold + '22', border: `2px solid ${colors.accent.gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: colors.text.dark, flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', margin: 0, color: colors.text.dark }}>
              {profile.displayName}
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, color: accountColor, padding: '3px 8px', borderRadius: 5, border: `1px solid ${accountColor + '40'}`, backgroundColor: accountColor + '12' }}>
              {profile.status}
            </span>
            {academySt && (
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.accent.gold, padding: '3px 8px', borderRadius: 5, border: `1px solid ${colors.accent.gold}40`, backgroundColor: colors.accent.gold + '12' }}>
                {academySt}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            {profile.groupName && (
              <div style={{ fontSize: 12, color: colors.text.muted }}>{profile.groupName}</div>
            )}
            {profile.implantationName && (
              <div style={{ fontSize: 12, color: colors.accent.gold, padding: '1px 7px', borderRadius: 4, border: `1px solid ${colors.accent.gold}30`, backgroundColor: colors.accent.gold + '10' }}>
                {profile.implantationName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Info chips ── */}
      {(profile.birthDate || profile.strongFoot || profile.ageCategory || profile.currentClub) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {profile.birthDate && (
            <span style={P.chip}>{fmtFull(profile.birthDate)}</span>
          )}
          {profile.ageCategory && (
            <span style={P.chip}>{profile.ageCategory}</span>
          )}
          {profile.strongFoot && (
            <span style={P.chip}>Pied {profile.strongFoot === 'right' ? 'droit' : profile.strongFoot === 'left' ? 'gauche' : 'ambidextre'}</span>
          )}
          {profile.currentClub && (
            <span style={P.chip}>{profile.currentClub}</span>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className="tab-btn"
            style={{
              padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              color: activeTab === tab.id ? colors.accent.gold : colors.text.muted,
              borderBottom: `2px solid ${activeTab === tab.id ? colors.accent.gold : 'transparent'}`,
              transition: 'color 0.15s',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'presences'     && <TabPresences     playerId={playerId} />}
      {activeTab === 'evaluations'   && <TabEvaluations   playerId={playerId} />}
      {activeTab === 'progression'   && <TabProgression   playerId={playerId} />}
      {activeTab === 'administratif' && <TabAdministratif profile={profile}   />}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const P: Record<string, React.CSSProperties> = {
  page    : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 860 },
  back    : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, transition: 'color 0.15s' },
  kpiRow  : { display: 'flex', backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, overflow: 'hidden' },
  kpi     : { flex: 1, padding: '14px 0', textAlign: 'center', borderRight: `1px solid ${colors.border.light}` },
  kpiLabel: { fontSize: 10, color: colors.text.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 },
  card    : { backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, padding: '14px 16px' },
  cardTitle: { fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  listRow : { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: colors.light.surface, borderRadius: '0 8px 8px 0', padding: '10px 12px', border: `1px solid ${colors.border.light}` },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  chip    : { fontSize: 12, color: colors.text.dark, padding: '4px 10px', borderRadius: 20, backgroundColor: colors.light.muted, border: `1px solid ${colors.border.light}` },
  tabLoading: { color: colors.text.muted, fontSize: 14 },
}
