// @aureak/api-client — Notifications in-app
// Story tbd-notifs-inapp
import { supabase } from './supabase'

export type InAppNotification = {
  id        : string
  tenantId  : string
  userId    : string
  title     : string
  body      : string
  type      : 'info' | 'warning' | 'success' | 'error'
  readAt    : string | null
  createdAt : string
}

function mapRow(r: Record<string, unknown>): InAppNotification {
  return {
    id       : r['id']        as string,
    tenantId : r['tenant_id'] as string,
    userId   : r['user_id']   as string,
    title    : r['title']     as string,
    body     : r['body']      as string,
    type     : (r['type']     as InAppNotification['type']) ?? 'info',
    readAt   : (r['read_at']  as string | null) ?? null,
    createdAt: r['created_at'] as string,
  }
}

/** Liste les notifications in-app de l'utilisateur courant */
export async function listInAppNotifications(opts: {
  unreadOnly?: boolean
  limit?     : number
} = {}): Promise<{ data: InAppNotification[]; error: unknown }> {
  let query = supabase
    .from('inapp_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)

  if (opts.unreadOnly) {
    query = query.is('read_at', null)
  }

  const { data, error } = await query
  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[notifications] listInAppNotifications:', error)
    return { data: [], error }
  }
  return { data: (data as Record<string, unknown>[]).map(mapRow), error: null }
}

/** Marque une notification comme lue */
export async function markNotificationRead(
  notifId: string,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('inapp_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notifId)
    .is('read_at', null)

  if (error && process.env.NODE_ENV !== 'production') {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[notifications] markNotificationRead:', error)
  }
  return { error }
}

/** Marque toutes les notifications comme lues */
export async function markAllNotificationsRead(): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('inapp_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)

  if (error && process.env.NODE_ENV !== 'production') {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[notifications] markAllNotificationsRead:', error)
  }
  return { error }
}

/** Compte les notifications non lues */
export async function countUnreadNotifications(): Promise<{ count: number; error: unknown }> {
  const { count, error } = await supabase
    .from('inapp_notifications')
    .select('*', { count: 'exact', head: true })
    .is('read_at', null)

  if (error) {
    if ((process.env.NODE_ENV as string) !== 'production') console.error('[notifications] countUnreadNotifications:', error)
    return { count: 0, error }
  }
  return { count: count ?? 0, error: null }
}
