'use client'
// Feuille de présence terrain — saisie rapide + ajout invités (Story 13.3)
import { useEffect, useState, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getSessionById, recordAttendance, listAttendancesBySession,
  prefillSessionAttendees, addGuestToSession, captureNewChildDuringSession,
  saveCoachNote, listChildDirectory,
  listSessionAttendeeRoster, batchResolveAttendeeNames,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, radius, transitions } from '@aureak/theme'
import type { Session, Attendance } from '@aureak/types'
import type { AttendanceStatus } from '@aureak/types'

type ChildRow = {
  childId    : string
  displayName: string
  status     : AttendanceStatus | null
  isGuest    : boolean
  coachNote  : string
  notesDirty : boolean
}

type DirectoryResult = { id: string; displayName: string }

const STATUS_OPTIONS: {
  value  : AttendanceStatus
  label  : string
  color  : string
  bg     : string
}[] = [
  { value: 'present', label: 'Présent',    color: colors.status.present,   bg: 'rgba(76,175,80,0.14)'   },
  { value: 'late',    label: 'En retard',  color: colors.status.attention,  bg: 'rgba(255,193,7,0.14)'   },
  { value: 'trial',   label: 'Essai',      color: colors.accent.gold,       bg: 'rgba(193,172,92,0.14)'  },
  { value: 'absent',  label: 'Absent',     color: colors.text.muted,        bg: colors.light.muted },
  { value: 'injured', label: 'Blessé',     color: colors.status.absent,     bg: 'rgba(244,67,54,0.10)'   },
]

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  const router = useRouter()
  return (
    <div style={A.page}>
      <style>{`@keyframes ap{0%,100%{opacity:.15}50%{opacity:.42}} .as{background:${colors.light.muted};border-radius:${radius.xs}px;animation:ap 1.8s ease-in-out infinite}`}</style>
      <button style={A.back} onClick={() => router.push('/coach/sessions' as never)}>← Mes séances</button>
      <div className="as" style={{ height: 28, width: 280, marginBottom: 8 }} />
      <div className="as" style={{ height: 14, width: 180, marginBottom: 24 }} />
      {[0,1,2,3,4,5].map(i => (
        <div key={i} className="as" style={{ height: 72, borderRadius: 10, marginBottom: 8 }} />
      ))}
    </div>
  )
}

// ── Sub-nav ───────────────────────────────────────────────────────────────────
function SubNav({ sessionId, active }: { sessionId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Présences',   href: `/coach/sessions/${sessionId}/attendance`  },
    { label: 'Évaluations', href: `/coach/sessions/${sessionId}/evaluations` },
  ]
  return (
    <div style={A.subNav}>
      {tabs.map(tab => (
        <button
          key={tab.href}
          style={{
            ...A.subNavBtn,
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

// ── Modal ajout joueur ────────────────────────────────────────────────────────
function AddGuestModal({
  sessionId,
  tenantId,
  onAdded,
  onClose,
}: {
  sessionId: string
  tenantId : string
  onAdded  : (child: ChildRow) => void
  onClose  : () => void
}) {
  const [query,          setQuery]          = useState('')
  const [results,        setResults]        = useState<DirectoryResult[]>([])
  const [searching,      setSearching]      = useState(false)
  const [mode,           setMode]           = useState<'search' | 'new'>('search')
  const [newName,        setNewName]        = useState('')
  const [newBirth,       setNewBirth]       = useState('')
  const [parentEmail,    setParentEmail]    = useState('')
  const [parentPhone,    setParentPhone]    = useState('')
  const [contactDeclined,setContactDeclined]= useState(false)
  const [adding,         setAdding]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = (q: string) => {
    setQuery(q)
    if (searchRef.current) clearTimeout(searchRef.current)
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    searchRef.current = setTimeout(async () => {
      const { data } = await listChildDirectory({ search: q.trim(), pageSize: 8 })
      setResults((data ?? []).map(r => ({
        id         : r.id,
        displayName: r.displayName,
      })))
      setSearching(false)
    }, 300)
  }

  const handleAddExisting = async (result: DirectoryResult) => {
    setAdding(true)
    setError(null)
    const { error: err } = await addGuestToSession(sessionId, result.id, tenantId)
    if (err) { setError("Erreur lors de l'ajout."); setAdding(false); return }
    onAdded({
      childId    : result.id,
      displayName: result.displayName,
      status     : null,
      isGuest    : true,
      coachNote  : '',
      notesDirty : false,
    })
    onClose()
  }

  const handleCreateNew = async () => {
    if (!newName.trim()) { setError('Le nom est requis.'); return }
    setAdding(true)
    setError(null)
    const parts     = newName.trim().split(/\s+/)
    const firstName = parts[0] ?? ''
    const lastName  = parts.slice(1).join(' ') || '—'
    const { data: newId, error: err } = await captureNewChildDuringSession(
      sessionId, tenantId,
      {
        firstName,
        lastName,
        birthDate      : newBirth || undefined,
        parentEmail    : parentEmail.trim() || undefined,
        parentPhone    : parentPhone.trim() || undefined,
        contactDeclined,
      },
    )
    if (err || !newId) { setError('Erreur lors de la création.'); setAdding(false); return }
    onAdded({
      childId    : newId,
      displayName: newName.trim(),
      status     : null,
      isGuest    : true,
      coachNote  : '',
      notesDirty : false,
    })
    onClose()
  }

  return (
    <div style={A.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={A.modal}>
        <div style={A.modalHead}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>+ Ajouter un joueur</span>
          <button style={A.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 16 }}>
          {(['search', 'new'] as const).map(m => (
            <button
              key={m}
              style={{
                padding     : '8px 16px',
                background  : 'none',
                border      : 'none',
                cursor      : 'pointer',
                fontWeight  : 600,
                fontSize    : 13,
                color       : mode === m ? colors.accent.gold : colors.text.muted,
                borderBottom: `2px solid ${mode === m ? colors.accent.gold : 'transparent'}`,
                transition  : transitions.fast,
              }}
              onClick={() => setMode(m)}
            >
              {m === 'search' ? 'Rechercher' : 'Nouveau joueur'}
            </button>
          ))}
        </div>

        {mode === 'search' ? (
          <>
            <input
              autoFocus
              style={A.modalInput}
              placeholder="Nom du joueur…"
              value={query}
              onChange={e => doSearch(e.target.value)}
            />
            {searching && (
              <div style={{ fontSize: 12, color: colors.text.muted, padding: '8px 0' }}>Recherche…</div>
            )}
            {results.length === 0 && query.trim().length >= 2 && !searching && (
              <div style={{ fontSize: 13, color: colors.text.muted, padding: '12px 0' }}>
                Aucun résultat. <button
                  style={{ background: 'none', border: 'none', color: colors.accent.gold, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setMode('new')}
                >Créer un nouveau joueur →</button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {results.map(r => (
                <button
                  key={r.id}
                  style={A.resultRow}
                  onClick={() => handleAddExisting(r)}
                  disabled={adding}
                >
                  <span style={{ fontWeight: 600 }}>{r.displayName}</span>
                  <span style={{ fontSize: 12, color: colors.text.muted }}>Ajouter →</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={A.fieldLabel}>Nom complet *</label>
              <input
                autoFocus
                style={A.modalInput}
                placeholder="Prénom Nom"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={A.fieldLabel}>Email parent (optionnel)</label>
                <input
                  type="email"
                  style={A.modalInput}
                  placeholder="parent@email.com"
                  value={parentEmail}
                  onChange={e => setParentEmail(e.target.value)}
                  disabled={contactDeclined}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={A.fieldLabel}>Tél. parent (optionnel)</label>
                <input
                  type="tel"
                  style={A.modalInput}
                  placeholder="+32 4xx xxx xxx"
                  value={parentPhone}
                  onChange={e => setParentPhone(e.target.value)}
                  disabled={contactDeclined}
                />
              </div>
            </div>
            <div>
              <label style={A.fieldLabel}>Date de naissance (optionnel)</label>
              <input
                type="date"
                style={A.modalInput}
                value={newBirth}
                onChange={e => setNewBirth(e.target.value)}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={contactDeclined}
                onChange={e => {
                  setContactDeclined(e.target.checked)
                  if (e.target.checked) { setParentEmail(''); setParentPhone('') }
                }}
              />
              <span>Parent n'a pas souhaité donner ses infos</span>
            </label>
            <button
              style={{ ...A.btnPrimary, opacity: adding ? 0.5 : 1 }}
              onClick={handleCreateNew}
              disabled={adding || !newName.trim()}
            >
              {adding ? 'Ajout en cours…' : 'Créer et ajouter'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ color: colors.status.errorStrong ?? colors.status.absent, fontSize: 13, marginTop: 8 }}>{error}</div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()
  const user          = useAuthStore(s => s.user)
  const tenantId      = useAuthStore(s => s.tenantId)

  const [session,    setSession]    = useState<Session | null>(null)
  const [children,   setChildren]   = useState<ChildRow[]>([])
  const [saving,     setSaving]     = useState<string | null>(null)
  const [allSaving,  setAllSaving]  = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [savingNote, setSavingNote] = useState<string | null>(null)
  const noteDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const load = async () => {
    try {
      const [sessionRes, attendanceRes] = await Promise.all([
        getSessionById(sessionId),
        listAttendancesBySession(sessionId),
      ])
      setSession(sessionRes.data)

      // Get roster (session_attendees) with is_guest + coach_notes
      let { data: attendees } = await listSessionAttendeeRoster(sessionId)

      if (attendees.length === 0) {
        await prefillSessionAttendees(sessionId)
        const refilled = await listSessionAttendeeRoster(sessionId)
        attendees = refilled.data
      }

      const allIds     = attendees.map(a => a.childId)
      const guestSet   = new Set(attendees.filter(a => a.isGuest).map(a => a.childId))
      const regularIds = allIds.filter(id => !guestSet.has(id))

      const { profileMap, dirMap } = await batchResolveAttendeeNames(regularIds, [...guestSet])

      const notesMap  = new Map(attendees.map(a => [a.childId, a.coachNotes ?? '']))
      const statusMap = new Map((attendanceRes.data as Attendance[]).map(a => [a.childId, a.status]))

      setChildren(allIds.map(childId => {
        const isGuest = guestSet.has(childId)
        return {
          childId,
          displayName: isGuest
            ? (dirMap.get(childId)     ?? `Invité ${childId.slice(0, 6)}`)
            : (profileMap.get(childId) ?? childId.slice(0, 8)),
          status    : statusMap.get(childId) ?? null,
          isGuest,
          coachNote  : notesMap.get(childId) ?? '',
          notesDirty : false,
        }
      }))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[coach/attendance] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sessionId])

  const handleStatus = async (childId: string, status: AttendanceStatus) => {
    if (!user?.id || !tenantId) return
    setSaving(childId)
    try {
      setChildren(prev => prev.map(c => c.childId === childId ? { ...c, status } : c))
      await recordAttendance({ sessionId, childId, tenantId, status, recordedBy: user.id })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[coach/attendance] handleStatus error:', err)
    } finally {
      setSaving(null)
    }
  }

  const handleAllPresent = async () => {
    if (!user?.id || !tenantId || allSaving) return
    setAllSaving(true)
    try {
      setChildren(prev => prev.map(c => ({ ...c, status: 'present' as AttendanceStatus })))
      await Promise.all(
        children.map(c =>
          recordAttendance({ sessionId, childId: c.childId, tenantId, status: 'present', recordedBy: user.id })
        )
      )
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[coach/attendance] handleAllPresent error:', err)
    } finally {
      setAllSaving(false)
    }
  }

  const handleNoteChange = (childId: string, value: string) => {
    const trimmed = value.slice(0, 140)
    setChildren(prev => prev.map(c => c.childId === childId ? { ...c, coachNote: trimmed, notesDirty: true } : c))
    if (noteDebounceRef.current[childId]) clearTimeout(noteDebounceRef.current[childId])
    noteDebounceRef.current[childId] = setTimeout(async () => {
      setSavingNote(childId)
      try {
        await saveCoachNote(sessionId, childId, trimmed)
        setChildren(prev => prev.map(c => c.childId === childId ? { ...c, notesDirty: false } : c))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[attendance] saveCoachNote error:', err)
      } finally {
        setSavingNote(null)
      }
    }, 2000)
  }

  const handleGuestAdded = (newChild: ChildRow) => {
    setChildren(prev => [...prev, newChild])
  }

  if (loading) return <Skeleton />

  const presentCount = children.filter(c =>
    c.status === 'present' || c.status === 'late' || c.status === 'trial'
  ).length

  return (
    <div style={A.page}>
      <style>{`
        .a-back:hover{color:${colors.accent.gold}}
        .a-sbtn:hover{opacity:.8}
        .a-allp:hover:not(:disabled){opacity:.88}
        .a-add:hover{background:${colors.accent.gold}!important;color:${colors.text.dark}!important}
        .a-result:hover{background:${colors.light.hover ?? colors.light.elevated}!important}
        .a-inp:focus{outline:none;border-color:${colors.accent.gold}!important}
      `}</style>

      <button className="a-back" style={A.back} onClick={() => router.push('/coach/sessions' as never)}>
        ← Mes séances
      </button>

      {session && (
        <div style={{ marginBottom: 16 }}>
          <h1 style={A.title}>
            {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h1>
          <div style={A.subtitle}>
            {new Date(session.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {` · ${session.durationMinutes} min`}
            {session.location ? ` · ${session.location}` : ''}
          </div>
        </div>
      )}

      <SubNav sessionId={sessionId} active="Présences" />

      {/* KPI + actions */}
      <div style={A.kpiBar}>
        <div style={A.kpiGroup}>
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: colors.status.present }}>{presentCount}</span>
          <span style={{ fontSize: 13, color: colors.text.muted }}>/ {children.length} présents</span>
          {children.length > 0 && (
            <>
              <span style={{ fontSize: 13, color: colors.text.muted }}>·</span>
              <span style={{ fontSize: 13, color: colors.accent.gold, fontWeight: 600 }}>
                {Math.round((presentCount / children.length) * 100)}%
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="a-add"
            style={A.btnAdd}
            onClick={() => setShowModal(true)}
          >
            + Joueur
          </button>
          {children.length > 0 && (
            <button
              className="a-allp"
              style={A.btnAllPresent}
              onClick={handleAllPresent}
              disabled={allSaving}
            >
              {allSaving ? 'Sauvegarde…' : '✓ Tous présents'}
            </button>
          )}
        </div>
      </div>

      {/* Children list */}
      {children.length === 0 ? (
        <div style={A.empty}>
          Aucun joueur inscrit.
          <button className="a-add" style={{ ...A.btnAdd, marginTop: 12, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} onClick={() => setShowModal(true)}>
            + Ajouter un joueur
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {children.map(child => {
            const isSaving = saving === child.childId
            const isNote   = savingNote === child.childId
            return (
              <div key={child.childId} style={A.childCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={A.childName}>{child.displayName}</span>
                    {child.isGuest && (
                      <span style={A.guestBadge}>Invité</span>
                    )}
                  </div>
                </div>
                <div style={A.statusBtns}>
                  {STATUS_OPTIONS.map(opt => {
                    const isSelected = child.status === opt.value
                    return (
                      <button
                        key={opt.value}
                        className="a-sbtn"
                        style={{
                          ...A.statusBtn,
                          color          : isSelected ? opt.color : colors.text.muted,
                          borderColor    : isSelected ? opt.color : colors.border.light,
                          backgroundColor: isSelected ? opt.bg : 'transparent',
                          fontWeight     : isSelected ? 700 : 500,
                          opacity        : isSaving ? 0.5 : 1,
                        }}
                        onClick={() => handleStatus(child.childId, opt.value)}
                        disabled={isSaving}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
                {/* Per-player coach note */}
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className="a-inp"
                    rows={2}
                    placeholder="Note pour ce joueur… (140 car. max)"
                    value={child.coachNote}
                    onChange={e => handleNoteChange(child.childId, e.target.value)}
                    style={A.noteInput}
                    maxLength={140}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: isNote ? colors.accent.gold : 'transparent' }}>
                      {isNote ? 'Enregistrement…' : '·'}
                    </span>
                    <span style={{ fontSize: 11, color: colors.text.muted }}>
                      {child.coachNote.length}/140
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && tenantId && (
        <AddGuestModal
          sessionId={sessionId}
          tenantId={tenantId}
          onAdded={handleGuestAdded}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

const A: Record<string, React.CSSProperties> = {
  page        : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: 780 },
  back        : { fontSize: 13, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16, transition: transitions.fast },
  title       : { fontSize: 24, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', margin: '0 0 4px' },
  subtitle    : { fontSize: 13, color: colors.text.muted },
  subNav      : { display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border.light}`, marginBottom: 20 },
  subNavBtn   : { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: transitions.fast, paddingBottom: 10 },
  kpiBar      : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: colors.light.surface, borderRadius: 10, border: `1px solid ${colors.border.light}`, marginBottom: 16, boxShadow: shadows.sm },
  kpiGroup    : { display: 'flex', alignItems: 'center', gap: 8 },
  btnAllPresent: { padding: '8px 18px', borderRadius: 7, border: 'none', backgroundColor: colors.status.present, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: transitions.fast },
  btnAdd      : { padding: '8px 14px', borderRadius: 7, border: `1px solid ${colors.accent.gold}`, backgroundColor: 'transparent', color: colors.accent.gold, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: transitions.fast },
  childCard   : { backgroundColor: colors.light.surface, borderRadius: 10, padding: '12px 16px', border: `1px solid ${colors.border.light}`, boxShadow: shadows.sm },
  childName   : { fontSize: 14, fontWeight: 600 },
  guestBadge  : { fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20, backgroundColor: 'rgba(193,172,92,0.18)', color: colors.accent.gold, border: `1px solid ${colors.border.gold}` },
  statusBtns  : { display: 'flex', gap: 6, flexWrap: 'wrap' },
  statusBtn   : { padding: '5px 12px', borderRadius: radius.xs, border: '1px solid', fontSize: 12, cursor: 'pointer', transition: transitions.fast },
  noteInput   : { width: '100%', padding: '6px 10px', borderRadius: radius.xs, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted, color: colors.text.dark, fontSize: 12, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: transitions.fast },
  empty       : { color: colors.text.muted, fontSize: 14, padding: '40px 0', textAlign: 'center' },
  // Modal
  overlay     : { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal       : { backgroundColor: colors.light.surface, borderRadius: 14, padding: 24, width: '100%', maxWidth: 440, boxShadow: shadows.lg },
  modalHead   : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalClose  : { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: colors.text.muted, padding: 0 },
  modalInput  : { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.muted, color: colors.text.dark, fontSize: 14, boxSizing: 'border-box', transition: transitions.fast },
  fieldLabel  : { display: 'block', fontSize: 12, fontWeight: 600, color: colors.text.muted, marginBottom: 4 },
  resultRow   : { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, border: `1px solid ${colors.border.light}`, background: 'none', cursor: 'pointer', transition: transitions.fast, textAlign: 'left' },
  btnPrimary  : { padding: '11px 20px', borderRadius: 8, border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: transitions.fast },
}
