'use client'
// Story 60.1 — Stats Room landing (original)
// Story 98.4 — Hub Performance dashboard-style
//
// REFONTE : remplace le header dark premium + ExportModal par une vue
// dashboard tokenisée alignée avec le reste de l'admin.
//
// Structure :
//   - AdminPageHeader "Performance" (+ action export PDF mensuel)
//   - 4 KPIs de synthèse via StatsStandardCard (getStatsRoomKpis)
//   - Grille raccourcis vers les 5 sous-pages (charge, clubs, présences,
//     progression, implantations)
//   - LiveCounter si séances en cours

import React, { useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Modal, TextInput, useWindowDimensions } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRouter } from 'expo-router'
import {
  getStatsRoomKpis, getMonthlyReportData, useLiveSessionCounts,
} from '@aureak/api-client'
import type { StatsRoomKpis } from '@aureak/api-client'
import type { ReportOptions } from '@aureak/types'
import { AureakText, LiveCounter } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader'
import { StatsStandardCard } from '../../../components/admin/stats'
import { generateMonthlyReport } from '../../../lib/admin/performance/generateMonthlyReport'

// ── Raccourcis vers les 5 sous-pages ──────────────────────────────────────────
interface ShortcutConfig {
  title      : string
  description: string
  href       : string
  accent     : string
  icon       : string
}

const SHORTCUTS: ShortcutConfig[] = [
  { title: 'Charge',        description: 'Heatmap jours/heures et intensité séances', href: '/performance/charge',       accent: colors.status.warning, icon: '🌡️' },
  { title: 'Clubs',          description: 'Classement implantations et performance',   href: '/performance/clubs',        accent: colors.status.info,    icon: '🛡️' },
  { title: 'Présences',     description: 'Taux de présence par groupe et période',    href: '/performance/presences',    accent: colors.accent.gold,    icon: '📅' },
  { title: 'Progression',   description: 'Niveaux et maîtrise des joueurs',           href: '/performance/progression',  accent: colors.status.success, icon: '📈' },
  { title: 'Implantations', description: 'Dashboard analytique par implantation',     href: '/performance/implantation', accent: colors.text.subtle,    icon: '🏟️' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PerformanceHubPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 1024
  const isTablet  = width >= 640 && width < 1024

  const [kpis, setKpis]                       = useState<StatsRoomKpis | null>(null)
  const [loading, setLoading]                 = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  const liveCounters = useLiveSessionCounts()

  useEffect(() => {
    setLoading(true)
    getStatsRoomKpis()
      .then(({ data }) => { setKpis(data) })
      .catch(err => {
        if (process.env.NODE_ENV !== 'production') console.error('[PerformanceHub] getStatsRoomKpis error:', err)
      })
      .finally(() => { setLoading(false) })
  }, [])

  const getRateTrend = (rate: number): { direction: 'up' | 'down' | 'neutral'; label: string } => {
    if (rate >= 80) return { direction: 'up',      label: 'Objectif atteint' }
    if (rate >= 60) return { direction: 'neutral', label: 'À surveiller'     }
    return             { direction: 'down',        label: 'Sous l\'objectif' }
  }

  const shortcutColumns = isDesktop ? 5 : isTablet ? 3 : 1
  const kpiColumns      = isDesktop ? 4 : isTablet ? 2 : 1

  return (
    <View style={s.page}>
      <AdminPageHeader
        title="Performance"
        actionButton={{
          label  : '⬇ Exporter PDF mensuel',
          onPress: () => setShowExportModal(true),
        }}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        {/* LiveCounter si séances en cours */}
        {liveCounters.sessionCount > 0 && (
          <LiveCounter
            sessionCount={liveCounters.sessionCount}
            presentCount={liveCounters.presentCount}
            totalCount={liveCounters.totalCount}
            isLive={liveCounters.isLive}
          />
        )}

        {/* 4 KPIs de synthèse */}
        <AureakText style={s.sectionTitle as TextStyle}>VUE D'ENSEMBLE</AureakText>
        <View style={[s.kpiGrid, { gap: space.md }]}>
          <View style={[s.kpiSlot, { flexBasis: `calc(100% / ${kpiColumns} - ${space.md}px)` as never }]}>
            <StatsStandardCard
              label="Taux présence"
              value={kpis ? String(kpis.avgAttendanceRate) : '—'}
              unit={kpis ? '%' : undefined}
              trend={kpis ? getRateTrend(kpis.avgAttendanceRate) : undefined}
              meta={loading ? 'Chargement…' : 'Sur toutes les séances'}
              iconTone="gold"
            />
          </View>
          <View style={[s.kpiSlot, { flexBasis: `calc(100% / ${kpiColumns} - ${space.md}px)` as never }]}>
            <StatsStandardCard
              label="Joueurs actifs"
              value={kpis ? String(kpis.activePlayers) : '—'}
              meta={loading ? 'Chargement…' : 'Inscrits annuaire actifs'}
              iconTone="gold"
            />
          </View>
          <View style={[s.kpiSlot, { flexBasis: `calc(100% / ${kpiColumns} - ${space.md}px)` as never }]}>
            <StatsStandardCard
              label="Séances totales"
              value={kpis ? String(kpis.totalSessions) : '—'}
              meta={loading ? 'Chargement…' : 'Séances non annulées'}
              iconTone="gold"
            />
          </View>
          <View style={[s.kpiSlot, { flexBasis: `calc(100% / ${kpiColumns} - ${space.md}px)` as never }]}>
            <StatsStandardCard
              label="Clubs liés"
              value={kpis ? String(kpis.linkedClubs) : '—'}
              meta={loading ? 'Chargement…' : 'Actifs dans l\'annuaire'}
              iconTone="neutral"
            />
          </View>
        </View>

        {/* Grille raccourcis */}
        <AureakText style={s.sectionTitle as TextStyle}>EXPLORER EN DÉTAIL</AureakText>
        <View style={[s.shortcutGrid, { gap: space.md }]}>
          {SHORTCUTS.map(sc => (
            <Pressable
              key={sc.href}
              onPress={() => router.push(sc.href as never)}
              style={({ pressed }) => [
                s.shortcutCard,
                { flexBasis: `calc(100% / ${shortcutColumns} - ${space.md}px)` as never },
                pressed && s.shortcutPressed,
              ] as never}
            >
              <View style={[s.shortcutAccent, { backgroundColor: sc.accent }]} />
              <View style={s.shortcutBody}>
                <AureakText style={s.shortcutIcon as TextStyle}>{sc.icon}</AureakText>
                <AureakText style={s.shortcutTitle as TextStyle}>{sc.title}</AureakText>
                <AureakText style={s.shortcutDesc as TextStyle}>{sc.description}</AureakText>
                <AureakText style={[s.shortcutCta, { color: sc.accent }] as never}>Voir →</AureakText>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Comparaisons */}
        <AureakText style={s.sectionTitle as TextStyle}>COMPARAISONS</AureakText>
        <View style={[s.shortcutGrid, { gap: space.md }]}>
          <Pressable
            onPress={() => router.push('/performance/comparaisons/evaluations' as never)}
            style={({ pressed }) => [s.shortcutCard, pressed && s.shortcutPressed, { minWidth: 280, flex: 1 }] as never}
          >
            <View style={[s.shortcutAccent, { backgroundColor: colors.accent.gold }]} />
            <View style={s.shortcutBody}>
              <AureakText style={s.shortcutIcon as TextStyle}>⚖️</AureakText>
              <AureakText style={s.shortcutTitle as TextStyle}>Comparaison évaluations</AureakText>
              <AureakText style={s.shortcutDesc as TextStyle}>Radar 2 joueurs sur 6 axes</AureakText>
              <AureakText style={[s.shortcutCta, { color: colors.accent.gold }] as never}>Voir →</AureakText>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/performance/comparaisons/implantations' as never)}
            style={({ pressed }) => [s.shortcutCard, pressed && s.shortcutPressed, { minWidth: 280, flex: 1 }] as never}
          >
            <View style={[s.shortcutAccent, { backgroundColor: colors.status.info }]} />
            <View style={s.shortcutBody}>
              <AureakText style={s.shortcutIcon as TextStyle}>🏟️</AureakText>
              <AureakText style={s.shortcutTitle as TextStyle}>Comparaison implantations</AureakText>
              <AureakText style={s.shortcutDesc as TextStyle}>Côte-à-côte sur métriques clés</AureakText>
              <AureakText style={[s.shortcutCta, { color: colors.status.info }] as never}>Voir →</AureakText>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />
    </View>
  )
}

// ── ExportModal (conservé de la version originale) ──────────────────────────

function getLastMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function ExportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const months = getLastMonths(12)
  const [month, setMonth]               = useState(months[0] ?? '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg, setErrorMsg]         = useState<string | null>(null)
  const [sections, setSections]         = useState({ presences: true, progression: true, topPlayers: true })

  const handleGenerate = async () => {
    setIsGenerating(true)
    setErrorMsg(null)
    try {
      const { data, error } = await getMonthlyReportData(month, null)
      if (error || !data) throw new Error('Données indisponibles')
      const filename = `aureak-rapport-${month}-all.pdf`
      const options: ReportOptions = { month, implantationId: null, sections, filename }
      await generateMonthlyReport(data, options)
      onClose()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ExportModal] generateMonthlyReport error:', err)
      setErrorMsg('Impossible de générer le PDF — vérifiez votre connexion')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={em.overlay} onPress={onClose}>
        <Pressable style={em.modal} onPress={e => e.stopPropagation?.()}>
          <AureakText style={em.title as TextStyle}>Exporter PDF mensuel</AureakText>

          <AureakText style={em.label as TextStyle}>MOIS</AureakText>
          <View style={em.monthRow}>
            {months.slice(0, 6).map(m => (
              <Pressable key={m} onPress={() => setMonth(m)} style={[em.monthChip, m === month && em.monthChipActive]}>
                <AureakText style={{ ...em.monthChipText, ...(m === month ? em.monthChipTextActive : {}) } as TextStyle}>{m}</AureakText>
              </Pressable>
            ))}
          </View>

          <AureakText style={em.label as TextStyle}>SECTIONS INCLUSES</AureakText>
          <View style={em.checkboxCol}>
            {(['presences', 'progression', 'topPlayers'] as const).map(sec => {
              const labels = { presences: 'Présences', progression: 'Progression', topPlayers: 'Top joueurs' }
              return (
                <Pressable key={sec} onPress={() => setSections(prev => ({ ...prev, [sec]: !prev[sec] }))} style={em.checkboxItem}>
                  <View style={[em.checkbox, sections[sec] && em.checkboxChecked]}>
                    {sections[sec] && <AureakText style={em.checkmark as TextStyle}>✓</AureakText>}
                  </View>
                  <AureakText style={em.checkboxLabel as TextStyle}>{labels[sec]}</AureakText>
                </Pressable>
              )
            })}
          </View>

          {errorMsg && <AureakText style={em.errorText as TextStyle}>{errorMsg}</AureakText>}

          <View style={em.actions}>
            <Pressable onPress={onClose} style={em.cancelBtn}>
              <AureakText style={em.cancelText as TextStyle}>Annuler</AureakText>
            </Pressable>
            <Pressable
              onPress={handleGenerate}
              disabled={isGenerating}
              style={[em.generateBtn, isGenerating && em.generateBtnDisabled]}
            >
              <AureakText style={em.generateText as TextStyle}>
                {isGenerating ? 'Génération…' : 'Générer PDF'}
              </AureakText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  page   : { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },

  sectionTitle: {
    fontSize     : 11,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop    : space.sm,
  },

  kpiGrid     : { flexDirection: 'row', flexWrap: 'wrap' },
  kpiSlot     : { minWidth: 200, flexGrow: 1 },

  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  shortcutCard: {
    minWidth       : 220,
    flexGrow       : 1,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
    // @ts-ignore web
    boxShadow      : shadows.sm,
  },
  shortcutPressed: { opacity: 0.88 },
  shortcutAccent : { height: 3 },
  shortcutBody   : { padding: space.md, gap: 6 },
  shortcutIcon   : { fontSize: 28 },
  shortcutTitle  : {
    fontSize  : 16,
    fontWeight: '700',
    fontFamily: fonts.display,
    color     : colors.text.dark,
  },
  shortcutDesc: {
    fontSize  : 12,
    color     : colors.text.muted,
    lineHeight: 18,
  },
  shortcutCta: {
    fontSize  : 12,
    fontWeight: '700',
    marginTop : 4,
  },
})

const em = StyleSheet.create({
  overlay: {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    justifyContent : 'center',
    alignItems     : 'center',
    padding        : space.xl,
  },
  modal: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    padding        : space.xl,
    width          : '100%' as never,
    maxWidth       : 440,
    gap            : space.sm,
    // @ts-ignore web
    boxShadow      : shadows.lg,
  },
  title: {
    fontSize    : 18,
    fontWeight  : '700',
    color       : colors.text.dark,
    fontFamily  : fonts.display,
    marginBottom: space.sm,
  },
  label: {
    fontSize     : 11,
    fontWeight   : '700',
    color        : colors.text.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop    : space.sm,
  },
  monthRow: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
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
  checkboxCol        : { gap: 8 },
  checkboxItem       : { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkbox: {
    width         : 18,
    height        : 18,
    borderRadius  : 4,
    borderWidth   : 1,
    borderColor   : colors.border.light,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  checkmark      : { fontSize: 10, color: colors.text.dark, fontWeight: '700' },
  checkboxLabel  : { fontSize: 13, color: colors.text.dark },
  errorText      : { fontSize: 12, color: colors.accent.red, marginTop: 12 },
  actions: {
    flexDirection : 'row',
    justifyContent: 'flex-end',
    gap           : 10,
    marginTop     : space.md,
  },
  cancelBtn: {
    paddingVertical  : 9,
    paddingHorizontal: 18,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  cancelText : { fontSize: 13, color: colors.text.muted },
  generateBtn: {
    paddingVertical  : 9,
    paddingHorizontal: 18,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateText       : { fontSize: 13, fontWeight: '700', color: colors.text.dark },
})
