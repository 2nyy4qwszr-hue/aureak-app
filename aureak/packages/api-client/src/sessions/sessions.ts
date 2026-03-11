// Story 4.1 — CRUD sessions
// Story 13.1 — Sessions v2 : sessionType, contentRef, guest management
// Story 13.2 — Calendrier, auto-génération & gestion des exceptions
// Story 13.3 — Mode séance coach, clôture, notes, absence
import { supabase } from '../supabase'
import type {
  Session, SessionCoach, SessionTheme, SessionSituation, SessionAttendee,
  CoachRole, SessionType, SessionContentRef, SchoolCalendarException,
  GPContentRef, TechniqueAcademieContentRef, SituationnelContentRef, EmptyContentRef,
} from '@aureak/types'
import type { Group } from '@aureak/types'
import { SITUATIONAL_BLOC_CODES } from '@aureak/types'

// ─── Row mapper (Supabase snake_case → Session camelCase) ─────────────────────
function mapSession(row: Record<string, unknown>): Session {
  return {
    id                    : row['id']                     as string,
    tenantId              : row['tenant_id']              as string,
    implantationId        : row['implantation_id']        as string,
    groupId               : row['group_id']               as string,
    sessionBlockId        : (row['session_block_id']      as string | null) ?? null,
    recurrenceId          : (row['recurrence_id']         as string | null) ?? null,
    isException           : (row['is_exception']          as boolean) ?? false,
    originalSessionId     : (row['original_session_id']   as string | null) ?? null,
    scheduledAt           : row['scheduled_at']           as string,
    durationMinutes       : row['duration_minutes']       as number,
    location              : (row['location']              as string | null) ?? null,
    status                : row['status']                 as Session['status'],
    attendanceStartedAt   : (row['attendance_started_at'] as string | null) ?? null,
    attendanceCompletedAt : (row['attendance_completed_at'] as string | null) ?? null,
    cancelledAt           : (row['cancelled_at']          as string | null) ?? null,
    cancellationReason    : (row['cancellation_reason']   as string | null) ?? null,
    deletedAt             : (row['deleted_at']            as string | null) ?? null,
    createdAt             : row['created_at']             as string,
    sessionType           : (row['session_type']          as SessionType | null) ?? null,
    contentRef            : (row['content_ref'] ?? {}) as SessionContentRef,
    closedAt              : (row['closed_at']             as string | null) ?? null,
    methodologySessionId  : (row['methodology_session_id'] as string | null) ?? null,
    notes                 : (row['notes']                 as string | null) ?? null,
  }
}

// ─── Session ──────────────────────────────────────────────────────────────────

export type CreateSessionParams = {
  tenantId        : string
  implantationId  : string
  groupId         : string
  scheduledAt     : string
  durationMinutes?: number
  location?       : string
  sessionBlockId? : string
  recurrenceId?   : string
  // Story 13.1
  sessionType?    : SessionType
  contentRef?     : SessionContentRef
}

export async function createSession(
  params: CreateSessionParams
): Promise<{ data: Session | null; error: unknown }> {
  // Ne pas passer tenant_id si vide — la colonne a DEFAULT current_tenant_id()
  const insertRow: Record<string, unknown> = {
    implantation_id : params.implantationId,
    group_id        : params.groupId,
    scheduled_at    : params.scheduledAt,
    duration_minutes: params.durationMinutes ?? 90,
    location        : params.location ?? null,
    session_block_id: params.sessionBlockId ?? null,
    recurrence_id   : params.recurrenceId ?? null,
    // Story 13.1
    session_type    : params.sessionType ?? null,
    content_ref     : params.contentRef ?? {},
  }
  if (params.tenantId) insertRow['tenant_id'] = params.tenantId

  const { data, error } = await supabase
    .from('sessions')
    .insert(insertRow)
    .select()
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapSession(data as Record<string, unknown>), error: null }
}

export async function getSession(
  sessionId: string
): Promise<{ data: Session | null; error: unknown }> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .is('deleted_at', null)
    .single()

  if (error || !data) return { data: null, error }
  return { data: mapSession(data as Record<string, unknown>), error: null }
}

export async function listSessionsByCoach(
  coachId: string
): Promise<{ data: Session[]; error: unknown }> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_coaches!inner(coach_id)
    `)
    .eq('session_coaches.coach_id', coachId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })

  return { data: ((data ?? []) as Record<string, unknown>[]).map(mapSession), error }
}

export async function listUpcomingSessions(params?: {
  implantationId?: string
  groupId?       : string
  status?        : string
}): Promise<{ data: Session[]; error: unknown }> {
  let query = supabase
    .from('sessions')
    .select('*')
    .is('deleted_at', null)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  if (params?.implantationId) query = query.eq('implantation_id', params.implantationId)
  if (params?.groupId)        query = query.eq('group_id', params.groupId)
  if (params?.status)         query = query.eq('status', params.status)

  const { data, error } = await query
  return { data: (data as Session[]) ?? [], error }
}

export type UpdateSessionParams = {
  scheduledAt?        : string
  durationMinutes?    : number
  location?           : string | null
  status?             : string
  // Story 13.1
  sessionType?        : SessionType | null
  contentRef?         : SessionContentRef
  // Story 19.5
  notes?              : string | null
  cancellationReason? : string | null
}

export async function updateSession(
  sessionId: string,
  params   : UpdateSessionParams
): Promise<{ error: unknown }> {
  const updates: Record<string, unknown> = {}
  if (params.scheduledAt)                      updates['scheduled_at']       = params.scheduledAt
  if (params.durationMinutes)                  updates['duration_minutes']    = params.durationMinutes
  if (params.location !== undefined)           updates['location']            = params.location
  if (params.status)                           updates['status']              = params.status
  // Story 13.1
  if (params.sessionType !== undefined)        updates['session_type']        = params.sessionType
  if (params.contentRef !== undefined)         updates['content_ref']         = params.contentRef
  // Story 19.5
  if (params.notes !== undefined)              updates['notes']               = params.notes
  if (params.cancellationReason !== undefined) updates['cancellation_reason'] = params.cancellationReason

  const { error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)

  return { error }
}

export async function cancelSession(
  sessionId         : string,
  cancellationReason: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('sessions')
    .update({
      status             : 'annulée',
      cancelled_at       : new Date().toISOString(),
      cancellation_reason: cancellationReason,
    })
    .eq('id', sessionId)

  return { error }
}

// ─── Session coaches ──────────────────────────────────────────────────────────

export async function assignCoach(
  sessionId: string,
  coachId  : string,
  tenantId : string,
  role     : CoachRole = 'lead'
): Promise<{ data: SessionCoach | null; error: unknown }> {
  const { data, error } = await supabase
    .from('session_coaches')
    .insert({ session_id: sessionId, coach_id: coachId, tenant_id: tenantId, role })
    .select()
    .single()

  return { data: data as SessionCoach | null, error }
}

export async function listSessionCoaches(
  sessionId: string
): Promise<{ data: SessionCoach[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_coaches')
    .select('*')
    .eq('session_id', sessionId)

  const mapped: SessionCoach[] = (data ?? []).map((row: Record<string, unknown>) => ({
    sessionId : row['session_id']  as string,
    coachId   : row['coach_id']    as string,
    tenantId  : row['tenant_id']   as string,
    role      : row['role']        as SessionCoach['role'],
    createdAt : row['created_at']  as string,
  }))
  return { data: mapped, error }
}

// Story 19.5 — Supprimer un coach d'une séance
export async function removeCoach(
  sessionId: string,
  coachId  : string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_coaches')
    .delete()
    .eq('session_id', sessionId)
    .eq('coach_id', coachId)

  return { error }
}

// ─── Session themes & situations ─────────────────────────────────────────────

export async function addSessionTheme(
  sessionId: string,
  themeId  : string,
  tenantId : string,
  sortOrder?: number
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_themes')
    .insert({ session_id: sessionId, theme_id: themeId, tenant_id: tenantId, sort_order: sortOrder ?? null })

  return { error }
}

export async function addSessionSituation(
  sessionId  : string,
  situationId: string,
  tenantId   : string,
  sortOrder? : number
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_situations')
    .insert({ session_id: sessionId, situation_id: situationId, tenant_id: tenantId, sort_order: sortOrder ?? null })

  return { error }
}

export async function listSessionThemes(
  sessionId: string
): Promise<{ data: SessionTheme[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_themes')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as SessionTheme[]) ?? [], error }
}

export async function listSessionSituations(
  sessionId: string
): Promise<{ data: SessionSituation[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_situations')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true, nullsFirst: false })

  return { data: (data as SessionSituation[]) ?? [], error }
}

// ─── Session attendees (Story 13.1) ──────────────────────────────────────────

export async function listSessionAttendees(
  sessionId: string
): Promise<{ data: SessionAttendee[]; error: unknown }> {
  const { data, error } = await supabase
    .from('session_attendees')
    .select('session_id, child_id, tenant_id, is_guest, coach_notes, contact_declined')
    .eq('session_id', sessionId)

  const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
    sessionId      : row['session_id']       as string,
    childId        : row['child_id']         as string,
    tenantId       : row['tenant_id']        as string,
    isGuest        : (row['is_guest']        as boolean) ?? false,
    coachNotes     : (row['coach_notes']     as string | null) ?? null,
    contactDeclined: (row['contact_declined'] as boolean) ?? false,
  })) as SessionAttendee[]

  return { data: mapped, error }
}

/**
 * Ajoute un joueur invité à une séance (is_guest = true, status = 'trial').
 * Le joueur n'a pas besoin d'être membre du groupe.
 */
export async function addGuestToSession(
  sessionId: string,
  childId  : string,
  tenantId : string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_attendees')
    .upsert(
      { session_id: sessionId, child_id: childId, tenant_id: tenantId, is_guest: true },
      { onConflict: 'session_id,child_id', ignoreDuplicates: false }
    )

  return { error }
}

/**
 * Retire un joueur invité d'une séance.
 * Sécurisé : ne supprime que si is_guest = true (ne peut pas retirer un membre régulier).
 */
export async function removeGuestFromSession(
  sessionId: string,
  childId  : string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('session_attendees')
    .delete()
    .eq('session_id', sessionId)
    .eq('child_id', childId)
    .eq('is_guest', true)

  return { error }
}

// ─── Story 13.2 — Calendrier scolaire ────────────────────────────────────────

/** Liste toutes les exceptions de calendrier scolaire pour le tenant courant */
export async function listSchoolCalendarExceptions(): Promise<{ data: SchoolCalendarException[]; error: unknown }> {
  const { data, error } = await supabase
    .from('school_calendar_exceptions')
    .select('*')
    .order('date', { ascending: true })

  const mapped = ((data ?? []) as Record<string, unknown>[]).map(r => ({
    id         : r['id']          as string,
    tenantId   : r['tenant_id']   as string,
    date       : r['date']        as string,
    label      : r['label']       as string,
    isNoSession: r['is_no_session'] as boolean,
    createdAt  : r['created_at']  as string,
  })) as SchoolCalendarException[]

  return { data: mapped, error }
}

/** Ajoute une exception de calendrier */
export async function addSchoolCalendarException(params: {
  date       : string
  label      : string
  isNoSession: boolean
}): Promise<{ data: SchoolCalendarException | null; error: unknown }> {
  const { data, error } = await supabase
    .from('school_calendar_exceptions')
    .insert({
      date        : params.date,
      label       : params.label,
      is_no_session: params.isNoSession,
    })
    .select()
    .single()

  if (error || !data) return { data: null, error }
  const r = data as Record<string, unknown>
  return {
    data: {
      id         : r['id']           as string,
      tenantId   : r['tenant_id']    as string,
      date       : r['date']         as string,
      label      : r['label']        as string,
      isNoSession: r['is_no_session'] as boolean,
      createdAt  : r['created_at']   as string,
    },
    error: null,
  }
}

/** Supprime une exception de calendrier */
export async function removeSchoolCalendarException(
  exceptionId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('school_calendar_exceptions')
    .delete()
    .eq('id', exceptionId)

  return { error }
}

// ─── Story 13.2 — Fonctions utilitaires de contenu ───────────────────────────

/**
 * Calcule le content_ref pour une séance en fonction de son type et de son index
 * dans la séquence annuelle du groupe (0-based).
 */
export function computeContentRef(
  sessionType: SessionType,
  index      : number
): SessionContentRef {
  switch (sessionType) {
    case 'goal_and_player': {
      // 15 entraînements répétés 2× = 30 séances/an
      // index 0-14 = répétition 1 (A), index 15-29 = répétition 2 (B)
      const half   = index < 15 ? 'A' : 'B' as const
      const pos    = index % 15                        // 0-14
      const mod    = Math.floor(pos / 5) + 1           // 1-3
      const seq    = (pos % 5) + 1                     // 1-5
      const repeat = (index < 15 ? 1 : 2) as 1 | 2
      return {
        method      : 'goal_and_player',
        module      : mod,
        sequence    : seq,
        globalNumber: pos + 1,
        half,
        repeat,
      } satisfies GPContentRef
    }

    case 'technique': {
      // 32 séances académie : 8 modules × 4 séances
      const mod  = Math.floor(index / 4) + 1           // 1-8
      const seq  = (index % 4) + 1                     // 1-4
      return {
        method      : 'technique',
        context     : 'academie',
        module      : mod,
        sequence    : seq,
        globalNumber: index + 1,
      } satisfies TechniqueAcademieContentRef
    }

    case 'situationnel': {
      // 7 blocs, 2 séances par bloc, rotation
      const blocCodes = SITUATIONAL_BLOC_CODES
      const blocIndex = Math.floor(index / 2) % blocCodes.length
      const blocCode  = blocCodes[blocIndex]
      // séquence globale dans ce bloc (1, 2, 3, ... après rotation complète)
      const cycleNum  = Math.floor(index / (2 * blocCodes.length))
      const posInCycle= index % 2                      // 0 ou 1
      const seq       = cycleNum * 2 + posInCycle + 1
      const label     = `${blocCode}-${String(seq).padStart(2, '0')}`
      return {
        method  : 'situationnel',
        blocCode,
        sequence: seq,
        label,
      } satisfies SituationnelContentRef
    }

    case 'perfectionnement':
    case 'integration':
    case 'equipe':
    case 'decisionnel':
    default:
      return { method: sessionType as 'perfectionnement' | 'integration' | 'equipe' } satisfies EmptyContentRef
  }
}

/**
 * Génère les drafts de séances pour une plage de dates en excluant les exceptions.
 * Retourne une liste de { date, contentRef } pour chaque occurrence du jour du groupe.
 */
export function buildSessionSequence(
  group       : Pick<Group, 'dayOfWeek' | 'startHour' | 'startMinute' | 'durationMinutes' | 'method'>,
  seasonStart : Date,
  seasonEnd   : Date,
  exceptions  : Set<string>,   // dates ISO 'YYYY-MM-DD' à exclure
  sessionType : SessionType
): Array<{ scheduledAt: string; contentRef: SessionContentRef; durationMinutes: number }> {
  const DAY_MAP: Record<string, number> = {
    Dimanche: 0, Lundi: 1, Mardi: 2, Mercredi: 3,
    Jeudi: 4, Vendredi: 5, Samedi: 6,
  }

  const targetDay = group.dayOfWeek ? (DAY_MAP[group.dayOfWeek] ?? -1) : -1
  if (targetDay === -1) return []

  const hour     = group.startHour    ?? 18
  const minute   = group.startMinute  ?? 0
  const duration = group.durationMinutes ?? 90

  const results: Array<{ scheduledAt: string; contentRef: SessionContentRef; durationMinutes: number }> = []
  let sequenceIndex = 0

  const current = new Date(seasonStart)
  // Avancer jusqu'au premier jour cible
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }

  while (current <= seasonEnd) {
    const dateStr = current.toISOString().split('T')[0]  // 'YYYY-MM-DD'
    if (!exceptions.has(dateStr)) {
      // Construire l'ISO datetime avec heure locale
      const scheduledAt = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
      results.push({
        scheduledAt,
        contentRef    : computeContentRef(sessionType, sequenceIndex),
        durationMinutes: duration,
      })
      sequenceIndex++
    }
    current.setDate(current.getDate() + 7)  // prochaine semaine
  }

  return results
}

// ─── Story 13.2 — Auto-génération des séances annuelles ─────────────────────

export type GenerateYearSessionsResult = {
  created : number
  skipped : string[]  // dates exclues (vacances)
  error?  : { code: 'SESSIONS_ALREADY_EXIST'; existingCount: number } | unknown
}

/**
 * Génère toutes les séances d'un groupe pour une plage de dates.
 * Idempotent : si des séances existent déjà pour ce groupe × plage, retourne une erreur.
 * @param groupId       ID du groupe
 * @param implantationId ID de l'implantation (requis pour INSERT)
 * @param tenantId      ID du tenant
 * @param sessionType   Type pédagogique des séances à créer
 * @param seasonStart   Date de début (YYYY-MM-DD)
 * @param seasonEnd     Date de fin   (YYYY-MM-DD)
 */
export async function generateYearSessions(
  groupId        : string,
  implantationId : string,
  tenantId       : string,
  sessionType    : SessionType,
  seasonStart    : string,
  seasonEnd      : string
): Promise<GenerateYearSessionsResult> {
  // 1. Charger les informations du groupe
  const { data: groupRow, error: groupErr } = await supabase
    .from('groups')
    .select('day_of_week, start_hour, start_minute, duration_minutes, method')
    .eq('id', groupId)
    .single()

  if (groupErr || !groupRow) {
    return { created: 0, skipped: [], error: groupErr ?? new Error('Groupe introuvable') }
  }

  const group: Pick<Group, 'dayOfWeek' | 'startHour' | 'startMinute' | 'durationMinutes' | 'method'> = {
    dayOfWeek      : (groupRow as Record<string, unknown>)['day_of_week']      as string | null,
    startHour      : (groupRow as Record<string, unknown>)['start_hour']       as number | null,
    startMinute    : (groupRow as Record<string, unknown>)['start_minute']     as number | null,
    durationMinutes: (groupRow as Record<string, unknown>)['duration_minutes'] as number | null,
    method         : (groupRow as Record<string, unknown>)['method']           as Group['method'],
  }

  const start = new Date(seasonStart + 'T00:00:00')
  const end   = new Date(seasonEnd + 'T23:59:59')

  // 2. Vérifier idempotence : des séances existent déjà pour ce groupe × plage ?
  const { count, error: countErr } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString())
    .is('deleted_at', null)

  if (countErr) return { created: 0, skipped: [], error: countErr }
  if ((count ?? 0) > 0) {
    return {
      created: 0,
      skipped: [],
      error  : { code: 'SESSIONS_ALREADY_EXIST', existingCount: count ?? 0 },
    }
  }

  // 3. Charger les exceptions de calendrier
  const { data: excData } = await supabase
    .from('school_calendar_exceptions')
    .select('date, is_no_session')
    .gte('date', seasonStart)
    .lte('date', seasonEnd)

  const exceptions = new Set<string>(
    ((excData ?? []) as Record<string, unknown>[])
      .filter(r => r['is_no_session'] === true)
      .map(r => r['date'] as string)
  )
  const skipped = Array.from(exceptions)

  // 4. Calculer la séquence des séances
  const drafts = buildSessionSequence(group, start, end, exceptions, sessionType)
  if (drafts.length === 0) return { created: 0, skipped }

  // 5. INSERT en batches de 50
  const BATCH = 50
  let created  = 0
  for (let i = 0; i < drafts.length; i += BATCH) {
    const batch = drafts.slice(i, i + BATCH).map(d => ({
      tenant_id      : tenantId,
      implantation_id: implantationId,
      group_id       : groupId,
      scheduled_at   : d.scheduledAt,
      duration_minutes: d.durationMinutes,
      status         : 'planifiée',
      session_type   : sessionType,
      content_ref    : d.contentRef,
    }))

    const { error: insertErr } = await supabase.from('sessions').insert(batch)
    if (insertErr) return { created, skipped, error: insertErr }
    created += batch.length
  }

  return { created, skipped }
}

// ─── Story 13.2 — Report et annulation enrichis ──────────────────────────────

/**
 * Reporte une séance à une nouvelle date.
 * Le content_ref ne change pas. Status → 'reportée'.
 */
export async function postponeSession(
  sessionId: string,
  newDate  : string   // ISO datetime ou date 'YYYY-MM-DD'
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('sessions')
    .update({
      scheduled_at: newDate,
      status      : 'reportée',
    })
    .eq('id', sessionId)

  return { error }
}

/**
 * Annule une séance avec raison obligatoire.
 * Pour les types avec contenu séquentiel, les séances suivantes ne sont PAS
 * recalculées automatiquement (MVP : gap visible dans l'UI, log audit).
 * Retourne le nombre de séances "suivantes" affectées (0 en MVP).
 */
export async function cancelSessionWithShift(
  sessionId: string,
  reason   : string
): Promise<{ contentShiftCount: number; error: unknown }> {
  // 1. Récupérer la séance annulée pour obtenir group_id + session_type
  const { data: sessionData, error: fetchErr } = await supabase
    .from('sessions')
    .select('id, group_id, session_type, content_ref, scheduled_at, tenant_id')
    .eq('id', sessionId)
    .single()

  if (fetchErr || !sessionData) {
    return { contentShiftCount: 0, error: fetchErr ?? new Error('Séance introuvable') }
  }

  const row = sessionData as Record<string, unknown>
  const sessionType = row['session_type'] as SessionType | null

  // 2. Annuler la séance
  const { error: cancelErr } = await supabase
    .from('sessions')
    .update({
      status             : 'annulée',
      cancelled_at       : new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', sessionId)

  if (cancelErr) return { contentShiftCount: 0, error: cancelErr }

  // 3. Pour les types avec contenu séquentiel : log audit (MVP — pas de recalcul)
  const SEQUENTIAL_TYPES: SessionType[] = ['goal_and_player', 'technique', 'situationnel']
  if (sessionType && SEQUENTIAL_TYPES.includes(sessionType)) {
    // Compter les séances suivantes planifiées du même groupe/type
    const { count: nextCount } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', row['group_id'] as string)
      .eq('session_type', sessionType)
      .eq('status', 'planifiée')
      .gt('scheduled_at', row['scheduled_at'] as string)
      .is('deleted_at', null)

    // Log audit : contenu potentiellement "perdu" dans la séquence
    await supabase.from('audit_logs').insert({
      tenant_id  : row['tenant_id'],
      entity_type: 'session',
      entity_id  : sessionId,
      action     : 'session_content_lost',
      metadata   : {
        sessionType,
        contentRef       : row['content_ref'],
        groupId          : row['group_id'],
        nextSessionsCount: nextCount ?? 0,
        note             : 'MVP: gap visible dans le calendrier — recalcul manuel possible',
      },
    })

    return { contentShiftCount: 0, error: null }
  }

  return { contentShiftCount: 0, error: null }
}

// ─── Story 13.2 — Requête calendrier mensuel ─────────────────────────────────

export type SessionCalendarRow = {
  id              : string
  scheduledAt     : string
  durationMinutes : number
  status          : string
  location        : string | null
  groupId         : string
  implantationId  : string
  sessionType     : SessionType | null
  contentRef      : SessionContentRef
  cancellationReason: string | null
  // Jointures
  groupName?      : string
  attendanceCount?: number
  rosterCount?    : number
}

/**
 * Liste les séances d'un mois donné pour une implantation.
 * Retourne toutes les séances (planifiées, réalisées, annulées, reportées).
 */
export async function listSessionsCalendar(params: {
  implantationId: string
  year          : number
  month         : number    // 1-12
  groupId?      : string
}): Promise<{ data: SessionCalendarRow[]; error: unknown }> {
  const { implantationId, year, month, groupId } = params

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth   = new Date(year, month, 0, 23, 59, 59)

  let query = supabase
    .from('sessions')
    .select(`
      id, scheduled_at, duration_minutes, status, location,
      group_id, implantation_id, session_type, content_ref, cancellation_reason
    `)
    .eq('implantation_id', implantationId)
    .gte('scheduled_at', startOfMonth.toISOString())
    .lte('scheduled_at', endOfMonth.toISOString())
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })

  if (groupId) query = query.eq('group_id', groupId)

  const { data, error } = await query
  if (error) return { data: [], error }

  const rows = ((data ?? []) as Record<string, unknown>[]).map(r => ({
    id              : r['id']               as string,
    scheduledAt     : r['scheduled_at']     as string,
    durationMinutes : r['duration_minutes'] as number,
    status          : r['status']           as string,
    location        : r['location']         as string | null,
    groupId         : r['group_id']         as string,
    implantationId  : r['implantation_id']  as string,
    sessionType     : r['session_type']     as SessionType | null,
    contentRef      : (r['content_ref'] ?? {}) as SessionContentRef,
    cancellationReason: r['cancellation_reason'] as string | null,
  })) as SessionCalendarRow[]

  return { data: rows, error: null }
}

// ─── Story 13.3 — Clôture coach + notes par joueur + remplacements ────────────

/**
 * Clôture une séance via la RPC `close_session_coach`.
 * Vérifie que toutes les présences sont statués avant de marquer status = 'réalisée'.
 * Idempotent.
 */
export async function closeSessionCoach(
  sessionId: string
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('close_session_coach', {
    p_session_id: sessionId,
  })
  return { error }
}

export type CaptureNewChildParams = {
  firstName       : string
  lastName        : string
  parentEmail?    : string
  parentPhone?    : string
  birthDate?      : string   // 'YYYY-MM-DD'
  contactDeclined?: boolean
}

/**
 * Crée un nouveau joueur dans child_directory (mode essai terrain)
 * et l'ajoute immédiatement à session_attendees comme guest.
 * Retourne l'ID du joueur créé.
 */
export async function captureNewChildDuringSession(
  sessionId   : string,
  tenantId    : string,
  childData   : CaptureNewChildParams
): Promise<{ data: string | null; error: unknown }> {
  // 1. Créer dans child_directory
  const displayName = `${childData.firstName} ${childData.lastName}`.trim()
  const insertRow: Record<string, unknown> = {
    display_name     : displayName,
    tenant_id        : tenantId,
    birth_date       : childData.birthDate ?? null,
    statut           : 'Nouveau',
    contact_declined : childData.contactDeclined ?? false,
    actif            : true,
  }
  if (childData.parentEmail) insertRow['parent1_email'] = childData.parentEmail
  if (childData.parentPhone) insertRow['parent1_tel']   = childData.parentPhone

  const { data: dirRow, error: dirErr } = await supabase
    .from('child_directory')
    .insert(insertRow)
    .select('id')
    .single()

  if (dirErr || !dirRow) return { data: null, error: dirErr }
  const childId = (dirRow as Record<string, unknown>)['id'] as string

  // 2. Ajouter à session_attendees comme guest
  const { error: guestErr } = await supabase
    .from('session_attendees')
    .upsert(
      { session_id: sessionId, child_id: childId, tenant_id: tenantId, is_guest: true },
      { onConflict: 'session_id,child_id', ignoreDuplicates: false }
    )

  if (guestErr) return { data: null, error: guestErr }
  return { data: childId, error: null }
}

/**
 * Sauvegarde une note rapide du coach sur un joueur pour la séance.
 * Mise à jour de session_attendees.coach_notes (max 140 chars).
 */
export async function saveCoachNote(
  sessionId: string,
  childId  : string,
  note     : string
): Promise<{ error: unknown }> {
  const trimmed = note.slice(0, 140)
  const { error } = await supabase
    .from('session_attendees')
    .update({ coach_notes: trimmed })
    .eq('session_id', sessionId)
    .eq('child_id', childId)

  return { error }
}

/**
 * Signale l'absence d'un coach et déclenche le workflow de remplacement
 * via l'Edge Function `coach-absence-handler`.
 */
export async function reportCoachAbsence(
  sessionId: string,
  coachId  : string
): Promise<{ error: unknown }> {
  const { error } = await supabase.functions.invoke('coach-absence-handler', {
    body: { action: 'report_absence', sessionId, coachId },
  })
  return { error }
}

/**
 * Accepte un remplacement de coach pour une séance.
 * Appelle l'Edge Function coach-absence-handler avec action accept_replacement.
 */
export async function acceptReplacement(
  sessionId: string,
  coachId  : string
): Promise<{ error: unknown }> {
  const { error } = await supabase.functions.invoke('coach-absence-handler', {
    body: { action: 'accept_replacement', sessionId, coachId },
  })
  return { error }
}

// ─── Story 19.4 — Vue admin enrichie (Jour/Semaine/Mois/Année) ───────────────

export type SessionRowAdmin = {
  id                : string
  scheduledAt       : string
  durationMinutes   : number
  status            : string
  location          : string | null
  groupId           : string
  implantationId    : string
  sessionType       : SessionType | null
  cancellationReason: string | null
  coaches           : { coachId: string; role: string }[]
}

/**
 * Charge les séances sur une plage de dates pour les vues admin.
 * Si withCoaches = true, inclut les coaches via JOIN (vues Jour et Semaine).
 * Aucun appel N+1 — le JOIN est fait en une seule requête Supabase.
 */
export async function listSessionsAdminView(params: {
  start          : string
  end            : string
  implantationId?: string
  groupId?       : string
  withCoaches    : boolean
}): Promise<{ data: SessionRowAdmin[]; error: unknown }> {
  const selectFields = params.withCoaches
    ? 'id, scheduled_at, duration_minutes, status, location, group_id, implantation_id, session_type, cancellation_reason, session_coaches(coach_id, role)'
    : 'id, scheduled_at, duration_minutes, status, location, group_id, implantation_id, session_type, cancellation_reason'

  let query = supabase
    .from('sessions')
    .select(selectFields)
    .gte('scheduled_at', params.start)
    .lte('scheduled_at', params.end)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })

  if (params.implantationId) query = query.eq('implantation_id', params.implantationId)
  if (params.groupId)        query = query.eq('group_id', params.groupId)

  const { data, error } = await query
  if (error) return { data: [], error }

  return {
    data : ((data ?? []) as Record<string, unknown>[]).map(r => ({
      id                : r['id']                  as string,
      scheduledAt       : r['scheduled_at']        as string,
      durationMinutes   : r['duration_minutes']    as number,
      status            : r['status']              as string,
      location          : r['location']            as string | null,
      groupId           : r['group_id']            as string,
      implantationId    : r['implantation_id']     as string,
      sessionType       : r['session_type']        as SessionType | null,
      cancellationReason: r['cancellation_reason'] as string | null,
      coaches           : params.withCoaches
        ? ((r['session_coaches'] ?? []) as Record<string, string>[]).map(c => ({
            coachId: c['coach_id'],
            role   : c['role'],
          }))
        : [],
    })),
    error: null,
  }
}

/**
 * Résout les noms d'affichage de plusieurs coaches en une seule requête batch.
 * Retourne un Map<coachId, displayName>.
 * Utiliser après listSessionsAdminView pour éviter le pattern N+1.
 */
export async function batchResolveCoachNames(coachIds: string[]): Promise<Map<string, string>> {
  if (coachIds.length === 0) return new Map()
  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', coachIds)
  const map = new Map<string, string>()
  ;((data ?? []) as { user_id: string; display_name: string }[]).forEach(p => {
    map.set(p.user_id, p.display_name)
  })
  return map
}

/**
 * Liste les séances d'un coach qui sont actuellement dans la fenêtre active
 * [scheduled_at - 30min .. scheduled_at + duration + 15min]
 * Retourne les séances 'planifiée' dans cette fenêtre.
 */
export function getActiveSessionsForCoach(
  sessions    : Session[],
  nowOverride?: Date
): Session[] {
  const now = nowOverride ?? new Date()
  return sessions.filter(s => {
    if (s.status !== 'planifiée') return false
    const start      = new Date(s.scheduledAt)
    const preWindow  = new Date(start.getTime() - 30 * 60 * 1000)
    const endWindow  = new Date(start.getTime() + (s.durationMinutes + 15) * 60 * 1000)
    return now >= preWindow && now <= endWindow
  })
}
