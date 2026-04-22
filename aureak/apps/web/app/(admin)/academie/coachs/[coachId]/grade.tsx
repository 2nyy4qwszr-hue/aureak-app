'use client'
// Story 11.1 — Attribuer un grade coach (admin)
import { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { awardCoachGrade, listCoachGradeHistory, getCoachCurrentGrade, getProfileDisplayName, sendGradeNotification } from '@aureak/api-client'
import type { CoachGrade, CoachGradeLevel } from '@aureak/api-client'
import { colors, shadows } from '@aureak/theme'

const GRADES: { value: CoachGradeLevel; label: string; color: string; emoji: string }[] = [
  { value: 'bronze',   label: 'Bronze',   color: colors.accent.gold, emoji: '🥉' },
  { value: 'silver',   label: 'Argent',   color: colors.accent.ivory, emoji: '🥈' },
  { value: 'gold',     label: 'Or',       color: colors.accent.gold, emoji: '🥇' },
  { value: 'platinum', label: 'Platine',  color: colors.accent.ivory, emoji: '💎' },
]

export default function CoachGradePage() {
  const { coachId }              = useLocalSearchParams<{ coachId: string }>()
  const [current, setCurrent]   = useState<CoachGrade | null>(null)
  const [history, setHistory]   = useState<CoachGrade[]>([])
  const [coachName, setCoachName] = useState<string>('')
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<CoachGradeLevel>('bronze')
  const [notes, setNotes]       = useState('')
  const [working, setWorking]   = useState(false)
  const [feedback, setFeedback] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [currentResult, historyResult, nameResult] = await Promise.all([
        getCoachCurrentGrade(coachId),
        listCoachGradeHistory(coachId),
        getProfileDisplayName(coachId),
      ])
      setCurrent(currentResult.data)
      setHistory(historyResult.data ?? [])
      setCoachName(nameResult.data ?? coachId.slice(0, 8))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[coaches/grade] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [coachId])

  const handleAward = async () => {
    setWorking(true)
    setFeedback('')
    try {
      const { data: gradeId, error } = await awardCoachGrade(coachId, selected, notes || undefined)
      if (error) {
        setFeedback(`Erreur : ${(error as Error)?.message ?? 'inconnue'}`)
      } else {
        // Notification push
        const gradeInfo = GRADES.find(g => g.value === selected)!
        await sendGradeNotification({
          coachId,
          gradeId   : gradeId as string | null,
          gradeLabel: gradeInfo.label,
          gradeEmoji: gradeInfo.emoji,
        })
        setFeedback(`Grade ${gradeInfo.label} attribué avec succès.`)
        setNotes('')
        await load()
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[coaches/grade] handleAward error:', err)
      setFeedback('Erreur inattendue lors de l\'attribution.')
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <div style={styles.loading}>Chargement...</div>

  return (
    <div style={styles.container}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <a href="/academie/coachs" style={styles.breadcrumbLink}>Coachs</a>
        <span style={styles.breadcrumbSep}>/</span>
        <span style={styles.breadcrumbPart}>{coachName}</span>
        <span style={styles.breadcrumbSep}>/</span>
        <span style={styles.breadcrumbCurrent}>Grade</span>
      </div>
      <h1 style={styles.title}>Grade pédagogique</h1>
      <p style={styles.coachLabel}>{coachName}</p>

      {/* Grade courant */}
      {current && (
        <div style={styles.currentCard}>
          <span style={styles.currentLabel}>Grade actuel</span>
          <span style={{ ...styles.currentGrade, color: GRADES.find(g => g.value === current.grade_level)?.color ?? colors.text.dark }}>
            {GRADES.find(g => g.value === current.grade_level)?.emoji} {GRADES.find(g => g.value === current.grade_level)?.label}
          </span>
          <span style={styles.currentDate}>
            Attribué le {new Date(current.awarded_at).toLocaleDateString('fr-FR')}
          </span>
          {current.notes && <span style={styles.currentNotes}>{current.notes}</span>}
        </div>
      )}

      {/* Formulaire attribution */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Attribuer un nouveau grade</h2>

        <div style={styles.gradeGrid}>
          {GRADES.map(g => (
            <button
              key={g.value}
              style={selected === g.value
                ? { ...styles.gradeBtn, borderColor: g.color, backgroundColor: `${g.color}22` }
                : styles.gradeBtn
              }
              onClick={() => setSelected(g.value)}
            >
              <span style={styles.gradeEmoji}>{g.emoji}</span>
              <span style={{ ...styles.gradeLabel, color: g.color }}>{g.label}</span>
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes (optionnel)"
          rows={3}
          style={styles.textarea}
        />

        <button
          style={working ? { ...styles.awardBtn, opacity: 0.6 } : styles.awardBtn}
          onClick={handleAward}
          disabled={working}
        >
          {working ? 'Attribution...' : 'Attribuer le grade'}
        </button>

        {feedback && (
          <p style={feedback.startsWith('Erreur') ? styles.error : styles.success}>{feedback}</p>
        )}
      </div>

      {/* Historique */}
      <h2 style={styles.sectionTitle}>Historique</h2>
      {history.length === 0 ? (
        <p style={styles.empty}>Aucun grade attribué.</p>
      ) : (
        history.map(g => {
          const gradeInfo = GRADES.find(gi => gi.value === g.grade_level)!
          return (
            <div key={g.id} style={styles.historyRow}>
              <span style={{ color: gradeInfo.color, fontSize: '18px' }}>{gradeInfo.emoji}</span>
              <div style={styles.historyInfo}>
                <span style={{ ...styles.historyGrade, color: gradeInfo.color }}>{gradeInfo.label}</span>
                {g.notes && <span style={styles.historyNotes}>{g.notes}</span>}
              </div>
              <span style={styles.historyDate}>{new Date(g.awarded_at).toLocaleDateString('fr-FR')}</span>
            </div>
          )
        })
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container      : { padding: '28px 32px', backgroundColor: colors.light.primary, minHeight: '100vh', color: colors.text.dark, maxWidth: '720px' },
  loading        : { padding: '48px', textAlign: 'center', color: colors.text.muted },
  breadcrumb     : { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' },
  breadcrumbLink : { fontSize: '12px', color: colors.accent.gold, textDecorationLine: 'none', fontWeight: 600 },
  breadcrumbSep  : { fontSize: '12px', color: colors.text.muted },
  breadcrumbPart : { fontSize: '12px', color: colors.text.muted },
  breadcrumbCurrent: { fontSize: '12px', color: colors.text.dark, fontWeight: 600 },
  title          : { fontSize: '26px', fontWeight: 700, marginBottom: '4px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.4px' },
  coachLabel     : { fontSize: '13px', color: colors.text.muted, marginBottom: '20px' },
  currentCard : { backgroundColor: colors.light.surface, borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: shadows.sm },
  currentLabel: { fontSize: '12px', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' },
  currentGrade: { fontSize: '24px', fontWeight: 900 },
  currentDate : { fontSize: '12px', color: colors.text.muted },
  currentNotes: { fontSize: '13px', color: colors.text.muted, fontStyle: 'italic' },
  card        : { backgroundColor: colors.light.surface, borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: shadows.sm },
  sectionTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: colors.accent.gold },
  gradeGrid   : { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' },
  gradeBtn    : { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px', borderRadius: '8px', border: `2px solid ${colors.border.light}`, backgroundColor: 'transparent', cursor: 'pointer' },
  gradeEmoji  : { fontSize: '24px' },
  gradeLabel  : { fontSize: '12px', fontWeight: 700 },
  textarea    : { width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border.light}`, backgroundColor: colors.light.primary, color: colors.text.dark, fontSize: '14px', resize: 'vertical', marginBottom: '12px', boxSizing: 'border-box' },
  awardBtn    : { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: colors.accent.gold, color: colors.text.dark, cursor: 'pointer', fontWeight: 700, fontSize: '15px' },
  error       : { color: colors.status.absent, marginTop: '10px', fontSize: '14px' },
  success     : { color: colors.status.present, marginTop: '10px', fontSize: '14px' },
  empty       : { color: colors.text.muted, fontSize: '14px' },
  historyRow  : { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: colors.light.surface, borderRadius: '8px', padding: '12px 16px', marginBottom: '8px', boxShadow: shadows.sm },
  historyInfo : { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  historyGrade: { fontSize: '14px', fontWeight: 700 },
  historyNotes: { fontSize: '12px', color: colors.text.muted },
  historyDate : { fontSize: '12px', color: colors.text.muted },
}
