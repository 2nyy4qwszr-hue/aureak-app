'use client'
// Story 10.1 — Cycle de vie utilisateur (admin)
import { useEffect, useState } from 'react'
import { suspendUser, reactivateUser, requestUserDeletion, listLifecycleEvents } from '@aureak/api-client'
import { colors } from '@aureak/theme'

type LifecycleEvent = {
  id        : string
  event_type: string
  actor_id  : string | null
  reason    : string | null
  created_at: string
}

type Props = { params: { userId: string } }

export default function UserLifecyclePage({ params }: Props) {
  const { userId }              = params
  const [events, setEvents]     = useState<LifecycleEvent[]>([])
  const [loading, setLoading]   = useState(true)
  const [reason, setReason]     = useState('')
  const [confirm, setConfirm]   = useState<'suspend' | 'delete' | null>(null)
  const [working, setWorking]   = useState(false)
  const [feedback, setFeedback] = useState('')

  const loadEvents = async () => {
    const result = await listLifecycleEvents(userId)
    setEvents(result.data as LifecycleEvent[])
    setLoading(false)
  }

  useEffect(() => { loadEvents() }, [userId])

  const handle = async (action: 'suspend' | 'reactivate' | 'delete') => {
    setWorking(true)
    setFeedback('')
    let error: unknown
    if (action === 'suspend')     ({ error } = await suspendUser(userId, reason || undefined))
    else if (action === 'reactivate') ({ error } = await reactivateUser(userId))
    else                          ({ error } = await requestUserDeletion(userId))

    if (error) {
      setFeedback(`Erreur : ${(error as Error)?.message ?? 'inconnue'}`)
    } else {
      setFeedback(
        action === 'suspend'    ? 'Utilisateur suspendu.' :
        action === 'reactivate' ? 'Utilisateur réactivé.' :
                                  'Suppression demandée (délai 30 jours).',
      )
      setConfirm(null)
      setReason('')
      await loadEvents()
    }
    setWorking(false)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Cycle de vie — utilisateur</h1>
      <p style={styles.uid}>{userId}</p>

      {/* Actions */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Actions</h2>

        {confirm === null && (
          <div style={styles.btnRow}>
            <button style={styles.btnWarn} onClick={() => setConfirm('suspend')}>Suspendre</button>
            <button style={styles.btnOk}   onClick={() => handle('reactivate')}>Réactiver</button>
            <button style={styles.btnDanger} onClick={() => setConfirm('delete')}>Demander suppression</button>
          </div>
        )}

        {confirm === 'suspend' && (
          <div style={styles.confirmBox}>
            <p style={styles.confirmText}>Raison de la suspension (optionnel) :</p>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={styles.input}
              placeholder="Ex : comportement inapproprié"
            />
            <div style={styles.btnRow}>
              <button style={styles.btnWarn} onClick={() => handle('suspend')} disabled={working}>
                {working ? '...' : 'Confirmer suspension'}
              </button>
              <button style={styles.btnSecondary} onClick={() => setConfirm(null)}>Annuler</button>
            </div>
          </div>
        )}

        {confirm === 'delete' && (
          <div style={styles.confirmBox}>
            <p style={styles.confirmText}>
              L&apos;utilisateur sera anonymisé après 30 jours. Confirmer ?
            </p>
            <div style={styles.btnRow}>
              <button style={styles.btnDanger} onClick={() => handle('delete')} disabled={working}>
                {working ? '...' : 'Confirmer suppression'}
              </button>
              <button style={styles.btnSecondary} onClick={() => setConfirm(null)}>Annuler</button>
            </div>
          </div>
        )}

        {feedback && (
          <p style={feedback.startsWith('Erreur') ? styles.error : styles.success}>{feedback}</p>
        )}
      </div>

      {/* Journal */}
      <h2 style={styles.sectionTitle}>Journal de cycle de vie</h2>
      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : events.length === 0 ? (
        <div style={styles.empty}>Aucun événement enregistré.</div>
      ) : (
        events.map(ev => (
          <div key={ev.id} style={styles.eventRow}>
            <span style={styles.eventType}>{ev.event_type.replace(/_/g, ' ')}</span>
            {ev.reason && <span style={styles.eventReason}>— {ev.reason}</span>}
            <span style={styles.eventDate}>{new Date(ev.created_at).toLocaleString('fr-FR')}</span>
          </div>
        ))
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container  : { padding: '24px', backgroundColor: colors.background.primary, minHeight: '100vh', color: colors.text.primary, maxWidth: '720px' },
  loading    : { padding: '24px', textAlign: 'center', color: colors.text.secondary },
  title      : { fontSize: '28px', fontWeight: 700, marginBottom: '4px' },
  uid        : { fontSize: '13px', color: colors.text.secondary, fontFamily: 'monospace', marginBottom: '24px' },
  card       : { backgroundColor: colors.background.surface, borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: colors.accent.gold },
  btnRow     : { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  btnWarn    : { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: colors.accent.gold, color: colors.background.primary, cursor: 'pointer', fontWeight: 600 },
  btnOk      : { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: colors.status.present, color: colors.background.primary, cursor: 'pointer', fontWeight: 600 },
  btnDanger  : { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: colors.status.absent, color: colors.text.primary, cursor: 'pointer', fontWeight: 600 },
  btnSecondary: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: 'transparent', color: colors.text.secondary, cursor: 'pointer' },
  input      : { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: colors.background.primary, color: colors.text.primary, fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' },
  confirmBox : { marginTop: '12px' },
  confirmText: { color: colors.text.secondary, marginBottom: '12px', fontSize: '14px' },
  error      : { color: colors.status.absent, marginTop: '10px', fontSize: '14px' },
  success    : { color: colors.status.present, marginTop: '10px', fontSize: '14px' },
  empty      : { color: colors.text.secondary, fontSize: '14px' },
  eventRow   : { display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: colors.background.surface, borderRadius: '6px', padding: '10px 14px', marginBottom: '8px', fontSize: '14px' },
  eventType  : { textTransform: 'capitalize', fontWeight: 600 },
  eventReason: { color: colors.text.secondary, flex: 1 },
  eventDate  : { color: colors.text.secondary, fontSize: '12px', whiteSpace: 'nowrap' },
}
