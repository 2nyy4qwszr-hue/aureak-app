import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Modal, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  getSessionById, listSessionCoaches, listAttendancesBySession, cancelSessionRpc,
  listSessionAttendees, addGuestToSession, removeGuestFromSession, listChildDirectory,
  postponeSession, cancelSessionWithShift,
} from '@aureak/api-client'
import { AureakButton, AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type { Session, SessionCoach, Attendance, SessionAttendee, ChildDirectoryEntry } from '@aureak/types'

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: colors.light.primary },
  content         : { padding: space.xl, gap: space.lg },
  breadcrumb      : { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs },
  breadcrumbLink  : { color: colors.accent.gold, fontWeight: '600' },
  breadcrumbSep   : { color: colors.text.muted },
  breadcrumbCurrent: { color: colors.text.muted },
  card     : {
    backgroundColor: colors.light.surface,
    borderRadius: 8, padding: space.md,
    borderWidth: 1, borderColor: colors.border.light, gap: space.sm,
    ...shadows.sm,
  },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.border.light, borderRadius: radius.xs,
    padding: space.sm, color: colors.text.dark, backgroundColor: colors.light.primary,
    flex: 1,
  },
})

export default function SessionDetailPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()
  const router = useRouter()
  const [session,     setSession]     = useState<Session | null>(null)
  const [coaches,     setCoaches]     = useState<SessionCoach[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState<string | null>(null)
  // Story 13.1 — Guest players
  const [attendees,   setAttendees]   = useState<SessionAttendee[]>([])
  const [guestSearch, setGuestSearch] = useState('')
  const [guestResults,setGuestResults]= useState<ChildDirectoryEntry[]>([])
  const [showGuestPicker, setShowGuestPicker] = useState(false)
  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError,  setCancelError]  = useState('')
  // Postpone dialog (Story 13.2)
  const [showPostponeDialog, setShowPostponeDialog] = useState(false)
  const [postponeDate,       setPostponeDate      ] = useState('')
  const [postponeError,      setPostponeError     ] = useState('')

  const load = async () => {
    if (!sessionId) {
      setLoadError('Identifiant de séance manquant.')
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const [s, c, a, att] = await Promise.all([
        getSessionById(sessionId),
        listSessionCoaches(sessionId),
        listAttendancesBySession(sessionId),
        listSessionAttendees(sessionId),
      ])
      if (s.error || !s.data) {
        setLoadError('Séance introuvable ou accès refusé.')
        setLoading(false)
        return
      }
      setSession(s.data)
      setCoaches(c.data)
      setAttendances(a.data)
      setAttendees(att.data)
    } catch (err) {
      setLoadError('Erreur lors du chargement de la séance.')
      console.error('[SessionDetail] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sessionId])

  // Guest search
  useEffect(() => {
    if (!guestSearch.trim()) { setGuestResults([]); return }
    listChildDirectory({ search: guestSearch.trim(), pageSize: 8 })
      .then(({ data }) => setGuestResults(data))
      .catch(() => {})
  }, [guestSearch])

  const handleAddGuest = async (child: ChildDirectoryEntry) => {
    if (!sessionId || !session) return
    await addGuestToSession(sessionId, child.id, session.tenantId)
    setGuestSearch('')
    setGuestResults([])
    setShowGuestPicker(false)
    load()
  }

  const handleRemoveGuest = async (childId: string) => {
    if (!sessionId) return
    await removeGuestFromSession(sessionId, childId)
    load()
  }

  // Decode contentRef label for display
  function contentRefLabel(session: Session): string {
    const ref = session.contentRef
    if (!ref || !('method' in ref)) return '—'
    switch (ref.method) {
      case 'goal_and_player':
        return `GP #${(ref as {globalNumber:number}).globalNumber} · ${(ref as {half:string}).half} Rep.${(ref as {repeat:number}).repeat}`
      case 'technique': {
        const r = ref as {context:string; globalNumber?:number; concept?:string; sequence:number}
        return r.context === 'academie'
          ? `Technique #${r.globalNumber}`
          : `Stage ${r.concept} · ${r.sequence}`
      }
      case 'situationnel': {
        const r = ref as {label:string; subtitle?:string; blocCode:string}
        return r.subtitle ? `${r.label} — ${r.subtitle}` : r.label
      }
      case 'decisionnel': {
        const r = ref as {blocks:Array<{title:string}>}
        return `Décisionnel · ${r.blocks.length} bloc${r.blocks.length !== 1 ? 's' : ''}`
      }
      default: return '—'
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Le motif est obligatoire.')
      return
    }
    // Story 13.2 : utilise cancelSessionWithShift (log audit si contenu perdu)
    const { error } = await cancelSessionWithShift(sessionId!, cancelReason.trim())
    if (error) {
      setCancelError((error as Error).message ?? 'Erreur lors de l\'annulation.')
    } else {
      setShowCancelDialog(false)
      load()
    }
  }

  const handlePostpone = async () => {
    if (!postponeDate.trim()) {
      setPostponeError('La nouvelle date est obligatoire.')
      return
    }
    // Construire ISO datetime avec l'heure existante si possible
    const newDate = postponeDate.includes('T') ? postponeDate : `${postponeDate}T${session ? new Date(session.scheduledAt).toTimeString().slice(0,5) : '18:00'}:00`
    const { error } = await postponeSession(sessionId!, newDate)
    if (error) {
      setPostponeError((error as Error).message ?? 'Erreur lors du report.')
    } else {
      setShowPostponeDialog(false)
      setPostponeDate('')
      setPostponeError('')
      load()
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      </View>
    )
  }

  if (loadError || !session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: space.xl }]}>
        <AureakText variant="h3" style={{ color: colors.accent.red ?? '#E05252', marginBottom: space.sm }}>
          Impossible d'afficher la séance
        </AureakText>
        <AureakText variant="body" style={{ color: colors.text.muted, textAlign: 'center' as never }}>
          {loadError ?? 'Séance introuvable.'}
        </AureakText>
        <Pressable
          style={{ marginTop: space.lg, paddingHorizontal: space.md, paddingVertical: space.sm, backgroundColor: colors.accent.gold, borderRadius: 8 }}
          onPress={() => router.push('/seances' as never)}
        >
          <AureakText variant="body" style={{ color: colors.text.dark, fontWeight: '700' as never }}>
            ← Retour aux séances
          </AureakText>
        </Pressable>
      </View>
    )
  }

  const sessionDate = new Date(session.scheduledAt).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Pressable onPress={() => router.push('/seances' as never)}>
          <AureakText variant="caption" style={styles.breadcrumbLink}>Séances</AureakText>
        </Pressable>
        <AureakText variant="caption" style={styles.breadcrumbSep}>/</AureakText>
        <AureakText variant="caption" style={styles.breadcrumbCurrent}>
          {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </AureakText>
      </View>

      <AureakText variant="h2">{sessionDate}</AureakText>

      {/* Infos session */}
      <View style={styles.card}>
        <View style={styles.row}>
          <AureakText variant="label">Statut :</AureakText>
          <Badge label={session.status} variant="zinc" />
          {session.sessionType && (
            <Badge
              label={SESSION_TYPE_LABELS[session.sessionType]}
              variant="goldOutline"
            />
          )}
        </View>
        {session.sessionType && (
          <AureakText variant="body" style={{ color: colors.accent.gold }}>
            Contenu : {contentRefLabel(session)}
          </AureakText>
        )}
        <AureakText variant="body">
          Durée : {session.durationMinutes} min
        </AureakText>
        {session.location && (
          <AureakText variant="body">Lieu : {session.location}</AureakText>
        )}
        {session.status === 'annulée' && session.cancellationReason && (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: 6, padding: space.sm }}>
            <AureakText variant="caption" style={{ color: '#DC2626', fontWeight: '700' as never }}>
              Séance annulée — Contenu décalé (log audit créé)
            </AureakText>
            <AureakText variant="caption" style={{ color: '#DC2626' }}>
              Motif : {session.cancellationReason}
            </AureakText>
          </View>
        )}
        {session.status === 'reportée' && (
          <View style={{ backgroundColor: '#FEF3C7', borderRadius: 6, padding: space.sm }}>
            <AureakText variant="caption" style={{ color: '#D97706', fontWeight: '700' as never }}>
              → Séance reportée
            </AureakText>
            <AureakText variant="caption" style={{ color: '#D97706' }}>
              Nouvelle date : {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </AureakText>
          </View>
        )}
      </View>

      {/* Joueurs invités (Story 13.1) */}
      <View style={styles.card}>
        <View style={styles.row}>
          <AureakText variant="label">Joueurs invités</AureakText>
          <Pressable
            style={{ marginLeft: 'auto' as never, paddingHorizontal: space.sm, paddingVertical: space.xs, backgroundColor: colors.accent.gold + '20', borderRadius: 6, borderWidth: 1, borderColor: colors.accent.gold }}
            onPress={() => setShowGuestPicker(v => !v)}
          >
            <AureakText variant="caption" style={{ color: colors.accent.gold }}>+ Ajouter un gardien</AureakText>
          </Pressable>
        </View>
        {attendees.filter(a => a.isGuest).map(a => (
          <View key={a.childId} style={[styles.row, { justifyContent: 'space-between' as never }]}>
            <AureakText variant="body">{a.childId.slice(0, 16)}… (invité)</AureakText>
            <Pressable onPress={() => handleRemoveGuest(a.childId)}>
              <AureakText variant="caption" style={{ color: '#DC2626' }}>Retirer</AureakText>
            </Pressable>
          </View>
        ))}
        {attendees.filter(a => a.isGuest).length === 0 && !showGuestPicker && (
          <AureakText variant="caption" style={{ color: colors.text.muted }}>Aucun joueur invité</AureakText>
        )}
        {showGuestPicker && (
          <View style={{ gap: space.xs }}>
            <TextInput
              style={styles.input}
              placeholder="Rechercher un joueur par nom…"
              value={guestSearch}
              onChangeText={setGuestSearch}
              autoFocus
            />
            {guestResults.map(child => (
              <Pressable
                key={child.id}
                style={{ paddingVertical: space.sm, paddingHorizontal: space.xs, borderBottomWidth: 1, borderBottomColor: colors.border.divider }}
                onPress={() => handleAddGuest(child)}
              >
                <AureakText variant="body">{child.displayName}</AureakText>
                {child.currentClub && (
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>{child.currentClub}</AureakText>
                )}
              </Pressable>
            ))}
            {guestSearch.trim().length > 0 && guestResults.length === 0 && (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Aucun joueur trouvé</AureakText>
            )}
          </View>
        )}
      </View>

      {/* Coaches */}
      <View style={styles.card}>
        <AureakText variant="label">Coaches</AureakText>
        {coaches.map(c => (
          <AureakText key={c.coachId} variant="body">
            {c.coachId.slice(0, 8)}… ({c.role})
          </AureakText>
        ))}
        {coaches.length === 0 && (
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            Aucun coach assigné
          </AureakText>
        )}
      </View>

      {/* Présences */}
      <View style={styles.card}>
        <AureakText variant="label">Présences ({attendances.length})</AureakText>
        {attendances.map(a => (
          <AureakText key={a.id} variant="body">
            {a.childId.slice(0, 8)}… → {a.status}
          </AureakText>
        ))}
        {attendances.length === 0 && (
          <AureakText variant="caption" style={{ color: colors.text.muted }}>
            Aucune présence enregistrée
          </AureakText>
        )}
      </View>

      {/* Actions (Story 13.2) */}
      {session.status === 'planifiée' && (
        <View style={styles.row}>
          <AureakButton
            label="→ Reporter"
            onPress={() => {
              setPostponeDate(session.scheduledAt.split('T')[0])
              setShowPostponeDialog(true)
            }}
            variant="secondary"
          />
          <AureakButton
            label="✕ Annuler la séance"
            onPress={() => setShowCancelDialog(true)}
            variant="secondary"
          />
        </View>
      )}
      {session.status === 'en_cours' ? (
        <AureakButton
          label="Annuler la séance"
          onPress={() => setShowCancelDialog(true)}
          variant="secondary"
        />
      ) : null}

      {/* Postpone dialog (Story 13.2) */}
      <Modal visible={showPostponeDialog} transparent animationType="fade">
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center', alignItems: 'center', padding: space.xl,
        }}>
          <View style={[styles.card, { width: '100%', maxWidth: 400 }]}>
            <AureakText variant="h3">Reporter la séance</AureakText>
            <AureakText variant="body" style={{ color: colors.text.muted }}>
              Le contenu pédagogique reste inchangé — seule la date change.
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4 }}>
              Nouvelle date (YYYY-MM-DD) :
            </AureakText>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="2026-04-20"
                value={postponeDate}
                onChangeText={setPostponeDate}
              />
            </View>
            {postponeError ? (
              <AureakText variant="caption" style={{ color: '#DC2626' }}>
                {postponeError}
              </AureakText>
            ) : null}
            <View style={styles.row}>
              <AureakButton label="Confirmer le report" onPress={handlePostpone} variant="primary" />
              <AureakButton
                label="Annuler"
                onPress={() => { setShowPostponeDialog(false); setPostponeDate(''); setPostponeError('') }}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel dialog */}
      <Modal visible={showCancelDialog} transparent animationType="fade">
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center', alignItems: 'center', padding: space.xl,
        }}>
          <View style={[styles.card, { width: '100%', maxWidth: 400 }]}>
            <AureakText variant="h3">Annuler la séance</AureakText>
            <AureakText variant="body" style={{ color: colors.text.muted }}>
              Le motif est obligatoire et sera communiqué aux parents.
            </AureakText>
            {session?.sessionType && ['goal_and_player','technique','situationnel'].includes(session.sessionType) && (
              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 6, padding: space.sm }}>
                <AureakText variant="caption" style={{ color: '#D97706', fontWeight: '700' as never }}>
                  ⚠️ Séance avec contenu séquentiel
                </AureakText>
                <AureakText variant="caption" style={{ color: '#D97706' }}>
                  Un log d'audit sera créé pour tracer la perte de contenu dans la séquence pédagogique.
                </AureakText>
              </View>
            )}
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="Motif d'annulation..."
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />
            </View>
            {cancelError ? (
              <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                {cancelError}
              </AureakText>
            ) : null}
            <View style={styles.row}>
              <AureakButton label="Confirmer" onPress={handleCancel} variant="primary" />
              <AureakButton
                label="Annuler"
                onPress={() => { setShowCancelDialog(false); setCancelReason(''); setCancelError('') }}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
