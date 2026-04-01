'use client'
// Liste complète des séances du coach — avec création + annulation inline
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { listSessionsByCoach, cancelSessionRpc } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'
import type { Session } from '@aureak/types'

// ── helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL: Record<string, string> = {
  planifiée: 'Planifiée',
  en_cours : 'En cours',
  terminée : 'Terminée',
  réalisée : 'Réalisée',  // Story 13.3 — clôture coach explicite
  annulée  : 'Annulée',
}
const STATUS_COLOR: Record<string, string> = {
  planifiée: colors.accent.gold,
  en_cours : colors.status.present,
  terminée : colors.text.muted,
  réalisée : colors.status.present,  // même couleur que "présent" (succès)
  annulée  : colors.status.absent,
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={S.page}>
      <style>{`@keyframes sl-p{0%,100%{opacity:.15}50%{opacity:.4}} .sl{background:${colors.light.muted};border-radius:6px;animation:sl-p 1.8s ease-in-out infinite}`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="sl" style={{ height: 28, width: 160 }} />
        <div className="sl" style={{ height: 36, width: 140, borderRadius: 7 }} />
      </div>
      <div className="sl" style={{ height: 40, width: '100%', borderRadius: 24, marginBottom: 20 }} />
      {[0,1,2,3,4].map(i => (
        <div key={i} className="sl" style={{ height: 72, borderRadius: 10, marginBottom: 10 }} />
      ))}
    </div>
  )
}

type FilterKey = 'all' | 'planifiée' | 'en_cours' | 'terminée'

export default function CoachSessionsPage() {
  const router = useRouter()
  const user   = useAuthStore(s => s.user)

  const [sessions,      setSessions]      = useState<Session[]>([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState<FilterKey>('all')
  const [cancelId,      setCancelId]      = useState<string | null>(null)
  const [cancelReason,  setCancelReason]  = useState('')
  const [cancelling,    setCancelling]    = useState(false)

  const load = async () => {
    if (!user?.id) return
    try {
      const { data } = await listSessionsByCoach(user.id)
      setSessions((data ?? []).sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id])

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    try {
      await cancelSessionRpc(cancelId, cancelReason.trim() || 'Annulée par le coach')
      setCancelId(null)
      setCancelReason('')
      setLoading(true)
      load()
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <Skeleton />

  const counts = {
    all      : sessions.length,
    planifiée: sessions.filter(s => s.status === 'planifiée').length,
    en_cours : sessions.filter(s => s.status === 'en_cours').length,
    terminée : sessions.filter(s => s.status === 'terminée').length,
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all',       label: `Toutes (${counts.all})`         },
    { key: 'planifiée', label: `À venir (${counts.planifiée})`   },
    { key: 'en_cours',  label: `En cours (${counts.en_cours})`   },
    { key: 'terminée',  label: `Terminées (${counts.terminée})`  },
  ]

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)

  return (
    <div style={S.page}>
      <style>{`
        .sl-btn:hover{opacity:.85}
        .sl-row:hover{background:rgba(255,255,255,0.025)}
        .sl-tab:hover{border-color:${colors.accent.gold}!important}
        .sl-inp:focus{outline:none;border-color:${colors.accent.gold}!important}
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>Mes séances</h1>
        <button
          className="sl-btn"
          style={S.btnNew}
          onClick={() => router.push('/coach/sessions/new' as never)}
        >
          + Nouvelle séance
        </button>
      </div>

      {/* Filter pills */}
      <div style={S.filters}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className="sl-tab"
            style={{
              ...S.filterBtn,
              borderColor    : filter === f.key ? colors.accent.gold : colors.border.light,
              color          : filter === f.key ? colors.text.dark : colors.text.muted,
              fontWeight     : filter === f.key ? 700 : 400,
              backgroundColor: filter === f.key ? colors.accent.gold + '18' : 'transparent',
            }}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, color: colors.text.muted }}>Aucune séance dans ce filtre</div>
          <button
            className="sl-btn"
            style={{ ...S.btnNew, marginTop: 16 }}
            onClick={() => router.push('/coach/sessions/new' as never)}
          >
            + Créer une séance
          </button>
        </div>
      ) : (
        <div style={S.list}>
          {filtered.map(session => {
            const d      = new Date(session.scheduledAt)
            const color  = STATUS_COLOR[session.status] ?? colors.text.muted
            const isOpen = cancelId === session.id
            return (
              <div
                key={session.id}
                className="sl-row"
                style={{ ...S.card, borderLeft: `3px solid ${color}` }}
              >
                {/* Main row */}
                <div style={S.cardBody}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: colors.text.dark }}>
                        {fmtDate(d)}
                      </span>
                      <span style={{ fontSize: 13, color: colors.text.muted }}>{fmtTime(d)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: colors.text.muted }}>
                      {session.durationMinutes} min
                      {session.location ? ` · ${session.location}` : ''}
                    </div>
                  </div>

                  <div style={S.cardRight}>
                    <span style={{ ...S.statusBadge, color, borderColor: color + '40', backgroundColor: color + '12' }}>
                      {STATUS_LABEL[session.status] ?? session.status}
                    </span>
                    <div style={S.actionBtns}>
                      {(session.status === 'planifiée' || session.status === 'en_cours') && (
                        <>
                          <button
                            className="sl-btn"
                            style={S.actBtn}
                            onClick={() => router.push(`/coach/sessions/${session.id}/attendance` as never)}
                          >
                            Présences
                          </button>
                          <button
                            className="sl-btn"
                            style={S.actBtn}
                            onClick={() => router.push(`/coach/sessions/${session.id}/evaluations` as never)}
                          >
                            Évals
                          </button>
                          <button
                            className="sl-btn"
                            style={{ ...S.actBtn, color: colors.status.absent, borderColor: colors.status.absent + '50' }}
                            onClick={() => setCancelId(isOpen ? null : session.id)}
                          >
                            {isOpen ? '✕' : 'Annuler'}
                          </button>
                        </>
                      )}
                      {session.status === 'terminée' && (
                        <>
                          <button
                            className="sl-btn"
                            style={S.actBtn}
                            onClick={() => router.push(`/coach/sessions/${session.id}/attendance` as never)}
                          >
                            Présences
                          </button>
                          <button
                            className="sl-btn"
                            style={S.actBtn}
                            onClick={() => router.push(`/coach/sessions/${session.id}/evaluations` as never)}
                          >
                            Évals
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cancel panel */}
                {isOpen && (
                  <div style={S.cancelPanel}>
                    <div style={{ fontSize: 13, color: colors.status.absent, fontWeight: 600, marginBottom: 10 }}>
                      Confirmer l'annulation
                    </div>
                    <input
                      className="sl-inp"
                      type="text"
                      placeholder="Raison (optionnel)"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      style={S.cancelInput}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        className="sl-btn"
                        style={S.cancelBtnConfirm}
                        onClick={handleCancel}
                        disabled={cancelling}
                      >
                        {cancelling ? 'En cours…' : 'Confirmer l\'annulation'}
                      </button>
                      <button
                        className="sl-btn"
                        style={S.cancelBtnAbort}
                        onClick={() => { setCancelId(null); setCancelReason('') }}
                      >
                        Retour
                      </button>
                    </div>
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

const S: Record<string, React.CSSProperties> = {
  page          : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 860 },
  header        : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title         : { fontSize: 26, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: 0, color: colors.accent.gold },
  btnNew        : { padding: '9px 20px', borderRadius: 7, border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'opacity 0.15s' },
  filters       : { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn     : { padding: '7px 16px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  list          : { display: 'flex', flexDirection: 'column', gap: 8 },
  card          : { backgroundColor: colors.light.surface, borderRadius: '0 10px 10px 0', border: `1px solid ${colors.border.light}`, overflow: 'hidden', transition: 'background 0.12s' },
  cardBody      : { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' },
  cardRight     : { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  statusBadge   : { fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, border: '1px solid', textTransform: 'uppercase', letterSpacing: '0.05em' },
  actionBtns    : { display: 'flex', gap: 6 },
  actBtn        : { padding: '5px 10px', borderRadius: 5, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.12s' },
  cancelPanel   : { padding: '14px 16px', borderTop: `1px solid ${colors.border.light}`, backgroundColor: 'rgba(244,67,54,0.04)' },
  cancelInput   : { width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted, color: colors.text.dark, fontSize: 13, boxSizing: 'border-box', transition: 'border-color 0.15s' },
  cancelBtnConfirm: { padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: colors.status.absent, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  cancelBtnAbort  : { padding: '8px 16px', borderRadius: 6, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  empty         : { textAlign: 'center', padding: '60px 0', color: colors.text.muted },
}
