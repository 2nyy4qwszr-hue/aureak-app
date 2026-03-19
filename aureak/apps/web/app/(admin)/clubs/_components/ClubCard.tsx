// ClubCard — Story 26.1 : fond PNG premium + zones absolute
// Story 26.2 : aspectRatio:1, CIRCLE_OUTER=140, nom uppercase 17px, fontFamily expo-font corrects

import React, { useState, useEffect } from 'react'
import { View, Image, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, shadows } from '@aureak/theme'
import type { ClubDirectoryEntry, ClubRelationType } from '@aureak/types'
import { CLUB_RELATION_TYPE_LABELS } from '@aureak/types'

const CARD_BG = require('../../../../assets/cards/background-card-club.png')

// ── Dimensions ────────────────────────────────────────────────────────────────
// Proportionnelles au fond graphique (quasi carré) — Story 26.2 : aspectRatio: 1
const CIRCLE_OUTER = 140   // diamètre total du cercle gold du fond
const CIRCLE_TOP   = 24    // distance du haut de la carte au haut du cercle
const CIRCLE_INNER = CIRCLE_OUTER - 28   // 112px — inscrit dans le ring gold

// ── Badge colors ──────────────────────────────────────────────────────────────
const RELATION_BADGE_COLORS: Record<Exclude<ClubRelationType, 'normal'>, string> = {
  partenaire: colors.accent.gold,
  associe   : '#60a5fa',
}

// ── ClubCard ──────────────────────────────────────────────────────────────────

type Props = {
  club   : ClubDirectoryEntry
  onPress: () => void
}

export default function ClubCard({ club, onPress }: Props) {
  const [hovered,  setHovered]  = useState(false)
  const [pressed,  setPressed]  = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => { setImgError(false) }, [club.logoUrl])

  const showLogo    = !!club.logoUrl && !imgError
  const isNonNormal = club.clubRelationType !== 'normal'
  const badgeColor  = isNonNormal
    ? RELATION_BADGE_COLORS[club.clubRelationType as Exclude<ClubRelationType, 'normal'>]
    : undefined
  const count = club.gardienCount

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityLabel={club.nom}
      accessibilityRole="button"
      style={[s.card, hovered && s.cardHover, pressed && s.cardPressed]}
    >
      {/* ── Fond graphique plein-cadre — contain : image entière, centrée, non zoomée ── */}
      {/* Fix : width/height 100% explicites — absoluteFillObject ne contraint pas <img> sur web */}
      <Image
        source={CARD_BG}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } as never}
        resizeMode="contain"
      />

      {/* ── Zone logo — centré dans le cercle gold du fond ── */}
      <View style={s.logoZone}>
        {showLogo ? (
          <Image
            source={{ uri: club.logoUrl! }}
            style={s.logoImage}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <AureakText style={s.logoFallback as never}>🧤</AureakText>
        )}
      </View>

      {/* ── Nom + localisation ── */}
      <View style={s.textZone}>
        <AureakText style={s.name as never} numberOfLines={2}>
          {club.nom}
        </AureakText>
        {(club.ville || club.province) && (
          <AureakText style={s.location as never}>
            {[club.ville, club.province].filter(Boolean).join(', ')}
          </AureakText>
        )}
      </View>

      {/* ── Stat gardiens ── */}
      <View style={s.statZone}>
        <AureakText style={s.statLabel as never}>Gardiens à l'académie</AureakText>
        <View style={s.statRow}>
          <AureakText style={s.gloveIcon as never}>🧤</AureakText>
          <AureakText style={s.statNumber as never}>
            {count > 0 ? count : '—'}
          </AureakText>
        </View>
      </View>

      {/* ── Badge type de relation (partenaire / associé) ── */}
      {isNonNormal && badgeColor && (
        <View style={[s.relationBadge, { borderColor: badgeColor }]}>
          <AureakText style={[s.relationBadgeText as never, { color: badgeColor }]}>
            {CLUB_RELATION_TYPE_LABELS[club.clubRelationType]}
          </AureakText>
        </View>
      )}
    </Pressable>
  )
}

// ── ClubCardSkeleton ──────────────────────────────────────────────────────────

export function ClubCardSkeleton() {
  return (
    <View style={sk.card}>
      <View style={sk.circle} />
      <View style={sk.nameLine} />
      <View style={sk.locationLine} />
      <View style={sk.statBlock} />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    aspectRatio     : 1,
    borderRadius    : 24,
    overflow        : 'hidden',
    boxShadow       : shadows.md,
    backgroundColor : colors.light.surface,   // visible autour du PNG (contain) + fallback si PNG échoue
  } as never,
  cardHover: {
    boxShadow: shadows.gold,
    transform: [{ scale: 1.02 }],
  } as never,
  cardPressed: {
    opacity  : 0.92,
    transform: [{ scale: 0.98 }],
  } as never,

  // Logo centré dans le cercle gold du fond
  logoZone: {
    position      : 'absolute',
    top           : CIRCLE_TOP,
    left          : '50%' as never,
    marginLeft    : -(CIRCLE_OUTER / 2),
    width         : CIRCLE_OUTER,
    height        : CIRCLE_OUTER,
    alignItems    : 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width       : CIRCLE_INNER,
    height      : CIRCLE_INNER,
    borderRadius: CIRCLE_INNER / 2,
  },
  logoFallback: {
    fontSize: 44,
  },

  // Texte centré sous le cercle
  textZone: {
    position  : 'absolute',
    top       : CIRCLE_TOP + CIRCLE_OUTER + 16,   // 24 + 140 + 16 = 180
    left      : 16,
    right     : 16,
    alignItems: 'center',
  },
  name: {
    fontFamily   : 'Montserrat-Bold',
    fontSize     : 17,
    color        : colors.text.dark,
    textAlign    : 'center',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    lineHeight   : 22,
  },
  location: {
    fontFamily: 'Montserrat-Regular',
    fontSize  : 11,
    color     : colors.text.muted,
    textAlign : 'center',
    marginTop : 4,
    lineHeight: 16,
  },

  // Stat gardiens — ancré en bas
  statZone: {
    position  : 'absolute',
    bottom    : 20,
    left      : 0,
    right     : 0,
    alignItems: 'center',
    gap       : 4,
  },
  statLabel: {
    fontFamily   : 'Montserrat-SemiBold',
    fontSize     : 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
    color        : colors.text.muted,
  },
  statRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 8,
  },
  gloveIcon: {
    fontSize: 32,
  },
  statNumber: {
    fontFamily: 'Montserrat-ExtraBold',
    fontSize  : 40,
    color     : '#3d2b00',   // brun gold foncé — cohérent avec la référence visuelle
    lineHeight: 44,
  },

  // Badge relation (top-right)
  relationBadge: {
    position         : 'absolute' as never,
    top              : 10,
    right            : 10,
    borderWidth      : 1,
    borderRadius     : 8,
    paddingHorizontal: 7,
    paddingVertical  : 2,
    backgroundColor  : 'rgba(255,255,255,0.85)',
  },
  relationBadgeText: {
    fontFamily: 'Montserrat-Bold',
    fontSize  : 9,
  },
})

const sk = StyleSheet.create({
  card: {
    aspectRatio    : 1,                    // Story 26.2 — carte carrée
    borderRadius   : 24,
    overflow       : 'hidden',
    backgroundColor: colors.light.muted,
    opacity        : 0.7,
  },
  circle: {
    position       : 'absolute',
    top            : CIRCLE_TOP,           // 24
    left           : '50%' as never,
    marginLeft     : -(CIRCLE_OUTER / 2),  // -70
    width          : CIRCLE_OUTER,         // 140
    height         : CIRCLE_OUTER,         // 140
    borderRadius   : CIRCLE_OUTER / 2,
    backgroundColor: colors.border.divider,
  },
  nameLine: {
    position       : 'absolute',
    top            : CIRCLE_TOP + CIRCLE_OUTER + 20,  // 184
    left           : '22%' as never,
    right          : '22%' as never,
    height         : 14,
    borderRadius   : 4,
    backgroundColor: colors.border.divider,
  },
  locationLine: {
    position       : 'absolute',
    top            : CIRCLE_TOP + CIRCLE_OUTER + 40,  // 204
    left           : '32%' as never,
    right          : '32%' as never,
    height         : 11,
    borderRadius   : 4,
    backgroundColor: colors.border.divider,
  },
  statBlock: {
    position       : 'absolute',
    bottom         : 24,
    left           : '30%' as never,
    right          : '30%' as never,
    height         : 48,
    borderRadius   : 8,
    backgroundColor: colors.border.divider,
  },
})
