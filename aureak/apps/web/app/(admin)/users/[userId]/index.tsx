'use client'
// Fiche compte utilisateur — Story 10.1 + accès admin
import { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getUserProfile, suspendUser, reactivateUser, requestUserDeletion, listLifecycleEvents } from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import { colors } from '@aureak/theme'

// UserProfile = alias local de UserRow (même shape)
type UserProfile = UserRow

type LifecycleEvent = {
  id        : string
  event_type: string
  actor_id  : string | null
  reason    : string | null
  created_at: string
}

// ── Labels ────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin : 'Administrateur',
  coach : 'Coach',
  parent: 'Parent',
  child : 'Joueur',
  club  : 'Club partenaire',
}

const STATUS_LABELS: Record<string, string> = {
  active   : 'Actif',
  suspended: 'Suspendu',
  pending  : 'En attente',
  deleted  : 'Supprimé',
}
const STATUS_COLORS: Record<string, string> = {
  active   : colors.status.present,
  suspended: colors.status.attention,
  pending  : colors.text.muted,
  deleted  : colors.status.absent,
}

const INVITE_LABELS: Record<string, string> = {
  not_invited: 'Non invité',
  invited    : 'Invité',
  active     : 'Actif',
}
const INVITE_COLORS: Record<string, string> = {
  not_invited: colors.text.muted,
  invited    : colors.status.attention,
  active     : colors.status.present,
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UserFichePage() {
  const { userId }              = useLocalSearchParams<{ userId: string }>()
  const router                  = useRouter()

  const [profile,    setProfile]    = useState<UserProfile | null>(null)
  const [profileErr, setProfileErr] = useState(false)
  const [events,     setEvents]     = useState<LifecycleEvent[]>([])
  const [loading,    setLoading]    = useState(true)

  const [reason,   setReason]   = useState('')
  const [confirm,  setConfirm]  = useState<'suspend' | 'reactivate' | 'delete' | null>(null)
  const [working,  setWorking]  = useState(false)
  const [feedback, setFeedback] = useState('')

  const load = async () => {
    if (!userId) return
    setLoading(true)
    setFeedback('')
    try {
      const [profileRes, eventsRes] = await Promise.all([
        getUserProfile(userId),
        listLifecycleEvents(userId),
      ])

      if (profileRes.error || !profileRes.data) {
        setProfileErr(true)
      } else {
        setProfile(profileRes.data)
      }

      setEvents((eventsRes.data ?? []) as LifecycleEvent[])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[users/detail] load error:', err)
      setProfileErr(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  const handle = async (action: 'suspend' | 'reactivate' | 'delete') => {
    setWorking(true)
    setFeedback('')
    try {
      let error: unknown
      if (action === 'suspend')         ({ error } = await suspendUser(userId, reason || undefined))
      else if (action === 'reactivate') ({ error } = await reactivateUser(userId))
      else                              ({ error } = await requestUserDeletion(userId))

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
        await load()
      }
    } finally {
      setWorking(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={P.page}>
        <style>{`@keyframes cp{0%,100%{opacity:.15}50%{opacity:.42}} .cs{background:${colors.light.muted};border-radius:8px;animation:cp 1.8s ease-in-out infinite}`}</style>
        <div className="cs" style={{ height: 14, width: 100, marginBottom: 24 }} />
        <div className="cs" style={{ height: 120, marginBottom: 16, borderRadius: 12 }} />
        <div className="cs" style={{ height: 90,  marginBottom: 16, borderRadius: 12 }} />
        <div className="cs" style={{ height: 200, borderRadius: 12 }} />
      </div>
    )
  }

  // ── Not found ──
  if (profileErr || !profile) {
    return (
      <div style={P.page}>
        <button style={P.back} onClick={() => router.back()}>← Utilisateurs</button>
        <div style={{ color: colors.text.muted, fontSize: 14 }}>Utilisateur introuvable.</div>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[profile.status] ?? colors.text.muted
  const inviteColor = INVITE_COLORS[profile.inviteStatus] ?? colors.text.muted
  const initial     = profile.displayName.charAt(0).toUpperCase() || '?'

  return (
    <div style={P.page}>

      {/* Back */}
      <button style={P.back} onClick={() => router.back()}>← Utilisateurs</button>

      {/* ── Hero ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.accent.gold + '22',
          border: `2px solid ${colors.accent.gold}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: colors.text.dark, flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={P.title}>{profile.displayName}</h1>
            <span style={{ ...P.badge, color: statusColor, borderColor: statusColor + '40', backgroundColor: statusColor + '12' }}>
              {STATUS_LABELS[profile.status] ?? profile.status}
            </span>
            <span style={{ ...P.badge, color: colors.accent.gold, borderColor: colors.accent.gold + '40', backgroundColor: colors.accent.gold + '12' }}>
              {ROLE_LABELS[profile.userRole] ?? profile.userRole}
            </span>
          </div>
          <div style={{ fontSize: 13, color: colors.text.muted, marginTop: 2 }}>
            {profile.email ?? '—'}
          </div>
        </div>
      </div>

      {/* ── Informations utilisateur ── */}
      <div style={P.card}>
        <div style={P.cardTitle}>Informations utilisateur</div>

        <div style={P.grid}>
          {/* Email */}
          <div style={P.field}>
            <div style={P.fieldLabel}>Email</div>
            <div style={P.fieldValue}>{profile.email ?? '—'}</div>
          </div>

          {/* Téléphone */}
          <div style={P.field}>
            <div style={P.fieldLabel}>Téléphone</div>
            <div style={P.fieldValue}>{profile.phone ?? '—'}</div>
          </div>

          {/* Rôle */}
          <div style={P.field}>
            <div style={P.fieldLabel}>Rôle</div>
            <div style={P.fieldValue}>{ROLE_LABELS[profile.userRole] ?? profile.userRole}</div>
          </div>

          {/* Statut compte */}
          <div style={P.field}>
            <div style={P.fieldLabel}>Statut du compte</div>
            <span style={{ ...P.badge, color: statusColor, borderColor: statusColor + '40', backgroundColor: statusColor + '12', fontSize: 12 }}>
              {STATUS_LABELS[profile.status] ?? profile.status}
            </span>
          </div>

          {/* Invitation */}
          <div style={P.field}>
            <div style={P.fieldLabel}>Invitation</div>
            <span style={{ ...P.badge, color: inviteColor, borderColor: inviteColor + '40', backgroundColor: inviteColor + '12', fontSize: 12 }}>
              {INVITE_LABELS[profile.inviteStatus] ?? profile.inviteStatus}
            </span>
          </div>

          {/* Date de création */}
          <div style={P.field}>
            <div style={P.fieldLabel}>Date de création</div>
            <div style={P.fieldValue}>{fmtDate(profile.createdAt)}</div>
          </div>

          {/* Dernière connexion */}
          <div style={P.field}>
            <div style={P.fieldLabel}>Dernière connexion</div>
            <div style={P.fieldValue}>{fmtDateTime(profile.lastSignInAt)}</div>
          </div>

          {/* ID technique */}
          <div style={P.field}>
            <div style={P.fieldLabel}>ID</div>
            <div style={{ ...P.fieldValue, fontFamily: 'monospace', fontSize: 11, color: colors.text.muted }}>
              {profile.userId}
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions cycle de vie ── */}
      <div style={P.card}>
        <div style={P.cardTitle}>Actions</div>

        {confirm === null && (
          <div style={P.btnRow}>
            {/* Suspendre : seulement si actif ou en attente */}
            {(profile.status === 'active' || profile.status === 'pending') && (
              <button style={P.btnWarn} onClick={() => setConfirm('suspend')}>
                Suspendre
              </button>
            )}
            {/* Réactiver : seulement si suspendu */}
            {profile.status === 'suspended' && (
              <button style={P.btnOk} onClick={() => setConfirm('reactivate')}>
                Réactiver
              </button>
            )}
            {/* Suppression : seulement si pas déjà supprimé */}
            {profile.status !== 'deleted' && (
              <button style={P.btnDanger} onClick={() => setConfirm('delete')}>
                Demander suppression
              </button>
            )}
          </div>
        )}

        {confirm === 'suspend' && (
          <div style={P.confirmBox}>
            <p style={P.confirmText}>Raison de la suspension (optionnel) :</p>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={P.input}
              placeholder="Ex : comportement inapproprié"
            />
            <div style={P.btnRow}>
              <button style={P.btnWarn} onClick={() => handle('suspend')} disabled={working}>
                {working ? '…' : 'Confirmer suspension'}
              </button>
              <button style={P.btnSecondary} onClick={() => setConfirm(null)}>Annuler</button>
            </div>
          </div>
        )}

        {confirm === 'reactivate' && (
          <div style={P.confirmBox}>
            <p style={P.confirmText}>
              Réactiver le compte de {profile.displayName} ?
            </p>
            <div style={P.btnRow}>
              <button style={P.btnOk} onClick={() => handle('reactivate')} disabled={working}>
                {working ? '…' : 'Confirmer réactivation'}
              </button>
              <button style={P.btnSecondary} onClick={() => setConfirm(null)}>Annuler</button>
            </div>
          </div>
        )}

        {confirm === 'delete' && (
          <div style={P.confirmBox}>
            <p style={P.confirmText}>
              L&apos;utilisateur sera anonymisé après 30 jours. Confirmer ?
            </p>
            <div style={P.btnRow}>
              <button style={P.btnDanger} onClick={() => handle('delete')} disabled={working}>
                {working ? '…' : 'Confirmer suppression'}
              </button>
              <button style={P.btnSecondary} onClick={() => setConfirm(null)}>Annuler</button>
            </div>
          </div>
        )}

        {feedback && (
          <p style={feedback.startsWith('Erreur') ? P.error : P.success}>{feedback}</p>
        )}
      </div>

      {/* ── Historique des actions ── */}
      <div style={P.card}>
        <div style={P.cardTitle}>Historique des actions importantes</div>
        {events.length === 0 ? (
          <div style={{ color: colors.text.muted, fontSize: 14, fontStyle: 'italic' }}>
            Aucun événement enregistré.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {events.map(ev => (
              <div key={ev.id} style={P.eventRow}>
                <div style={{ flex: 1 }}>
                  <span style={P.eventType}>{ev.event_type.replace(/_/g, ' ')}</span>
                  {ev.reason && (
                    <span style={{ color: colors.text.muted, marginLeft: 8 }}>— {ev.reason}</span>
                  )}
                </div>
                <span style={P.eventDate}>{fmtDateTime(ev.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const P: Record<string, React.CSSProperties> = {
  page       : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 760 },
  back       : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 },
  title      : { fontSize: 24, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', margin: 0, color: colors.text.dark },
  badge      : { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: '1px solid', display: 'inline-block' },

  card       : { backgroundColor: colors.light.surface, borderRadius: 12, border: `1px solid ${colors.border.light}`, padding: '18px 20px', marginBottom: 16 },
  cardTitle  : { fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 },

  grid       : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' },
  field      : { },
  fieldLabel : { fontSize: 10, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 },
  fieldValue : { fontSize: 14, color: colors.text.dark },

  btnRow     : { display: 'flex', gap: 10, flexWrap: 'wrap' },
  btnWarn    : { padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: colors.accent.gold, color: colors.light.primary, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnOk      : { padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: colors.status.present, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnDanger  : { padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: colors.status.absent, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnSecondary: { padding: '8px 16px', borderRadius: 6, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, cursor: 'pointer', fontSize: 13 },

  confirmBox : { marginTop: 12 },
  confirmText: { color: colors.text.muted, marginBottom: 12, fontSize: 14 },
  input      : { width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.primary, color: colors.text.dark, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' },

  error      : { color: colors.status.absent, marginTop: 10, fontSize: 14 },
  success    : { color: colors.status.present, marginTop: 10, fontSize: 14 },

  eventRow   : { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: colors.light.muted, borderRadius: 6, padding: '9px 12px', fontSize: 13 },
  eventType  : { fontWeight: 600, textTransform: 'capitalize' },
  eventDate  : { color: colors.text.muted, fontSize: 11, whiteSpace: 'nowrap' },
}
