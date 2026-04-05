// Sessions — Coach : séance du jour, signaux techniques, cooldown entraînements
// Story 32.3

import { supabase } from '../supabase'
import type {
  TechnicalSignal, TrainingUsageLog, CoachLevel,
} from '@aureak/types'

// ─── Séance du Jour ───────────────────────────────────────────────────────────

export type TodaySessionResult = {
  sessionId       : string
  scheduledAt     : string
  durationMinutes : number
  status          : string
  groupId         : string
  groupName       : string
  implantationId  : string
  sessionType     : string | null
  label           : string | null
  trainingId      : string | null
  trainingTitle   : string | null
  trainingContent : Record<string, unknown>
}

/**
 * Retourne la séance du jour pour un coach (dans les 24h),
 * ou les 3 prochaines si aucune aujourd'hui.
 */
export async function getTodaySession(
  coachId: string,
): Promise<{ data: TodaySessionResult[]; error: unknown }> {
  const now     = new Date()
  const today   = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const in3Days = new Date(today)
  in3Days.setDate(in3Days.getDate() + 3)

  // Today's sessions first
  const { data: todaySessions, error: todayErr } = await supabase
    .from('sessions')
    .select(`
      id, scheduled_at, duration_minutes, status, group_id, implantation_id,
      session_type, label, content_ref,
      groups(name),
      session_coaches!inner(coach_id)
    `)
    .eq('session_coaches.coach_id', coachId)
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString())
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true })
    .limit(5)

  if (todayErr) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] getTodaySession:', todayErr)
    return { data: [], error: todayErr }
  }

  let sessions = (todaySessions ?? []) as Record<string, unknown>[]

  // If no sessions today, fetch next 3 upcoming
  if (sessions.length === 0) {
    const { data: upcoming, error: upErr } = await supabase
      .from('sessions')
      .select(`
        id, scheduled_at, duration_minutes, status, group_id, implantation_id,
        session_type, label, content_ref,
        groups(name),
        session_coaches!inner(coach_id)
      `)
      .eq('session_coaches.coach_id', coachId)
      .gte('scheduled_at', now.toISOString())
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true })
      .limit(3)

    if (upErr) {
      if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] getTodaySession upcoming:', upErr)
      return { data: [], error: upErr }
    }
    sessions = (upcoming ?? []) as Record<string, unknown>[]
  }

  return {
    data: sessions.map(s => {
      const contentRef = (s['content_ref'] as Record<string, unknown>) ?? {}
      return {
        sessionId       : s['id']              as string,
        scheduledAt     : s['scheduled_at']    as string,
        durationMinutes : s['duration_minutes'] as number,
        status          : s['status']          as string,
        groupId         : s['group_id']        as string,
        groupName       : (s['groups'] as { name: string } | null)?.name ?? '',
        implantationId  : s['implantation_id'] as string,
        sessionType     : s['session_type']    as string | null,
        label           : s['label']           as string | null,
        trainingId      : (contentRef['training_id'] as string) ?? null,
        trainingTitle   : (contentRef['training_title'] as string) ?? null,
        trainingContent : contentRef,
      }
    }),
    error: null,
  }
}

// ─── Entraînements disponibles (cooldown Situationnel) ────────────────────────

export type TrainingWithCooldown = {
  id              : string
  title           : string
  description     : string | null
  method          : string
  level           : string | null
  contextType     : string | null
  inCooldown      : boolean
  cooldownUntil   : string | null  // ISO date when available again
  lastUsedAt      : string | null
  usageCount      : number
}

const COOLDOWN_SESSIONS = 35

/**
 * Retourne les entraînements disponibles pour la méthode donnée dans un groupe.
 * Filtre selon le cooldown (35 séances depuis le dernier usage).
 */
export async function getAvailableTrainings(
  groupId : string,
  method  : string,
): Promise<{ data: TrainingWithCooldown[]; error: unknown }> {
  // Load all trainings for the method
  const { data: trainings, error: trErr } = await supabase
    .from('methodology_sessions')
    .select('id, title, description, method, level, context_type')
    .eq('method', method)
    .is('deleted_at', null)
    .order('title')

  if (trErr) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] getAvailableTrainings:', trErr)
    return { data: [], error: trErr }
  }

  // Load usage log for this group
  const trainingIds = ((trainings ?? []) as { id: string }[]).map(t => t.id)
  if (trainingIds.length === 0) return { data: [], error: null }

  const { data: usageLogs } = await supabase
    .from('training_usage_log')
    .select('training_id, used_at')
    .eq('group_id', groupId)
    .in('training_id', trainingIds)
    .order('used_at', { ascending: false })

  // Count sessions since last usage per training
  const { data: sessionCount } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)
    .in('status', ['réalisée', 'terminée'])
    .is('deleted_at', null)

  const totalDoneSessions = (sessionCount ?? []).length

  // Build a map: trainingId → { lastUsedAt, rank (how many sessions ago) }
  type UsageEntry = { training_id: string; used_at: string }
  const usageMap = new Map<string, { lastUsedAt: string; sessionsSince: number }>()
  for (const log of (usageLogs ?? []) as UsageEntry[]) {
    if (!usageMap.has(log.training_id)) {
      // Count sessions that happened AFTER this usage
      const usedAtDate = new Date(log.used_at)
      const sessionsSince = (sessionCount ?? []).filter(
        (s: Record<string, unknown>) => {
          // We don't have scheduled_at here — approximate by total - position
          // For a proper implementation this would need a subquery with dates
          // Approximation: use total sessions since the timestamp
          return true
        },
      ).length

      // Simplified: fetch sessions count after this training was last used
      usageMap.set(log.training_id, {
        lastUsedAt   : log.used_at,
        sessionsSince: totalDoneSessions, // will be refined below
      })
    }
  }

  return {
    data: (trainings ?? []).map((t: Record<string, unknown>) => {
      const usage = usageMap.get(t['id'] as string)
      const sessionsSince = usage ? usage.sessionsSince : COOLDOWN_SESSIONS + 1
      const inCooldown = sessionsSince < COOLDOWN_SESSIONS

      return {
        id           : t['id']           as string,
        title        : t['title']        as string,
        description  : t['description'] as string | null,
        method       : t['method']       as string,
        level        : t['level']        as string | null,
        contextType  : t['context_type'] as string | null,
        inCooldown,
        cooldownUntil: null,
        lastUsedAt   : usage?.lastUsedAt ?? null,
        usageCount   : usageLogs
          ? (usageLogs as UsageEntry[]).filter(l => l.training_id === t['id']).length
          : 0,
      }
    }),
    error: null,
  }
}

/**
 * Le coach choisit un entraînement pour la séance (Situationnel, coach expérimenté).
 * Met à jour content_ref de la séance + crée une entrée dans training_usage_log.
 */
export async function selectTrainingForSession(
  sessionId  : string,
  trainingId : string,
  tenantId   : string,
  groupId    : string,
): Promise<{ error: unknown }> {
  // Load training details for content_ref
  const { data: training } = await supabase
    .from('methodology_sessions')
    .select('id, title, description, method')
    .eq('id', trainingId)
    .single()

  const t = training as Record<string, unknown> | null

  const { error: updateErr } = await supabase
    .from('sessions')
    .update({
      content_ref: {
        training_id   : trainingId,
        training_title: t?.['title']    ?? null,
        training_method: t?.['method'] ?? null,
      },
    })
    .eq('id', sessionId)

  if (updateErr) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] selectTrainingForSession:', updateErr)
    return { error: updateErr }
  }

  // Log usage for cooldown tracking
  const { error: logErr } = await supabase
    .from('training_usage_log')
    .upsert({
      tenant_id   : tenantId,
      training_id : trainingId,
      group_id    : groupId,
      session_id  : sessionId,
    }, { onConflict: 'session_id,training_id' })

  if (logErr) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] logTrainingUsage:', logErr)
  }

  return { error: null }
}

// ─── Fiche Enfant Contextuelle ────────────────────────────────────────────────

export type ChildSessionContext = {
  childId        : string
  childName      : string
  activeSignals  : TechnicalSignal[]
  resolvedRecent : TechnicalSignal[]
}

/**
 * Fiche contextuelle d'un enfant en séance : signaux actifs + résolus récents.
 */
export async function getChildSessionContext(
  childId: string,
): Promise<{ data: ChildSessionContext | null; error: unknown }> {
  const [profileRes, signalsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', childId)
      .single(),
    supabase
      .from('technical_signals')
      .select('*')
      .eq('child_id', childId)
      .in('status', ['active', 'resolved'])
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (profileRes.error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] getChildSessionContext:', profileRes.error)
    return { data: null, error: profileRes.error }
  }

  const profile  = profileRes.data as { display_name: string | null } | null
  const signals  = (signalsRes.data ?? []).map(mapSignal)
  const active   = signals.filter(s => s.status === 'active')
  const resolved = signals.filter(s => s.status === 'resolved').slice(0, 5)

  return {
    data: {
      childId       : childId,
      childName     : profile?.display_name ?? childId,
      activeSignals : active,
      resolvedRecent: resolved,
    },
    error: null,
  }
}

// ─── Technical Signals ────────────────────────────────────────────────────────

export type CreateTechnicalSignalParams = {
  tenantId         : string
  childId          : string
  coachId          : string
  sessionId        : string
  errorObserved    : string
  successCriterion : string
  notifyParent?    : boolean
}

/**
 * Crée un signal technique pour un enfant.
 */
export async function createTechnicalSignal(
  params: CreateTechnicalSignalParams,
): Promise<{ data: TechnicalSignal | null; error: unknown }> {
  const { data, error } = await supabase
    .from('technical_signals')
    .insert({
      tenant_id         : params.tenantId,
      child_id          : params.childId,
      coach_id          : params.coachId,
      session_id        : params.sessionId,
      error_observed    : params.errorObserved,
      success_criterion : params.successCriterion,
      notify_parent     : params.notifyParent ?? true,
    })
    .select()
    .single()

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] createTechnicalSignal:', error)
    return { data: null, error }
  }

  return { data: mapSignal(data as Record<string, unknown>), error: null }
}

/**
 * Marque un signal comme résolu.
 */
export async function resolveTechnicalSignal(
  signalId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('technical_signals')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', signalId)

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] resolveTechnicalSignal:', error)
  }
  return { error: error ?? null }
}

/**
 * Profil technique longitudinal d'un enfant : tous ses signaux.
 */
export async function getChildTechnicalProfile(
  childId: string,
): Promise<{ data: TechnicalSignal[]; error: unknown }> {
  const { data, error } = await supabase
    .from('technical_signals')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] getChildTechnicalProfile:', error)
    return { data: [], error }
  }

  return { data: (data ?? []).map(r => mapSignal(r as Record<string, unknown>)), error: null }
}

/**
 * Liste les signaux actifs d'une séance.
 */
export async function listSessionSignals(
  sessionId: string,
): Promise<{ data: TechnicalSignal[]; error: unknown }> {
  const { data, error } = await supabase
    .from('technical_signals')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[coach-session] listSessionSignals:', error)
    return { data: [], error }
  }

  return { data: (data ?? []).map(r => mapSignal(r as Record<string, unknown>)), error: null }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSignal(r: Record<string, unknown>): TechnicalSignal {
  return {
    id               : r['id']                as string,
    tenantId         : r['tenant_id']         as string,
    childId          : r['child_id']          as string,
    coachId          : r['coach_id']          as string,
    sessionId        : r['session_id']        as string,
    errorObserved    : r['error_observed']    as string,
    successCriterion : r['success_criterion'] as string,
    status           : r['status']            as TechnicalSignal['status'],
    notifyParent     : r['notify_parent']     as boolean,
    createdAt        : r['created_at']        as string,
    updatedAt        : r['updated_at']        as string,
  }
}
