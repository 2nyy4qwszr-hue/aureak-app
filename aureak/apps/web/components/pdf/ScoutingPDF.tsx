// Story 55-7 — Export scouting PDF
// Composant react-pdf pour la fiche de scouting professionnelle A4.
// IMPORTANT : utilise les composants @react-pdf/renderer, pas React Native.
// Pas de StyleSheet RN ici — utiliser les objets de style react-pdf.

import {
  Document, Page, View, Text, Image, Svg, Path, Line, Polyline, G,
} from '@react-pdf/renderer'
import type { EvaluationPoint } from '@aureak/types'
import type { PlayerAxisAverage } from '@aureak/api-client'

// ── Couleurs hardcodées (PDF ne supporte pas les tokens dynamiques) ───────────
const GOLD         = '#C1AC5C'
const DARK         = '#1A1A1A'
const SURFACE      = '#F3EFE7'
const MUTED        = '#888888'
const RED          = '#E05252'
const GREEN        = '#10B981'
const TEXT_DARK    = '#1A1A1A'
const TEXT_MUTED   = '#666666'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScoutingPDFProps {
  playerName   : string
  birthDate    : string | null
  currentClub  : string | null
  groupName    : string | null
  season       : string | null
  photoBase64  : string | null   // data URI base64 ou null
  radarData    : PlayerAxisAverage | null
  growthData   : EvaluationPoint[]
  avgScore     : number | null
  bestScore    : number | null
  evalCount    : number
  progression  : number | null   // delta entre dernière et première note (±)
  recentEvals  : {
    date       : string
    sessionName: string | null
    score      : number
    note       : string | null
  }[]
  generatedAt  : string          // ISO
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 7.5) return GREEN
  if (s >= 5)   return GOLD
  return RED
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return iso }
}

function slugName(name: string): string {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
}

export function buildFileName(playerName: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `scouting-${slugName(playerName)}-${date}.pdf`
}

// ── Sub-composants PDF ─────────────────────────────────────────────────────────

function PDFRadar({ axes }: { axes: Record<string, number> }) {
  const keys = Object.keys(axes)
  if (keys.length === 0) return null

  const cx   = 90
  const cy   = 90
  const R    = 70
  const n    = keys.length
  const TWO_PI = 2 * Math.PI

  // Points du polygone maximal
  const polyPoints = keys.map((_, i) => {
    const angle = (TWO_PI * i) / n - Math.PI / 2
    const r = ((axes[keys[i]] ?? 0) / 10) * R
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  })

  const polyStr = polyPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Axes radiaux
  const axisLines = keys.map((_, i) => {
    const angle = (TWO_PI * i) / n - Math.PI / 2
    return {
      x1: cx,
      y1: cy,
      x2: cx + R * Math.cos(angle),
      y2: cy + R * Math.sin(angle),
      labelX: cx + (R + 12) * Math.cos(angle),
      labelY: cy + (R + 12) * Math.sin(angle),
      key: keys[i],
    }
  })

  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      {/* Cercles de référence */}
      {[0.25, 0.5, 0.75, 1].map(factor => (
        <Path
          key={factor}
          d={keys.map((_, i) => {
            const angle = (TWO_PI * i) / n - Math.PI / 2
            const r = factor * R
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            return (i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`)
          }).join(' ') + 'Z'}
          fill="none"
          stroke="#CCCCCC"
          strokeWidth={0.5}
        />
      ))}
      {/* Lignes axes */}
      {axisLines.map(a => (
        <Line key={a.key} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#CCCCCC" strokeWidth={0.5} />
      ))}
      {/* Polygone joueur */}
      <Polyline points={polyStr} fill={GOLD + '40'} stroke={GOLD} strokeWidth={1.5} />
      {/* Labels axes */}
      {axisLines.map(a => (
        <G key={'label-' + a.key}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Text
            style={{ fontSize: 6 }}
            {...({
              fill      : TEXT_MUTED,
              textAnchor: 'middle',
              x         : a.labelX,
              y         : a.labelY + 2,
            } as any)}
          >
            {a.key}
          </Text>
        </G>
      ))}
    </Svg>
  )
}

function PDFTimeline({ data }: { data: EvaluationPoint[] }) {
  if (data.length < 2) return null

  const width  = 340
  const height = 80
  const pad    = { left: 24, right: 8, top: 8, bottom: 16 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const scores = data.map(d => d.score)
  const minS   = Math.min(...scores)
  const maxS   = Math.max(...scores)
  const range  = maxS - minS || 1

  const pts = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * innerW,
    y: pad.top + innerH - ((d.score - minS) / range) * innerH,
  }))

  const lineStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Ligne */}
      <Path d={lineStr} fill="none" stroke={GOLD} strokeWidth={1.5} />
      {/* Points */}
      {pts.map((p, i) => (
        <Path
          key={i}
          d={`M${(p.x - 2).toFixed(1)},${p.y.toFixed(1)} a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0`}
          fill={scoreColor(data[i]?.score ?? 0)}
        />
      ))}
      {/* Axe X — dates tous les 2 points */}
      {data.filter((_, i) => i % 2 === 0).map((d, idx) => {
        const realIdx = idx * 2
        const p = pts[realIdx]
        if (!p) return null
        const dateLabel = fmtDate(d.date).slice(0, 5)  // DD/MM
        return (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Text
            key={idx}
            style={{ fontSize: 5 }}
            {...({ fill: TEXT_MUTED, x: p.x - 6, y: height - 2 } as any)}
          >
            {dateLabel}
          </Text>
        )
      })}
    </Svg>
  )
}

// ── Document principal ─────────────────────────────────────────────────────────

export function ScoutingPDF(props: ScoutingPDFProps) {
  const {
    playerName, birthDate, currentClub, groupName, season,
    photoBase64, radarData, growthData,
    avgScore, bestScore, evalCount, progression,
    recentEvals, generatedAt,
  } = props

  const genDate = fmtDate(generatedAt)
  const initials = playerName
    .split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')

  return (
    <Document title={`Scouting — ${playerName}`} author="Aureak Academy">
      {/* ── PAGE 1 ── */}
      <Page size="A4" orientation="portrait" style={{ fontFamily: 'Helvetica', backgroundColor: SURFACE }}>

        {/* Header doré */}
        <View style={{
          backgroundColor: DARK,
          borderBottom   : `3px solid ${GOLD}`,
          padding        : 20,
          flexDirection  : 'row',
          alignItems     : 'center',
          gap            : 16,
        }}>
          {/* Photo ou initiales */}
          <View style={{
            width           : 70, height: 70, borderRadius: 35,
            backgroundColor : GOLD + '30',
            borderWidth     : 2, borderColor: GOLD,
            alignItems      : 'center', justifyContent: 'center',
            overflow        : 'hidden',
          }}>
            {photoBase64
              ? <Image src={photoBase64} style={{ width: 70, height: 70, objectFit: 'cover' }} />
              : <Text style={{ fontSize: 22, color: GOLD, fontFamily: 'Helvetica-Bold' }}>{initials}</Text>
            }
          </View>

          {/* Infos joueur */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, color: GOLD, fontFamily: 'Helvetica-Bold', letterSpacing: 1 }}>
              {playerName}
            </Text>
            {birthDate && (
              <Text style={{ fontSize: 9, color: '#AAAAAA', marginTop: 2 }}>
                Né le {fmtDate(birthDate)}
              </Text>
            )}
            {currentClub && (
              <Text style={{ fontSize: 9, color: '#AAAAAA' }}>Club : {currentClub}</Text>
            )}
          </View>

          {/* Date + badge Aureak */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, color: GOLD, fontFamily: 'Helvetica-Bold' }}>AUREAK</Text>
            <Text style={{ fontSize: 7, color: '#AAAAAA', marginTop: 4 }}>Fiche Scouting</Text>
            <Text style={{ fontSize: 7, color: '#AAAAAA' }}>{genDate}</Text>
          </View>
        </View>

        {/* Méta données */}
        <View style={{ flexDirection: 'row', gap: 8, padding: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Groupe',   value: groupName   ?? '—' },
            { label: 'Saison',   value: season      ?? '—' },
            { label: 'Évals',    value: String(evalCount)  },
            { label: 'Moy.',     value: avgScore  !== null ? avgScore.toFixed(1)  : '—' },
            { label: 'Record',   value: bestScore !== null ? bestScore.toFixed(1) : '—' },
            { label: 'Tendance', value: progression !== null ? (progression >= 0 ? `+${progression.toFixed(1)}` : progression.toFixed(1)) : '—' },
          ].map(m => (
            <View key={m.label} style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 6, padding: 8,
              borderWidth: 1, borderColor: '#E0D8CC',
              minWidth: 70, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 7, color: TEXT_MUTED, marginBottom: 2 }}>{m.label}</Text>
              <Text style={{ fontSize: 13, color: TEXT_DARK, fontFamily: 'Helvetica-Bold' }}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Sections radar + timeline */}
        <View style={{ flexDirection: 'row', padding: 16, gap: 16 }}>
          {/* Radar */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: TEXT_MUTED, fontFamily: 'Helvetica-Bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Profil technique
            </Text>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E0D8CC' }}>
              {radarData && Object.keys(radarData.axes).length > 0
                ? <PDFRadar axes={radarData.axes} />
                : <Text style={{ fontSize: 9, color: TEXT_MUTED }}>Données insuffisantes</Text>
              }
            </View>
          </View>

          {/* Timeline */}
          <View style={{ flex: 1.8 }}>
            <Text style={{ fontSize: 9, color: TEXT_MUTED, fontFamily: 'Helvetica-Bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Progression (10 dernières séances)
            </Text>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#E0D8CC' }}>
              {growthData.length >= 2
                ? <PDFTimeline data={growthData} />
                : <Text style={{ fontSize: 9, color: TEXT_MUTED }}>Données insuffisantes</Text>
              }
            </View>
          </View>
        </View>

        {/* Tableau évaluations récentes */}
        {recentEvals.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 9, color: TEXT_MUTED, fontFamily: 'Helvetica-Bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Évaluations récentes
            </Text>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E0D8CC' }}>
              {/* Header tableau */}
              <View style={{ flexDirection: 'row', backgroundColor: DARK, padding: '6 10' }}>
                {['Date', 'Séance', 'Note', 'Commentaire'].map(h => (
                  <Text key={h} style={{
                    flex       : h === 'Commentaire' ? 2 : 1,
                    fontSize   : 7, color: '#AAAAAA',
                    fontFamily : 'Helvetica-Bold', textTransform: 'uppercase',
                  }}>{h}</Text>
                ))}
              </View>
              {/* Lignes */}
              {recentEvals.slice(0, 10).map((ev, i) => (
                <View key={i} style={{
                  flexDirection  : 'row',
                  padding        : '5 10',
                  backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F8F5F0',
                  borderTopWidth : i === 0 ? 0 : 1,
                  borderTopColor : '#E0D8CC',
                }}>
                  <Text style={{ flex: 1, fontSize: 7, color: TEXT_DARK }}>{fmtDate(ev.date)}</Text>
                  <Text style={{ flex: 1, fontSize: 7, color: TEXT_DARK }}>{ev.sessionName ?? '—'}</Text>
                  <Text style={{ flex: 1, fontSize: 8, color: scoreColor(ev.score), fontFamily: 'Helvetica-Bold' }}>
                    {ev.score.toFixed(1)}
                  </Text>
                  <Text style={{ flex: 2, fontSize: 7, color: TEXT_MUTED }}>{ev.note ?? '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={{
          position: 'absolute', bottom: 16, left: 0, right: 0,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 7, color: TEXT_MUTED }}>
            Document confidentiel — Aureak Academy · {genDate}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
