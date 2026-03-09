'use client'
// Préférences de notification du parent
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Switch } from 'react-native'
import { supabase } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space } from '@aureak/theme'

type NotifPrefs = {
  pushEnabled : boolean
  emailEnabled: boolean
  smsEnabled  : boolean
}

type NotifLog = {
  id        : string
  eventType : string
  channel   : string
  status    : string
  urgency   : 'routine' | 'urgent'
  sentAt    : string
}

const CHANNEL_LABEL: Record<string, string> = {
  push : 'Notification push',
  email: 'Email',
  sms  : 'SMS',
}

const EVENT_LABEL: Record<string, string> = {
  session_reminder     : 'Rappel de séance',
  absence_alert        : 'Alerte absence',
  evaluation_available : 'Évaluation disponible',
  top_seance           : 'Top séance',
  ticket_reply         : 'Réponse ticket support',
}

export default function NotificationsPage() {
  const user     = useAuthStore(s => s.user)
  const tenantId = useAuthStore(s => s.tenantId)

  const [prefs,   setPrefs]   = useState<NotifPrefs>({ pushEnabled: true, emailEnabled: true, smsEnabled: false })
  const [logs,    setLogs]    = useState<NotifLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const [prefsRes, logsRes] = await Promise.all([
        supabase
          .from('notification_preferences')
          .select('push_enabled, email_enabled, sms_enabled')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('notification_send_log')
          .select('id, event_type, channel, status, urgency, sent_at')
          .eq('recipient_id', user.id)
          .order('sent_at', { ascending: false })
          .limit(20),
      ])

      if (prefsRes.data) {
        const p = prefsRes.data as { push_enabled: boolean; email_enabled: boolean; sms_enabled: boolean }
        setPrefs({ pushEnabled: p.push_enabled, emailEnabled: p.email_enabled, smsEnabled: p.sms_enabled })
      }

      setLogs(
        ((logsRes.data ?? []) as {
          id: string; event_type: string; channel: string; status: string; urgency: string; sent_at: string
        }[]).map(l => ({
          id       : l.id,
          eventType: l.event_type,
          channel  : l.channel,
          status   : l.status,
          urgency  : l.urgency as 'routine' | 'urgent',
          sentAt   : l.sent_at,
        }))
      )
      setLoading(false)
    }
    load()
  }, [user?.id])

  const savePref = async (patch: Partial<NotifPrefs>) => {
    if (!user?.id || !tenantId) return
    const next = { ...prefs, ...patch }
    setPrefs(next)
    setSaving(true)
    await supabase.from('notification_preferences').upsert(
      {
        user_id      : user.id,
        tenant_id    : tenantId,
        push_enabled : next.pushEnabled,
        email_enabled: next.emailEnabled,
        sms_enabled  : next.smsEnabled,
        updated_at   : new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    setSaving(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakText variant="h2">Notifications</AureakText>
      <AureakText variant="body" style={{ color: colors.text.muted }}>
        Gérez comment vous souhaitez être informé(e) de l'activité de vos enfants.
      </AureakText>

      {/* Preferences */}
      <View style={styles.section}>
        <AureakText variant="h3" style={styles.sectionTitle}>Canaux de notification</AureakText>

        {loading ? (
          <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
        ) : (
          <>
            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>Notifications push</AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  Alertes immédiates sur votre appareil
                </AureakText>
              </View>
              <Switch
                value={prefs.pushEnabled}
                onValueChange={v => savePref({ pushEnabled: v })}
                disabled={saving}
                trackColor={{ false: colors.border.light, true: colors.status.present }}
                thumbColor={colors.text.dark}
              />
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>Email</AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  Résumés hebdomadaires et alertes importantes
                </AureakText>
              </View>
              <Switch
                value={prefs.emailEnabled}
                onValueChange={v => savePref({ emailEnabled: v })}
                disabled={saving}
                trackColor={{ false: colors.border.light, true: colors.status.present }}
                thumbColor={colors.text.dark}
              />
            </View>

            <View style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>SMS</AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  Alertes urgentes uniquement (absences)
                </AureakText>
              </View>
              <Switch
                value={prefs.smsEnabled}
                onValueChange={v => savePref({ smsEnabled: v })}
                disabled={saving}
                trackColor={{ false: colors.border.light, true: colors.status.present }}
                thumbColor={colors.text.dark}
              />
            </View>

            {saving && (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                Sauvegarde en cours…
              </AureakText>
            )}
          </>
        )}
      </View>

      {/* History */}
      <View style={styles.section}>
        <AureakText variant="h3" style={styles.sectionTitle}>Historique des notifications</AureakText>

        {!loading && logs.length === 0 ? (
          <AureakText variant="body" style={{ color: colors.text.muted }}>
            Aucune notification reçue.
          </AureakText>
        ) : (
          logs.map(log => (
            <View key={log.id} style={[styles.logRow, log.urgency === 'urgent' && styles.logRowUrgent]}>
              <View style={{ flex: 1 }}>
                <AureakText variant="body" style={{ fontWeight: '600' }}>
                  {EVENT_LABEL[log.eventType] ?? log.eventType}
                </AureakText>
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  {CHANNEL_LABEL[log.channel] ?? log.channel} ·{' '}
                  {new Date(log.sentAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </AureakText>
              </View>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: log.status === 'sent' ? colors.status.present : colors.status.absent },
                ]}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container   : { flex: 1, backgroundColor: colors.light.primary },
  content     : { padding: space.xl, gap: space.lg },
  section     : {
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : space.sm,
  },
  sectionTitle: { marginBottom: space.xs },
  prefRow     : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.md,
    paddingVertical: space.sm,
    borderTopWidth : 1,
    borderTopColor : colors.border.light,
  },
  logRow      : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    paddingVertical: space.sm,
    borderTopWidth : 1,
    borderTopColor : colors.border.light,
  },
  logRowUrgent: { borderLeftWidth: 3, borderLeftColor: colors.status.absent, paddingLeft: space.sm },
  statusDot   : { width: 8, height: 8, borderRadius: 4 },
})
