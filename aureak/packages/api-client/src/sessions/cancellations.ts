// @aureak/api-client — Annulations & tampons de séances (Story 32.1)
// Migration 00101

import { supabase } from '../supabase'
import type { CancellationType, BufferStatus, SessionBuffer, SeasonDebt } from '@aureak/types'

const MAX_BUFFERS_PER_SEASON = 3

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapBuffer(row: Record<string, unknown>): SessionBuffer {
  return {
    id          : row.id           as string,
    tenantId    : row.tenant_id    as string,
    groupId     : row.group_id     as string,
    seasonId    : (row.season_id   as string | null) ?? null,
    bufferDate  : row.buffer_date  as string,
    status      : row.status       as BufferStatus,
    createdAt   : row.created_at   as string,
    activatedAt : (row.activated_at as string | null) ?? null,
    sessionId   : (row.session_id  as string | null) ?? null,
  }
}

function mapDebt(row: Record<string, unknown>): SeasonDebt {
  return {
    id             : row.id              as string,
    tenantId       : row.tenant_id       as string,
    groupId        : row.group_id        as string,
    seasonId       : (row.season_id      as string | null) ?? null,
    debtCount      : row.debt_count      as number,
    suspendedCount : row.suspended_count as number,
    updatedAt      : row.updated_at      as string,
  }
}

// ── Annulation avec gestion dette ────────────────────────────────────────────

export type CancelSessionV2Params = {
  sessionId : string
  type      : CancellationType
  reason    : string
  tenantId  : string
  groupId   : string
  seasonId? : string | null
}

/**
 * Annule une séance avec le type Reporter (crée une dette) ou Décaler (pas de dette).
 * Pour Décaler, décale aussi toutes les séances futures du groupe de 7 jours.
 */
export async function cancelSessionV2(params: CancelSessionV2Params): Promise<void> {
  const { sessionId, type, reason, tenantId, groupId, seasonId } = params

  // 1. Annuler la séance
  const { error: cancelError } = await supabase
    .from('sessions')
    .update({
      status            : 'annulée',
      cancelled_at      : new Date().toISOString(),
      cancellation_reason: reason,
      cancellation_type : type,
    })
    .eq('id', sessionId)

  if (cancelError) {
    if (process.env.NODE_ENV !== 'production') console.error('[cancellations] cancelSessionV2:', cancelError)
    throw cancelError
  }

  // 2. Reporter → crée/incrémente la dette
  if (type === 'reporter') {
    await incrementDebt(tenantId, groupId, seasonId ?? null)
  }

  // 3. Décaler → avance toutes les séances futures du groupe de 7 jours
  if (type === 'decaler') {
    await shiftSessionsForward(groupId, sessionId)
  }
}

// ── Dette ─────────────────────────────────────────────────────────────────────

export async function getGroupDebt(groupId: string, seasonId?: string | null): Promise<{
  debt       : SeasonDebt | null
  buffers    : SessionBuffer[]
  canActivate: boolean            // true si disponible et dette > 0
}> {
  const [debtRes, buffersRes] = await Promise.all([
    supabase
      .from('season_debt')
      .select('*')
      .eq('group_id', groupId)
      .eq(seasonId ? 'season_id' : 'season_id', seasonId ?? null)
      .maybeSingle(),
    supabase
      .from('session_buffers')
      .select('*')
      .eq('group_id', groupId)
      .order('buffer_date'),
  ])

  if (debtRes.error && process.env.NODE_ENV !== 'production') console.error('[cancellations] getGroupDebt debt:', debtRes.error)
  if (buffersRes.error && process.env.NODE_ENV !== 'production') console.error('[cancellations] getGroupDebt buffers:', buffersRes.error)

  const debt    = debtRes.data ? mapDebt(debtRes.data as Record<string, unknown>) : null
  const buffers = (buffersRes.data ?? []).map((r) => mapBuffer(r as Record<string, unknown>))
  const available = buffers.filter((b) => b.status === 'available').length
  const canActivate = available > 0 && (debt?.debtCount ?? 0) > 0

  return { debt, buffers, canActivate }
}

async function incrementDebt(tenantId: string, groupId: string, seasonId: string | null): Promise<void> {
  // Vérifier si la dette existe déjà
  const { data: existing } = await supabase
    .from('season_debt')
    .select('id, debt_count, suspended_count')
    .eq('group_id', groupId)
    .eq(seasonId ? 'season_id' : 'season_id', seasonId)
    .maybeSingle()

  if (existing) {
    const currentDebt  = (existing as Record<string, unknown>).debt_count as number
    const currentSusp  = (existing as Record<string, unknown>).suspended_count as number
    // Vérifier combien de tampons sont disponibles
    const { count } = await supabase
      .from('session_buffers')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('status', 'available')
    const available = count ?? 0

    if (currentDebt < MAX_BUFFERS_PER_SEASON && available > 0) {
      // Incrémente dette normale
      const { error } = await supabase
        .from('season_debt')
        .update({ debt_count: currentDebt + 1, updated_at: new Date().toISOString() })
        .eq('id', (existing as Record<string, unknown>).id as string)
      if (error && process.env.NODE_ENV !== 'production') console.error('[cancellations] incrementDebt update:', error)
    } else {
      // Plafond atteint → incrémente suspendue
      const { error } = await supabase
        .from('season_debt')
        .update({ suspended_count: currentSusp + 1, updated_at: new Date().toISOString() })
        .eq('id', (existing as Record<string, unknown>).id as string)
      if (error && process.env.NODE_ENV !== 'production') console.error('[cancellations] incrementDebt suspend:', error)
    }
  } else {
    // Créer une nouvelle entrée de dette
    const { error } = await supabase
      .from('season_debt')
      .insert({
        tenant_id       : tenantId,
        group_id        : groupId,
        season_id       : seasonId,
        debt_count      : 1,
        suspended_count : 0,
      })
    if (error && process.env.NODE_ENV !== 'production') console.error('[cancellations] incrementDebt insert:', error)
  }
}

// ── Décalage programme ────────────────────────────────────────────────────────

/**
 * Décale de 7 jours toutes les séances planifiées futures du groupe,
 * à l'exclusion de la séance annulée elle-même.
 */
export async function shiftSessionsForward(groupId: string, excludeSessionId: string): Promise<void> {
  // Récupérer toutes les séances futures du groupe
  const { data, error } = await supabase
    .from('sessions')
    .select('id, scheduled_at')
    .eq('group_id', groupId)
    .eq('status', 'planifiée')
    .neq('id', excludeSessionId)
    .gt('scheduled_at', new Date().toISOString())
    .is('deleted_at', null)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[cancellations] shiftSessionsForward:', error)
    throw error
  }

  if (!data || data.length === 0) return

  // Décaler chaque séance de 7 jours
  for (const session of data) {
    const row = session as Record<string, unknown>
    const current = new Date(row.scheduled_at as string)
    current.setDate(current.getDate() + 7)
    await supabase
      .from('sessions')
      .update({ scheduled_at: current.toISOString() })
      .eq('id', row.id as string)
  }
}

// ── Tampons ───────────────────────────────────────────────────────────────────

export async function listSessionBuffers(
  groupId  : string,
  seasonId?: string | null,
): Promise<SessionBuffer[]> {
  let q = supabase
    .from('session_buffers')
    .select('*')
    .eq('group_id', groupId)
    .order('buffer_date')

  if (seasonId != null) q = q.eq('season_id', seasonId)

  const { data, error } = await q
  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[cancellations] listSessionBuffers:', error)
    throw error
  }
  return (data ?? []).map((r) => mapBuffer(r as Record<string, unknown>))
}

export async function createSessionBuffer(
  tenantId  : string,
  groupId   : string,
  bufferDate: string,        // 'YYYY-MM-DD'
  seasonId? : string | null,
): Promise<SessionBuffer> {
  const { data, error } = await supabase
    .from('session_buffers')
    .insert({
      tenant_id  : tenantId,
      group_id   : groupId,
      season_id  : seasonId ?? null,
      buffer_date: bufferDate,
      status     : 'available',
    })
    .select()
    .single()

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('[cancellations] createSessionBuffer:', error)
    throw error
  }
  return mapBuffer(data as Record<string, unknown>)
}

/**
 * Active un tampon : crée la séance de rattrapage, décrémente la dette, notifie les parents.
 */
export async function activateBuffer(
  bufferId : string,
  tenantId : string,
  groupId  : string,
  seasonId?: string | null,
): Promise<SessionBuffer> {
  const now = new Date().toISOString()

  // 1. Récupérer le tampon
  const { data: bufferData, error: fetchError } = await supabase
    .from('session_buffers')
    .select('*')
    .eq('id', bufferId)
    .single()

  if (fetchError || !bufferData) {
    if (process.env.NODE_ENV !== 'production') console.error('[cancellations] activateBuffer fetch:', fetchError)
    throw fetchError ?? new Error('Tampon introuvable')
  }

  const buffer = mapBuffer(bufferData as Record<string, unknown>)

  // 2. Créer la séance de rattrapage (statut planifiée)
  const { data: newSession, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      tenant_id       : tenantId,
      group_id        : groupId,
      scheduled_at    : `${buffer.bufferDate}T10:00:00+00:00`,
      duration_minutes: 90,
      status          : 'planifiée',
      cancellation_reason: null,
    })
    .select('id')
    .single()

  if (sessionError) {
    if (process.env.NODE_ENV !== 'production') console.error('[cancellations] activateBuffer createSession:', sessionError)
    throw sessionError
  }

  // 3. Marquer le tampon comme activé
  const { data: updatedBuffer, error: updateError } = await supabase
    .from('session_buffers')
    .update({
      status      : 'activated',
      activated_at: now,
      session_id  : (newSession as Record<string, unknown>).id,
    })
    .eq('id', bufferId)
    .select()
    .single()

  if (updateError) {
    if (process.env.NODE_ENV !== 'production') console.error('[cancellations] activateBuffer update:', updateError)
    throw updateError
  }

  // 4. Décrémenter la dette
  const { data: debtData } = await supabase
    .from('season_debt')
    .select('id, debt_count')
    .eq('group_id', groupId)
    .eq(seasonId ? 'season_id' : 'season_id', seasonId ?? null)
    .maybeSingle()

  if (debtData) {
    const currentDebt = (debtData as Record<string, unknown>).debt_count as number
    await supabase
      .from('season_debt')
      .update({ debt_count: Math.max(0, currentDebt - 1), updated_at: now })
      .eq('id', (debtData as Record<string, unknown>).id as string)
  }

  return mapBuffer(updatedBuffer as Record<string, unknown>)
}

// Note : reportCoachAbsence est dans sessions.ts (Edge Function coach-absence-handler)
