// Parent — Préférences et historique de notifications (ARCH-1)
// Consolide les 3 accès Supabase directs de parent/notifications/index.tsx

import { supabase } from '../supabase'

export type NotificationPreferences = {
  pushEnabled : boolean
  emailEnabled: boolean
  smsEnabled  : boolean
}

export type NotificationLog = {
  id       : string
  eventType: string
  channel  : string
  status   : string
  urgency  : 'routine' | 'urgent'
  sentAt   : string
}

/** Charge les préférences de notification d'un utilisateur */
export async function getNotificationPreferences(
  userId: string,
): Promise<{ data: NotificationPreferences | null; error: unknown }> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('push_enabled, email_enabled, sms_enabled')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return { data: null, error }
  const p = data as { push_enabled: boolean; email_enabled: boolean; sms_enabled: boolean }
  return {
    data : { pushEnabled: p.push_enabled, emailEnabled: p.email_enabled, smsEnabled: p.sms_enabled },
    error: null,
  }
}

/** Charge l'historique des 20 dernières notifications reçues */
export async function listNotificationLogs(
  userId: string,
): Promise<{ data: NotificationLog[]; error: unknown }> {
  const { data, error } = await supabase
    .from('notification_send_log')
    .select('id, event_type, channel, status, urgency, sent_at')
    .eq('recipient_id', userId)
    .order('sent_at', { ascending: false })
    .limit(20)

  if (error) return { data: [], error }

  const logs: NotificationLog[] = ((data ?? []) as {
    id: string; event_type: string; channel: string; status: string; urgency: string; sent_at: string
  }[]).map(l => ({
    id       : l.id,
    eventType: l.event_type,
    channel  : l.channel,
    status   : l.status,
    urgency  : l.urgency as 'routine' | 'urgent',
    sentAt   : l.sent_at,
  }))

  return { data: logs, error: null }
}

/** Sauvegarde les préférences de notification (upsert) */
export async function saveNotificationPreferences(
  userId  : string,
  tenantId: string,
  prefs   : NotificationPreferences,
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id      : userId,
        tenant_id    : tenantId,
        push_enabled : prefs.pushEnabled,
        email_enabled: prefs.emailEnabled,
        sms_enabled  : prefs.smsEnabled,
        updated_at   : new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  return { error }
}
