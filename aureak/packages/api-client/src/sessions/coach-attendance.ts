// Sessions — Workflow Coach Présences & Badges (Story 33.2)

import { supabase } from '../supabase'
import type {
  AttendanceStatus, BehavioralBadge, SessionBadgeAward, SessionPhoto, LateType,
} from '@aureak/types'

// ─── Roster grille ────────────────────────────────────────────────────────────

export type RosterChild = {
  childId       : string
  displayName   : string
  avatarUrl     : string | null
  attendanceType: 'member' | 'trial'
  status        : AttendanceStatus | null
  lateType      : LateType | null
  isGuest       : boolean
}

/**
 * Charge le roster d'une séance avec les statuts de présence actuels.
 * Résout les noms depuis profiles (membres réguliers) et child_directory (essais).
 */
export async function getCoachSessionRoster(
  sessionId: string,
): Promise<{ data: RosterChild[]; error: unknown }> {
  const [attendeesRes, attendancesRes] = await Promise.all([
    supabase
      .from('session_attendees')
      .select('child_id, is_guest, attendance_type')
      .eq('session_id', sessionId),
    supabase
      .from('attendances')
      .select('child_id, status, late_type')
      .eq('session_id', sessionId),
  ])

  if (attendeesRes.error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] getCoachSessionRoster:', attendeesRes.error)
    return { data: [], error: attendeesRes.error }
  }

  type AttendeeRow    = { child_id: string; is_guest: boolean; attendance_type: string }
  type AttendanceRow  = { child_id: string; status: string; late_type: string | null }

  const attendees   = (attendeesRes.data ?? []) as AttendeeRow[]
  const attendances = (attendancesRes.data ?? []) as AttendanceRow[]

  const regularIds = attendees.filter(a => !a.is_guest).map(a => a.child_id)
  const guestIds   = attendees.filter(a =>  a.is_guest).map(a => a.child_id)

  const [profilesRes, dirRes] = await Promise.all([
    regularIds.length > 0
      ? supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', regularIds)
      : Promise.resolve({ data: [] as { user_id: string; display_name: string; avatar_url: string | null }[], error: null }),
    guestIds.length > 0
      ? supabase.from('child_directory').select('id, display_name').in('id', guestIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[], error: null }),
  ])

  const nameMap   = new Map<string, string>()
  const avatarMap = new Map<string, string | null>()

  for (const p of (profilesRes.data ?? []) as { user_id: string; display_name: string; avatar_url: string | null }[]) {
    nameMap.set(p.user_id, p.display_name)
    avatarMap.set(p.user_id, p.avatar_url)
  }
  for (const d of (dirRes.data ?? []) as { id: string; display_name: string }[]) {
    nameMap.set(d.id, d.display_name)
  }

  const attMap = new Map(attendances.map(a => [a.child_id, a]))

  return {
    data: attendees.map(a => {
      const att = attMap.get(a.child_id)
      return {
        childId       : a.child_id,
        displayName   : nameMap.get(a.child_id) ?? a.child_id,
        avatarUrl     : avatarMap.get(a.child_id) ?? null,
        attendanceType: (a.attendance_type ?? 'member') as 'member' | 'trial',
        status        : att ? (att.status as AttendanceStatus) : null,
        lateType      : att?.late_type ? (att.late_type as LateType) : null,
        isGuest       : a.is_guest,
      }
    }),
    error: null,
  }
}

// ─── Marquer présence ────────────────────────────────────────────────────────

export async function markAttendance(params: {
  tenantId  : string
  sessionId : string
  childId   : string
  coachId   : string
  status    : AttendanceStatus
  lateType? : LateType
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('attendances')
    .upsert({
      session_id  : params.sessionId,
      child_id    : params.childId,
      tenant_id   : params.tenantId,
      status      : params.status,
      recorded_by : params.coachId,
      recorded_at : new Date().toISOString(),
      late_type   : params.lateType ?? null,
    }, { onConflict: 'session_id,child_id' })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] markAttendance:', error)
  }
  return { error: error ?? null }
}

// ─── Essai initié par le coach ────────────────────────────────────────────────

export type TrialChildData = {
  firstName : string
  lastName  : string
  birthYear : number
  tenantId  : string
  sessionId : string
  coachId   : string
}

/**
 * Crée un enfant essai initié par le coach.
 * Insère dans child_directory (sans auth) + session_attendees (type=trial).
 * L'admin recevra une alerte pour valider l'ajout.
 */
export async function addTrialByCoach(params: TrialChildData): Promise<{ data: { childId: string } | null; error: unknown }> {
  const displayName = `${params.firstName} ${params.lastName}`.trim()

  // Créer dans child_directory sans compte auth
  const { data: dirData, error: dirErr } = await supabase
    .from('child_directory')
    .insert({
      tenant_id    : params.tenantId,
      display_name : displayName,
      birth_date   : `${params.birthYear}-01-01`,
      statut       : 'Nouveau',
      actif        : true,
    })
    .select('id')
    .single()

  if (dirErr || !dirData) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] addTrialByCoach dir:', dirErr)
    return { data: null, error: dirErr }
  }

  const childId = dirData.id

  // Ajouter à la séance comme essai
  const { error: saErr } = await supabase
    .from('session_attendees')
    .upsert({
      session_id      : params.sessionId,
      child_id        : childId,
      tenant_id       : params.tenantId,
      is_guest        : true,
      attendance_type : 'trial',
    }, { onConflict: 'session_id,child_id' })

  if (saErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] addTrialByCoach attendee:', saErr)
    return { data: null, error: saErr }
  }

  // Créer alerte admin "essai en attente de validation"
  await supabase
    .from('admin_alerts')
    .insert({
      tenant_id   : params.tenantId,
      type        : 'trial_pending_validation',
      entity_id   : childId,
      entity_type : 'child',
      metadata    : {
        displayName,
        sessionId  : params.sessionId,
        coachId    : params.coachId,
        birthYear  : params.birthYear,
      },
      status: 'active',
    })
    .then(({ error: alertErr }) => {
      if (alertErr && process.env.NODE_ENV !== 'production') {
        if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] addTrialByCoach alert:', alertErr)
      }
    })

  return { data: { childId }, error: null }
}

// ─── Badges disponibles ───────────────────────────────────────────────────────

/**
 * Charge les badges disponibles pour une séance :
 * - Comportementaux globaux (tenant_id = null)
 * - Thématiques du tenant actif
 */
export async function listAvailableBadges(
  tenantId: string,
): Promise<{ data: BehavioralBadge[]; error: unknown }> {
  const { data, error } = await supabase
    .from('behavioral_badges')
    .select('*')
    .eq('is_active', true)
    .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
    .order('category')
    .order('name')

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] listAvailableBadges:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map(r => ({
      id       : r['id']        as string,
      tenantId : r['tenant_id'] as string | null,
      name     : r['name']      as string,
      emoji    : r['emoji']     as string,
      category : r['category']  as 'comportemental' | 'thematique',
      isActive : r['is_active'] as boolean,
    })),
    error: null,
  }
}

// ─── Attribuer badge ──────────────────────────────────────────────────────────

export async function awardBadge(params: {
  tenantId  : string
  sessionId : string
  childId   : string
  badgeId   : string
  coachId   : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_badge_awards')
    .upsert({
      tenant_id  : params.tenantId,
      session_id : params.sessionId,
      child_id   : params.childId,
      badge_id   : params.badgeId,
      awarded_by : params.coachId,
      awarded_at : new Date().toISOString(),
    }, { onConflict: 'session_id,child_id,badge_id' })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] awardBadge:', error)
  }
  return { error: error ?? null }
}

// ─── Retirer badge ────────────────────────────────────────────────────────────

export async function removeBadge(params: {
  sessionId : string
  childId   : string
  badgeId   : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_badge_awards')
    .delete()
    .eq('session_id', params.sessionId)
    .eq('child_id', params.childId)
    .eq('badge_id', params.badgeId)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] removeBadge:', error)
  }
  return { error: error ?? null }
}

// ─── Photo souvenir ───────────────────────────────────────────────────────────

export async function uploadSessionPhoto(params: {
  tenantId  : string
  sessionId : string
  coachId   : string
  file      : File
}): Promise<{ data: SessionPhoto | null; error: unknown }> {
  const timestamp  = Date.now()
  const ext        = params.file.name.split('.').pop() ?? 'jpg'
  const storagePath = `session-photos/${params.sessionId}/${timestamp}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('session-media')
    .upload(storagePath, params.file, { upsert: false })

  if (uploadErr) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] uploadSessionPhoto storage:', uploadErr)
    return { data: null, error: uploadErr }
  }

  const { data, error: insertErr } = await supabase
    .from('session_photos')
    .insert({
      tenant_id    : params.tenantId,
      session_id   : params.sessionId,
      storage_path : storagePath,
      taken_by     : params.coachId,
      taken_at     : new Date().toISOString(),
    })
    .select('*')
    .single()

  if (insertErr || !data) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] uploadSessionPhoto insert:', insertErr)
    return { data: null, error: insertErr }
  }

  return {
    data: {
      id          : data['id']           as string,
      tenantId    : data['tenant_id']    as string,
      sessionId   : data['session_id']   as string,
      storagePath : data['storage_path'] as string,
      takenBy     : data['taken_by']     as string,
      takenAt     : data['taken_at']     as string,
    },
    error: null,
  }
}

export async function listSessionPhotos(
  sessionId: string,
): Promise<{ data: SessionPhoto[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_photos')
    .select('*')
    .eq('session_id', sessionId)
    .order('taken_at', { ascending: false })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] listSessionPhotos:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map(r => ({
      id          : r['id']           as string,
      tenantId    : r['tenant_id']    as string,
      sessionId   : r['session_id']   as string,
      storagePath : r['storage_path'] as string,
      takenBy     : r['taken_by']     as string,
      takenAt     : r['taken_at']     as string,
    })),
    error: null,
  }
}

// ─── Dos de carte enfant ──────────────────────────────────────────────────────

export type ChildSessionCard = {
  childId         : string
  displayName     : string
  presentThisMonth: number
  recentBadges    : { badgeName: string; emoji: string; awardedAt: string }[]
  activeTechSignal: { errorObserved: string } | null
  evalDone        : boolean
}

export async function getChildSessionCard(
  childId: string,
  sessionId: string,
): Promise<{ data: ChildSessionCard | null; error: unknown }> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [nameRes, badgesRes, signalRes, evalRes, attendancesRes] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('user_id', childId).maybeSingle(),
    supabase
      .from('session_badge_awards')
      .select('badge_id, awarded_at, behavioral_badges(name, emoji)')
      .eq('child_id', childId)
      .order('awarded_at', { ascending: false })
      .limit(5),
    supabase
      .from('technical_signals')
      .select('error_observed')
      .eq('child_id', childId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('evaluations')
      .select('id')
      .eq('child_id', childId)
      .eq('session_id', sessionId)
      .limit(1),
    supabase
      .from('attendances')
      .select('session_id')
      .eq('child_id', childId)
      .eq('status', 'present')
      .gte('recorded_at', monthStart.toISOString()),
  ])

  if (nameRes.error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] getChildSessionCard:', nameRes.error)
    return { data: null, error: nameRes.error }
  }

  type BadgeAwardRow = {
    badge_id: string; awarded_at: string;
    behavioral_badges: { name: string; emoji: string } | { name: string; emoji: string }[] | null
  }

  const recentBadges = ((badgesRes.data ?? []) as BadgeAwardRow[]).map(r => {
    const badge = Array.isArray(r.behavioral_badges) ? r.behavioral_badges[0] : r.behavioral_badges
    return {
      badgeName : badge?.name  ?? '',
      emoji     : badge?.emoji ?? '',
      awardedAt : r.awarded_at,
    }
  }).filter(b => b.badgeName)

  type SignalRow = { error_observed: string }
  const signal = signalRes.data as SignalRow | null

  return {
    data: {
      childId,
      displayName      : (nameRes.data as { display_name: string } | null)?.display_name ?? childId,
      presentThisMonth : (attendancesRes.data ?? []).length,
      recentBadges,
      activeTechSignal : signal ? { errorObserved: signal.error_observed } : null,
      evalDone         : (evalRes.data ?? []).length > 0,
    },
    error: null,
  }
}

// ─── Badges d'une séance ──────────────────────────────────────────────────────

export async function listSessionBadgeAwards(
  sessionId: string,
): Promise<{ data: (SessionBadgeAward & { badgeName: string; emoji: string })[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_badge_awards')
    .select('*, behavioral_badges(name, emoji)')
    .eq('session_id', sessionId)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[coach-attendance] listSessionBadgeAwards:', error)
    return { data: [], error }
  }

  type Row = {
    id: string; tenant_id: string; session_id: string; child_id: string;
    badge_id: string; awarded_by: string; awarded_at: string;
    behavioral_badges: { name: string; emoji: string } | { name: string; emoji: string }[] | null
  }

  return {
    data: ((data ?? []) as Row[]).map(r => {
      const badge = Array.isArray(r.behavioral_badges) ? r.behavioral_badges[0] : r.behavioral_badges
      return {
        id        : r.id,
        tenantId  : r.tenant_id,
        sessionId : r.session_id,
        childId   : r.child_id,
        badgeId   : r.badge_id,
        awardedBy : r.awarded_by,
        awardedAt : r.awarded_at,
        badgeName : badge?.name  ?? '',
        emoji     : badge?.emoji ?? '',
      }
    }),
    error: null,
  }
}
