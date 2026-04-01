'use client'
// Story 13.3 — Hub de séance coach : Contenu | Présences | Évals | Notes
// AC2 Contenu, AC3 En cours, AC4 Présences, AC6 Évals, AC7 Clôture, AC9 Absence
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getSessionById,
  closeSessionCoach,
  reportCoachAbsence,
  listSessionAttendees,
  listAttendancesBySession,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, transitions, radius } from '@aureak/theme'
import type { Session, SessionAttendee, Attendance } from '@aureak/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type TabId = 'contenu' | 'presences' | 'evaluations' | 'notes' | 'quiz'

const TABS: { id: TabId; label: string }[] = [
  { id: 'contenu',      label: 'Contenu'     },
  { id: 'presences',    label: 'Présences'   },
  { id: 'evaluations',  label: 'Évaluations' },
  { id: 'notes',        label: 'Notes'       },
  { id: 'quiz',         label: 'Quiz'        },
]

function fmtDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getSessionPhase(session: Session): 'avant' | 'pendant' | 'apres' {
  const now      = new Date()
  const start    = new Date(session.scheduledAt)
  const preStart = new Date(start.getTime() - 30 * 60_000)
  const endPlus  = new Date(start.getTime() + (session.durationMinutes + 15) * 60_000)

  if (now < preStart) return 'avant'
  if (now >= preStart && now <= endPlus) return 'pendant'
  return 'apres'
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={S.page}>
      <style>{`@keyframes sh{0%,100%{opacity:.15}50%{opacity:.4}} .sk{background:${colors.light.muted};border-radius:8px;animation:sh 1.8s ease-in-out infinite}`}</style>
      <div className="sk" style={{ height: 28, width: 300, marginBottom: 8 }} />
      <div className="sk" style={{ height: 14, width: 200, marginBottom: 24 }} />
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 20 }}>
        {TABS.map(t => <div key={t.id} className="sk" style={{ height: 36, width: 90, marginRight: 4 }} />)}
      </div>
      {[0,1,2].map(i => <div key={i} className="sk" style={{ height: 80, marginBottom: 10 }} />)}
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onSelect }: { active: TabId; onSelect: (t: TabId) => void }) {
  return (
    <div style={S.tabBar}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          style={{
            ...S.tabBtn,
            color      : active === tab.id ? colors.accent.gold : colors.text.muted,
            borderBottom: `2px solid ${active === tab.id ? colors.accent.gold : 'transparent'}`,
            fontWeight : active === tab.id ? 700 : 400,
          }}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Onglet Contenu (AC2, AC3) ────────────────────────────────────────────────
function TabContenu({ session }: { session: Session }) {
  const phase = getSessionPhase(session)
  const cr    = session.contentRef as Record<string, unknown>

  return (
    <div style={S.tabContent}>
      {/* Badge phase */}
      <div style={{
        ...S.phaseBadge,
        backgroundColor: phase === 'pendant' ? colors.status.present + '22' : colors.light.muted,
        borderColor    : phase === 'pendant' ? colors.status.present : colors.border.light,
        color          : phase === 'pendant' ? colors.status.present : colors.text.muted,
      }}>
        {phase === 'avant' ? '⏰ Avant la séance' : phase === 'pendant' ? '▶ En cours' : '✓ Terminée'}
      </div>

      {/* Référence contenu */}
      {cr && Object.keys(cr).length > 0 && (
        <div style={S.card}>
          <div style={S.cardTitle}>Référence pédagogique</div>
          {cr['method'] && (
            <div style={S.metaRow}>
              <span style={S.metaLabel}>Méthode</span>
              <span style={S.metaValue}>{String(cr['method']).toUpperCase()}</span>
            </div>
          )}
          {cr['module'] && (
            <div style={S.metaRow}>
              <span style={S.metaLabel}>Module</span>
              <span style={S.metaValue}>Module {String(cr['module'])}</span>
            </div>
          )}
          {cr['sequence'] && (
            <div style={S.metaRow}>
              <span style={S.metaLabel}>Séance</span>
              <span style={S.metaValue}>#{String(cr['sequence'])}</span>
            </div>
          )}
          {cr['label'] && (
            <div style={S.metaRow}>
              <span style={S.metaLabel}>Bloc</span>
              <span style={S.metaValue}>{String(cr['label'])}</span>
            </div>
          )}
          {cr['globalNumber'] && (
            <div style={S.metaRow}>
              <span style={S.metaLabel}>N° global</span>
              <span style={S.metaValue}>{String(cr['globalNumber'])}</span>
            </div>
          )}
        </div>
      )}

      {/* Pendant : blocs d'exercice (décisionnel) */}
      {phase === 'pendant' && cr['blocs'] && Array.isArray(cr['blocs']) && (
        <div style={S.card}>
          <div style={S.cardTitle}>Blocs d'exercice</div>
          {(cr['blocs'] as string[]).map((b: string, i: number) => (
            <div key={i} style={S.blocRow}>
              <span style={S.blocNum}>{i + 1}</span>
              <span style={{ fontSize: 14 }}>{b}</span>
            </div>
          ))}
        </div>
      )}

      {/* PDF contenu pédagogique (AC2 — Task 8 basic) */}
      <div style={S.card}>
        <div style={S.cardTitle}>Ressources</div>
        <div style={{ fontSize: 13, color: colors.text.muted }}>
          Les PDFs de contenu pédagogique sont disponibles dans le module Méthodologie.
        </div>
        <button
          style={S.linkBtn}
          onClick={() => window.open('/methodologie/seances', '_blank')}
        >
          Ouvrir le module Méthodologie →
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SessionHubPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()
  const user          = useAuthStore(s => s.user)

  const [session,     setSession]    = useState<Session | null>(null)
  const [tab,         setTab]        = useState<TabId>('contenu')
  const [loading,     setLoading]    = useState(true)
  const [closing,     setClosing]    = useState(false)
  const [closeError,  setCloseError] = useState<string | null>(null)
  const [closedOk,    setClosedOk]   = useState(false)
  const [absenting,   setAbsenting]  = useState(false)
  const [absenceOk,   setAbsenceOk]  = useState(false)
  const [attendees,   setAttendees]  = useState<SessionAttendee[]>([])
  const [attendances, setAttendances]= useState<Attendance[]>([])
  const [refreshing,  setRefreshing] = useState(false)

  const load = async () => {
    try {
      const [sessionRes, attendeesRes, attendancesRes] = await Promise.all([
        getSessionById(sessionId),
        listSessionAttendees(sessionId),
        listAttendancesBySession(sessionId),
      ])
      setSession(sessionRes.data)
      setAttendees(attendeesRes.data ?? [])
      setAttendances((attendancesRes.data ?? []) as Attendance[])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SessionHub] load error:', err)
      setCloseError('Erreur de chargement — rechargez la page.')
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch présences depuis l'iframe (state possiblement périmé)
  const refreshAttendances = async () => {
    setRefreshing(true)
    try {
      const { data } = await listAttendancesBySession(sessionId)
      setAttendances((data ?? []) as Attendance[])
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [sessionId])

  const handleClose = async () => {
    if (!session) return
    setCloseError(null)
    setClosedOk(false)
    setClosing(true)

    // Re-fetch présences depuis le serveur (état iframe potentiellement périmé)
    const { data: liveAttendances } = await listAttendancesBySession(sessionId)
    const liveData = (liveAttendances ?? []) as Attendance[]
    setAttendances(liveData)

    const statusedIds = new Set(liveData.map(a => a.childId))
    const unsatused   = attendees.filter(a => !statusedIds.has(a.childId))
    if (unsatused.length > 0) {
      setCloseError(`${unsatused.length} joueur(s) sans statut — complétez l'onglet Présences`)
      setClosing(false)
      return
    }

    const { error } = await closeSessionCoach(sessionId)
    if (error) {
      const msg = String(error).includes('PRESENCES_INCOMPLETE')
        ? 'Présences incomplètes — vérifiez l\'onglet Présences.'
        : 'Erreur lors de la clôture. Réessayez.'
      setCloseError(msg)
      setClosing(false)
      return
    }

    // Toast succès (AC7)
    setClosedOk(true)
    setTimeout(() => setClosedOk(false), 4000)

    // Rafraîchir la session
    const { data } = await getSessionById(sessionId)
    setSession(data)
    setClosing(false)
  }

  const handleAbsence = async () => {
    if (!user?.id || !session) return
    if (!confirm('Confirmer votre absence pour cette séance ?')) return
    setAbsenting(true)
    setAbsenceOk(false)
    const { error } = await reportCoachAbsence(sessionId, user.id)
    setAbsenting(false)
    if (error) {
      setCloseError('Erreur lors du signalement. Réessayez ou contactez l\'administrateur.')
    } else {
      setCloseError(null)
      setAbsenceOk(true)
      setTimeout(() => setAbsenceOk(false), 5000)
    }
  }

  if (loading) return <Skeleton />

  if (!session) {
    return (
      <div style={S.page}>
        <button style={S.back} onClick={() => router.push('/coach/sessions' as never)}>← Mes séances</button>
        <div style={{ color: colors.status.absent, fontSize: 14 }}>Séance introuvable.</div>
      </div>
    )
  }

  const isRealized  = session.status === 'réalisée'
  const phase       = getSessionPhase(session)
  const statusedIds = new Set(attendances.map(a => a.childId))
  const allStatused = attendees.length > 0 && attendees.every(a => statusedIds.has(a.childId))

  return (
    <div style={S.page}>
      <style>{`
        .sh-back:hover{color:${colors.accent.gold}}
        .sh-tab:hover{color:${colors.text.dark}!important}
        .sh-btn:hover:not(:disabled){opacity:.85}
      `}</style>

      {/* ── Back ── */}
      <button className="sh-back" style={S.back} onClick={() => router.push('/coach/sessions' as never)}>
        ← Mes séances
      </button>

      {/* ── Header séance ── */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={S.title}>{fmtDate(new Date(session.scheduledAt))}</h1>
        <div style={S.subtitle}>
          {fmtTime(new Date(session.scheduledAt))} · {session.durationMinutes} min
          {session.location ? ` · ${session.location}` : ''}
          {isRealized && <span style={S.realizedBadge}>✓ Clôturée</span>}
        </div>
      </div>

      {/* ── Tabs ── */}
      <TabBar active={tab} onSelect={setTab} />

      {/* ── Content ── */}
      {tab === 'contenu' && <TabContenu session={session} />}
      {tab === 'presences' && (
        <iframe
          style={{ border: 'none', width: '100%', minHeight: 500 }}
          src={`/coach/sessions/${sessionId}/attendance`}
        />
      )}
      {tab === 'evaluations' && (
        <iframe
          style={{ border: 'none', width: '100%', minHeight: 500 }}
          src={`/coach/sessions/${sessionId}/evaluations`}
        />
      )}
      {tab === 'notes' && (
        <iframe
          style={{ border: 'none', width: '100%', minHeight: 500 }}
          src={`/coach/sessions/${sessionId}/notes`}
        />
      )}
      {tab === 'quiz' && (
        <iframe
          style={{ border: 'none', width: '100%', minHeight: 500 }}
          src={`/coach/sessions/${sessionId}/learning-report`}
        />
      )}

      {/* ── Toast succès clôture (AC7) ── */}
      {closedOk && (
        <div style={S.toastSuccess}>✓ Séance clôturée</div>
      )}

      {/* ── Toast absence signalée ── */}
      {absenceOk && (
        <div style={S.toastInfo}>📣 Absence signalée — les remplaçants ont été notifiés.</div>
      )}

      {/* ── Sticky footer : Clôturer + Absent ── */}
      {!isRealized && (
        <div style={S.stickyFooter}>
          {closeError && (
            <div style={S.errorBar}>⚠ {closeError}</div>
          )}
          {/* Rafraîchir présences (état iframe potentiellement périmé) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: colors.text.muted }}>
              {allStatused
                ? `✓ ${attendees.length} joueur${attendees.length > 1 ? 's' : ''} statués`
                : `${attendees.length - new Set(attendances.map(a => a.childId)).size} joueur(s) sans statut`
              }
            </span>
            <button
              style={S.refreshBtn}
              onClick={refreshAttendances}
              disabled={refreshing}
            >
              {refreshing ? '…' : '↻ Rafraîchir'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="sh-btn"
              style={{ ...S.btnAbsent }}
              onClick={handleAbsence}
              disabled={absenting}
            >
              {absenting ? 'Signalement…' : '⚠ Je suis absent'}
            </button>
            <button
              className="sh-btn"
              style={{
                ...S.btnClose,
                opacity          : closing ? 0.5 : 1,
                backgroundColor  : allStatused ? colors.status.present : colors.light.elevated ?? colors.border.light,
              }}
              onClick={handleClose}
              disabled={closing}
              title={!allStatused ? 'Présences incomplètes — cliquez pour vérifier' : undefined}
            >
              {closing ? 'Clôture en cours…' : phase === 'avant' ? 'Clôturer (pré-séance)' : 'Clôturer la séance ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page        : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 860, paddingBottom: 100 },
  back        : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, transition: `color ${transitions.fast}` },
  title       : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: '0 0 4px' },
  subtitle    : { fontSize: 13, color: colors.text.muted, display: 'flex', alignItems: 'center', gap: 8 },
  realizedBadge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, backgroundColor: colors.status.present + '22', color: colors.status.present },
  tabBar      : { display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 20 },
  tabBtn      : { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, transition: `all ${transitions.fast}`, paddingBottom: 10 },
  tabContent  : { display: 'flex', flexDirection: 'column', gap: 16 },
  phaseBadge  : { display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 700, alignSelf: 'flex-start' },
  card        : { backgroundColor: colors.light.surface, borderRadius: 10, padding: '16px 18px', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTitle   : { fontSize: 11, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' },
  metaRow     : { display: 'flex', gap: 12, alignItems: 'center' },
  metaLabel   : { fontSize: 12, color: colors.text.muted, width: 80, flexShrink: 0 },
  metaValue   : { fontSize: 14, fontWeight: 600, color: colors.text.dark },
  blocRow     : { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${colors.border.light}` },
  blocNum     : { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent.gold, color: colors.text.dark, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
  linkBtn     : { fontSize: 13, color: colors.accent.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, textAlign: 'left' } as React.CSSProperties,
  stickyFooter: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: colors.light.surface, borderTop: `1px solid ${colors.border.light}`, padding: '12px 32px', boxShadow: '0 -4px 16px rgba(0,0,0,0.07)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 } as React.CSSProperties,
  errorBar    : { fontSize: 12, color: colors.status.absent, fontWeight: 600 },
  btnAbsent   : { padding: '10px 18px', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: `all ${transitions.fast}` },
  btnClose    : { padding: '10px 24px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: `all ${transitions.fast}` },
  refreshBtn  : { fontSize: 11, color: colors.accent.gold, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', fontWeight: 600 },
  toastSuccess: { position: 'fixed', top: 20, right: 20, backgroundColor: colors.status.present, color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(76,175,80,0.35)', zIndex: 200 } as React.CSSProperties,
  toastInfo   : { position: 'fixed', top: 20, right: 20, backgroundColor: colors.accent.gold, color: colors.text.dark, padding: '12px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, boxShadow: '0 4px 16px rgba(193,172,92,0.35)', zIndex: 200 } as React.CSSProperties,
}
