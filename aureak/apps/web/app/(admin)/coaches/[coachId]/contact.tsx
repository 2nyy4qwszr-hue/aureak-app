'use client'
// Story 9.5 — Formulaire contact coach (Admin → Coach)
import { useEffect, useState } from 'react'
import { sendAdminMessage, listAdminMessages } from '@aureak/api-client'
import { colors, shadows } from '@aureak/theme'

type AdminMessage = {
  id          : string
  message     : string
  urgency     : 'routine' | 'urgent'
  sent_at     : string
  recipient_id: string
}

type Props = { params: { coachId: string } }

export default function ContactCoachPage({ params }: Props) {
  const { coachId } = params

  const [message, setMessage]   = useState('')
  const [urgency, setUrgency]   = useState<'routine' | 'urgent'>('routine')
  const [sending, setSending]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [history, setHistory]   = useState<AdminMessage[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const loadHistory = async () => {
    setLoadingHistory(true)
    const result = await listAdminMessages(coachId)
    setHistory((result.data as AdminMessage[]) ?? [])
    setLoadingHistory(false)
  }

  useEffect(() => { loadHistory() }, [coachId])

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setSuccess(false)
    const result = await sendAdminMessage(coachId, message.trim(), urgency)
    if (!result.error) {
      setMessage('')
      setSuccess(true)
      await loadHistory()
    }
    setSending(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.breadcrumb}>
        <a href="/coaches" style={styles.breadcrumbLink}>Coachs</a>
        <span style={styles.breadcrumbSep}>/</span>
        <span style={styles.breadcrumbCurrent}>Contact</span>
      </div>
      <h1 style={styles.title}>Contacter ce coach</h1>

      {/* Formulaire */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Nouveau message</h2>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Rédigez votre message..."
          maxLength={2000}
          rows={5}
          style={styles.textarea}
        />
        <div style={styles.charCount}>{message.length}/2000</div>

        <div style={styles.urgencyRow}>
          <span style={styles.urgencyLabel}>Urgence :</span>
          {(['routine', 'urgent'] as const).map(u => (
            <button
              key={u}
              onClick={() => setUrgency(u)}
              style={urgency === u ? { ...styles.urgencyBtn, ...styles.urgencyBtnActive } : styles.urgencyBtn}
            >
              {u === 'routine' ? 'Routine' : '🚨 Urgent'}
            </button>
          ))}
        </div>

        {urgency === 'urgent' && (
          <div style={styles.urgencyWarning}>
            Un message urgent déclenche push + email + SMS selon les préférences du coach.
          </div>
        )}

        <button
          style={sending || !message.trim() ? { ...styles.sendBtn, opacity: 0.5 } : styles.sendBtn}
          onClick={handleSend}
          disabled={sending || !message.trim()}
        >
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>

        {success && <div style={styles.successMsg}>Message envoyé avec succès.</div>}
      </div>

      {/* Historique */}
      <h2 style={styles.sectionTitle}>Historique des messages</h2>
      {loadingHistory ? (
        <div style={styles.loading}>Chargement...</div>
      ) : history.length === 0 ? (
        <div style={styles.empty}>Aucun message envoyé à ce coach.</div>
      ) : (
        history.map(msg => (
          <div
            key={msg.id}
            style={msg.urgency === 'urgent' ? { ...styles.msgRow, ...styles.msgRowUrgent } : styles.msgRow}
          >
            <div style={styles.msgHeader}>
              <span style={msg.urgency === 'urgent' ? styles.badgeUrgent : styles.badgeRoutine}>
                {msg.urgency === 'urgent' ? '🚨 Urgent' : 'Routine'}
              </span>
              <span style={styles.msgDate}>
                {new Date(msg.sent_at).toLocaleString('fr-FR')}
              </span>
            </div>
            <div style={styles.msgBody}>{msg.message}</div>
          </div>
        ))
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container      : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: '720px' },
  loading        : { padding: '24px', textAlign: 'center', color: colors.text.muted },
  breadcrumb     : { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' },
  breadcrumbLink : { fontSize: '12px', color: colors.accent.gold, textDecoration: 'none', fontWeight: 600 },
  breadcrumbSep  : { fontSize: '12px', color: colors.text.muted },
  breadcrumbCurrent: { fontSize: '12px', color: colors.text.dark, fontWeight: 600 },
  title          : { fontSize: '26px', fontWeight: 700, marginBottom: '24px', fontFamily: 'Montserrat, sans-serif' },
  card           : { backgroundColor: colors.light.surface, borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: shadows.sm },
  sectionTitle   : { fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: colors.accent.gold },
  textarea       : { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.primary, color: colors.text.dark, fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' },
  charCount      : { fontSize: '12px', color: colors.text.muted, textAlign: 'right', marginTop: '4px' },
  urgencyRow     : { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' },
  urgencyLabel   : { fontSize: '14px', color: colors.text.muted },
  urgencyBtn     : { padding: '6px 14px', borderRadius: '6px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.primary, color: colors.text.muted, cursor: 'pointer', fontSize: '14px' },
  urgencyBtnActive: { borderColor: colors.accent.gold, color: colors.accent.gold, backgroundColor: 'rgba(245,158,11,0.1)' },
  urgencyWarning : { marginTop: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', color: colors.status.absent, fontSize: '12px' },
  sendBtn        : { marginTop: '16px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
  successMsg     : { marginTop: '12px', color: colors.status.present, fontSize: '14px' },
  empty          : { color: colors.text.muted, fontSize: '14px', padding: '16px 0' },
  msgRow         : { backgroundColor: colors.light.surface, borderRadius: '8px', padding: '16px', marginBottom: '8px', boxShadow: shadows.sm },
  msgRowUrgent   : { borderLeft: `4px solid ${colors.status.errorText}` },
  msgHeader      : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  badgeRoutine   : { fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: colors.border.light, color: colors.text.muted },
  badgeUrgent    : { fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.15)', color: colors.status.absent },
  msgDate        : { fontSize: '12px', color: colors.text.muted },
  msgBody        : { fontSize: '14px', color: colors.text.muted, lineHeight: '1.5' },
}
