// Story 8.5 — Rapport quiz coach : vue agrégée maîtrise par séance
import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { getSessionLearningReport } from '@aureak/api-client'
import { colors } from '@aureak/theme'

type AttemptRow = {
  id              : string
  child_id        : string
  theme_id        : string
  mastery_status  : string | null
  mastery_percent : number | null
  questions_answered: number
  correct_count   : number
  stop_reason     : string | null
  themes          : { name: string }[] | null
}

type ThemeStat = { name: string; total: number; acquired: number }

const STOP_LABELS: Record<string, string> = {
  mastered     : 'Maîtrisé',
  child_stopped: 'Arrêté par le joueur',
  time_limit   : 'Temps écoulé',
}

export default function SessionLearningReport() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const [attempts,   setAttempts]   = useState<AttemptRow[]>([])
  const [themeStats, setThemeStats] = useState<Record<string, ThemeStat>>({})
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    getSessionLearningReport(sessionId)
      .then(({ attempts: a, themeStats: ts }) => {
        setAttempts((a ?? []) as unknown as AttemptRow[])
        setThemeStats(ts)
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return <div style={S.page}><div style={{ color: colors.text.muted, fontSize: 14 }}>Chargement...</div></div>
  }

  if (attempts.length === 0) {
    return (
      <div style={S.page}>
        <div style={{ color: colors.text.muted, fontSize: 14, fontStyle: 'italic' }}>
          Aucun quiz effectué pour cette séance.
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      {/* Synthèse par thème */}
      <section style={S.section}>
        <div style={S.sectionTitle}>Synthèse par thème</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(themeStats).map(([themeId, stat]) => {
            const pct = stat.total > 0 ? Math.round(stat.acquired / stat.total * 100) : 0
            const color = pct >= 70 ? colors.status.present : pct >= 40 ? colors.status.attention : colors.status.absent
            return (
              <div key={themeId} style={{ ...S.themeCard, borderColor: color + '40' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.text.dark, marginBottom: 4 }}>{stat.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'Rajdhani, sans-serif' }}>{pct}%</div>
                <div style={{ fontSize: 11, color: colors.text.muted }}>{stat.acquired}/{stat.total} acquis</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Détails par tentative */}
      <section style={S.section}>
        <div style={S.sectionTitle}>Détails par joueur × thème</div>
        <table style={S.table}>
          <thead>
            <tr>
              {['Joueur', 'Thème', 'Maîtrise', 'Score', 'Raison d\'arrêt'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => {
              const themeName = Array.isArray(a.themes) ? (a.themes[0]?.name ?? '—') : (a.themes as { name?: string } | null)?.name ?? '—'
              const acquired = a.mastery_status === 'acquired'
              const color    = acquired ? colors.status.present : a.mastery_status === 'not_acquired' ? colors.status.absent : colors.text.muted
              return (
                <tr key={a.id}>
                  <td style={S.td}><code style={{ fontSize: 10, color: colors.text.muted }}>{a.child_id.slice(0, 8)}…</code></td>
                  <td style={S.td}>{themeName}</td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, color, borderColor: color + '40', backgroundColor: color + '12' }}>
                      {acquired ? 'Acquis' : a.mastery_status === 'not_acquired' ? 'Non acquis' : '—'}
                      {a.mastery_percent !== null ? ` (${a.mastery_percent}%)` : ''}
                    </span>
                  </td>
                  <td style={S.td}>
                    {a.correct_count}/{a.questions_answered}
                  </td>
                  <td style={S.td} style={{ color: colors.text.muted, fontSize: 12 }}>
                    {a.stop_reason ? (STOP_LABELS[a.stop_reason] ?? a.stop_reason) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page       : { padding: '20px 24px', backgroundColor: colors.light.primary, minHeight: '100%', color: colors.text.dark },
  section    : { marginBottom: 24 },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  themeCard  : { backgroundColor: colors.light.surface, borderRadius: 8, padding: '12px 16px', border: '1px solid', minWidth: 120 },
  table      : { width: '100%', borderCollapse: 'collapse' },
  th         : { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', borderBottom: `1px solid ${colors.border.light}` },
  td         : { padding: '8px 12px', fontSize: 13, borderBottom: `1px solid ${colors.border.light}` },
  badge      : { fontSize: 11, padding: '2px 7px', borderRadius: 5, border: '1px solid', display: 'inline-block', fontWeight: 600 },
}
