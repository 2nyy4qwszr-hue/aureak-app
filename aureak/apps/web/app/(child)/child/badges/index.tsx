'use client'
// Badges & points enfant — quêtes actives et terminées
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { getPlayerProgress, listActiveQuests, listAllQuests } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space } from '@aureak/theme'
import type { PlayerProgress } from '@aureak/types'
import type { PlayerQuest } from '@aureak/api-client'

const QUEST_STATUS_LABEL: Record<string, string> = {
  active   : 'En cours',
  completed: 'Terminée',
  failed   : 'Expirée',
}
const QUEST_STATUS_COLOR: Record<string, string> = {
  active   : colors.status.present,
  completed: colors.accent.gold,
  failed   : colors.status.absent,
}

export default function ChildBadgesPage() {
  const user = useAuthStore(s => s.user)

  const [progress,  setProgress]  = useState<PlayerProgress | null>(null)
  const [active,    setActive]    = useState<PlayerQuest[]>([])
  const [all,       setAll]       = useState<PlayerQuest[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      getPlayerProgress(user.id),
      listActiveQuests(user.id),
      listAllQuests(user.id),
    ]).then(([prog, activeQ, allQ]) => {
      setProgress(prog)
      setActive(activeQ)
      setAll(allQ)
    }).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[badges] load error:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [user?.id])

  const completed = all.filter(q => q.status === 'completed')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakText variant="h2">Badges & Points</AureakText>

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement...</AureakText>
      ) : (
        <>
          {/* Points KPIs */}
          <View style={styles.kpiRow}>
            <View style={styles.kpi}>
              <AureakText variant="h2" style={{ color: colors.accent.gold }}>
                {progress?.totalPoints ?? 0}
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Points totaux</AureakText>
            </View>
            <View style={styles.kpi}>
              <AureakText variant="h2" style={{ color: colors.status.present }}>
                {progress?.currentStreak ?? 0}
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Série en cours</AureakText>
            </View>
            <View style={styles.kpi}>
              <AureakText variant="h2" style={{ color: colors.accent.gold }}>
                {completed.length}
              </AureakText>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>Quêtes terminées</AureakText>
            </View>
          </View>

          {/* Active quests */}
          <AureakText variant="h3" style={{ marginTop: space.sm }}>Quêtes en cours</AureakText>

          {active.length === 0 ? (
            <AureakText variant="body" style={{ color: colors.text.muted }}>
              Aucune quête active.
            </AureakText>
          ) : (
            active.map(q => {
              const def = q.quest_definitions as { name?: string; description?: string; reward_points?: number } | null
              const pct = q.target_value > 0
                ? Math.min(100, Math.round((q.current_value / q.target_value) * 100))
                : 0
              return (
                <View key={q.id} style={styles.questCard}>
                  <View style={styles.questHeader}>
                    <AureakText variant="body" style={{ fontWeight: '700', flex: 1 }}>
                      {def?.name ?? 'Quête'}
                    </AureakText>
                    {def?.reward_points && (
                      <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '600' }}>
                        +{def.reward_points} pts
                      </AureakText>
                    )}
                  </View>
                  {def?.description && (
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      {def.description}
                    </AureakText>
                  )}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` as never }]} />
                  </View>
                  <View style={styles.questFooter}>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      {q.current_value} / {q.target_value}
                    </AureakText>
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>
                      {pct}%
                    </AureakText>
                  </View>
                </View>
              )
            })
          )}

          {/* Completed quests */}
          {completed.length > 0 && (
            <>
              <AureakText variant="h3" style={{ marginTop: space.sm }}>Quêtes terminées</AureakText>
              {completed.map(q => {
                const def = q.quest_definitions as { name?: string; reward_points?: number } | null
                return (
                  <View key={q.id} style={[styles.questCard, styles.questDone]}>
                    <View style={styles.questHeader}>
                      <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 16 }}>
                        ✓
                      </AureakText>
                      <AureakText variant="body" style={{ fontWeight: '600', flex: 1, color: colors.text.muted }}>
                        {def?.name ?? 'Quête'}
                      </AureakText>
                      {def?.reward_points && (
                        <AureakText variant="caption" style={{ color: colors.accent.gold }}>
                          +{def.reward_points} pts
                        </AureakText>
                      )}
                    </View>
                  </View>
                )
              })}
            </>
          )}

          {/* All quests with other statuses */}
          {all.filter(q => q.status === 'failed').length > 0 && (
            <>
              <AureakText variant="h3" style={{ marginTop: space.sm }}>Quêtes expirées</AureakText>
              {all.filter(q => q.status === 'failed').map(q => {
                const def = q.quest_definitions as { name?: string } | null
                return (
                  <View key={q.id} style={[styles.questCard, styles.questFailed]}>
                    <AureakText variant="body" style={{ color: colors.text.muted }}>
                      {def?.name ?? 'Quête'}
                    </AureakText>
                    <AureakText variant="caption" style={{ color: QUEST_STATUS_COLOR[q.status] ?? colors.text.muted }}>
                      {QUEST_STATUS_LABEL[q.status] ?? q.status}
                    </AureakText>
                  </View>
                )
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.light.primary },
  content      : { padding: space.xl, gap: space.md },
  kpiRow       : {
    flexDirection  : 'row',
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  kpi          : { flex: 1, alignItems: 'center', gap: 4 },
  questCard    : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    gap            : 6,
  },
  questDone    : { opacity: 0.7 },
  questFailed  : { opacity: 0.5 },
  questHeader  : { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  questFooter  : { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: 'hidden' },
  progressFill : { height: 6, backgroundColor: colors.accent.gold, borderRadius: 3 },
})
