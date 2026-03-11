import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Modal, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  supabase,
  getSessionById, listSessionCoaches, listAttendancesBySession,
  listSessionAttendees, addGuestToSession, removeGuestFromSession, listChildDirectory,
  postponeSession, cancelSessionWithShift, getChildDirectoryEntry,
} from '@aureak/api-client'
import { AureakButton, AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type { Session, SessionCoach, Attendance, SessionAttendee, ChildDirectoryEntry } from '@aureak/types'

const STATUS_LABEL: Record<string, string> = {
  planifiée: 'Planifiée', en_cours: 'En cours', réalisée: 'Réalisée',
  annulée: 'Annulée', reportée: 'Reportée',
}
const STATUS_VARIANT: Record<string, 'gold' | 'present' | 'zinc' | 'attention'> = {
  planifiée: 'gold', en_cours: 'present', réalisée: 'zinc',
  annulée: 'attention', reportée: 'gold',
}

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
  const { sessionId, updated } = useLocalSearchParams<{ sessionId: string; updated?: string }>()
  const router = useRouter()
  const [session,     setSession]     = useState<Session | null>(null)
  const [coaches,     setCoaches]     = useState<SessionCoach[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState<string | null>(null)
  // Story 19.5 — Toast après modification
  const [showUpdatedToast, setShowUpdatedToast] = useState(updated === 'true')
  // Story 13.1 — Guest players
  const [attendees,     setAttendees]    = useState<SessionAttendee[]>([])
  const [guestNameMap,  setGuestNameMap] = useState<Record<string, string>>({})
  const [coachNameMap,  setCoachNameMap] = useState<Record<string, string>>({})
  const [childNameMap,  setChildNameMap] = useState<Record<string, string>>({})
  const [guestSearch,   setGuestSearch]  = useState('')
  const [guestResults, setGuestResults]= useState<ChildDirectoryEntry[]>([])
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

      // Resolve coach names from profiles
      if (c.data.length > 0) {
        const ids = c.data.map((coach: SessionCoach) => coach.coachId)
        const { data: cProfiles } = await supabase
          .from('profiles').select('user_id, display_name').in('user_id', ids)
        const cMap: Record<string, string> = {}
        ;(cProfiles ?? []).forEach((p: { user_id: string; display_name: string }) => { cMap[p.user_id] = p.display_name })
        setCoachNameMap(cMap)
      }

      // Resolve guest names from child_directory
      const guests = att.data.filter((x: SessionAttendee) => x.isGuest)
      if (guests.length > 0) {
        const entries = await Promise.all(guests.map((g: SessionAttendee) => getChildDirectoryEntry(g.childId)))
        const map: Record<string, string> = {}
        entries.forEach((e, i) => { if (e.data) map[guests[i].childId] = e.data.displayName })
        setGuestNameMap(map)
      }

      // Resolve non-guest child names for attendances
      if (a.data.length > 0) {
        const guestSet = new Set(guests.map((g: SessionAttendee) => g.childId))
        const nonGuestIds = (a.data as Attendance[])
          .filter(x => !guestSet.has(x.childId)).map(x => x.childId)
        if (nonGuestIds.length > 0) {
          const { data: kProfiles } = await supabase
            .from('profiles').select('user_id, display_name').in('user_id', nonGuestIds)
          const kMap: Record<string, string> = {}
          ;(kProfiles ?? []).forEach((p: { user_id: string; display_name: string }) => { kMap[p.user_id] = p.display_name })
          setChildNameMap(kMap)
        }
      }
    } catch (err) {
      setLoadError('Erreur lors du chargement de la séance.')
      console.error('[SessionDetail] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sessionId])

  // Guest search — debounced 300ms, min 2 chars
  useEffect(() => {
    if (guestSearch.trim().length < 2) { setGuestResults([]); return }
    const timer = setTimeout(() => {
      listChildDirectory({ search: guestSearch.trim(), pageSize: 8 })
        .then(({ data }) => setGuestResults(data))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [guestSearch])

  const handleAddGuest = async (child: ChildDirectoryEntry) => {
    if (!sessionId || !session) return
    await addGuestToSession(sessionId, child.id, session.tenantId)
    setGuestNameMap(prev => ({ ...prev, [child.id]: child.displayName }))
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
    const existingTime = session
      ? `${String(new Date(session.scheduledAt).getHours()).padStart(2,'0')}:${String(new Date(session.scheduledAt).getMinutes()).padStart(2,'0')}`
      : '18:00'
    const newDate = postponeDate.includes('T') ? postponeDate : `${postponeDate}T${existingTime}:00`
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
      {/* Toast mise à jour (Story 19.5) */}
      {showUpdatedToast && (
        <View style={{ backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 8, padding: space.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AureakText variant="caption" style={{ color: '#065F46', fontWeight: '700' as never }}>
            ✓ Séance mise à jour avec succès
          </AureakText>
          <Pressable onPress={() => setShowUpdatedToast(false)}>
            <AureakText variant="caption" style={{ color: '#065F46' }}>×</AureakText>
          </Pressable>
        </View>
      )}

      {/* Breadcrumb */}
      <View style={[styles.breadcrumb, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
          <Pressable onPress={() => router.push('/seances' as never)}>
            <AureakText variant="caption" style={styles.breadcrumbLink}>Séances</AureakText>
          </Pressable>
          <AureakText variant="caption" style={styles.breadcrumbSep}>/</AureakText>
          <AureakText variant="caption" style={styles.breadcrumbCurrent}>
            {new Date(session.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </AureakText>
        </View>
        {/* Story 19.5 — Bouton Modifier (masqué si séance réalisée) */}
        {session.status !== 'réalisée' && (
          <Pressable
            style={{ backgroundColor: colors.light.surface, borderWidth: 1, borderColor: colors.border.light, borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: 4 }}
            onPress={() => router.push(`/seances/${sessionId}/edit` as never)}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' as never }}>
              ✏️ Modifier
            </AureakText>
          </Pressable>
        )}
      </View>

      <AureakText variant="h2">{sessionDate}</AureakText>

      {/* Infos session */}
      <View style={styles.card}>
        <View style={styles.row}>
          <AureakText variant="label">Statut :</AureakText>
          <Badge
            label={STATUS_LABEL[session.status] ?? session.status}
            variant={STATUS_VARIANT[session.status] ?? 'zinc'}
          />
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
              La date affichée ci-dessus est la nouvelle date de cette séance.
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
            <AureakText variant="body">{guestNameMap[a.childId] ?? a.childId.slice(0, 16) + '…'} (invité)</AureakText>
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
            {coachNameMap[c.coachId] ?? c.coachId.slice(0, 8) + '…'} ({c.role})
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
        {attendances.map(a => {
          const name = guestNameMap[a.childId] ?? childNameMap[a.childId] ?? a.childId.slice(0, 8) + '…'
          const statusLabel: Record<string, string> = {
            present: 'Présent', absent: 'Absent', late: 'En retard',
            trial: 'Essai', injured: 'Blessé',
          }
          return (
            <AureakText key={a.id} variant="body">
              {name} → {statusLabel[a.status] ?? a.status}
            </AureakText>
          )
        })}
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
            variant="danger"
          />
        </View>
      )}
      {session.status === 'en_cours' ? (
        <AureakButton
          label="Annuler la séance"
          onPress={() => setShowCancelDialog(true)}
          variant="danger"
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
              <AureakText variant="caption" style={{ color: colors.accent.red }}>
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
