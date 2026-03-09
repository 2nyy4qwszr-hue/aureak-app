'use client'
// Historique complet des séances de l'enfant
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getChildProfile, supabase } from '@aureak/api-client'
import { AureakText, Badge } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { EvaluationSignal } from '@aureak/types'

type SessionRow = {
  sessionId   : string
  scheduledAt : string
  groupName   : string | null
  status      : string
  receptivite : EvaluationSignal | null
  goutEffort  : EvaluationSignal | null
  attitude    : EvaluationSignal | null
  topSeance   : 'star' | 'none' | null
}

const STATUS_LABEL: Record<string, string> = {
  present: 'Présent',
  absent : 'Absent',
  late   : 'En retard',
  trial  : 'Essai',
  injured: 'Blessé',
}
const STATUS_VARIANT: Record<string, 'present' | 'zinc' | 'attention' | 'gold'> = {
  present: 'present',
  absent : 'zinc',
  late   : 'attention',
  trial  : 'gold',
  injured: 'zinc',
}

const SIGNAL_ICON: Record<EvaluationSignal, string> = { positive: '✓', attention: '!', none: '–' }
const SIGNAL_COLOR: Record<EvaluationSignal, string> = {
  positive : colors.status.present,
  attention: colors.status.attention,
  none     : colors.text.muted,
}

function ChildSubNav({ childId, active }: { childId: string; active: string }) {
  const router = useRouter()
  const tabs = [
    { label: 'Fiche',       href: `/parent/children/${childId}`          },
    { label: 'Séances',     href: `/parent/children/${childId}/sessions`  },
    { label: 'Progression', href: `/parent/children/${childId}/progress`  },
  ]
  return (
    <View style={subNav.bar}>
      {tabs.map(tab => (
        <Pressable key={tab.href} onPress={() => router.push(tab.href as never)}>
          <View style={[subNav.tab, active === tab.label && subNav.tabActive]}>
            <AureakText
              variant="caption"
              style={{ color: active === tab.label ? colors.accent.gold : colors.text.muted, fontWeight: '600' }}
            >
              {tab.label}
            </AureakText>
          </View>
        </Pressable>
      ))}
    </View>
  )
}
const subNav = StyleSheet.create({
  bar    : { flexDirection: 'row', gap: space.lg, borderBottomWidth: 1, borderBottomColor: colors.border.light, paddingBottom: space.sm },
  tab    : { paddingBottom: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent.gold },
})

export default function ChildSessionsPage() {
  const { childId } = useLocalSearchParams<{ childId: string }>()
  const router      = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [sessions,    setSessions]    = useState<SessionRow[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const [profileRes, childRes] = await Promise.all([
        getChildProfile(childId, { months: 12 }),
        supabase.from('profiles').select('display_name').eq('user_id', childId).single(),
      ])
      setDisplayName((childRes.data as { display_name: string } | null)?.display_name ?? '')

      type RawAttendance = {
        id      : string
        status  : string
        sessions?: {
          id           : string
          scheduled_at : string
          groups?      : { name: string } | null
        } | null
      }
      type RawEval = {
        session_id  : string
        receptivite : EvaluationSignal
        gout_effort : EvaluationSignal
        attitude    : EvaluationSignal
        top_seance  : 'star' | 'none'
      }

      const evalMap = new Map(
        (profileRes.evaluations as RawEval[]).map(e => [e.session_id, e])
      )

      const rows: SessionRow[] = (profileRes.attendances as unknown as RawAttendance[])
        .filter(a => a.sessions)
        .map(a => {
          const ev = evalMap.get(a.sessions!.id)
          return {
            sessionId  : a.sessions!.id,
            scheduledAt: a.sessions!.scheduled_at,
            groupName  : a.sessions!.groups?.name ?? null,
            status     : a.status,
            receptivite: ev?.receptivite ?? null,
            goutEffort : ev?.gout_effort ?? null,
            attitude   : ev?.attitude    ?? null,
            topSeance  : ev?.top_seance  ?? null,
          }
        })

      setSessions(rows)
      setLoading(false)
    }
    load()
  }, [childId])

  const presentCount = sessions.filter(s => ['present', 'late', 'trial'].includes(s.status)).length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.push('/parent/dashboard' as never)}>
        <AureakText variant="caption" style={{ color: colors.accent.gold }}>← Dashboard</AureakText>
      </Pressable>

      <AureakText variant="h2">{displayName || '…'} — Séances</AureakText>

      <ChildSubNav childId={childId} active="Séances" />

      {!loading && sessions.length > 0 && (
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          {sessions.length} séances sur 12 mois · {presentCount} présences
        </AureakText>
      )}

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      ) : sessions.length === 0 ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>
          Aucune séance enregistrée.
        </AureakText>
      ) : (
        sessions.map((s, idx) => (
          <View key={s.sessionId ?? idx} style={styles.row}>
            {/* Date + group */}
            <View style={{ flex: 1 }}>
              <AureakText variant="body" style={{ fontWeight: '600' }}>
                {new Date(s.scheduledAt).toLocaleDateString('fr-FR', {
                  weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                })}
              </AureakText>
              {s.groupName && (
                <AureakText variant="caption" style={{ color: colors.text.muted }}>
                  {s.groupName}
                </AureakText>
              )}
            </View>

            {/* Présence badge */}
            <Badge
              label={STATUS_LABEL[s.status] ?? s.status}
              variant={STATUS_VARIANT[s.status] ?? 'zinc'}
            />

            {/* Eval signals */}
            {(s.receptivite || s.goutEffort || s.attitude) && (
              <View style={styles.signals}>
                {([s.receptivite, s.goutEffort, s.attitude] as (EvaluationSignal | null)[]).map((sig, i) =>
                  sig ? (
                    <View key={i} style={styles.signalDot}>
                      <AureakText
                        variant="caption"
                        style={{ color: SIGNAL_COLOR[sig], fontWeight: '700', fontSize: 10 }}
                      >
                        {SIGNAL_ICON[sig]}
                      </AureakText>
                    </View>
                  ) : null
                )}
                {s.topSeance === 'star' && (
                  <AureakText variant="caption" style={{ fontSize: 12 }}>⭐</AureakText>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.sm },
  row      : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  signals  : { flexDirection: 'row', gap: 3, alignItems: 'center' },
  signalDot: {
    width          : 20,
    height         : 20,
    borderRadius   : 10,
    backgroundColor: colors.light.muted,
    alignItems     : 'center',
    justifyContent : 'center',
  },
})
