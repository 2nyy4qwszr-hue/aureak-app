'use client'
// Story tbd-vue-implantation — Dashboard analytique par implantation
import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { listImplantations, getImplantationStats, listGroupsByImplantation } from '@aureak/api-client'
import type { ImplantationStats } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import type { Implantation, Group } from '@aureak/types'

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <View style={{ height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
      <View style={{ height: 6, width: `${pct}%` as never, backgroundColor: color, borderRadius: 3 }} />
    </View>
  )
}

// ── KPI card ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, showBar }: {
  label: string
  value: string | number
  sub?  : string
  color?: string
  showBar?: boolean
}) {
  const barColor = color ?? colors.accent.gold
  const numVal   = typeof value === 'number' ? value : parseFloat(String(value))
  return (
    <View style={s.kpiCard}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' as never }}>
        {label}
      </AureakText>
      <AureakText variant="h2" style={{ color: barColor, fontSize: 28, fontWeight: '700', marginTop: 4 }}>
        {value}
      </AureakText>
      {sub && <AureakText variant="caption" style={{ color: colors.text.muted }}>{sub}</AureakText>}
      {showBar && <ProgressBar value={numVal} color={barColor} />}
    </View>
  )
}

// ── Rate color ─────────────────────────────────────────────────────────────────
function rateColor(pct: number): string {
  if (pct >= 80) return colors.status.present
  if (pct >= 60) return colors.status.attention
  return colors.status.errorStrong
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ImplantationDashboardPage() {
  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [stats,         setStats]         = useState<ImplantationStats[]>([])
  const [groups,        setGroups]        = useState<Group[]>([])
  const [selectedId,    setSelectedId]    = useState<string>('')
  const [loading,       setLoading]       = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: impls }, { data: statsData }] = await Promise.all([
        listImplantations(),
        getImplantationStats(),
      ])
      const implList = impls ?? []
      setImplantations(implList)
      setStats((statsData as ImplantationStats[]) ?? [])
      setSelectedId(prev => {
        if (prev || implList.length === 0) return prev
        return implList[0].id
      })
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ImplantationDashboard] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadGroups = useCallback(async (implantationId: string) => {
    if (!implantationId) return
    setLoadingGroups(true)
    try {
      const { data } = await listGroupsByImplantation(implantationId)
      setGroups(data ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ImplantationDashboard] loadGroups error:', err)
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (selectedId) loadGroups(selectedId) }, [selectedId, loadGroups])

  const currentStats = stats.find(s => s.implantation_id === selectedId)
  const currentImpl  = implantations.find(i => i.id === selectedId)

  const closureRate  = currentStats
    ? currentStats.sessions_total > 0
      ? Math.round((currentStats.sessions_closed / currentStats.sessions_total) * 100)
      : 0
    : null

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* ── Header ── */}
      <View>
        <AureakText variant="h2">Par implantation</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted }}>
          Statistiques de la période des 30 derniers jours
        </AureakText>
      </View>

      {/* ── Sélecteur implantation ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl }}>
        <View style={{ flexDirection: 'row', gap: space.sm, paddingHorizontal: space.xl }}>
          {implantations.map(impl => (
            <Pressable
              key={impl.id}
              style={[s.implantChip, selectedId === impl.id && s.implantChipActive]}
              onPress={() => setSelectedId(impl.id)}
            >
              <AureakText
                variant="caption"
                style={{
                  color     : selectedId === impl.id ? colors.light.primary : colors.text.dark,
                  fontWeight: '700',
                }}
              >
                {impl.name}
              </AureakText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
      ) : !currentImpl ? (
        <AureakText variant="body" style={{ color: colors.text.muted }}>Aucune implantation disponible.</AureakText>
      ) : (
        <>
          {/* ── Titre implantation ── */}
          <View style={s.implantHeader}>
            <AureakText variant="h3" style={{ color: colors.text.dark }}>{currentImpl.name}</AureakText>
            {currentImpl.address && (
              <AureakText variant="caption" style={{ color: colors.text.muted }}>{currentImpl.address}</AureakText>
            )}
          </View>

          {/* ── KPIs ── */}
          {currentStats ? (
            <View style={s.kpiGrid}>
              <KpiCard
                label="Séances"
                value={currentStats.sessions_total}
                sub="30 derniers jours"
                color={colors.accent.gold}
              />
              <KpiCard
                label="Clôturées"
                value={`${closureRate}%`}
                sub={`${currentStats.sessions_closed}/${currentStats.sessions_total}`}
                color={rateColor(closureRate ?? 0)}
                showBar
              />
              <KpiCard
                label="Présence"
                value={`${Math.round(currentStats.attendance_rate_pct)}%`}
                color={rateColor(currentStats.attendance_rate_pct)}
                showBar
              />
              <KpiCard
                label="Maîtrise"
                value={`${Math.round(currentStats.mastery_rate_pct)}%`}
                color={rateColor(currentStats.mastery_rate_pct)}
                showBar
              />
            </View>
          ) : (
            <View style={s.noStatsBox}>
              <AureakText variant="body" style={{ color: colors.text.muted }}>
                Aucune donnée statistique disponible pour cette implantation.
              </AureakText>
            </View>
          )}

          {/* ── Groupes ── */}
          <View style={{ marginTop: space.sm }}>
            <AureakText variant="label" style={s.sectionLabel as never}>
              GROUPES ({groups.length})
            </AureakText>
            {loadingGroups ? (
              <AureakText variant="body" style={{ color: colors.text.muted }}>Chargement…</AureakText>
            ) : groups.length === 0 ? (
              <AureakText variant="body" style={{ color: colors.text.muted }}>Aucun groupe dans cette implantation.</AureakText>
            ) : (
              groups.map(g => (
                <View key={g.id} style={s.groupRow}>
                  <AureakText variant="body" style={{ color: colors.text.dark, flex: 1 }}>{g.name}</AureakText>
                  {g.dayOfWeek && (
                    <AureakText variant="caption" style={{ color: colors.text.muted }}>{g.dayOfWeek}</AureakText>
                  )}
                  {g.method && (
                    <View style={[s.methodBadge]}>
                      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>{g.method}</AureakText>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.light.primary },
  content      : { padding: space.xl, gap: space.md },

  implantChip  : {
    paddingHorizontal: 16,
    paddingVertical  : 8,
    borderRadius     : 20,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  implantChipActive: {
    backgroundColor  : colors.accent.gold,
    borderColor      : colors.accent.gold,
  },

  implantHeader: { gap: 2 },

  kpiGrid      : {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.sm,
  },
  kpiCard      : {
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    flex           : 1,
    minWidth       : 140,
  },

  noStatsBox   : {
    backgroundColor: colors.light.surface,
    borderRadius   : 8,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },

  sectionLabel : {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as never,
    marginBottom : space.sm,
  },

  groupRow     : {
    flexDirection  : 'row',
    alignItems     : 'center',
    gap            : space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  methodBadge  : {
    paddingHorizontal: 8,
    paddingVertical  : 2,
    borderRadius     : 10,
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
})
