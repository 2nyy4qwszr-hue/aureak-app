// Story 5.5 — Timeline admin : historique event_log + restauration
import { supabase } from '../supabase'

export type TimelineEvent = {
  id          : string
  eventType   : string
  occurredAt  : string
  source      : string
  deviceId    : string | null
  payload     : Record<string, unknown>
  actorId     : string
  actorName   : string | null
}

export type AttendanceSnapshot = {
  childId    : string
  sessionId  : string
  status     : string
  recordedAt : string | null
  updatedAt  : string | null
}

export type AttendanceTimeline = {
  snapshot: AttendanceSnapshot | null
  events  : TimelineEvent[]
}

export async function getAttendanceTimeline(
  sessionId : string,
  childId   : string,
  filters?  : { source?: string; from?: string; to?: string },
): Promise<{ data: AttendanceTimeline; error: unknown }> {
  const [snapshotResult, eventsResult] = await Promise.all([
    supabase
      .from('attendances')
      .select('child_id, session_id, status, recorded_at, updated_at')
      .eq('session_id', sessionId)
      .eq('child_id', childId)
      .maybeSingle(),

    (() => {
      let q = supabase
        .from('event_log')
        .select('id, event_type, occurred_at, source, device_id, payload, actor_id, profiles!actor_id(display_name)')
        .eq('entity_type', 'attendance')
        .filter('payload->>session_id', 'eq', sessionId)
        .filter('payload->>child_id', 'eq', childId)
        .order('occurred_at', { ascending: false })

      if (filters?.source) q = q.eq('source', filters.source)
      if (filters?.from)   q = q.gte('occurred_at', filters.from)
      if (filters?.to)     q = q.lte('occurred_at', filters.to)
      return q
    })(),
  ])

  const snapshot = snapshotResult.data
    ? {
        childId   : snapshotResult.data.child_id as string,
        sessionId : snapshotResult.data.session_id as string,
        status    : snapshotResult.data.status as string,
        recordedAt: snapshotResult.data.recorded_at as string | null,
        updatedAt : snapshotResult.data.updated_at as string | null,
      }
    : null

  const events: TimelineEvent[] = ((eventsResult.data ?? []) as unknown[]).map((row) => {
    const r = row as {
      id: string; event_type: string; occurred_at: string; source: string
      device_id: string | null; payload: Record<string, unknown>; actor_id: string
      profiles: { display_name: string | null } | { display_name: string | null }[] | null
    }
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    return {
      id        : r.id,
      eventType : r.event_type,
      occurredAt: r.occurred_at,
      source    : r.source,
      deviceId  : r.device_id,
      payload   : r.payload,
      actorId   : r.actor_id,
      actorName : profile?.display_name ?? null,
    }
  })

  return {
    data : { snapshot, events },
    error: snapshotResult.error ?? eventsResult.error,
  }
}

export async function restoreAttendance(
  sessionId            : string,
  childId              : string,
  restoredStatus       : string,
  restoredFromEventId  : string,
): Promise<{ data: unknown; error: unknown }> {
  const { data, error } = await supabase.rpc('restore_attendance', {
    p_session_id            : sessionId,
    p_child_id              : childId,
    p_restored_status       : restoredStatus,
    p_restored_from_event_id: restoredFromEventId,
  })
  return { data, error }
}

export async function markConflictsReviewed(
  sessionId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('mark_conflicts_reviewed', {
    p_session_id: sessionId,
  })
  return { error }
}
