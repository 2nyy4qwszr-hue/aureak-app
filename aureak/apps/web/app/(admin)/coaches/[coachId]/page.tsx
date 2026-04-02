'use client'
// Story 32.2 — Métriques qualité coach (vue admin)
// Taux de remplissage débrief, taux de présence, délai moyen
import { useEffect, useState } from 'react'
import { getCoachQualityMetrics, getProfileDisplayName } from '@aureak/api-client'
import type { CoachQualityMetrics } from '@aureak/types'
import { colors, shadows, radius, transitions } from '@aureak/theme'

type Props = { params: { coachId: string } }

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

export default function CoachQualityPage({ params }: Props) {
  const { coachId } = params
  const [metrics,   setMetrics]   = useState<CoachQualityMetrics | null>(null)
  const [coachName, setCoachName] = useState<string>('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCoachQualityMetrics(coachId),
      getProfileDisplayName(coachId),
    ]).then(([metricsRes, nameRes]) => {
      setMetrics(metricsRes.data)
      setCoachName(nameRes.data ?? coachId)
    }).finally(() => setLoading(false))
  }, [coachId])

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
        <a href='/coaches' style={{ fontSize: 12, color: colors.accent.gold, textDecoration: 'none' }}>
          Coachs
        </a>
        <span style={{ color: colors.text.subtle, fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: colors.text.muted }}>{coachName || coachId}</span>
        <span style={{ color: colors.text.subtle, fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: colors.text.muted }}>Métriques qualité</span>
      </div>

      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: colors.text.dark }}>
        Métriques qualité
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: colors.text.muted }}>
        {coachName} — données non publiques, usage interne uniquement.
      </p>

      {loading ? (
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
      )}

      {/* Navigation links */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {[
          { href: `/coaches/${coachId}/grade`,   label: '🎖 Grade' },
          { href: `/coaches/${coachId}/contact`, label: '✉ Contact' },
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
              textDecoration: 'none',
              transition   : `all ${transitions.fast}`,
            }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
