// EvaluationCard.tsx — Card FUT-style note centrale (Story 55-1)
// Affichage percutant évaluation gardien : note centrale, sous-scores, photo background
// Gamme : or ≥8, argent 6–7.9, bronze <6 — tokens @aureak/theme exclusivement

import React from 'react'
import { Platform, View, StyleSheet, Image } from 'react-native'
import { colors, fonts, radius, shadows, space } from '@aureak/theme'
import type { EvaluationWithChild } from '@aureak/types'
import { Text as AureakText } from './components/Text'

// ── Constantes de gamme ───────────────────────────────────────────────────────

export type EvaluationTier = 'gold' | 'silver' | 'bronze'

/** Calcule le tier (gamme) depuis une note 0–10 */
export function evalTier(score: number): EvaluationTier {
  if (score >= 8.0) return 'gold'
  if (score >= 6.0) return 'silver'
  return 'bronze'
}

/** Calcule un score numérique 0–10 depuis les signaux qualitatifs */
export function signalScore(receptivite: string, goutEffort: string, attitude: string): number {
  const val = (s: string) => s === 'positive' ? 1 : s === 'none' ? 0.5 : 0
  return ((val(receptivite) + val(goutEffort) + val(attitude)) / 3) * 10
}

// ── Config visuelle par gamme ─────────────────────────────────────────────────

type TierConfig = {
  bg       : string
  border   : string
  label    : string
  noteColor: string
  textColor: string
  badgeBg  : string
  badgeText: string
}

const TIER_CONFIG: Record<EvaluationTier, TierConfig> = {
  gold: {
    bg       : colors.accent.gold,
    border   : colors.accent.goldLight,
    label    : 'OR',
    noteColor: '#3D2E00',
    textColor: '#3D2E00',
    badgeBg  : colors.accent.goldLight,
    badgeText: '#3D2E00',
  },
  silver: {
    bg       : colors.light.surface,
    border   : '#C0C0C0',
    label    : 'ARG',
    noteColor: colors.text.dark,
    textColor: colors.text.dark,
    badgeBg  : '#E5E5E5',
    badgeText: '#444',
  },
  bronze: {
    bg       : colors.status.errorStrong + '18',    // rouge pâle 10% opacité
    border   : colors.status.errorStrong,
    label    : 'BRZ',
    noteColor: colors.status.errorStrong,
    textColor: colors.text.dark,
    badgeBg  : colors.status.errorStrong + '30',
    badgeText: colors.status.errorStrong,
  },
}

// ── Labels des sous-scores ────────────────────────────────────────────────────

const SIGNAL_LABEL: Record<string, string> = {
  acquired    : 'Acquis',
  in_progress : 'En cours',
  not_acquired: 'Non acquis',
  positive    : 'Positif',
  attention   : 'Attention',
  none        : 'Neutre',
}

type SubScore = { label: string; value: string }

function buildSubScores(ev: EvaluationWithChild): SubScore[] {
  const scores: SubScore[] = [
    { label: 'Réceptivité', value: SIGNAL_LABEL[ev.receptivite] ?? ev.receptivite },
    { label: 'Goût effort', value: SIGNAL_LABEL[ev.goutEffort]  ?? ev.goutEffort  },
    { label: 'Attitude',    value: SIGNAL_LABEL[ev.attitude]    ?? ev.attitude     },
  ]
  return scores.filter(s => s.value)
}

// ── Initiales fallback ────────────────────────────────────────────────────────

function initials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ── Props ─────────────────────────────────────────────────────────────────────

export type EvaluationCardProps = {
  evaluation   : EvaluationWithChild
  showPhoto?   : boolean    // afficher la photo en background (défaut true)
  compact?     : boolean    // mode liste dense — note 48px, critères masqués
  isPersonalBest?: boolean  // badge "Meilleure séance" (Story 55-4)
}

// ── Composant principal ───────────────────────────────────────────────────────

export function EvaluationCard({
  evaluation,
  showPhoto  = true,
  compact    = false,
  isPersonalBest = false,
}: EvaluationCardProps) {
  const score     = signalScore(evaluation.receptivite, evaluation.goutEffort, evaluation.attitude)
  const tier      = evalTier(score)
  const cfg       = TIER_CONFIG[tier]
  const subScores = buildSubScores(evaluation)

  const cardStyle = [
    styles.card,
    {
      backgroundColor: cfg.bg,
      borderColor    : cfg.border,
      boxShadow      : tier === 'gold' ? shadows.gold : shadows.sm,
    } as never,
    compact && styles.cardCompact,
  ]

  return (
    <View style={cardStyle as never}>

      {/* ── Photo background ── */}
      {showPhoto && evaluation.photoUrl && !compact && (
        <View style={styles.photoBg} pointerEvents="none">
          <Image
            source={{ uri: evaluation.photoUrl }}
            style={styles.photo}
            accessibilityLabel=""
          />
          <View style={styles.photoOverlay} />
        </View>
      )}

      {/* ── Initiales placeholder si pas de photo ── */}
      {showPhoto && !evaluation.photoUrl && !compact && (
        <View style={[styles.photoBg, styles.initialsContainer]} pointerEvents="none">
          <AureakText style={[styles.initialsText, { color: cfg.textColor + '30' }] as never}>
            {initials(evaluation.childName)}
          </AureakText>
        </View>
      )}

      {/* ── Badge gamme (coin supérieur droit) ── */}
      <View style={styles.badgeCorner} accessibilityLabel={`Gamme ${cfg.label}`}>
        <View style={[styles.tierBadge, { backgroundColor: cfg.badgeBg }]}>
          <AureakText style={[styles.tierBadgeText, { color: cfg.badgeText }] as never}>
            {cfg.label}
          </AureakText>
        </View>
      </View>

      {/* ── Badge Personal Best (Story 55-4) ── */}
      {isPersonalBest && (
        <View style={styles.pbBadgeRow}>
          {/* BestSessionBadge intégré via prop conditionnelle */}
          <View style={styles.pbBadgeInline} accessibilityLabel="Meilleure séance personnelle">
            <AureakText style={styles.pbBadgeText as never}>Meilleure séance</AureakText>
          </View>
        </View>
      )}

      {/* ── Layout : note + sous-scores ── */}
      <View style={[styles.body, compact && styles.bodyCompact]}>

        {/* Colonne gauche : sous-scores (masqués en compact) */}
        {!compact && (
          <View style={styles.subScoresCol}>
            {subScores.map((s, idx) => (
              <View key={idx} style={styles.subScoreRow}>
                <AureakText style={[styles.subScoreLabel, { color: cfg.textColor + 'BB' }] as never}>
                  {s.label}
                </AureakText>
                <AureakText style={[styles.subScoreValue, { color: cfg.textColor }] as never}>
                  {s.value}
                </AureakText>
              </View>
            ))}
          </View>
        )}

        {/* Note centrale */}
        <View style={styles.noteCenter}>
          <AureakText
            style={[
              styles.noteText,
              { color: cfg.noteColor, fontSize: compact ? 48 : 80 },
            ] as never}
          >
            {score.toFixed(1)}
          </AureakText>
          {!compact && (
            <AureakText style={[styles.noteSub, { color: cfg.textColor + '99' }] as never}>
              /10
            </AureakText>
          )}
        </View>

        {/* Spacer droite (symétrie) */}
        {!compact && <View style={styles.rightSpacer} />}
      </View>

      {/* ── Infos contextuelles ── */}
      <View style={[styles.footer, compact && styles.footerCompact]}>
        <AureakText
          style={[styles.footerName, { color: cfg.textColor }] as never}
          numberOfLines={1}
        >
          {evaluation.childName ?? '—'}
        </AureakText>
        <AureakText style={[styles.footerMeta, { color: cfg.textColor + '99' }] as never}>
          {evaluation.sessionDate
            ? new Date(evaluation.sessionDate).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short',
              })
            : '—'}
          {evaluation.coachName ? ` · ${evaluation.coachName}` : ''}
        </AureakText>
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius : radius.card,
    borderWidth  : 2,
    overflow     : 'hidden' as never,
    minHeight    : 160,
    position     : 'relative' as never,
  },
  cardCompact: {
    minHeight: 80,
  },

  // Photo background
  photoBg: {
    position      : 'absolute' as never,
    top           : 0, left: 0, right: 0, bottom: 0,
  },
  photo: {
    width         : '100%' as never,
    height        : '100%' as never,
    opacity       : 0.2,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  initialsContainer: {
    alignItems     : 'center' as never,
    justifyContent : 'center' as never,
  },
  initialsText: {
    fontSize  : 96,
    fontWeight: '900' as never,
  },

  // Badge corner
  badgeCorner: {
    position : 'absolute' as never,
    top      : space.sm,
    right    : space.sm,
    zIndex   : 10,
  },
  tierBadge: {
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
    borderRadius     : radius.badge,
  },
  tierBadgeText: {
    fontSize  : 10,
    fontWeight: '800' as never,
    letterSpacing: 1,
  },

  // Badge Personal Best
  pbBadgeRow: {
    position : 'absolute' as never,
    top      : space.sm,
    left     : space.sm,
    zIndex   : 10,
  },
  pbBadgeInline: {
    backgroundColor  : colors.accent.gold,
    paddingHorizontal: space.sm,
    paddingVertical  : 3,
    borderRadius     : radius.badge,
  },
  pbBadgeText: {
    fontSize  : 10,
    fontWeight: '800' as never,
    color     : '#3D2E00',
    letterSpacing: 0.5,
  },

  // Body layout
  body: {
    flexDirection : 'row' as never,
    alignItems    : 'center' as never,
    justifyContent: 'space-between' as never,
    paddingHorizontal: space.md,
    paddingTop    : space.lg,
    paddingBottom : space.xs,
    gap           : space.md,
  },
  bodyCompact: {
    paddingTop   : space.sm,
    paddingBottom: space.xs,
  },

  // Sous-scores
  subScoresCol: {
    flex : 1,
    gap  : 6,
  },
  subScoreRow: {
    gap: 2,
  },
  subScoreLabel: {
    fontSize  : 9,
    fontWeight: '600' as never,
    textTransform: 'uppercase' as never,
    letterSpacing: 0.8,
  },
  subScoreValue: {
    fontSize  : 12,
    fontWeight: '700' as never,
  },

  // Note centrale
  noteCenter: {
    alignItems    : 'center' as never,
    justifyContent: 'center' as never,
  },
  noteText: {
    fontWeight  : '900' as never,
    lineHeight  : 1 as never,
    fontFamily  : fonts.display,
  },
  noteSub: {
    fontSize  : 14,
    fontWeight: '600' as never,
    marginTop : -4,
  },

  // Spacer droite
  rightSpacer: {
    flex: 1,
  },

  // Footer
  footer: {
    paddingHorizontal: space.md,
    paddingBottom    : space.md,
    paddingTop       : space.xs,
    gap              : 2,
  },
  footerCompact: {
    paddingVertical: space.xs,
  },
  footerName: {
    fontSize  : 13,
    fontWeight: '700' as never,
  },
  footerMeta: {
    fontSize: 11,
  },
})
