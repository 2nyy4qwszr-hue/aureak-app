'use client'
// Notes de séance coach : note globale + notes par joueur (Story 13.3)
import { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getSessionById, getSessionNote, upsertSessionNote,
  saveCoachNote, supabase,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, radius, transitions } from '@aureak/theme'
import type { Session } from '@aureak/types'

type PlayerNote = {
  childId    : string
  displayName: string
  note       : string
  saved      : boolean
  saving     : boolean
}

function SubNav({ sessionId, active }: { sessionId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Présences',   href: `/coach/sessions/${sessionId}/attendance`  },
    { label: 'Évaluations', href: `/coach/sessions/${sessionId}/evaluations` },
    { label: 'Notes',       href: `/coach/sessions/${sessionId}/notes`       },
  ]
  return (
    <div style={N.subNav}>
      {tabs.map(tab => (
        <button
          key={tab.href}
          style={{
            ...N.subNavBtn,
            color      : active === tab.label ? colors.accent.gold : colors.text.muted,
            borderBottom: `2px solid ${active === tab.label ? colors.accent.gold : 'transparent'}`,
          }}
          onClick={() => router.push(tab.href as never)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default function NotesPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()
  const user          = useAuthStore(s => s.user)
  const tenantId      = useAuthStore(s => s.tenantId)

  const [session,        setSession]        = useState<Session | null>(null)
  const [note,           setNote]           = useState('')
  const [visibleToAdmin, setVisibleToAdmin] = useState(true)
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [players,        setPlayers]        = useState<PlayerNote[]>([])
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!user?.id) return
    const doLoad = async () => {
      const [sessionRes, noteRes] = await Promise.all([
        getSessionById(sessionId),
        getSessionNote(sessionId, user.id),
      ])
      setSession(sessionRes.data)
      if (noteRes.data) {
        setNote(noteRes.data.note)
        setVisibleToAdmin(noteRes.data.visibleToAdmin)
      }

      // Load attendees with coach_notes for per-player section
      const { data: attendees } = await supabase
        .from('session_attendees')
        .select('child_id, is_guest, coach_notes')
        .eq('session_id', sessionId)

      if (attendees && attendees.length > 0) {
        const allIds   = attendees.map((a: { child_id: string }) => a.child_id)
        const guestIds = new Set(attendees
          .filter((a: { is_guest: boolean }) => a.is_guest)
          .map((a: { child_id: string }) => a.child_id)
        )
        const regularIds = allIds.filter((id: string) => !guestIds.has(id))

        const [profilesRes, dirRes] = await Promise.all([
          regularIds.length > 0
            ? supabase.from('profiles').select('user_id, display_name').in('user_id', regularIds)
            : Promise.resolve({ data: [] }),
          guestIds.size > 0
            ? supabase.from('child_directory').select('id, display_name').in('id', [...guestIds])
            : Promise.resolve({ data: [] }),
        ])

        const nameMap = new Map([
          ...(profilesRes.data ?? []).map((p: { user_id: string; display_name: string }) => [p.user_id, p.display_name] as [string, string]),
          ...(dirRes.data ?? []).map((d: { id: string; display_name: string }) => [d.id, d.display_name] as [string, string]),
        ])

        setPlayers(attendees.map((a: { child_id: string; coach_notes: string | null }) => ({
          childId    : a.child_id,
          displayName: nameMap.get(a.child_id) ?? a.child_id.slice(0, 8),
          note       : a.coach_notes ?? '',
          saved      : !!(a.coach_notes),
          saving     : false,
        })))
      }

      setLoading(false)
    }
    doLoad()
  }, [sessionId, user?.id])

  const handleSaveSession = async () => {
    if (!user?.id || !tenantId || !note.trim()) return
    setSaving(true)
    setSaved(false)
    await upsertSessionNote(sessionId, user.id, tenantId, note.trim(), visibleToAdmin)
    setSaving(false)
    setSaved(true)
  }

  const handlePlayerNoteChange = (childId: string, value: string) => {
    const trimmed = value.slice(0, 140)
    setPlayers(prev => prev.map(p => p.childId === childId ? { ...p, note: trimmed, saved: false } : p))
    if (debounceRef.current[childId]) clearTimeout(debounceRef.current[childId])
    debounceRef.current[childId] = setTimeout(async () => {
      setPlayers(prev => prev.map(p => p.childId === childId ? { ...p, saving: true } : p))
      await saveCoachNote(sessionId, childId, trimmed)
      setPlayers(prev => prev.map(p => p.childId === childId ? { ...p, saving: false, saved: true } : p))
    }, 2000)
  }

  if (loading) {
    return (
      <div style={N.page}>
        <button style={N.back} onClick={() => router.push('/coach/sessions' as never)}>← Mes séances</button>
        <div style={{ color: colors.text.muted, fontSize: 14, padding: '40px 0' }}>Chargement…</div>
      </div>
    )
  }

  return (
    <div style={N.page}>
      <style>{`
        .n-back:hover{color:${colors.accent.gold}}
        .n-inp:focus{outline:none;border-color:${colors.accent.gold}!important}
        .n-btn:hover:not(:disabled){opacity:.88}
      `}</style>

      <button className="n-back" style={N.back} onClick={() => router.push('/coach/sessions' as never)}>
        ← Mes séances
      </button>

      {session && (
        <div style={{ marginBottom: 16 }}>
          <h1 style={N.title}>
            {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h1>
          <div style={N.subtitle}>
            {new Date(session.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
          </div>
        </div>
      )}

      <SubNav sessionId={sessionId} active="Notes" />

      {/* Session-level note */}
      <div style={N.card}>
        <div style={N.cardTitle}>Note de séance</div>
        <textarea
          className="n-inp"
          style={N.textarea}
          value={note}
          onChange={e => { setNote(e.target.value); setSaved(false) }}
          placeholder="Observations générales, points à retenir, incidents…"
          rows={6}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${colors.border.light}` }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={visibleToAdmin}
              onChange={e => setVisibleToAdmin(e.target.checked)}
            />
            <span>Visible par l'administrateur</span>
          </label>
          <button
            className="n-btn"
            style={{ ...N.btnSave, opacity: (saving || !note.trim()) ? 0.5 : 1 }}
            onClick={handleSaveSession}
            disabled={saving || !note.trim()}
          >
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Per-player notes */}
      {players.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={N.sectionTitle}>Notes par joueur</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map(player => (
              <div key={player.childId} style={N.playerCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{player.displayName}</span>
                  {player.saving
                    ? <span style={{ fontSize: 11, color: colors.text.muted }}>Enregistrement…</span>
                    : player.saved && player.note
                      ? <span style={{ fontSize: 11, color: colors.status.present, fontWeight: 700 }}>✓</span>
                      : null
                  }
                </div>
                <textarea
                  className="n-inp"
                  rows={2}
                  placeholder="Note pour ce joueur… (140 car. max)"
                  value={player.note}
                  onChange={e => handlePlayerNoteChange(player.childId, e.target.value)}
                  maxLength={140}
                  style={N.playerTextarea}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: colors.text.muted, marginTop: 2 }}>
                  {player.note.length}/140
                </div>
              </div>
            ))}
          </div>
          <div style={N.hint}>
            Les notes par joueur sont sauvegardées automatiquement à la saisie.
          </div>
        </div>
      )}
    </div>
  )
}

const N: Record<string, React.CSSProperties> = {
  page          : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 780 },
  back          : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, transition: transitions.fast },
  title         : { fontSize: 24, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', margin: '0 0 4px' },
  subtitle      : { fontSize: 13, color: colors.text.muted },
  subNav        : { display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 20 },
  subNavBtn     : { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: transitions.fast, paddingBottom: 10 },
  card          : { backgroundColor: colors.light.surface, borderRadius: 12, padding: '20px', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm, display: 'flex', flexDirection: 'column', gap: 12 },
  cardTitle     : { fontSize: 13, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em' },
  textarea      : { width: '100%', padding: '10px 12px', borderRadius: radius.xs, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted, color: colors.text.dark, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', minHeight: 120, boxSizing: 'border-box', transition: transitions.fast },
  btnSave       : { padding: '9px 20px', borderRadius: 8, border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: transitions.fast },
  sectionTitle  : { fontSize: 13, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 },
  playerCard    : { backgroundColor: colors.light.surface, borderRadius: 10, padding: '12px 16px', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm },
  playerTextarea: { width: '100%', padding: '6px 10px', borderRadius: radius.xs, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted, color: colors.text.dark, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: transitions.fast },
  hint          : { fontSize: 12, color: colors.text.muted, marginTop: 10, padding: '10px 14px', backgroundColor: colors.light.surface, borderRadius: 8, border: `1px solid ${colors.border.light}` },
}
