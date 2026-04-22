'use client'
// Story 9.2 — Dashboard anomalies admin
// Story 99.5 — AdminPageHeader v2 ("Anomalies")
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { listAnomalies, resolveAnomaly } from '@aureak/api-client'
import type { AnomalyEvent } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { AdminPageHeader } from '../../../../../components/admin/AdminPageHeader'

const TYPE_LABELS: Record<AnomalyEvent['anomalyType'], string> = {
  session_not_closed     : 'Séance non clôturée',
  high_absenteeism       : 'Absentéisme élevé',
  coach_feedback_missing : 'Notes coach manquantes',
  no_session_activity    : 'Aucune activité planifiée',
}

const TYPE_ICONS: Record<AnomalyEvent['anomalyType'], string> = {
  session_not_closed     : '🔓',
  high_absenteeism       : '⚠️',
  coach_feedback_missing : '📝',
  no_session_activity    : '📅',
}

const SEVERITY_COLOR: Record<AnomalyEvent['severity'], string> = {
  info    : colors.status.info,
  warning : colors.status.attention,
  critical: colors.accent.red,
}

const SEVERITY_LABEL: Record<AnomalyEvent['severity'], string> = {
  info    : 'Info',
  warning : 'Attention',
  critical: 'Critique',
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([])
  const [loading,   setLoading]   = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [ignoring,  setIgnoring]  = useState<string | null>(null)
  const [filter,    setFilter]    = useState<'all' | AnomalyEvent['severity']>('all')
  const [detail,    setDetail]    = useState<AnomalyEvent | null>(null)
  const [ignored,   setIgnored]   = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listAnomalies()
      setAnomalies(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Anomalies] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await resolveAnomaly(id)
      setAnomalies(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[Anomalies] resolve error:', err)
    } finally {
      setResolving(null)
    }
  }

  const handleIgnore = (id: string) => {
    setIgnoring(id)
    setTimeout(() => {
      setIgnored(prev => new Set([...prev, id]))
      setIgnoring(null)
    }, 300)
  }

  const visibleAnomalies = anomalies.filter(a => !ignored.has(a.id))
  const filtered = filter === 'all' ? visibleAnomalies : visibleAnomalies.filter(a => a.severity === filter)

  const counts = {
    all     : visibleAnomalies.length,
    critical: visibleAnomalies.filter(a => a.severity === 'critical').length,
    warning : visibleAnomalies.filter(a => a.severity === 'warning').length,
    info    : visibleAnomalies.filter(a => a.severity === 'info').length,
  }

  return (
    <>
    <View style={{ flex: 1, backgroundColor: colors.light.primary }}>
      {/* Story 99.5 — AdminPageHeader v2 */}
      <AdminPageHeader
        title="Anomalies"
        actionButton={{
          label  : '↻ Actualiser',
          onPress: load,
        }}
      />

    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* KPI row */}
      <View style={s.kpiRow}>
        {([
          { key: 'all',      label: 'Total',    value: counts.all,      color: colors.text.dark },
          { key: 'critical', label: 'Critiques', value: counts.critical, color: colors.accent.red },
          { key: 'warning',  label: 'Attention', value: counts.warning,  color: colors.status.attention },
          { key: 'info',     label: 'Info',      value: counts.info,     color: colors.status.info },
        ] as const).map(k => (
          <Pressable key={k.key} style={[s.kpi, filter === k.key && s.kpiActive]} onPress={() => setFilter(k.key)}>
            <AureakText variant="h2" style={{ color: k.color, fontSize: 24 }}>{k.value}</AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted }}>{k.label}</AureakText>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <AureakText variant="body" style={{ fontSize: 32 }}>✅</AureakText>
          <AureakText variant="body" style={{ color: colors.text.muted }}>
            {filter === 'all' ? 'Aucune anomalie active.' : 'Aucune anomalie dans cette catégorie.'}
          </AureakText>
        </View>
      ) : (
        filtered.map(a => {
          const color = SEVERITY_COLOR[a.severity]
          return (
            <View key={a.id} style={[s.card, { borderLeftColor: color }]}>
              <View style={s.cardTop}>
                <AureakText variant="caption" style={{ fontSize: 20 }}>
                  {TYPE_ICONS[a.anomalyType]}
                </AureakText>
                <View style={{ flex: 1 }}>
                  <AureakText variant="body" style={{ fontWeight: '700' }}>
                    {TYPE_LABELS[a.anomalyType]}
                  </AureakText>
                  <AureakText variant="caption" style={{ color: colors.text.muted }}>
                    {new Date(a.createdAt).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </AureakText>
                </View>
                <View style={[s.severityBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                  <AureakText variant="caption" style={{ color, fontWeight: '700', fontSize: 10 }}>
                    {SEVERITY_LABEL[a.severity]}
                  </AureakText>
                </View>
              </View>

              {Object.keys(a.metadata ?? {}).length > 0 && (
                <View style={s.metaBox}>
                  {Object.entries(a.metadata).map(([k, v]) => (
                    <AureakText key={k} variant="caption" style={{ color: colors.text.muted }}>
                      {k} : {String(v)}
                    </AureakText>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Pressable
                  style={[s.resolveBtn, resolving === a.id && s.resolveBtnDisabled]}
                  onPress={() => handleResolve(a.id)}
                  disabled={resolving === a.id}
                >
                  <AureakText variant="caption" style={{ color: resolving === a.id ? colors.text.muted : colors.status.present, fontWeight: '700' }}>
                    {resolving === a.id ? 'Résolution…' : '✓ Résolu'}
                  </AureakText>
                </Pressable>

                <Pressable
                  style={[s.ignoreBtn, ignoring === a.id && s.resolveBtnDisabled]}
                  onPress={() => handleIgnore(a.id)}
                  disabled={ignoring === a.id}
                >
                  <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700' }}>
                    Ignorer
                  </AureakText>
                </Pressable>

                <Pressable
                  style={s.detailBtn}
                  onPress={() => setDetail(a)}
                >
                  <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>
                    Voir détail
                  </AureakText>
                </Pressable>
              </View>
            </View>
          )
        })
      )}
      {ignored.size > 0 && (
        <AureakText variant="caption" style={{ color: colors.text.subtle, textAlign: 'center', paddingVertical: 4 }}>
          {ignored.size} anomalie{ignored.size > 1 ? 's' : ''} ignorée{ignored.size > 1 ? 's' : ''} — actualiser pour les voir de nouveau
        </AureakText>
      )}
    </ScrollView>
    </View>

    {/* Panneau détail — inline (pas de redirection) */}
    {detail && (
      <Pressable
        style={{
          position: 'fixed' as never,
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 100,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        }}
        onPress={() => setDetail(null)}
      >
        <Pressable
          onPress={e => e.stopPropagation()}
          style={{
            backgroundColor: colors.light.surface,
            borderRadius   : 12,
            padding        : 24,
            width          : '100%',
            maxWidth       : 480,
            borderLeftWidth: 4,
            borderLeftColor: SEVERITY_COLOR[detail.severity],
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <AureakText variant="h3" style={{ color: colors.text.dark }}>
              {TYPE_ICONS[detail.anomalyType]} {TYPE_LABELS[detail.anomalyType]}
            </AureakText>
            <Pressable onPress={() => setDetail(null)}>
              <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 18 }}>✕</AureakText>
            </Pressable>
          </View>

          <AureakText variant="caption" style={{ color: colors.text.muted, marginBottom: 16 }}>
            {new Date(detail.createdAt).toLocaleString('fr-BE')} · Sévérité : {SEVERITY_LABEL[detail.severity]}
          </AureakText>

          {Object.keys(detail.metadata ?? {}).length > 0 && (
            <View style={{ backgroundColor: colors.light.muted, borderRadius: 8, padding: 12, gap: 4 }}>
              <AureakText variant="caption" style={{ color: colors.text.subtle, fontWeight: '700', textTransform: 'uppercase' as never, letterSpacing: 0.8 }}>
                Métadonnées
              </AureakText>
              {Object.entries(detail.metadata).map(([k, v]) => (
                <AureakText key={k} variant="caption" style={{ color: colors.text.muted }}>
                  {k} : {String(v)}
                </AureakText>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <Pressable
              style={[s.resolveBtn, resolving === detail.id && s.resolveBtnDisabled]}
              onPress={() => { handleResolve(detail.id); setDetail(null) }}
              disabled={resolving === detail.id}
            >
              <AureakText variant="caption" style={{ color: colors.status.present, fontWeight: '700' }}>
                ✓ Résoudre
              </AureakText>
            </Pressable>
            <Pressable
              style={s.ignoreBtn}
              onPress={() => { handleIgnore(detail.id); setDetail(null) }}
            >
              <AureakText variant="caption" style={{ color: colors.text.muted, fontWeight: '700' }}>
                Ignorer
              </AureakText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    )}
    </>
  )
}

const s = StyleSheet.create({
  container     : { flex: 1, backgroundColor: colors.light.primary },
  content       : { padding: space.xl, gap: space.md },
  header        : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  refreshBtn    : {
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.gold,
  },
  kpiRow        : {
    flexDirection  : 'row',
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
  },
  kpi           : {
    flex           : 1,
    alignItems     : 'center',
    padding        : space.md,
    gap            : 4,
  },
  kpiActive     : { backgroundColor: colors.light.muted },
  card          : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderLeftWidth: 4,
    gap            : space.sm,
  },
  cardTop       : { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  severityBadge : {
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : 4,
    borderWidth      : 1,
  },
  metaBox       : {
    backgroundColor: colors.light.muted,
    borderRadius   : 6,
    padding        : space.sm,
    gap            : 2,
  },
  resolveBtn    : {
    alignSelf      : 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.status.present + '40',
    backgroundColor  : colors.status.present + '12',
  },
  resolveBtnDisabled: { opacity: 0.4 },
  ignoreBtn     : {
    alignSelf        : 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.muted,
  },
  detailBtn     : {
    alignSelf        : 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.gold,
    backgroundColor  : colors.accent.gold + '08',
  },
  empty         : { alignItems: 'center', gap: space.md, paddingVertical: space.xl * 2 },
})
