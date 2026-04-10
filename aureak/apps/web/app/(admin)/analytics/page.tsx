'use client'
// Story 60.1 — Stats Room landing hub
// Header dark premium + 4 section cards + 4 KPI globaux + skeleton loading

import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { getStatsRoomKpis, getMonthlyReportData, useLiveSessionCounts } from '@aureak/api-client'
import type { StatsRoomKpis } from '@aureak/api-client'
import { LiveCounter } from '@aureak/ui'
import { colors, fonts, radius, shadows, transitions, space, getStatColor, STAT_THRESHOLDS } from '@aureak/theme'
import { generateMonthlyReport } from './generateMonthlyReport'
import type { ReportOptions } from '@aureak/types'

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
    accent     : colors.status.warning,
    icon       : '🌡️',
    kpiLabel   : 'Séances ce mois',
  },
  {
    title      : 'Clubs',
    description: 'Classement implantations et performance',
    href       : '/analytics/clubs',
    accent     : colors.status.info,
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
// ── ExportModal ───────────────────────────────────────────────────────────────

function getLastMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function ExportModal({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const months    = getLastMonths(12)
  const [month,        setMonth]        = useState(months[0] ?? '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null)
  const [sections,     setSections]     = useState({ presences: true, progression: true, topPlayers: true })

  const handleGenerate = async () => {
    setIsGenerating(true)
    setErrorMsg(null)
    try {
      const { data, error } = await getMonthlyReportData(month, null)
      if (error || !data) throw new Error('Données indisponibles')

      const filename = `aureak-rapport-${month}-all.pdf`
      const options: ReportOptions = {
        month,
        implantationId: null,
        sections,
        filename,
      }
      await generateMonthlyReport(data, options)
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ExportModal] generateMonthlyReport error:', err)
      setErrorMsg('Impossible de générer le PDF — vérifiez votre connexion')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!visible) return null

  return (
    <View style={em.overlay}>
      <View style={em.modal}>
        <Text style={em.title}>Exporter PDF mensuel</Text>

        {/* Sélecteur mois */}
        <Text style={em.label}>Mois</Text>
        <View style={em.monthRow}>
          {months.slice(0, 6).map(m => (
            <Pressable key={m} onPress={() => setMonth(m)} style={[em.monthChip, m === month && em.monthChipActive]}>
              <Text style={[em.monthChipText, m === month && em.monthChipTextActive]}>{m}</Text>
            </Pressable>
          ))}
        </View>

        {/* Checkboxes sections */}
        <Text style={em.label}>Sections incluses</Text>
        <View style={em.checkboxRow}>
          {(['presences', 'progression', 'topPlayers'] as const).map(sec => {
            const labels = { presences: 'Présences', progression: 'Progression', topPlayers: 'Top joueurs' }
            return (
              <Pressable key={sec} onPress={() => setSections(prev => ({ ...prev, [sec]: !prev[sec] }))} style={em.checkboxItem}>
                <View style={[em.checkbox, sections[sec] && em.checkboxChecked]}>
                  {sections[sec] && <Text style={em.checkmark}>✓</Text>}
                </View>
                <Text style={em.checkboxLabel}>{labels[sec]}</Text>
              </Pressable>
            )
          })}
        </View>

        {/* Erreur */}
        {errorMsg && <Text style={em.errorText}>{errorMsg}</Text>}

        {/* Actions */}
        <View style={em.actions}>
          <Pressable onPress={onClose} style={em.cancelBtn}>
            <Text style={em.cancelText}>Annuler</Text>
          </Pressable>
          <Pressable
            onPress={handleGenerate}
            disabled={isGenerating}
            style={[em.generateBtn, isGenerating && em.generateBtnDisabled]}
          >
            <Text style={em.generateText}>{isGenerating ? 'Génération...' : 'Générer PDF'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const em = StyleSheet.create({
  overlay: {
    position       : 'fixed' as never,
    inset          : 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems     : 'center',
    justifyContent : 'center',
    zIndex         : 1000,
  } as never,
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : 28,
    width          : 400,
    maxWidth       : '90vw' as never,
    boxShadow      : shadows.lg,
  } as never,
  title: {
    fontSize    : 18,
    fontWeight  : '700',
    color       : colors.text.dark,
    fontFamily  : fonts.display,
    marginBottom: 20,
  },
  label: {
    fontSize    : 12,
    fontWeight  : '600',
    color       : colors.text.muted,
    textTransform: 'uppercase' as never,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop   : 14,
  },
  monthRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap' as never,
    gap          : 6,
  },
  monthChip: {
    paddingVertical  : 4,
    paddingHorizontal: 10,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  monthChipActive    : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  monthChipText      : { fontSize: 11, color: colors.text.muted },
  monthChipTextActive: { color: colors.text.dark, fontWeight: '700' },
  checkboxRow        : { gap: 8 },
  checkboxItem       : { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkbox: {
    width          : 18,
    height         : 18,
    borderRadius   : 4,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    alignItems     : 'center',
    justifyContent : 'center',
  },
  checkboxChecked: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  checkmark      : { fontSize: 10, color: colors.text.dark, fontWeight: '700' },
  checkboxLabel  : { fontSize: 13, color: colors.text.dark },
  errorText      : { fontSize: 12, color: colors.accent.red, marginTop: 12 },
  actions: {
    flexDirection  : 'row',
    justifyContent : 'flex-end',
    gap            : 10,
    marginTop      : 24,
  },
  cancelBtn: {
    paddingVertical  : 9,
    paddingHorizontal: 18,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  cancelText  : { fontSize: 13, color: colors.text.muted },
  generateBtn: {
    paddingVertical  : 9,
    paddingHorizontal: 18,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateText       : { fontSize: 13, fontWeight: '700', color: colors.text.dark },
})

// ── Page principale ───────────────────────────────────────────────────────────

export default function StatsRoomPage() {
  const router = useRouter()
  const [kpis, setKpis]               = useState<StatsRoomKpis | null>(null)
  const [loading, setLoading]         = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  // ── Live counters (Story 60.8) ──
  const liveCounters = useLiveSessionCounts()

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
      {/* ── Modale export PDF (Story 60.7) ── */}
      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />

      {/* ── Header premium dark ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.push('/dashboard' as never)} style={s.backLink}>
          <Text style={s.backText}>← Dashboard</Text>
        </Pressable>
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Stats Room</Text>
            <Text style={s.subtitle}>Tableau analytique de l'académie</Text>
          </View>
          <Pressable onPress={() => setShowExportModal(true)} style={s.exportBtn}>
            <Text style={s.exportBtnText}>⬇ Exporter PDF mensuel</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Live Counter (Story 60.8) — visible uniquement si séances en cours ── */}
      {liveCounters.sessionCount > 0 && (
        <View style={{ paddingHorizontal: space.xl, paddingTop: space.md }}>
          <LiveCounter
            sessionCount={liveCounters.sessionCount}
            presentCount={liveCounters.presentCount}
            totalCount={liveCounters.totalCount}
            isLive={liveCounters.isLive}
          />
        </View>
      )}

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
            <KpiCard label="Taux présence"    value={kpis ? `${kpis.avgAttendanceRate}%` : '—'} color={kpis ? getStatColor(kpis.avgAttendanceRate, STAT_THRESHOLDS.attendance.high, STAT_THRESHOLDS.attendance.low) : colors.status.success} />
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
  headerRow: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'flex-end',
    flexWrap      : 'wrap' as never,
    gap           : 12,
  },
  exportBtn: {
    paddingVertical  : 8,
    paddingHorizontal: 16,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
    alignSelf        : 'flex-end' as never,
  },
  exportBtnText: {
    fontSize  : 12,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  title: {
    fontFamily: fonts.display,
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
    fontFamily: fonts.display,
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
