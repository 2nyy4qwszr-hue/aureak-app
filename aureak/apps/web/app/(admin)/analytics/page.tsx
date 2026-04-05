'use client'
// Story 60.1 — Stats Room landing hub
// Header dark premium + 4 section cards + 4 KPI globaux + skeleton loading

import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { getStatsRoomKpis } from '@aureak/api-client'
import type { StatsRoomKpis } from '@aureak/api-client'
import { colors, radius, shadows, transitions, space } from '@aureak/theme'

// ── Constantes locales de couleur (tokens non disponibles pour ces valeurs) ───
const CHARGE_AMBER = '#F59E0B'
const CLUBS_BLUE   = '#3B82F6'

// ── Section cards config ──────────────────────────────────────────────────────
interface SectionConfig {
  title      : string
  description: string
  href       : string
  accent     : string
  icon       : string
  kpiLabel   : string
}

const SECTIONS: SectionConfig[] = [
  {
    title      : 'Présences',
    description: 'Taux de présence par groupe et période',
    href       : '/analytics/presences',
    accent     : colors.accent.gold,
    icon       : '📅',
    kpiLabel   : 'Taux moyen',
  },
  {
    title      : 'Progression',
    description: 'Niveaux et maîtrise des joueurs',
    href       : '/analytics/progression',
    accent     : colors.status.success,
    icon       : '📈',
    kpiLabel   : 'Joueurs actifs',
  },
  {
    title      : 'Charge',
    description: 'Heatmap jours/heures et intensité séances',
    href       : '/analytics/charge',
    accent     : CHARGE_AMBER,
    icon       : '🌡️',
    kpiLabel   : 'Séances ce mois',
  },
  {
    title      : 'Clubs',
    description: 'Classement implantations et performance',
    href       : '/analytics/clubs',
    accent     : CLUBS_BLUE,
    icon       : '🛡️',
    kpiLabel   : 'Clubs liés',
  },
]

// ── KPI Skeleton ──────────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <View style={s.kpiCard}>
      <View style={[s.skeletonLine, { width: 60, marginBottom: 8 }]} />
      <View style={[s.skeletonLine, { width: 80, height: 28 }]} />
    </View>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, color ? { color } : {}]}>{value}</Text>
    </View>
  )
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ section, kpiValue, loading }: { section: SectionConfig; kpiValue?: string; loading?: boolean }) {
  const router  = useRouter()
  const [hovered, setHovered] = useState(false)

  return (
    <Pressable
      onPress={() => router.push(section.href as never)}
      style={({ pressed }) => [
        s.sectionCard,
        (pressed || hovered) && s.sectionCardHover,
      ]}
      {...({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } as object)}
    >
      {/* Accent stripe */}
      <View style={[s.accentStripe, { backgroundColor: section.accent }]} />

      <View style={s.sectionCardBody}>
        <Text style={s.sectionIcon}>{section.icon}</Text>
        <Text style={s.sectionTitle}>{section.title}</Text>
        <Text style={s.sectionDescription}>{section.description}</Text>

        {/* Quick stat */}
        <View style={s.quickStatRow}>
          <Text style={s.quickStatLabel}>{section.kpiLabel}</Text>
          {loading ? (
            <View style={[s.skeletonLine, { width: 50, height: 18 }]} />
          ) : (
            <Text style={[s.quickStatValue, { color: section.accent }]}>{kpiValue ?? '—'}</Text>
          )}
        </View>

        {/* CTA */}
        <Text style={[s.ctaLink, { color: section.accent }]}>Voir les stats →</Text>
      </View>
    </Pressable>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StatsRoomPage() {
  const router = useRouter()
  const [kpis, setKpis]       = useState<StatsRoomKpis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getStatsRoomKpis()
      .then(({ data }) => {
        setKpis(data)
      })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[StatsRoomPage] getStatsRoomKpis error:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // KPI values per section
  const sectionKpis: string[] = [
    kpis ? `${kpis.avgAttendanceRate}%`  : '—',
    kpis ? String(kpis.activePlayers)    : '—',
    kpis ? `${kpis.totalSessions}`       : '—',
    kpis ? String(kpis.linkedClubs)      : '—',
  ]

  return (
    <View style={s.container}>
      {/* ── Header premium dark ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.push('/dashboard' as never)} style={s.backLink}>
          <Text style={s.backText}>← Dashboard</Text>
        </Pressable>
        <Text style={s.title}>Stats Room</Text>
        <Text style={s.subtitle}>Tableau analytique de l'académie</Text>
      </View>

      {/* ── KPI bandeau global ── */}
      <View style={s.kpiBandeau}>
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard label="Total séances"    value={kpis?.totalSessions    ?? '—'} color={colors.accent.gold} />
            <KpiCard label="Taux présence"    value={kpis ? `${kpis.avgAttendanceRate}%` : '—'} color={colors.status.success} />
            <KpiCard label="Joueurs actifs"   value={kpis?.activePlayers    ?? '—'} />
            <KpiCard label="Séances ce mois"  value={kpis?.totalSessions    ?? '—'} />
          </>
        )}
      </View>

      {/* ── Section cards grille 2×2 ── */}
      <View style={s.grid}>
        {SECTIONS.map((section, idx) => (
          <SectionCard
            key={section.href}
            section={section}
            kpiValue={sectionKpis[idx]}
            loading={loading}
          />
        ))}
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    minHeight      : '100%' as never,
  },

  // Header dark premium
  header: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: space.xl,
    paddingTop     : space.xl,
    paddingBottom  : space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.dark,
  },
  backLink: {
    marginBottom: space.md,
    alignSelf   : 'flex-start',
  },
  backText: {
    color    : colors.text.secondary,
    fontSize : 13,
  },
  title: {
    fontFamily: 'Montserrat',
    fontSize  : 32,
    fontWeight: '900',
    color     : colors.accent.gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize : 14,
    color    : colors.text.secondary,
    letterSpacing: 0.5,
  },

  // KPI bandeau
  kpiBandeau: {
    flexDirection  : 'row',
    flexWrap       : 'wrap' as never,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    gap            : space.md,
    backgroundColor: colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.dark,
  },
  kpiCard: {
    flex       : 1,
    minWidth   : 140,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.elevated,
    borderRadius: radius.card,
  },
  kpiLabel: {
    fontSize : 10,
    fontWeight: '700',
    color    : colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize : 24,
    fontWeight: '700',
    color    : colors.text.primary,
  },

  // Skeleton
  skeletonLine: {
    height         : 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius   : 4,
  },

  // Grid 2×2
  grid: {
    flexDirection  : 'row',
    flexWrap       : 'wrap' as never,
    padding        : space.xl,
    gap            : space.lg,
  },

  // Section card
  sectionCard: {
    flex           : 1,
    minWidth       : 280,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    overflow       : 'hidden' as never,
    boxShadow      : shadows.sm,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    transition     : `all ${transitions.fast}`,
  } as never,
  sectionCardHover: {
    boxShadow : shadows.md,
    transform : [{ translateY: -2 }],
    borderColor: colors.border.gold,
  } as never,

  accentStripe: {
    height: 3,
    width : '100%',
  },
  sectionCardBody: {
    padding: space.lg,
  },
  sectionIcon: {
    fontSize    : 28,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Montserrat',
    fontSize  : 18,
    fontWeight: '700',
    color     : colors.text.dark,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color   : colors.text.muted,
    lineHeight: 18,
    marginBottom: 16,
  },
  quickStatRow: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.light.muted,
    borderRadius  : radius.xs,
    marginBottom  : 12,
  },
  quickStatLabel: {
    fontSize : 11,
    color    : colors.text.muted,
    fontWeight: '600',
  },
  quickStatValue: {
    fontSize : 16,
    fontWeight: '700',
  },
  ctaLink: {
    fontSize : 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign : 'right' as never,
  },
})
