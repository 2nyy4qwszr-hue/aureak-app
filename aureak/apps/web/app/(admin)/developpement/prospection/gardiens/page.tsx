// Epic 89 — Story 89.6 : Dashboard funnel prospection gardiens
// AC #7 : taux de conversion par étape (prospect → invité → essai → candidat → inscrit)
// + listing des essais consommés avec issue et override admin (reset trial right).
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  getProspectFunnelStats,
  listChildDirectory,
  resetTrialRight,
  recordTrialOutcome,
  type ProspectFunnelStats,
} from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { ChildDirectoryEntry, TrialOutcome } from '@aureak/types'

// ── Funnel Card (1 étape) ─────────────────────────────────────────────────────

type FunnelStep = {
  key        : keyof ProspectFunnelStats
  label      : string
  picto      : string
  color      : string
}

const FUNNEL_STEPS: FunnelStep[] = [
  { key: 'prospect', label: 'PROSPECTS',  picto: '🔍', color: colors.text.muted        },
  { key: 'contacte', label: 'CONTACTÉS',  picto: '📞', color: colors.status.amberText  },
  { key: 'invite',   label: 'INVITÉS',    picto: '✉️',  color: colors.accent.gold       },
  { key: 'candidat', label: 'CANDIDATS',  picto: '⚽', color: colors.status.present    },
  { key: 'inscrit',  label: 'INSCRITS',   picto: '🎓', color: colors.accent.gold       },
]

function formatPercent(num: number, denom: number): string {
  if (denom <= 0) return '—'
  return `${Math.round((num / denom) * 100)} %`
}

function FunnelStepCard({
  step, value, prevValue,
}: {
  step: FunnelStep; value: number; prevValue: number | null
}) {
  const conversion = prevValue !== null ? formatPercent(value, prevValue) : null
  return (
    <View style={st.funnelCard}>
      <AureakText style={st.funnelPicto as never}>{step.picto}</AureakText>
      <AureakText style={st.funnelLabel as never}>{step.label}</AureakText>
      <AureakText style={[st.funnelValue, { color: step.color }] as never}>{value}</AureakText>
      {conversion && (
        <AureakText style={st.funnelConversion as never}>
          {conversion} depuis étape préc.
        </AureakText>
      )}
    </View>
  )
}

// ── Table listing prospects avec essai consommé ──────────────────────────────

function OutcomeBadge({ outcome }: { outcome: TrialOutcome | null }) {
  if (outcome === null) {
    return <AureakText style={{ color: colors.text.muted, fontSize: 12 }}>—</AureakText>
  }
  const conf: Record<TrialOutcome, { label: string; color: string }> = {
    present   : { label: 'Présent',   color: colors.status.present   },
    absent    : { label: 'Absent',    color: colors.status.absent    },
    cancelled : { label: 'Annulée',   color: colors.text.muted       },
  }
  const c = conf[outcome]
  return (
    <View style={[st.badge, { backgroundColor: c.color + '22', borderColor: c.color }] as never}>
      <AureakText style={{ color: c.color, fontSize: 11, fontWeight: '700' }}>
        {c.label}
      </AureakText>
    </View>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ProspectionGardiensPage() {
  const router                    = useRouter()
  const role                      = useAuthStore(s => s.role)
  const [stats, setStats]         = useState<ProspectFunnelStats | null>(null)
  const [trialUsed, setTrialUsed] = useState<ChildDirectoryEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [actionId, setActionId]   = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)

  // Story 89.1 — CTA scout terrain (admin + commercial)
  const canAddProspect = role === 'admin' || role === 'commercial'

  async function loadAll() {
    setLoading(true)
    try {
      const [fs, list] = await Promise.all([
        getProspectFunnelStats(),
        listChildDirectory({ pageSize: 1000 }),
      ])
      setStats(fs)
      // On ne montre que les gardiens ayant consommé leur essai gratuit
      setTrialUsed(list.data.filter(c => c.trialUsed))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionGardiensPage] load error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // Conversion funnel (stats[step] / stats[stepPrécédent])
  const funnelValues = useMemo(() => {
    if (!stats) return []
    return FUNNEL_STEPS.map((s, i) => ({
      step     : s,
      value    : stats[s.key] as number,
      prevValue: i === 0 ? null : (stats[FUNNEL_STEPS[i - 1].key] as number),
    }))
  }, [stats])

  // Taux global prospect → inscrit
  const globalConversion = stats && stats.prospect > 0
    ? formatPercent(stats.inscrit, stats.prospect)
    : null

  async function handleReset(childId: string) {
    setActionId(childId)
    setError(null)
    try {
      const res = await resetTrialRight(childId)
      if (res.ok === false) {
        setError(res.error)
        return
      }
      await loadAll()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionGardiensPage] reset error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setActionId(null)
    }
  }

  async function handleSetOutcome(childId: string, outcome: TrialOutcome) {
    setActionId(childId)
    setError(null)
    try {
      const res = await recordTrialOutcome({ childId, outcome })
      if (res.ok === false) {
        setError(res.error)
        return
      }
      await loadAll()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionGardiensPage] outcome error:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setActionId(null)
    }
  }

  return (
    <ScrollView style={st.container} contentContainerStyle={st.content}>
      {/* Header */}
      <View style={st.header}>
        <AureakText style={st.title as never}>Prospection — Gardiens</AureakText>
        <AureakText style={st.sub as never}>
          Funnel de conversion et traçabilité des séances d'essai gratuites
        </AureakText>
      </View>

      {/* Story 89.1 — CTA ajout rapide prospect terrain (admin | commercial) */}
      {canAddProspect && (
        <Pressable
          style={st.addProspectCta}
          onPress={() => router.push('/developpement/prospection/gardiens/ajouter' as never)}
          accessibilityLabel="Ajouter un prospect terrain"
        >
          <AureakText style={st.addProspectCtaText as never}>
            + Ajouter un prospect terrain
          </AureakText>
        </Pressable>
      )}

      {error && (
        <View style={st.errorBanner}>
          <AureakText style={{ color: colors.status.absent, fontSize: 12 }}>{error}</AureakText>
        </View>
      )}

      {/* Funnel Stats */}
      {loading ? (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Chargement…</AureakText>
      ) : !stats ? (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>Stats indisponibles</AureakText>
      ) : (
        <>
          {/* Conversion globale */}
          <View style={st.globalCard}>
            <View>
              <AureakText style={st.globalLabel as never}>TAUX DE CONVERSION GLOBAL</AureakText>
              <AureakText style={st.globalSub as never}>Prospect → Inscrit</AureakText>
            </View>
            <AureakText style={st.globalValue as never}>{globalConversion ?? '—'}</AureakText>
          </View>

          {/* Funnel row */}
          <View style={st.funnelRow}>
            {funnelValues.map(({ step, value, prevValue }) => (
              <FunnelStepCard
                key={step.key as string}
                step={step}
                value={value}
                prevValue={prevValue}
              />
            ))}
          </View>

          {/* Compteurs essais consommés */}
          <View style={st.secondaryRow}>
            <View style={st.kpiMini}>
              <AureakText style={st.kpiMiniLabel as never}>ESSAIS CONSOMMÉS</AureakText>
              <AureakText style={st.kpiMiniValue as never}>{stats.trialsUsed}</AureakText>
            </View>
            <View style={st.kpiMini}>
              <AureakText style={st.kpiMiniLabel as never}>ABSENCES ESSAIS</AureakText>
              <AureakText style={[st.kpiMiniValue, { color: colors.status.absent }] as never}>
                {stats.trialsAbsent}
              </AureakText>
            </View>
          </View>
        </>
      )}

      {/* Liste des essais consommés */}
      <View style={st.sectionHeader}>
        <AureakText style={st.sectionTitle as never}>Essais consommés</AureakText>
        <AureakText style={st.sectionSub as never}>
          {trialUsed.length} prospect{trialUsed.length > 1 ? 's' : ''} — gérez l'issue et les overrides
        </AureakText>
      </View>

      {loading ? (
        <AureakText style={{ color: colors.text.muted, fontSize: 13 }}>…</AureakText>
      ) : trialUsed.length === 0 ? (
        <View style={st.emptyState}>
          <AureakText style={st.emptyText as never}>
            Aucun essai consommé pour le moment
          </AureakText>
        </View>
      ) : (
        <View style={st.tableWrapper}>
          {/* Header */}
          <View style={st.tableHeader}>
            <View style={{ flex: 2 }}>
              <AureakText style={st.thText as never}>GARDIEN</AureakText>
            </View>
            <View style={{ width: 130 }}>
              <AureakText style={st.thText as never}>DATE ESSAI</AureakText>
            </View>
            <View style={{ width: 120 }}>
              <AureakText style={st.thText as never}>ISSUE</AureakText>
            </View>
            <View style={{ width: 130 }}>
              <AureakText style={st.thText as never}>STATUT</AureakText>
            </View>
            <View style={{ flex: 1.5, minWidth: 260 }}>
              <AureakText style={st.thText as never}>ACTIONS</AureakText>
            </View>
          </View>
          {trialUsed.map((c, idx) => {
            const rowBg = idx % 2 === 0 ? colors.light.surface : colors.light.muted
            const dateFmt = c.trialDate
              ? new Date(c.trialDate).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : '—'
            const busy = actionId === c.id
            return (
              <View key={c.id} style={[st.tableRow, { backgroundColor: rowBg }] as never}>
                <View style={{ flex: 2 }}>
                  <AureakText style={st.nameText as never}>{c.displayName}</AureakText>
                  <AureakText style={st.nameSub as never}>
                    {c.parent1Email ?? c.parent2Email ?? '—'}
                  </AureakText>
                </View>
                <AureakText style={[st.cellMuted, { width: 130 }] as never}>{dateFmt}</AureakText>
                <View style={{ width: 120 }}>
                  <OutcomeBadge outcome={c.trialOutcome} />
                </View>
                <View style={{ width: 130 }}>
                  <AureakText style={st.cellMuted as never}>
                    {c.prospectStatus ?? '—'}
                  </AureakText>
                </View>
                <View style={st.actionsCell}>
                  {c.trialOutcome === null ? (
                    <>
                      <Pressable
                        style={[st.actionBtnGreen, busy && { opacity: 0.5 }] as never}
                        disabled={busy}
                        onPress={() => handleSetOutcome(c.id, 'present')}
                      >
                        <AureakText style={st.actionBtnText as never}>Présent</AureakText>
                      </Pressable>
                      <Pressable
                        style={[st.actionBtnRed, busy && { opacity: 0.5 }] as never}
                        disabled={busy}
                        onPress={() => handleSetOutcome(c.id, 'absent')}
                      >
                        <AureakText style={st.actionBtnText as never}>Absent</AureakText>
                      </Pressable>
                      <Pressable
                        style={[st.actionBtnNeutral, busy && { opacity: 0.5 }] as never}
                        disabled={busy}
                        onPress={() => handleSetOutcome(c.id, 'cancelled')}
                      >
                        <AureakText style={st.actionBtnTextDark as never}>Annulée</AureakText>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={[st.actionBtnNeutral, busy && { opacity: 0.5 }] as never}
                      disabled={busy}
                      onPress={() => handleReset(c.id)}
                    >
                      <AureakText style={st.actionBtnTextDark as never}>
                        ↺ Reset essai (admin)
                      </AureakText>
                    </Pressable>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },

  header: { gap: 6 },
  title : { fontSize: 24, fontWeight: '700', fontFamily: fonts.display, color: colors.text.dark, letterSpacing: 0.5 },
  sub   : { color: colors.text.muted, fontSize: 13 },

  // Story 89.1 — CTA ajout rapide prospect terrain
  addProspectCta: {
    minHeight        : 48,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
    alignItems       : 'center',
    justifyContent   : 'center',
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    // @ts-ignore RN Web
    boxShadow        : shadows.md,
  },
  addProspectCtaText: {
    color     : colors.text.dark,
    fontSize  : 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  errorBanner: {
    backgroundColor  : colors.status.absent + '15',
    borderLeftWidth  : 3,
    borderLeftColor  : colors.status.absent,
    padding          : space.sm,
    borderRadius     : radius.xs,
  },

  // Global conversion card
  globalCard: {
    flexDirection  : 'row',
    justifyContent : 'space-between',
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.xl,
    // @ts-ignore
    boxShadow      : shadows.sm,
  },
  globalLabel: { color: colors.text.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  globalSub  : { color: colors.text.subtle, fontSize: 13, marginTop: 4 },
  globalValue: { fontSize: 40, fontFamily: fonts.display, fontWeight: '900', color: colors.accent.gold },

  // Funnel cards row
  funnelRow: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  funnelCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    minWidth       : 150,
    flex           : 1,
    alignItems     : 'center',
    gap            : 4,
    // @ts-ignore
    boxShadow      : shadows.sm,
  },
  funnelPicto: { fontSize: 22, marginBottom: 2 },
  funnelLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  funnelValue: { fontSize: 28, fontFamily: fonts.display, fontWeight: '900' },
  funnelConversion: { color: colors.text.subtle, fontSize: 10, textAlign: 'center', marginTop: 2 },

  // Secondary mini kpis
  secondaryRow: { flexDirection: 'row', gap: space.md, flexWrap: 'wrap' },
  kpiMini: {
    backgroundColor : colors.light.surface,
    borderRadius    : radius.card,
    borderWidth     : 1,
    borderColor     : colors.border.light,
    padding         : space.md,
    minWidth        : 180,
    flex            : 1,
  },
  kpiMiniLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  kpiMiniValue: { fontSize: 22, fontWeight: '800', color: colors.text.dark, marginTop: 4 },

  // Section header
  sectionHeader: { marginTop: space.lg, gap: 4 },
  sectionTitle : { fontSize: 16, fontFamily: fonts.display, fontWeight: '700', color: colors.text.dark },
  sectionSub   : { color: colors.text.muted, fontSize: 12 },

  // Table
  tableWrapper: {
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    overflow       : 'hidden',
    backgroundColor: colors.light.surface,
  },
  tableHeader: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 10,
    backgroundColor  : colors.light.muted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.md,
  },
  thText: {
    fontSize     : 10,
    fontWeight   : '700',
    fontFamily   : fonts.display,
    color        : colors.text.subtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection    : 'row',
    alignItems       : 'center',
    paddingHorizontal: 16,
    paddingVertical  : 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    gap              : space.md,
  },
  nameText : { color: colors.text.dark, fontSize: 13, fontWeight: '600' },
  nameSub  : { color: colors.text.muted, fontSize: 11, marginTop: 2 },
  cellMuted: { color: colors.text.muted, fontSize: 12 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical  : 3,
    borderRadius     : 10,
    borderWidth      : 1,
    alignSelf        : 'flex-start',
  },

  actionsCell: { flex: 1.5, minWidth: 260, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actionBtnGreen  : { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.xs, backgroundColor: colors.status.present },
  actionBtnRed    : { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.xs, backgroundColor: colors.status.absent },
  actionBtnNeutral: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.xs, backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.border.light },
  actionBtnText     : { color: '#fff', fontSize: 11, fontWeight: '700' },
  actionBtnTextDark : { color: colors.text.dark, fontSize: 11, fontWeight: '700' },

  emptyState: {
    padding        : space.xl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  emptyText: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },
})
