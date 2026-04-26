'use client'
// Hub Performance — Vue d'ensemble : pattern strictement aligné sur /activites
// (header tabs uniformisé, KPIs + 3 widgets, FAB "Exporter PDF").
//
// Story 60.1 — Stats Room landing (origine).
// Story 98.4 — Hub Performance dashboard-style.
// Refonte alignée sur pattern activites (Epic Design Alignment).

import React, { useState, useEffect } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Modal, useWindowDimensions } from 'react-native'
import type { TextStyle } from 'react-native'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { AureakText } from '@aureak/ui'
import { getMonthlyReportData } from '@aureak/api-client'
import type { ReportOptions } from '@aureak/types'

import { PerformanceNavBar }                                                   from '../../../components/admin/performance/PerformanceNavBar'
import { PerformanceHubKpis }                                                  from '../../../components/admin/performance/PerformanceHubKpis'
import { PerformanceHubLive, PerformanceHubExploration, PerformanceHubComparaisons } from '../../../components/admin/performance/PerformanceHubWidgets'
import { PrimaryAction }                                                       from '../../../components/admin/PrimaryAction'
import { generateMonthlyReport }                                               from '../../../lib/admin/performance/generateMonthlyReport'

export default function PerformanceHubPage() {
  const { width } = useWindowDimensions()
  const widgetCols = width >= 1024 ? 3 : 1

  const [showExportModal, setShowExportModal] = useState(false)

  // Ouvre le modal export depuis le bouton topbar "+ Rapport mensuel" (event custom).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => setShowExportModal(true)
    window.addEventListener('aureak:performance-export', handler)
    return () => window.removeEventListener('aureak:performance-export', handler)
  }, [])

  return (
    <View style={styles.container}>
      <PerformanceNavBar />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <PerformanceHubKpis />

        <View style={[styles.widgetsGrid, { gridTemplateColumns: `repeat(${widgetCols}, 1fr)` } as never]}>
          <PerformanceHubLive />
          <PerformanceHubExploration />
          <PerformanceHubComparaisons />
        </View>
      </ScrollView>

      <PrimaryAction
        label="Exporter PDF"
        onPress={() => setShowExportModal(true)}
      />

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scroll: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  scrollContent: {
    paddingTop   : space.md,
    paddingBottom: 64,
    gap          : space.md,
  },
  widgetsGrid: {
    display          : 'grid' as never,
    gap              : space.md,
    paddingHorizontal: space.lg,
    paddingTop       : space.sm,
  },
})

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
