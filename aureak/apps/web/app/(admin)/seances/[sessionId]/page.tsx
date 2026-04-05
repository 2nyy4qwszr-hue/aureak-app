import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, TextInput, Modal, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  resolveProfileDisplayNames,
  getSessionById, listSessionCoaches, listAttendancesBySession,
  listSessionAttendees, addGuestToSession, removeGuestFromSession, listChildDirectory,
  postponeSession, cancelSessionWithShift, getChildDirectoryEntry,
  listSessionThemeBlocks, listSessionWorkshops,
  listGroupMembersWithDetails,
  addSessionThemeBlock, removeSessionThemeBlock, listMethodologyThemes,
} from '@aureak/api-client'
import { AureakButton, AureakText, Badge } from '@aureak/ui'
import { colors, space, shadows, radius, methodologyMethodColors } from '@aureak/theme'
import { SESSION_TYPE_LABELS } from '@aureak/types'
import type { Session, SessionCoach, Attendance, SessionAttendee, ChildDirectoryEntry, SessionThemeBlock, SessionWorkshop, GroupMemberWithDetails, MethodologyTheme } from '@aureak/types'
import { contentRefLabel } from '../_utils'

const STATUS_LABEL: Record<string, string> = {
  planifiée: 'Planifiée', en_cours: 'En cours', réalisée: 'Réalisée',
  annulée: 'Annulée', reportée: 'Reportée',
}
const STATUS_VARIANT: Record<string, 'gold' | 'present' | 'zinc' | 'attention'> = {
  planifiée: 'gold', en_cours: 'present', réalisée: 'zinc',
  annulée: 'attention', reportée: 'gold',
}

// Story 47.3 — Styles actions rapides
const actSt = StyleSheet.create({
  quickBtn: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignItems: 'center' as never,
  },
})

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
    boxShadow: shadows.sm,
  } as never,
  backBtn: { paddingBottom: 4 },
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
  // Story 21.2 — Theme blocks
  const [themeBlocks,   setThemeBlocks]  = useState<SessionThemeBlock[]>([])
  // Story 49.2 — Theme picker (édition post-création)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [availableThemes, setAvailableThemes] = useState<MethodologyTheme[]>([])
  const [addingTheme,     setAddingTheme]     = useState(false)
  const [themeAddError,   setThemeAddError]   = useState<string | null>(null)
  const [removingThemeId, setRemovingThemeId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  // Story 21.3 — Workshops
  const [workshops,     setWorkshops]    = useState<SessionWorkshop[]>([])
  // Story 46.1 — Group members
  const [groupMembers,  setGroupMembers] = useState<GroupMemberWithDetails[]>([])
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
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const [s, c, a, att, tb, ws] = await Promise.all([
        getSessionById(sessionId),
        listSessionCoaches(sessionId),
        listAttendancesBySession(sessionId),
        listSessionAttendees(sessionId),
        listSessionThemeBlocks(sessionId),
        listSessionWorkshops(sessionId),
      ])
      if (s.error || !s.data) {
        setLoadError('Séance introuvable ou accès refusé.')
        return
      }
      setSession(s.data)
      setCoaches(c.data)
      setAttendances(a.data)
      setAttendees(att.data)
      setThemeBlocks(tb)
      setWorkshops(ws)

      // Story 46.1 — Load group members if group is set
      if (s.data.groupId) {
        const members = await listGroupMembersWithDetails(s.data.groupId)
        const sorted = [...members].sort((a, b) =>
          a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' })
        )
        setGroupMembers(sorted)
      } else {
        setGroupMembers([])
      }

      // Resolve coach names from profiles
      if (c.data.length > 0) {
        const ids = c.data.map((coach: SessionCoach) => coach.coachId)
        const { data: cMap } = await resolveProfileDisplayNames(ids)
        setCoachNameMap(cMap)
      }

      // Resolve guest names from child_directory
      const guests = att.data.filter((x: SessionAttendee) => x.isGuest)
      if (guests.length > 0) {
        const entries = await Promise.all(guests.map((g: SessionAttendee) => getChildDirectoryEntry(g.childId)))
        const map: Record<string, string> = {}
        entries.forEach((e, i) => { if (e) map[guests[i].childId] = e.displayName })
        setGuestNameMap(map)
      }

      // Resolve non-guest child names for attendances
      if (a.data.length > 0) {
        const guestSet = new Set(guests.map((g: SessionAttendee) => g.childId))
        const nonGuestIds = (a.data as Attendance[])
          .filter(x => !guestSet.has(x.childId)).map(x => x.childId)
        if (nonGuestIds.length > 0) {
          const { data: kMap } = await resolveProfileDisplayNames(nonGuestIds)
          setChildNameMap(kMap)
        }
      }
    } catch (err) {
      setLoadError('Erreur lors du chargement de la séance.')
      if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] load error:', err)
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
        .catch(err => { if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] guestSearch error:', err) })
    }, 300)
    return () => clearTimeout(timer)
  }, [guestSearch])

  // Story 49.2 — Theme picker handlers
  const handleOpenThemePicker = async () => {
    setThemeAddError(null)
    if (availableThemes.length === 0) {
      const all = await listMethodologyThemes({ activeOnly: true })
      setAvailableThemes(all)
    }
    setShowThemePicker(true)
  }

  const handleAddTheme = async (themeId: string) => {
    if (!session || !sessionId) return
    setAddingTheme(true)
    setThemeAddError(null)
    try {
      const { data, error } = await addSessionThemeBlock({
        sessionId,
        tenantId : session.tenantId,
        themeId,
        sortOrder: themeBlocks.length,
      })
      if (error || !data) {
        setThemeAddError(error ?? 'Erreur inconnue')
        return
      }
      const theme = availableThemes.find(t => t.id === themeId)
      setThemeBlocks(prev => [...prev, { ...data, themeName: theme?.title }])
      setShowThemePicker(false)
    } finally {
      setAddingTheme(false)
    }
  }

  const handleRemoveTheme = async (blockId: string) => {
    setRemovingThemeId(blockId)
    const snapshot = [...themeBlocks]
    setThemeBlocks(prev => prev.filter(b => b.id !== blockId)) // optimistic
    try {
      const { error } = await removeSessionThemeBlock(blockId)
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error('[SessionDetail] removeThemeBlock error:', error)
        setThemeBlocks(snapshot) // rollback
      }
    } finally {
      setRemovingThemeId(null)
      setConfirmRemoveId(null)
    }
  }

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

  // Story 46.1 — Avatar initials helper
  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  // Story 46.1 — Age from birth_date
  const getAge = (birthDate: string | null): string => {
    if (!birthDate) return ''
    const birth = new Date(birthDate)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
    return `${age} ans`
  }

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

      {/* Back button */}
      <Pressable onPress={() => router.push('/seances' as never)} style={styles.backBtn}>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>← Séances</AureakText>
      </Pressable>

      {/* Story 21.1 — titre auto-généré s'il existe (AC8 : h1), sinon date */}
      <AureakText variant="h1">{session.label ?? sessionDate}</AureakText>
      {session.label && (
        <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: -space.xs }}>
          {sessionDate}
        </AureakText>
      )}

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
        {session.contextType && (
          <AureakText variant="body" style={{ color: colors.text.muted }}>
            Contexte : {session.contextType === 'academie' ? '🏫 Académie' : '🏕️ Stage'}
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

      {/* Joueurs du groupe (Story 46.1) */}
      <View style={styles.card}>
        {session.groupId ? (
          <>
            <AureakText variant="label">
              {`Joueurs du groupe (${groupMembers.length})`}
            </AureakText>
            {groupMembers.length === 0 ? (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Aucun joueur dans ce groupe
              </AureakText>
            ) : (
              groupMembers.map(member => (
                <View key={member.childId} style={[styles.row, { paddingVertical: 4 }]}>
                  {/* Avatar initiales */}
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: colors.accent.gold + '30',
                    borderWidth: 1, borderColor: colors.accent.gold + '60',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <AureakText style={{ fontSize: 12, fontWeight: '700' as never, color: colors.accent.gold }}>
                      {initials(member.displayName)}
                    </AureakText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AureakText variant="body" style={{ fontWeight: '600' as never }}>
                      {member.displayName}
                    </AureakText>
                    {member.birthDate ? (
                      <AureakText variant="caption" style={{ color: colors.text.muted }}>
                        {getAge(member.birthDate)}
                      </AureakText>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <AureakText variant="label">Joueurs du groupe</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
              Séance ponctuelle — aucun groupe fixe
            </AureakText>
          </>
        )}
      </View>

      {/* Thèmes pédagogiques (Story 21.2 + Story 49.2 édition post-création) */}
      {!loading && (
        <View style={styles.card}>
          {/* Header avec bouton d'ajout */}
          <View style={[styles.row, { justifyContent: 'space-between' as never }]}>
            <AureakText variant="label">Thèmes pédagogiques</AureakText>
            <Pressable
              style={{
                paddingHorizontal: space.sm, paddingVertical: space.xs,
                backgroundColor: colors.accent.gold + '20',
                borderRadius: 6, borderWidth: 1, borderColor: colors.accent.gold,
                opacity: addingTheme ? 0.6 : 1,
              }}
              onPress={handleOpenThemePicker}
              disabled={addingTheme}
            >
              <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                {addingTheme ? '…' : '+ Ajouter un thème'}
              </AureakText>
            </Pressable>
          </View>

          {/* Liste des blocs existants */}
          {themeBlocks.length > 0 ? themeBlocks.map((b, i) => (
            <View key={b.id}>
              {/* Ligne thème */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.xs, paddingVertical: 2 }}>
                <AureakText variant="caption" style={{ color: colors.text.muted, minWidth: 18 }}>{i + 1}.</AureakText>
                <View style={{ flex: 1 }}>
                  <AureakText variant="body">{b.themeName ?? b.themeId}</AureakText>
                  {b.sequenceName && (
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      Séquence : {b.sequenceName}
                    </AureakText>
                  )}
                  {b.resourceLabel && (
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      Ressource : {b.resourceLabel}
                    </AureakText>
                  )}
                </View>
                {/* Bouton Retirer */}
                {removingThemeId !== b.id && confirmRemoveId !== b.id && (
                  <Pressable onPress={() => setConfirmRemoveId(b.id)}>
                    <AureakText variant="caption" style={{ color: colors.accent.red ?? '#E05252' }}>Retirer</AureakText>
                  </Pressable>
                )}
                {removingThemeId === b.id && (
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>…</AureakText>
                )}
              </View>
              {/* Confirmation inline */}
              {confirmRemoveId === b.id && removingThemeId !== b.id && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: space.xs,
                  backgroundColor: '#FEE2E2', borderRadius: 6, padding: space.xs,
                  marginLeft: 22,
                }}>
                  <AureakText variant="caption" style={{ color: '#DC2626', flex: 1 }}>
                    Retirer ce thème ?
                  </AureakText>
                  <Pressable
                    style={{ paddingHorizontal: space.xs, paddingVertical: 2, backgroundColor: '#DC2626', borderRadius: 4 }}
                    onPress={() => handleRemoveTheme(b.id)}
                  >
                    <AureakText variant="caption" style={{ color: '#FFFFFF', fontWeight: '700' as never }}>Confirmer</AureakText>
                  </Pressable>
                  <Pressable
                    style={{ paddingHorizontal: space.xs, paddingVertical: 2, borderWidth: 1, borderColor: '#DC2626', borderRadius: 4 }}
                    onPress={() => setConfirmRemoveId(null)}
                  >
                    <AureakText variant="caption" style={{ color: '#DC2626' }}>Annuler</AureakText>
                  </Pressable>
                </View>
              )}
            </View>
          )) : (
            <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
              Aucun thème associé
            </AureakText>
          )}

          {/* Picker inline */}
          {showThemePicker && (
            <View style={{
              marginTop: space.xs,
              borderWidth: 1, borderColor: colors.border.light,
              borderRadius: radius.xs,
              backgroundColor: colors.light.surface,
              boxShadow: shadows.md,
              maxHeight: 280,
              overflow: 'hidden' as never,
            }}>
              <View style={{ padding: space.xs, borderBottomWidth: 1, borderBottomColor: colors.border.divider, flexDirection: 'row', justifyContent: 'space-between' as never, alignItems: 'center' }}>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  Sélectionner un thème
                </AureakText>
                <Pressable onPress={() => setShowThemePicker(false)}>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>✕</AureakText>
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 230 }}>
                {availableThemes.filter(t => !themeBlocks.map(b => b.themeId).includes(t.id)).map(t => {
                  const methodColor = t.method
                    ? (methodologyMethodColors as Record<string, string>)[t.method] ?? colors.text.muted
                    : null
                  return (
                    <Pressable
                      key={t.id}
                      style={({ pressed }: { pressed: boolean }) => ({
                        paddingVertical: space.sm, paddingHorizontal: space.sm,
                        borderBottomWidth: 1, borderBottomColor: colors.border.divider,
                        flexDirection: 'row', alignItems: 'center', gap: space.xs,
                        backgroundColor: pressed ? colors.light.hover : colors.light.surface,
                      })}
                      onPress={() => handleAddTheme(t.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <AureakText variant="body">{t.title}</AureakText>
                      </View>
                      {methodColor && (
                        <View style={{
                          paddingHorizontal: 6, paddingVertical: 2,
                          borderRadius: 4,
                          backgroundColor: methodColor + '25',
                          borderWidth: 1, borderColor: methodColor + '70',
                        }}>
                          <AureakText style={{ fontSize: 10, fontWeight: '600' as never, color: methodColor }}>
                            {t.method}
                          </AureakText>
                        </View>
                      )}
                    </Pressable>
                  )
                })}
                {availableThemes.filter(t => !themeBlocks.map(b => b.themeId).includes(t.id)).length === 0 && (
                  <View style={{ padding: space.sm }}>
                    <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>
                      Tous les thèmes actifs sont déjà associés
                    </AureakText>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Erreur ajout */}
          {themeAddError && (
            <AureakText variant="caption" style={{ color: colors.accent.red ?? '#E05252', marginTop: space.xs }}>
              {themeAddError}
            </AureakText>
          )}
        </View>
      )}

      {/* Ateliers (Story 21.3) */}
      {!loading && workshops.length > 0 && (
        <View style={styles.card}>
          <AureakText variant="label">Ateliers ({workshops.length})</AureakText>
          {workshops.map((w, i) => (
            <View key={w.id} style={{ gap: 2, paddingVertical: 4, borderBottomWidth: i < workshops.length - 1 ? 1 : 0, borderBottomColor: colors.border.divider }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.accent.gold + '20', borderWidth: 1, borderColor: colors.accent.gold + '50' }}>
                  <AureakText style={{ fontSize: 10, fontWeight: '700' as never, color: colors.accent.gold }}>Atelier {i + 1}</AureakText>
                </View>
                <AureakText variant="body" style={{ fontWeight: '600' as never }}>{w.title}</AureakText>
              </View>
              {w.pdfUrl && (
                <Pressable onPress={() => (window as never as Window & { open: (u: string, t: string) => void }).open(w.pdfUrl!, '_blank')}>
                  <AureakText variant="caption" style={{ color: colors.accent.gold }}>📄 Voir PDF →</AureakText>
                </Pressable>
              )}
              {w.cardLabel && (
                <AureakText variant="caption" style={{ color: colors.text.muted }}>🃏 {w.cardLabel}</AureakText>
              )}
              {w.notes && (
                <AureakText variant="caption" style={{ color: colors.text.muted, fontStyle: 'italic' as never }}>{w.notes}</AureakText>
              )}
            </View>
          ))}
        </View>
      )}

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

      {/* Actions rapides (Story 47.3) — accès direct présences & évaluations */}
      <View style={styles.card}>
        <AureakText variant="label">Actions rapides</AureakText>
        <View style={styles.row}>
          <Pressable
            style={actSt.quickBtn}
            onPress={() => router.push(`/(admin)/presences?sessionId=${sessionId}` as never)}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' as never }}>
              📋 Gérer les présences
            </AureakText>
          </Pressable>
          <Pressable
            style={actSt.quickBtn}
            onPress={() => router.push(`/(admin)/evaluations?sessionId=${sessionId}` as never)}
          >
            <AureakText variant="caption" style={{ color: colors.text.dark, fontWeight: '600' as never }}>
              ⭐ Voir les évaluations
            </AureakText>
          </Pressable>
        </View>
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
