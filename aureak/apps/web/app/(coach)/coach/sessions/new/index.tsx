'use client'
// Création d'une nouvelle séance
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { createSession, listImplantations, listGroupsByImplantation } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

type Implantation = { id: string; name: string }
type Group        = { id: string; name: string }

export default function NewSessionPage() {
  const router   = useRouter()
  const user     = useAuthStore(s => s.user)
  const tenantId = useAuthStore(s => s.tenantId)

  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [groups,        setGroups]        = useState<Group[]>([])
  const [implId,        setImplId]        = useState('')
  const [groupId,       setGroupId]       = useState('')
  const [date,          setDate]          = useState(() => new Date().toISOString().split('T')[0])
  const [time,          setTime]          = useState('09:00')
  const [duration,      setDuration]      = useState('90')
  const [location,      setLocation]      = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  // Load implantations
  useEffect(() => {
    listImplantations().then(({ data }) => {
      const list = (data ?? []) as Implantation[]
      setImplantations(list)
      if (list.length === 1) setImplId(list[0].id)
    })
  }, [])

  // Load groups when implantation changes
  useEffect(() => {
    if (!implId) { setGroups([]); setGroupId(''); return }
    listGroupsByImplantation(implId).then(({ data }) => {
      const list = (data ?? []) as Group[]
      setGroups(list)
      setGroupId(list.length === 1 ? list[0].id : '')
    })
  }, [implId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !tenantId || !implId || !groupId) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
      const { data: session, error: err } = await createSession({
        tenantId,
        implantationId : implId,
        groupId,
        scheduledAt,
        durationMinutes: parseInt(duration, 10) || 90,
        location       : location.trim() || undefined,
      })
      if (err || !session) {
        setError('Erreur lors de la création. Réessayez.')
        return
      }
      router.push(`/coach/sessions/${session.id}/attendance` as never)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[coach/sessions/new] handleSubmit error:', err)
      setError('Erreur inattendue. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={F.page}>
      <style>{`
        .ns-inp:focus { outline: none; border-color: ${colors.accent.gold} !important; }
        .ns-sel:focus { outline: none; border-color: ${colors.accent.gold} !important; }
        .ns-back:hover { color: ${colors.accent.gold}; }
        .ns-sub:hover:not(:disabled) { opacity: .88; }
      `}</style>

      {/* Back */}
      <button className="ns-back" style={F.back} onClick={() => router.push('/coach/sessions' as never)}>
        ← Mes séances
      </button>

      <h1 style={F.title}>Nouvelle séance</h1>

      <form onSubmit={handleSubmit} style={F.form}>

        {/* Implantation */}
        <div style={F.field}>
          <label style={F.label}>Implantation <span style={F.req}>*</span></label>
          <select
            className="ns-sel"
            value={implId}
            onChange={e => setImplId(e.target.value)}
            style={F.select}
            required
          >
            <option value="">— Sélectionnez —</option>
            {implantations.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        {/* Groupe */}
        <div style={F.field}>
          <label style={F.label}>Groupe <span style={F.req}>*</span></label>
          <select
            className="ns-sel"
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            style={F.select}
            required
            disabled={!implId || groups.length === 0}
          >
            <option value="">— Sélectionnez —</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {implId && groups.length === 0 && (
            <div style={F.hint}>Aucun groupe pour cette implantation</div>
          )}
        </div>

        {/* Date + Heure */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={F.field}>
            <label style={F.label}>Date <span style={F.req}>*</span></label>
            <input
              className="ns-inp"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={F.input}
              required
            />
          </div>
          <div style={F.field}>
            <label style={F.label}>Heure <span style={F.req}>*</span></label>
            <input
              className="ns-inp"
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={F.input}
              required
            />
          </div>
        </div>

        {/* Durée + Lieu */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={F.field}>
            <label style={F.label}>Durée (min)</label>
            <input
              className="ns-inp"
              type="number"
              value={duration}
              min={15}
              max={300}
              step={15}
              onChange={e => setDuration(e.target.value)}
              style={F.input}
            />
          </div>
          <div style={F.field}>
            <label style={F.label}>Lieu</label>
            <input
              className="ns-inp"
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Dojo, Salle A…"
              style={F.input}
            />
          </div>
        </div>

        {error && <div style={F.error}>{error}</div>}

        {/* Actions */}
        <div style={F.actions}>
          <button
            type="button"
            style={F.btnCancel}
            onClick={() => router.push('/coach/sessions' as never)}
          >
            Annuler
          </button>
          <button
            className="ns-sub"
            type="submit"
            style={F.btnSubmit}
            disabled={saving || !implId || !groupId}
          >
            {saving ? 'Création…' : 'Créer la séance →'}
          </button>
        </div>
      </form>
    </div>
  )
}

const F: Record<string, React.CSSProperties> = {
  page     : { padding: '32px 40px', maxWidth: 560, backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark },
  back     : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, transition: 'color 0.15s' },
  title    : { fontSize: 26, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', margin: '0 0 28px', color: colors.text.dark },
  form     : { display: 'flex', flexDirection: 'column', gap: 20 },
  field    : { display: 'flex', flexDirection: 'column', gap: 6 },
  label    : { fontSize: 12, fontWeight: 700, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em' },
  req      : { color: colors.accent.gold },
  hint     : { fontSize: 12, color: colors.text.muted, marginTop: 4 },
  input    : {
    padding        : '10px 12px',
    borderRadius   : 7,
    border         : `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.surface,
    color          : colors.text.dark,
    fontSize       : 14,
    transition     : 'border-color 0.15s',
  },
  select   : {
    padding        : '10px 12px',
    borderRadius   : 7,
    border         : `1px solid ${colors.border.light}`,
    backgroundColor: colors.light.surface,
    color          : colors.text.dark,
    fontSize       : 14,
    transition     : 'border-color 0.15s',
    cursor         : 'pointer',
  },
  error    : { fontSize: 13, color: colors.status.absent, padding: '10px 14px', borderRadius: 7, backgroundColor: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.3)' },
  actions  : { display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 },
  btnCancel: { padding: '10px 20px', borderRadius: 7, border: `1px solid ${colors.border.light}`, backgroundColor: 'transparent', color: colors.text.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSubmit: { padding: '10px 24px', borderRadius: 7, border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' },
}
