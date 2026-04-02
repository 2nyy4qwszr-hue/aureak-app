import React, { useState } from 'react'
import { View, Image, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, shadows, radius } from '@aureak/theme'
import type { Theme } from '@aureak/types'

// Background officiel Aureak — fond blanc nacré avec décorations dorées
// Source : assets/Cards aureak - themes.png (racine projet)
const BG_THEME = require('../../../../assets/cards/background-theme.png')

// Gabarits visuels de référence (racine projet) :
//   - assets/Cards aureak - themes.png        (fond vide)
//   - assets/Cards aureak - themes modele.png  (carte complète avec données)

type Props = {
  theme    : Theme
  groupName: string | null
  category?: string | null
  onPress  : () => void
  onManage : () => void
}

export default function PremiumThemeCard({ theme, groupName, onPress }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={theme.name}
      style={({ pressed }) => [
        pCard.container,
        hovered && pCard.hover,
        pressed && pCard.pressed,
      ]}
    >
      {/* ── Background officiel PNG ── */}
      {/* Fix : width/height 100% explicites — absoluteFillObject ne contraint pas <img> sur web */}
      <Image
        source={BG_THEME}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } as never}
        resizeMode="cover"
      />

      {/* ── Zone titre — au-dessus de la ligne dorée (~30% du haut) ── */}
      <View style={pZone.titleArea}>
        {/* Badge numéro #01 — discret, coin haut-gauche */}
        {theme.positionIndex != null && (
          <View style={pZone.numberBadge}>
            <AureakText style={pZone.numberBadgeText}>
              #{String(theme.positionIndex).padStart(2, '0')}
            </AureakText>
          </View>
        )}

        {/* Nom du thème — paddingLeft élargi si badge présent pour éviter le chevauchement */}
        <AureakText
          style={[pZone.themeName, theme.positionIndex != null && pZone.themeNameWithBadge] as never}
          numberOfLines={2}
        >
          {theme.name}
        </AureakText>

        {/* Nom du bloc */}
        {groupName && (
          <AureakText style={pZone.groupName} numberOfLines={1}>
            {groupName}
          </AureakText>
        )}
      </View>

      {/* ── Zone image — sous la ligne dorée (~33% → bas) ── */}
      <View style={pZone.imageArea}>
        {theme.imageUrl ? (
          <Image
            source={{ uri: theme.imageUrl }}
            style={{ width: '100%', height: '100%' } as never}
            resizeMode="cover"
          />
        ) : (
          <View style={pZone.imagePlaceholder}>
            <AureakText style={pZone.placeholderIcon}>◈</AureakText>
          </View>
        )}
      </View>
    </Pressable>
  )
}

// ── Styles carte ────────────────────────────────────────────────────────────────
const pCard = StyleSheet.create({
  container: {
    width       : '100%' as never,   // remplit la cellule CSS grid — requis car tous les enfants sont position:absolute
    aspectRatio : 1,
    overflow    : 'hidden',
    borderRadius: radius.cardLg,  // 24
    position    : 'relative' as never,
    transition  : 'transform 0.15s ease, box-shadow 0.15s ease',
  } as never,
  hover: {
    boxShadow: shadows.gold,
    transform: [{ scale: 1.015 }],
  } as never,
  pressed: {
    opacity: 0.94,
  },
})

// ── Styles zones ────────────────────────────────────────────────────────────────
const pZone = StyleSheet.create({
  // Zone titre : 0% → 30% de la hauteur (au-dessus de la ligne dorée du PNG)
  titleArea: {
    position         : 'absolute' as never,
    top              : 30,
    left             : 0,
    right            : 0,
    height           : '30%' as never,
    justifyContent   : 'center',
    alignItems       : 'center',
    paddingHorizontal: 14,
  },

  // Nom du thème
  themeName: {
    fontSize     : 17,
    fontWeight   : '900',
    fontFamily   : 'Rajdhani, sans-serif',
    textTransform: 'uppercase' as never,
    letterSpacing: 0.5,
    color        : colors.text.dark,
    textAlign    : 'center',
    lineHeight   : 20,
  } as never,
  // Décalage gauche quand le badge #01 est affiché (badge ~35px + 10px marge)
  themeNameWithBadge: {
    paddingLeft: 0,
  },

  // Nom du bloc — texte discret sous le titre
  groupName: {
    fontSize     : 10,
    fontWeight   : '400',
    color        : colors.text.muted,
    textAlign    : 'center',
    marginTop    : 2,
    letterSpacing: 0.3,
  } as never,

  // Badge numéro #01 — positionné en absolu dans la titleArea
  numberBadge: {
    position         : 'absolute' as never,
    top              : 8,
    left             : 10,
    backgroundColor  : 'rgba(0,0,0,0.10)',
    borderRadius     : 6,
    paddingHorizontal: 6,
    paddingVertical  : 2,
  },
  numberBadgeText: {
    fontSize     : 9,
    fontWeight   : '700',
    letterSpacing: 0.8,
    color        : colors.text.dark,
    fontFamily   : 'Geist Mono, monospace',
  } as never,

  // Zone image : 33% → bas (sous la ligne dorée, avec marges)
  // Le gap 30%→33% laisse la ligne dorée du PNG visible
  imageArea: {
    position    : 'absolute' as never,
    top         : '33%' as never,
    left        : 12,
    right       : 12,
    bottom      : 12,
    borderRadius: 14,
    overflow    : 'hidden',
  },

  // Placeholder quand imageUrl est null
  imagePlaceholder: {
    flex           : 1,
    backgroundColor: colors.accent.gold + '15',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  placeholderIcon: {
    fontSize: 36,
    color   : colors.accent.gold,
    opacity : 0.35,
  } as never,
})
