'use client'
// Story 32.2 — Métriques qualité coach (vue admin)
// Story 59-5 — Quêtes hebdomadaires coaches
// Story 97.6 — AdminPageHeader v2 (titre = nom dynamique du coach)
// Taux de remplissage débrief, taux de présence, délai moyen
import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { getCoachQualityMetrics, getProfileDisplayName, listGroupsByCoach, getCoachWeeklyQuests, assignCoachWeeklyQuests, getCoachSessionStats, listCoachRecentSessions } from '@aureak/api-client'
import type { CoachGroupEntry, CoachSessionStats, CoachRecentSession } from '@aureak/api-client'
import type { CoachQualityMetrics, CoachQuestWithDefinition } from '@aureak/types'
import { colors, shadows, radius, transitions, gamification } from '@aureak/theme'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'

function MetricTile({
  label, value, unit = '', note,
}: {
  label : string
  value : number | null
  unit? : string
  note? : string
}) {
  const display = value == null ? '—' : `${value}${unit}`
  const isGood  = value != null && unit === '%' && value >= 80
  const isWarn  = value != null && unit === '%' && value >= 60 && value < 80
  const isBad   = value != null && unit === '%' && value < 60
  const color   = unit === '%'
    ? (isGood ? colors.status.present : isWarn ? colors.status.attention : isBad ? colors.status.absent : colors.text.dark)
    : colors.text.dark

  return (
    <div style={{
      background   : colors.light.surface,
      borderRadius : radius.card,
      padding      : '16px 20px',
      boxShadow    : shadows.sm,
      border       : `1px solid ${colors.border.divider}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: 0.5 }}>
        {display}
      </div>
      {note && (
        <div style={{ fontSize: 11, color: colors.text.subtle, marginTop: 4 }}>
          {note}
        </div>
      )}
    </div>
  )
}

export default function CoachQualityPage() {
  const { coachId } = useLocalSearchParams<{ coachId: string }>()
  const [metrics,        setMetrics]        = useState<CoachQualityMetrics | null>(null)
  const [coachName,      setCoachName]      = useState<string>('')
  const [groups,         setGroups]         = useState<CoachGroupEntry[]>([])
  const [loading,        setLoading]        = useState(true)

  // Story 59-5 — Quêtes coaches
  const [coachQuests,    setCoachQuests]    = useState<CoachQuestWithDefinition[]>([])
  const [loadingQuests,  setLoadingQuests]  = useState(true)

  // Story 69-8 — Onglet Activité
  const [activeTab,        setActiveTab]        = useState<'qualite' | 'activite'>('qualite')
  const [sessionStats,     setSessionStats]     = useState<CoachSessionStats | null>(null)
  const [recentSessions,   setRecentSessions]   = useState<CoachRecentSession[]>([])
  const [loadingActivite,  setLoadingActivite]  = useState(false)
  const [activiteLoaded,   setActiviteLoaded]   = useState(false)
  const [assigningQuests, setAssigningQuests] = useState(false)

  useEffect(() => {
    setLoading(true)
    try {
      Promise.all([
        getCoachQualityMetrics(coachId),
        getProfileDisplayName(coachId),
        listGroupsByCoach(coachId),
      ]).then(([metricsRes, nameRes, groupsRes]) => {
        setMetrics(metricsRes.data)
        setCoachName(nameRes.data ?? coachId)
        setGroups(groupsRes)
      }).catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[CoachQualityPage] load error:', err)
      }).finally(() => setLoading(false))
    } finally {
      // setLoading géré dans .finally() ci-dessus — pattern try/finally requis
    }
  }, [coachId])

  // Story 59-5 — Chargement quêtes de la semaine
  useEffect(() => {
    setLoadingQuests(true)
    ;(async () => {
      try {
        const { data, error } = await getCoachWeeklyQuests(coachId)
        if (error) {
          if (process.env.NODE_ENV !== 'production') console.error('[CoachQualityPage] quests error:', error)
        }
        setCoachQuests(data ?? [])
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[CoachQualityPage] quests exception:', err)
      } finally {
        setLoadingQuests(false)
      }
    })()
  }, [coachId])

  async function loadActivite() {
    if (activiteLoaded) return
    setLoadingActivite(true)
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        getCoachSessionStats(coachId),
        listCoachRecentSessions(coachId, 10),
      ])
      if (statsRes.error) {
        if (process.env.NODE_ENV !== 'production') console.error('[CoachQualityPage] sessionStats error:', statsRes.error)
      }
      setSessionStats(statsRes.data)
      setRecentSessions(sessionsRes.data)
      setActiviteLoaded(true)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CoachQualityPage] loadActivite exception:', err)
    } finally {
      setLoadingActivite(false)
    }
  }

  async function handleAssignQuests() {
    setAssigningQuests(true)
    try {
      const { error } = await assignCoachWeeklyQuests(coachId)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[CoachQualityPage] assign quests error:', error)
        return
      }
      // Recharger les quêtes
      const { data } = await getCoachWeeklyQuests(coachId)
      setCoachQuests(data ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[CoachQualityPage] assign quests exception:', err)
    } finally {
      setAssigningQuests(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Story 97.6 — AdminPageHeader v2 avec titre dynamique (nom du coach) */}
      <AdminPageHeader title={coachName || 'Coach'} />

      <div style={{ padding: '0 32px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
        <a href='/academie/coachs' style={{ fontSize: 12, color: colors.accent.gold, textDecorationLine: 'none' }}>
          Coachs
        </a>
        <span style={{ color: colors.text.subtle, fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: colors.text.muted }}>Métriques qualité</span>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.text.muted }}>
        Données non publiques — usage interne uniquement.
      </p>

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.divider}`, marginBottom: 24 }}>
        {([
          { key: 'qualite',  label: 'Qualité' },
          { key: 'activite', label: 'Activité' },
        ] as const).map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key === 'activite') loadActivite() }}
              style={{
                padding      : '8px 20px',
                background   : 'none',
                border       : 'none',
                borderBottom : isActive ? `2px solid ${colors.accent.gold}` : '2px solid transparent',
                fontSize     : 13,
                fontWeight   : isActive ? 700 : 400,
                color        : isActive ? colors.accent.gold : colors.text.muted,
                cursor       : 'pointer',
                marginBottom : -1,
                transition   : `all ${transitions.fast}`,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Onglet Activité ── */}
      {activeTab === 'activite' && (
        <div>
          {loadingActivite ? (
            <div style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</div>
          ) : (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Séances animées',   value: sessionStats?.sessionsCount    ?? 0 },
                  { label: 'Présence moyenne',   value: sessionStats?.avgPresencePct != null ? `${Math.round(sessionStats.avgPresencePct)}%` : '—' },
                  { label: 'Évaluations saisies', value: sessionStats?.evaluationsCount ?? 0 },
                ].map(card => (
                  <div key={card.label} style={{ background: colors.light.surface, borderRadius: radius.card, padding: '16px 20px', boxShadow: shadows.sm, border: `1px solid ${colors.border.divider}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: colors.text.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{card.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: colors.text.dark }}>{card.value}</div>
                  </div>
                ))}
              </div>

              {/* Liste séances récentes */}
              <div style={{ background: colors.light.surface, borderRadius: radius.card, boxShadow: shadows.sm, border: `1px solid ${colors.border.divider}` }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border.divider}`, fontSize: 14, fontWeight: 700, color: colors.text.dark }}>
                  10 dernières séances
                </div>
                {recentSessions.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: colors.text.muted, fontSize: 13 }}>
                    Aucune séance animée pour ce coach.
                  </div>
                ) : recentSessions.map(s => (
                  <a
                    key={s.id}
                    href={`/activites/seances/${s.id}`}
                    style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${colors.border.divider}`, textDecorationLine: 'none', gap: 16 }}
                  >
                    <span style={{ fontSize: 12, color: colors.text.muted, minWidth: 80 }}>
                      {new Date(s.scheduledAt).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: colors.text.dark }}>
                      {s.groupName ?? '—'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.status === 'clotured' ? colors.status.present : colors.text.muted }}>
                      {s.status}
                    </span>
                    <span style={{ fontSize: 12, color: colors.accent.gold }}>→</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Onglet Qualité (contenu existant) ── */}
      {activeTab === 'qualite' && (loading ? (
        <div style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</div>
      ) : !metrics ? (
        <div style={{
          textAlign    : 'center',
          padding      : 40,
          background   : colors.light.surface,
          borderRadius : radius.card,
          border       : `1px dashed ${colors.border.divider}`,
          color        : colors.text.muted,
        }}>
          Aucune donnée disponible pour ce coach.
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div style={{
            display             : 'grid',
            gridTemplateColumns : 'repeat(auto-fill, minmax(180px, 1fr))',
            gap                 : 12,
            marginBottom        : 24,
          }}>
            <MetricTile
              label='Taux débrief'
              value={metrics.debriefFillRate}
              unit='%'
              note={`${metrics.debriefsFilled} / ${metrics.sessionsDone} séances`}
            />
            <MetricTile
              label='Taux présence'
              value={metrics.presenceRate}
              unit='%'
              note={`${metrics.sessionsDone} animées sur ${metrics.totalSessions}`}
            />
            <MetricTile
              label='Délai débrief moyen'
              value={metrics.avgDebriefDelayHours != null
                ? Math.round(metrics.avgDebriefDelayHours * 10) / 10
                : null}
              unit='h'
              note='Après fin de séance'
            />
            <MetricTile
              label='Débriefs manquants'
              value={metrics.debriefsMissing}
              note='Séances sans débrief rempli'
            />
          </div>

          {/* Detail table */}
          <div style={{
            background   : colors.light.surface,
            borderRadius : radius.card,
            padding      : 20,
            boxShadow    : shadows.sm,
            border       : `1px solid ${colors.border.divider}`,
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: colors.text.dark }}>
              Détail
            </h2>
            {[
              ['Séances totales',          String(metrics.totalSessions)],
              ['Séances réalisées',        String(metrics.sessionsDone)],
              ['Débriefs remplis',         String(metrics.debriefsFilled)],
              ['Débriefs manquants',       String(metrics.debriefsMissing)],
              ['Taux de remplissage',      metrics.debriefFillRate != null ? `${metrics.debriefFillRate}%` : '—'],
              ['Taux de présence',         metrics.presenceRate != null ? `${metrics.presenceRate}%` : '—'],
              ['Délai moyen débrief',      metrics.avgDebriefDelayHours != null ? `${Math.round(metrics.avgDebriefDelayHours * 10) / 10}h` : '—'],
            ].map(([label, value], i) => (
              <div
                key={label}
                style={{
                  display        : 'flex',
                  justifyContent : 'space-between',
                  alignItems     : 'center',
                  padding        : '8px 0',
                  borderTop      : i > 0 ? `1px solid ${colors.border.divider}` : undefined,
                }}
              >
                <span style={{ fontSize: 13, color: colors.text.muted }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark }}>{value}</span>
              </div>
            ))}
          </div>
        </>
      ))}

      {/* ── Historique des groupes ── */}
      <div style={{ marginTop: 32, display: activeTab === 'qualite' ? undefined : 'none' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: colors.text.dark }}>
          Historique des groupes
        </h2>
        {loading ? (
          <div style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</div>
        ) : groups.length === 0 ? (
          <div style={{
            padding: 20, textAlign: 'center',
            background: colors.light.surface, borderRadius: radius.card,
            border: `1px dashed ${colors.border.divider}`, color: colors.text.muted, fontSize: 13,
          }}>
            Aucun groupe associé à ce coach.
          </div>
        ) : (
          <div style={{ background: colors.light.surface, borderRadius: radius.card, boxShadow: shadows.sm, border: `1px solid ${colors.border.divider}`, overflow: 'hidden' }}>
            {groups.map((g, i) => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                borderTop: i > 0 ? `1px solid ${colors.border.divider}` : undefined,
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text.dark }}>{g.groupName}</span>
                  {g.implantationName && (
                    <span style={{ fontSize: 12, color: colors.text.muted, marginLeft: 8 }}>— {g.implantationName}</span>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: g.role === 'principal' ? colors.accent.gold : colors.text.muted,
                  background: g.role === 'principal' ? colors.accent.gold + '18' : colors.light.muted,
                  padding: '2px 8px', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {g.role}
                </span>
                <span style={{ fontSize: 11, color: colors.text.subtle }}>
                  {new Date(g.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quêtes de la semaine (Story 59-5) ── */}
      <div style={{ marginTop: 32, display: activeTab === 'qualite' ? undefined : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text.dark }}>
            Quêtes de la semaine
          </h2>
          <button
            onClick={handleAssignQuests}
            disabled={assigningQuests}
            style={{
              padding      : '6px 12px',
              background   : assigningQuests ? colors.light.muted : colors.accent.gold,
              color        : assigningQuests ? colors.text.muted : '#fff',
              border       : 'none',
              borderRadius : radius.xs,
              fontSize     : 12,
              fontWeight   : 600,
              cursor       : assigningQuests ? 'not-allowed' : 'pointer',
              transition   : `all ${transitions.fast}`,
            }}
          >
            {assigningQuests ? 'Assignation…' : '+ Assigner quêtes semaine'}
          </button>
        </div>

        {loadingQuests ? (
          <div style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</div>
        ) : coachQuests.length === 0 ? (
          <div style={{
            padding: 20, textAlign: 'center',
            background: colors.light.surface, borderRadius: radius.card,
            border: `1px dashed ${colors.border.divider}`, color: colors.text.muted, fontSize: 13,
          }}>
            Aucune quête assignée cette semaine. Cliquez sur "+ Assigner quêtes semaine" pour en créer.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coachQuests.map(quest => {
              const pct     = Math.min(100, quest.targetValue > 0 ? Math.round((quest.currentValue / quest.targetValue) * 100) : 0)
              const isDone  = quest.status === 'completed'
              const isExp   = quest.status === 'expired'
              const statusIcon = isDone ? '✓' : isExp ? '✗' : '⏳'
              const statusColor = isDone ? colors.status.success : isExp ? colors.accent.red : colors.status.info

              return (
                <div
                  key={quest.id}
                  style={{
                    background   : colors.light.surface,
                    borderRadius : radius.card,
                    padding      : '14px 16px',
                    boxShadow    : shadows.sm,
                    border       : `1px solid ${isDone ? colors.status.success + '44' : colors.border.divider}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16, color: statusColor }}>{statusIcon}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.text.dark }}>
                      {quest.questDefinition?.name ?? quest.questDefinitionId}
                    </span>
                    <span style={{ fontSize: 11, color: colors.text.subtle }}>
                      {quest.currentValue} / {quest.targetValue}
                    </span>
                    {quest.questDefinition?.xpReward && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: colors.accent.gold }}>
                        +{quest.questDefinition.xpReward} XP
                      </span>
                    )}
                  </div>

                  {/* Barre de progression */}
                  <div style={{
                    height      : gamification.xp.barHeight,
                    borderRadius: gamification.xp.barRadius,
                    background  : gamification.xp.trackColor,
                    overflow    : 'hidden',
                  }}>
                    <div style={{
                      height      : '100%',
                      width       : `${pct}%`,
                      borderRadius: gamification.xp.barRadius,
                      background  : isDone ? colors.status.success : gamification.xp.fillColor,
                      transition  : `width 0.4s ease`,
                    }} />
                  </div>

                  {quest.questDefinition?.description && (
                    <div style={{ fontSize: 11, color: colors.text.subtle, marginTop: 6 }}>
                      {quest.questDefinition.description}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Navigation links */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {[
          { href: `/academie/coachs/${coachId}/grade`,   label: '🎖 Grade' },
          { href: `/academie/coachs/${coachId}/contact`, label: '✉ Contact' },
        ].map(link => (
          <a
            key={link.href}
            href={link.href}
            style={{
              padding      : '7px 14px',
              background   : colors.light.muted,
              border       : `1px solid ${colors.border.divider}`,
              borderRadius : radius.xs,
              fontSize     : 12,
              color        : colors.text.muted,
              textDecorationLine: 'none',
              transition   : `all ${transitions.fast}`,
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
      </div>
    </div>
  )
}
