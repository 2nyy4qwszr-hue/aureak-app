// Parent — Présences Heatmap & Badges Historique (Story 33.3)

import { supabase } from '../supabase'
import type {
  AbsenceJustification, AbsenceReason, AttendanceHeatmapEntry, ChildBadgeHistory,
  HeatmapStatus,
} from '@aureak/types'

// ─── Justification d'absence ──────────────────────────────────────────────────

export async function submitAbsenceJustification(params: {
  tenantId  : string
  childId   : string
  sessionId : string
  reason    : AbsenceReason
  note?     : string
  parentId  : string
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('absence_justifications')
    .upsert({
      tenant_id    : params.tenantId,
      child_id     : params.childId,
      session_id   : params.sessionId,
      reason       : params.reason,
      note         : params.note ?? null,
      submitted_by : params.parentId,
      submitted_at : new Date().toISOString(),
    }, { onConflict: 'child_id,session_id' })

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[attendance-heatmap] submitAbsenceJustification:', error)
  }
  return { error: error ?? null }
}

export async function getAbsenceJustification(
  childId  : string,
  sessionId: string,
): Promise<{ data: AbsenceJustification | null; error: unknown }> {
  const { data, error } = await supabase
    .from('absence_justifications')
    .select('*')
    .eq('child_id', childId)
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[attendance-heatmap] getAbsenceJustification:', error)
    return { data: null, error }
  }

  if (!data) return { data: null, error: null }

  return {
    data: {
      id          : data['id']           as string,
      tenantId    : data['tenant_id']    as string,
      childId     : data['child_id']     as string,
      sessionId   : data['session_id']   as string,
      reason      : data['reason']       as AbsenceReason,
      note        : data['note']         as string | null,
      submittedBy : data['submitted_by'] as string,
      submittedAt : data['submitted_at'] as string,
    },
    error: null,
  }
}

// ─── Heatmap assiduité ────────────────────────────────────────────────────────

export async function getChildAttendanceHeatmap(
  childId  : string,
  seasonId?: string,
): Promise<{ data: AttendanceHeatmapEntry[]; error: unknown }> {
  let query = supabase
    .from('v_child_attendance_heatmap')
    .select('*')
    .eq('child_id', childId)
    .order('session_date', { ascending: false })
    .limit(365)

  // Filter by season via date range if seasonId provided
  // If not, load last 6 months
  if (!seasonId) {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    query = query.gte('session_date', sixMonthsAgo.toISOString().slice(0, 10))
  }

  const { data, error } = await query

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[attendance-heatmap] getChildAttendanceHeatmap:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map(r => ({
      childId             : r['child_id']             as string,
      tenantId            : r['tenant_id']            as string,
      sessionDate         : r['session_date']         as string,
      sessionId           : r['session_id']           as string,
      groupId             : r['group_id']             as string,
      rawStatus           : r['raw_status']           as string,
      justificationReason : r['justification_reason'] as AbsenceReason | null,
      heatmapStatus       : r['heatmap_status']       as HeatmapStatus,
    })),
    error: null,
  }
}

// ─── Stats présence ───────────────────────────────────────────────────────────

export type AttendanceStats = {
  total          : number
  present        : number
  absent         : number
  justified      : number
  injured        : number
  attendanceRate : number | null   // % sur total (excluant blessures)
  qualityRate    : number | null   // % sur (total - justified - injured)
}

export function computeAttendanceStats(entries: AttendanceHeatmapEntry[]): AttendanceStats {
  const total    = entries.length
  const present  = entries.filter(e => e.heatmapStatus === 'present').length
  const absent   = entries.filter(e => e.heatmapStatus === 'absent').length
  const justified = entries.filter(e => e.heatmapStatus === 'justified').length
  const injured  = entries.filter(e => e.heatmapStatus === 'injured').length

  const attendanceBase  = total
  const qualityBase     = total - justified - injured

  return {
    total,
    present,
    absent,
    justified,
    injured,
    attendanceRate : attendanceBase > 0 ? Math.round((present / attendanceBase) * 100) : null,
    qualityRate    : qualityBase > 0 ? Math.round((present / qualityBase) * 100) : null,
  }
}

// ─── Historique badges ────────────────────────────────────────────────────────

export async function getChildBadgeHistory(
  childId: string,
): Promise<{ data: ChildBadgeHistory[]; error: unknown }> {
  const { data, error } = await supabase
    .from('v_child_badge_history')
    .select('*')
    .eq('child_id', childId)
    .order('session_date', { ascending: false })
    .limit(200)

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[attendance-heatmap] getChildBadgeHistory:', error)
    return { data: [], error }
  }

  return {
    data: (data ?? []).map(r => ({
      childId      : r['child_id']       as string,
      tenantId     : r['tenant_id']      as string,
      badgeId      : r['badge_id']       as string,
      badgeName    : r['badge_name']     as string,
      emoji        : r['emoji']          as string,
      sessionId    : r['session_id']     as string,
      sessionDate  : r['session_date']   as string,
      awardedBy    : r['awarded_by']     as string,
      awardedByName: r['awarded_by_name'] as string,
    })),
    error: null,
  }
}

// ─── Photo souvenir ───────────────────────────────────────────────────────────

export type SessionPhotoPublic = {
  sessionId   : string
  storagePath : string
  takenAt     : string
  publicUrl   : string
}

export async function getSessionPhoto(
  sessionId: string,
): Promise<{ data: SessionPhotoPublic | null; error: unknown }> {
  const { data, error } = await supabase
    .from('session_photos')
    .select('session_id, storage_path, taken_at')
    .eq('session_id', sessionId)
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[attendance-heatmap] getSessionPhoto:', error)
    return { data: null, error }
  }

  if (!data) return { data: null, error: null }

  const { data: { publicUrl } } = supabase.storage
    .from('session-media')
    .getPublicUrl(data['storage_path'] as string)

  return {
    data: {
      sessionId   : data['session_id']   as string,
      storagePath : data['storage_path'] as string,
      takenAt     : data['taken_at']     as string,
      publicUrl,
    },
    error: null,
  }
}
