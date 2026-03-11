'use client'
// Story 19.5 — Page d'édition complète d'une séance existante
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getSessionById, listSessionCoaches, listAvailableCoaches,
  updateSession, assignCoach, removeCoach,
} from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import { SESSION_TYPES, SESSION_TYPE_LABELS } from '@aureak/types'
import type { Session, SessionCoach, CoachRole, SessionType } from '@aureak/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const TERRAINS  = ['Terrain A', 'Terrain B', 'Terrain C', 'Terrain D', 'Extérieur', 'Salle', 'Autre…']
const HOURS     = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const MINUTES   = [0, 15, 30, 45]
const DURATIONS = [45, 60, 75, 90, 105, 120]

const STATUSES = [
  { key: 'planifiée',  label: 'Planifiée'  },
  { key: 'en_cours',   label: 'En cours'   },
  { key: 'réalisée',   label: 'Réalisée'   },
  { key: 'reportée',   label: 'Reportée'   },
  { key: 'annulée',    label: 'Annulée'    },
] as const

const COACH_ROLES: { key: CoachRole; label: string }[] = [
  { key: 'lead',      label: 'Principal' },
  { key: 'assistant', label: 'Assistant' },
]

const TYPE_COLOR: Record<string, string> = {
  goal_and_player : methodologyMethodColors['Goal and Player'],
  technique       : methodologyMethodColors['Technique'],
  situationnel    : methodologyMethodColors['Situationnel'],
  decisionnel     : methodologyMethodColors['Décisionnel'],
  perfectionnement: methodologyMethodColors['Perfectionnement'],
  integration     : methodologyMethodColors['Intégration'],
  equipe          : '#94A3B8',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CoachEntry = { coachId: string; role: CoachRole; name: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractDate(scheduledAt: string): string {
  return scheduledAt.substring(0, 10)
}

function extractHour(scheduledAt: string): number {
  return new Date(scheduledAt).getHours()
}

function extractMinute(scheduledAt: string): number {
  const m = new Date(scheduledAt).getMinutes()
  return MINUTES.includes(m) ? m : 0
}

function contentRefLabel(session: Session): string {
  const ref = session.contentRef
  if (!ref || !('method' in ref)) return '—'
  switch (ref.method) {
    case 'goal_and_player':
      return `GP #${(ref as {globalNumber:number}).globalNumber} · ${(ref as {half:string}).half} Rep.${(ref as {repeat:number}).repeat}`
    case 'technique': {
      const r = ref as {context:string; globalNumber?:number; concept?:string; sequence:number}
      return r.context === 'academie' ? `Technique #${r.globalNumber}` : `Stage ${r.concept} · ${r.sequence}`
    }
    case 'situationnel': {
      const r = ref as {label:string; subtitle?:string}
      return r.subtitle ? `${r.label} — ${r.subtitle}` : r.label
    }
    case 'decisionnel': {
      const r = ref as {blocks:Array<{title:string}>}
      return `Décisionnel · ${r.blocks.length} bloc${r.blocks.length !== 1 ? 's' : null}`
    }
    default: return '—'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditSessionPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router        = useRouter()

  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [session, setSession] = useState<Session | null>(null)

  // Form fields
  const [date,               setDate]               = useState('')
  const [hour,               setHour]               = useState(18)
  const [minute,             setMinute]             = useState(0)
  const [duration,           setDuration]           = useState(90)
  const [sessionType,        setSessionType]        = useState<SessionType | null>(null)
  const [terrain,            setTerrain]            = useState('')
  const [status,             setStatus]             = useState('planifiée')
  const [cancellationReason, setCancellationReason] = useState('')
  const [notes,              setNotes]              = useState('')

  // Coach state
  const [initialCoaches,  setInitialCoaches]  = useState<CoachEntry[]>([])
  const [selectedCoaches, setSelectedCoaches] = useState<CoachEntry[]>([])
  const [allCoaches,      setAllCoaches]      = useState<{ id: string; name: string }[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)

    const [s, c, coaches] = await Promise.all([
      getSessionById(sessionId),
      listSessionCoaches(sessionId),
      listAvailableCoaches(),
    ])

    if (!s.data) {
      setLoadError('Séance introuvable ou accès refusé.')
      setLoading(false)
      return
    }

    const sess = s.data
    setSession(sess)
    setAllCoaches(coaches)

    setDate(extractDate(sess.scheduledAt))
    setHour(extractHour(sess.scheduledAt))
    setMinute(extractMinute(sess.scheduledAt))
    setDuration(sess.durationMinutes)
    setSessionType(sess.sessionType)
    setTerrain(sess.location ?? '')
    setStatus(sess.status)
    setCancellationReason(sess.cancellationReason ?? '')
    setNotes(sess.notes ?? '')

    const coachNameMap = new Map(coaches.map((c: { id: string; name: string }) => [c.id, c.name]))
    const entries: CoachEntry[] = (c.data ?? []).map((sc: SessionCoach) => ({
      coachId : sc.coachId,
      role    : sc.role as CoachRole,
      name    : coachNameMap.get(sc.coachId) ?? '—',
    }))
    setInitialCoaches([...entries])
    setSelectedCoaches([...entries])
    setLoading(false)
  }, [sessionId])

  useEffect(() => { load() }, [load])

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errs['date']     = 'Date obligatoire (format YYYY-MM-DD)'
    if (!duration)                                   errs['duration'] = 'Durée obligatoire'
    if (!status)                                     errs['status']   = 'Statut obligatoire'
    if (status === 'annulée' && !cancellationReason.trim()) {
      errs['cancellationReason'] = "Le motif d'annulation est obligatoire"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate() || !session) return
    setSaving(true)
    setSaveError(null)

    const scheduledAt = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

    const { error: updateError } = await updateSession(sessionId!, {
      scheduledAt,
      durationMinutes   : duration,
      location          : terrain || null,
      status,
      sessionType       : sessionType || null,
      notes             : notes.trim() || null,
      cancellationReason: status === 'annulée' ? cancellationReason.trim() : undefined,
    })

    if (updateError) {
      setSaveError('Erreur lors de la mise à jour. Veuillez réessayer.')
      setSaving(false)
      return
    }

    // Coach diff
    const initialSet  = new Set(initialCoaches.map(c => c.coachId))
    const selectedSet = new Set(selectedCoaches.map(c => c.coachId))
    const toAdd    = selectedCoaches.filter(c => !initialSet.has(c.coachId))
    const toRemove = initialCoaches.filter(c => !selectedSet.has(c.coachId))

    const ops = [
      ...toAdd.map(c    => assignCoach(sessionId!, c.coachId, session.tenantId, c.role)),
      ...toRemove.map(c => removeCoach(sessionId!, c.coachId)),
    ]
    if (ops.length > 0) await Promise.all(ops)

    router.replace(`/seances/${sessionId}?updated=true` as never)
  }

  // ── Coach management ────────────────────────────────────────────────────────

  const removeSelectedCoach = (coachId: string) => {
    setSelectedCoaches(p => p.filter(c => c.coachId !== coachId))
  }

  const addCoach = (coachId: string, role: CoachRole) => {
    if (selectedCoaches.some(c => c.coachId === coachId)) return
    const coach = allCoaches.find(c => c.id === coachId)
    if (!coach) return
    if (role === 'lead' && selectedCoaches.some(c => c.role === 'lead')) return
    setSelectedCoaches(p => [...p, { coachId, role, name: coach.name }])
  }

  const availableToAdd = useMemo(
    () => allCoaches.filter(c => !selectedCoaches.some(sc => sc.coachId === c.id)),
    [allCoaches, selectedCoaches]
  )

  // ── States ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ScrollView style={st.container}>
        <View style={st.skeleton}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[st.skeletonBlock, { height: i === 1 ? 32 : 80 }]} />
          ))}
        </View>
      </ScrollView>
    )
  }

  if (loadError || !session) {
    return (
      <View style={[st.container, { justifyContent: 'center', alignItems: 'center', padding: space.xl }]}>
        <AureakText variant="h3" style={{ color: colors.accent.red ?? '#E05252' }}>
          {loadError ?? 'Séance introuvable'}
        </AureakText>
        <Pressable
          style={[st.btnPrimary, { marginTop: space.lg }]}
          onPress={() => router.push('/seances' as never)}
        >
          <AureakText style={st.btnPrimaryText}>← Retour aux séances</AureakText>
        </Pressable>
      </View>
    )
  }

  const sessionDateLabel = new Date(session.scheduledAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  // Séance réalisée — lecture seule
  if (session.status === 'réalisée') {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <View style={st.breadcrumb}>
          <Pressable onPress={() => router.push('/seances' as never)}>
            <AureakText variant="caption" style={st.breadcrumbLink}>Séances</AureakText>
          </Pressable>
          <AureakText variant="caption" style={st.breadcrumbSep}>›</AureakText>
          <AureakText variant="caption" style={st.breadcrumbCurrent}>{sessionDateLabel} › Modifier</AureakText>
        </View>
        <View style={st.warningBanner}>
          <AureakText style={{ color: '#92400E', fontWeight: '700' as never }}>
            Cette séance est réalisée et ne peut plus être modifiée.
          </AureakText>
          <Pressable style={[st.btnSecondary, { marginTop: space.sm, alignSelf: 'flex-start' as never }]} onPress={() => router.back()}>
            <AureakText style={st.btnSecondaryText}>← Retour</AureakText>
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>

      {/* Breadcrumb */}
      <View style={st.breadcrumb}>
        <Pressable onPress={() => router.push('/seances' as never)}>
          <AureakText variant="caption" style={st.breadcrumbLink}>Séances</AureakText>
        </Pressable>
        <AureakText variant="caption" style={st.breadcrumbSep}>›</AureakText>
        <Pressable onPress={() => router.push(`/seances/${sessionId}` as never)}>
          <AureakText variant="caption" style={st.breadcrumbLink}>{sessionDateLabel}</AureakText>
        </Pressable>
        <AureakText variant="caption" style={st.breadcrumbSep}>›</AureakText>
        <AureakText variant="caption" style={st.breadcrumbCurrent}>Modifier</AureakText>
      </View>

      <View style={st.formCard}>

        {/* ── Planification ── */}
        <AureakText style={st.sectionLabel}>PLANIFICATION</AureakText>

        <View style={st.fieldWrap}>
          <AureakText style={st.fieldLabel}>Date</AureakText>
          <TextInput
            style={[st.input, errors['date'] && st.inputError]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.text.muted}
          />
          {errors['date'] && <AureakText style={st.errorText}>{errors['date']}</AureakText>}
        </View>

        <View style={st.fieldWrap}>
          <AureakText style={st.fieldLabel}>Heure</AureakText>
          <View style={st.chipRow}>
            {HOURS.map(h => (
              <Pressable key={h} style={[st.chip, hour === h && st.chipActive]} onPress={() => setHour(h)}>
                <AureakText style={[st.chipText, hour === h ? st.chipTextActive : null] as never}>
                  {String(h).padStart(2, '0')}h
                </AureakText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={st.fieldWrap}>
          <AureakText style={st.fieldLabel}>Minutes</AureakText>
          <View style={st.chipRow}>
            {MINUTES.map(m => (
              <Pressable key={m} style={[st.chip, minute === m && st.chipActive]} onPress={() => setMinute(m)}>
                <AureakText style={[st.chipText, minute === m ? st.chipTextActive : null] as never}>
                  :{String(m).padStart(2, '0')}
                </AureakText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={st.fieldWrap}>
          <AureakText style={st.fieldLabel}>Durée</AureakText>
          <View style={st.chipRow}>
            {DURATIONS.map(d => (
              <Pressable key={d} style={[st.chip, duration === d && st.chipActive]} onPress={() => setDuration(d)}>
                <AureakText style={[st.chipText, duration === d ? st.chipTextActive : null] as never}>{d} min</AureakText>
              </Pressable>
            ))}
          </View>
          {errors['duration'] && <AureakText style={st.errorText}>{errors['duration']}</AureakText>}
        </View>

        <View style={st.separator} />

        {/* ── Type de séance ── */}
        <AureakText style={st.sectionLabel}>TYPE DE SÉANCE</AureakText>

        <View style={st.fieldWrap}>
          <AureakText style={st.fieldLabel}>Type pédagogique</AureakText>
          <View style={st.chipRow}>
            <Pressable
              style={[st.chip, sessionType === null && st.chipActive]}
              onPress={() => setSessionType(null)}
            >
              <AureakText style={[st.chipText, sessionType === null ? st.chipTextActive : null] as never}>Aucun</AureakText>
            </Pressable>
            {SESSION_TYPES.map(t => {
              const color    = TYPE_COLOR[t] ?? colors.accent.gold
              const isActive = sessionType === t
              return (
                <Pressable
                  key={t}
                  style={[st.chip, isActive && { borderColor: color, backgroundColor: color + '18' }]}
                  onPress={() => setSessionType(t)}
                >
                  <AureakText style={[st.chipText, isActive ? { color } : null] as never}>
                    {SESSION_TYPE_LABELS[t]}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={st.fieldWrap}>
          <AureakText style={st.fieldLabel}>Terrain</AureakText>
          <View style={st.chipRow}>
            <Pressable style={[st.chip, terrain === '' && st.chipActive]} onPress={() => setTerrain('')}>
              <AureakText style={[st.chipText, terrain === '' ? st.chipTextActive : null] as never}>Aucun</AureakText>
            </Pressable>
            {TERRAINS.map(t => (
              <Pressable key={t} style={[st.chip, terrain === t && st.chipActive]} onPress={() => setTerrain(t)}>
                <AureakText style={[st.chipText, terrain === t ? st.chipTextActive : null] as never}>{t}</AureakText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={st.fieldWrap}>
          <AureakText style={st.fieldLabel}>Statut</AureakText>
          <View style={st.chipRow}>
            {STATUSES.map(({ key, label }) => (
              <Pressable key={key} style={[st.chip, status === key && st.chipActive]} onPress={() => setStatus(key)}>
                <AureakText style={[st.chipText, status === key ? st.chipTextActive : null] as never}>{label}</AureakText>
              </Pressable>
            ))}
          </View>
          {errors['status'] && <AureakText style={st.errorText}>{errors['status']}</AureakText>}
        </View>

        {status === 'annulée' && (
          <View style={st.fieldWrap}>
            <AureakText style={st.fieldLabel}>Motif d'annulation *</AureakText>
            <TextInput
              style={[st.input, errors['cancellationReason'] && st.inputError]}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              placeholder="Indiquer le motif d'annulation…"
              placeholderTextColor={colors.text.muted}
            />
            {errors['cancellationReason'] && (
              <AureakText style={st.errorText}>{errors['cancellationReason']}</AureakText>
            )}
          </View>
        )}

        {session.sessionType && (
          <View style={st.readOnlyField}>
            <AureakText style={st.fieldLabel}>Contenu pédagogique (lecture seule)</AureakText>
            <AureakText style={{ color: colors.accent.gold, fontWeight: '600' as never }}>
              {contentRefLabel(session)}
            </AureakText>
            <AureakText style={{ fontSize: 10, color: colors.text.muted, marginTop: 2 }}>
              L'édition du contenu pédagogique sera disponible dans une prochaine version.
            </AureakText>
          </View>
        )}

        <View style={st.separator} />

        {/* ── Coaches ── */}
        <AureakText style={st.sectionLabel}>COACHES ASSIGNÉS</AureakText>

        {selectedCoaches.length === 0 ? (
          <AureakText style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
            Aucun coach assigné
          </AureakText>
        ) : (
          selectedCoaches.map(c => (
            <View key={c.coachId} style={st.coachRow}>
              <View style={{ flex: 1 }}>
                <AureakText style={st.coachName}>{c.name}</AureakText>
                <AureakText style={st.coachRole}>
                  {c.role === 'lead' ? 'Principal' : c.role === 'assistant' ? 'Assistant' : c.role}
                </AureakText>
              </View>
              <Pressable style={st.removeBtn} onPress={() => removeSelectedCoach(c.coachId)}>
                <AureakText style={st.removeBtnText}>×</AureakText>
              </Pressable>
            </View>
          ))
        )}

        {availableToAdd.length > 0 && (
          <View style={st.addCoachWrap}>
            <AureakText style={st.fieldLabel}>Ajouter un coach</AureakText>
            {availableToAdd.slice(0, 8).map(c => (
              <View key={c.id} style={st.addCoachEntry}>
                <AureakText style={{ flex: 1, fontSize: 12, color: colors.text.dark }}>{c.name}</AureakText>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {COACH_ROLES.map(r => (
                    <Pressable
                      key={r.key}
                      style={[st.chip, { paddingVertical: 2 }]}
                      onPress={() => addCoach(c.id, r.key)}
                    >
                      <AureakText style={st.chipText}>{r.label}</AureakText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={st.separator} />

        {/* ── Notes ── */}
        <AureakText style={st.sectionLabel}>NOTES</AureakText>
        <View style={st.fieldWrap}>
          <AureakText style={st.fieldLabel}>Commentaires (optionnel)</AureakText>
          <TextInput
            style={[st.input, { minHeight: 80, textAlignVertical: 'top' as never }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes libres sur cette séance…"
            placeholderTextColor={colors.text.muted}
            multiline
          />
        </View>

        <View style={st.separator} />

        {/* ── Lecture seule ── */}
        <AureakText style={st.sectionLabel}>INFORMATIONS (LECTURE SEULE)</AureakText>
        <View style={st.readOnlyRow}>
          <AureakText style={st.fieldLabel}>Implantation :</AureakText>
          <AureakText style={{ color: colors.text.muted, fontSize: 12 }}>{session.implantationId}</AureakText>
        </View>
        <View style={st.readOnlyRow}>
          <AureakText style={st.fieldLabel}>Groupe :</AureakText>
          <AureakText style={{ color: colors.text.muted, fontSize: 12 }}>{session.groupId}</AureakText>
        </View>

        {saveError && (
          <View style={st.errorBanner}>
            <AureakText style={st.errorBannerText}>{saveError}</AureakText>
          </View>
        )}

        {/* Footer */}
        <View style={st.footer}>
          <Pressable
            style={[st.btnSecondary, saving && { opacity: 0.6 }]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <AureakText style={st.btnSecondaryText}>Annuler</AureakText>
          </Pressable>
          <Pressable
            style={[st.btnPrimary, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <AureakText style={st.btnPrimaryText}>
              {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </AureakText>
          </Pressable>
        </View>

      </View>
    </ScrollView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container : { flex: 1, backgroundColor: colors.light.primary },
  content   : { padding: space.xl, alignItems: 'center' as never, paddingBottom: 48 },

  breadcrumb     : { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.md, alignSelf: 'flex-start' as never },
  breadcrumbLink : { color: colors.accent.gold, fontWeight: '600' as never },
  breadcrumbSep  : { color: colors.text.muted },
  breadcrumbCurrent: { color: colors.text.muted },

  formCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.xl,
    gap            : space.md,
    width          : '100%',
    maxWidth       : 640,
    boxShadow: shadows.sm,
  } as never,

  sectionLabel: {
    fontSize     : 9,
    fontWeight   : '700' as never,
    letterSpacing: 1,
    color        : colors.text.muted,
    textTransform: 'uppercase' as never,
    marginBottom : 2,
  },

  separator: { height: 1, backgroundColor: colors.border.divider, marginVertical: space.xs },

  fieldWrap : { gap: 4 },
  fieldLabel: { fontSize: 10, fontWeight: '600' as never, color: colors.text.muted, letterSpacing: 0.5 },

  input: {
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderRadius   : radius.xs,
    padding        : space.sm,
    color          : colors.text.dark,
    backgroundColor: colors.light.primary,
    fontSize       : 13,
  },
  inputError: { borderColor: '#DC2626' },

  chipRow : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip    : {
    paddingHorizontal: space.sm,
    paddingVertical  : 5,
    borderRadius     : 20,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  chipActive    : { borderColor: colors.accent.gold, backgroundColor: colors.accent.gold + '18' },
  chipText      : { fontSize: 11, color: colors.text.muted },
  chipTextActive: { color: colors.text.dark, fontWeight: '700' as never },

  errorText  : { fontSize: 10, color: '#DC2626', marginTop: 2 },
  errorBanner: {
    backgroundColor: '#FEE2E2', borderRadius: 6,
    padding: space.sm, borderWidth: 1, borderColor: '#FECACA',
  },
  errorBannerText: { fontSize: 12, color: '#DC2626', fontWeight: '600' as never },

  coachRow   : { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs, borderBottomWidth: 1, borderBottomColor: colors.border.divider },
  coachName  : { fontSize: 13, fontWeight: '600' as never, color: colors.text.dark },
  coachRole  : { fontSize: 10, color: colors.text.muted },
  removeBtn  : { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 16, color: '#DC2626', lineHeight: 20 },

  addCoachWrap : { gap: space.xs },
  addCoachEntry: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },

  readOnlyField: { backgroundColor: colors.light.primary, borderRadius: radius.xs, padding: space.sm, gap: 2 },
  readOnlyRow  : { flexDirection: 'row', gap: space.sm, alignItems: 'center' },

  warningBanner: {
    backgroundColor: '#FEF3C7', borderRadius: 8, padding: space.md,
    borderWidth: 1, borderColor: '#FDE68A', gap: space.sm,
  },

  footer: { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', marginTop: space.sm },

  btnPrimary: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : 7,
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '700' as never, color: colors.text.dark },

  btnSecondary: {
    borderWidth      : 1,
    borderColor      : colors.border.light,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : 7,
  },
  btnSecondaryText: { fontSize: 13, color: colors.text.muted },

  skeleton     : { padding: space.xl, gap: space.md },
  skeletonBlock: { backgroundColor: colors.light.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border.light, opacity: 0.6 },
})
