// SituationCard.tsx — Card situation pédagogique style Hearthstone (Story 58-1)
// Illustration ASCII terrain, badge méthode, étoiles difficulté, badge recommandé
// Tokens @aureak/theme exclusivement — seules exceptions : FIELD_DARK / FIELD_LIGHT

import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { colors, radius, shadows, space, methodologyMethodColors } from '@aureak/theme'
import type { MethodologySituation } from '@aureak/types'
import { Text as AureakText } from './components/Text'

// ── Constantes terrain ────────────────────────────────────────────────────────
const FIELD_DARK       = '#1a472a'
const FIELD_LIGHT      = '#2d6a4f'
const BADGE_TEXT_COLOR = '#FFFFFF'

const FIELD_ASCII = [
  '  ┌──────────────────┐  ',
  '  │   ┌──────────┐   │  ',
  '  │   │    ●     │   │  ',
  '  │   └──────────┘   │  ',
  '  │────────────────── │  ',
  '  │   ┌──────────┐   │  ',
  '  │   │          │   │  ',
  '  └──────────────────┘  ',
].join('\n')

// ── Types ─────────────────────────────────────────────────────────────────────

export type SituationCardProps = {
  situation      : MethodologySituation
  onPress?       : () => void
  difficulty?    : number         // 1–5, défaut 3
  isRecommended? : boolean
  draggable?     : boolean
  onDragStart?   : (e: React.DragEvent<HTMLDivElement>) => void
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor : colors.light.surface,
    borderRadius    : radius.cardLg,
    // boxShadow via style inline (non supporté dans StyleSheet React Native)
    minHeight       : 200,
    maxWidth        : 280,
    overflow        : 'hidden' as never,
    flexDirection   : 'column',
  },
  fieldZone: {
    height          : 90,
    backgroundColor : FIELD_DARK,
    position        : 'relative' as never,
    alignItems      : 'center',
    justifyContent  : 'center',
    overflow        : 'hidden' as never,
  },
  fieldAscii: {
    fontFamily      : 'monospace',
    fontSize        : 9,
    color           : FIELD_LIGHT,
    letterSpacing   : 0,
    lineHeight      : 12,
    userSelect      : 'none' as never,
  },
  methodBadge: {
    position        : 'absolute' as never,
    top             : 6,
    right           : 6,
    borderRadius    : radius.xs,
    paddingHorizontal: 6,
    paddingVertical : 2,
  },
  recommendedBadge: {
    position        : 'absolute' as never,
    top             : 6,
    left            : 6,
    borderRadius    : radius.xs,
    paddingHorizontal: 6,
    paddingVertical : 2,
    backgroundColor : 'rgba(0,0,0,0.6)',
    borderWidth     : 1,
    borderColor     : colors.accent.gold,
  },
  infoZone: {
    padding : space.sm,
    gap     : 4,
    flex    : 1,
  },
  starsRow: {
    flexDirection : 'row',
    marginTop     : 4,
    gap           : 2,
  },
})

// ── Composant ─────────────────────────────────────────────────────────────────

export function SituationCard({
  situation,
  onPress,
  difficulty = 3,
  isRecommended = false,
  draggable,
  onDragStart,
}: SituationCardProps) {
  const methodColor = (methodologyMethodColors as Record<string, string>)[situation.method ?? ''] ?? colors.accent.gold

  const dragProps = draggable
    ? {
        draggable  : true,
        onDragStart: onDragStart,
      }
    : {}

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { boxShadow: shadows.md } as never]}
      {...(dragProps as object)}
    >
      {/* Zone illustration terrain */}
      <View style={styles.fieldZone}>
        <AureakText style={styles.fieldAscii as never}>{FIELD_ASCII}</AureakText>

        {/* Badge méthode — overlay haut-droite */}
        {situation.method && (
          <View style={[styles.methodBadge, { backgroundColor: methodColor }]}>
            <AureakText
              variant="caption"
              style={{ color: BADGE_TEXT_COLOR, fontSize: 10, fontWeight: '700' } as never}
            >
              {situation.method}
            </AureakText>
          </View>
        )}

        {/* Badge recommandé — overlay haut-gauche */}
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <AureakText
              variant="caption"
              style={{ color: colors.accent.gold, fontSize: 10, fontWeight: '700' } as never}
            >
              ✦ Recommandé
            </AureakText>
          </View>
        )}
      </View>

      {/* Zone infos */}
      <View style={styles.infoZone}>
        <AureakText
          variant="body"
          style={{ fontWeight: '700', fontSize: 15, color: colors.text.dark } as never}
          numberOfLines={2}
        >
          {situation.title}
        </AureakText>

        {situation.description && (
          <AureakText
            variant="caption"
            style={{ color: colors.text.muted, marginTop: space.xs } as never}
            numberOfLines={2}
          >
            {situation.description}
          </AureakText>
        )}

        {/* Étoiles difficulté */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <AureakText
              key={i}
              style={{
                color   : i <= difficulty ? colors.accent.gold : colors.border.light,
                fontSize: 14,
              } as never}
            >
              ★
            </AureakText>
          ))}
        </View>
      </View>
    </Pressable>
  )
}
