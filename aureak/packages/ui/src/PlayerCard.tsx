// PlayerCard — Carte joueur FUT-style 160×220px
// Story 52-1 : tiers visuels Prospect/Académicien/Confirmé/Elite, avatar, nom, badge statut
// AC6 : zéro valeur de couleur ou espacement hardcodée — tout via @aureak/theme tokens

import React, { useState } from 'react'
import { View, StyleSheet, Pressable, Image } from 'react-native'
import { colors, fonts, space, radius, playerTiers } from '@aureak/theme'
import { AureakText } from './components/Text'
import type { JoueurListItem } from '@aureak/api-client'

// ── Tiers ─────────────────────────────────────────────────────────────────────

export type PlayerTier = 'Prospect' | 'Académicien' | 'Confirmé' | 'Elite'

type TierConfig = {
  bg        : string
  border    : string
  textColor : string
  badgeBg   : string
  badgeText : string
  badgeLabel: string
  overlay   : string
}

/**
 * TIER_CONFIG — dérive la config visuelle par tier depuis les tokens playerTiers.
 * Source de vérité des couleurs : @aureak/theme tokens.ts — playerTiers.*
 */
const TIER_CONFIG: Record<PlayerTier, TierConfig> = {
  Prospect: {
    bg        : playerTiers.prospect.bg,
    border    : playerTiers.prospect.border,
    textColor : colors.text.dark,
    badgeBg   : playerTiers.prospect.badgeBg,
    badgeText : playerTiers.prospect.badgeText,
    badgeLabel: 'Prospect',
    overlay   : playerTiers.prospect.overlay,
  },
  Académicien: {
    bg        : playerTiers.academicien.bg,
    border    : playerTiers.academicien.border,
    textColor : colors.text.dark,
    badgeBg   : playerTiers.academicien.badgeBg,
    badgeText : playerTiers.academicien.badgeText,
    badgeLabel: 'Académicien',
    overlay   : playerTiers.academicien.overlay,
  },
  Confirmé: {
    bg        : playerTiers.confirme.bg,
    border    : playerTiers.confirme.border,
    textColor : colors.text.dark,
    badgeBg   : playerTiers.confirme.badgeBg,
    badgeText : playerTiers.confirme.badgeText,
    badgeLabel: 'Confirmé',
    overlay   : playerTiers.confirme.overlay,
  },
  Elite: {
    bg        : playerTiers.elite.bg,
    border    : playerTiers.elite.border,
    textColor : colors.text.primary,
    badgeBg   : playerTiers.elite.badgeBg,
    badgeText : playerTiers.elite.badgeText,
    badgeLabel: 'Elite',
    overlay   : playerTiers.elite.overlay,
  },
}

// ── Avatar helpers ─────────────────────────────────────────────────────────────

function getInitials(displayName: string, nom?: string | null, prenom?: string | null): string {
  if (nom && prenom) return (nom.charAt(0) + prenom.charAt(0)).toUpperCase()
  if (nom)           return nom.charAt(0).toUpperCase()
  const parts = displayName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * avatarBgColor — détermine une couleur de fond avatar depuis l'id joueur.
 * Palette source : playerTiers.avatarPalette dans @aureak/theme.
 */
export function avatarBgColor(id: string): string {
  const palette = playerTiers.avatarPalette
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

// ── PhotoAvatar ────────────────────────────────────────────────────────────────

type PhotoAvatarProps = {
  photoUrl   : string | null
  displayName: string
  id         : string
  nom?       : string | null
  prenom?    : string | null
  size       : number
}

function PhotoAvatar({ photoUrl, displayName, id, nom, prenom, size }: PhotoAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const showPhoto = Boolean(photoUrl) && !imgError
  const bg        = avatarBgColor(id)
  const initials  = getInitials(displayName, nom, prenom)

  return (
    <View
      style={[
        av.circle,
        {
          width          : size,
          height         : size,
          borderRadius   : size / 2,
          backgroundColor: showPhoto ? 'transparent' : bg,
        },
      ]}
    >
      {showPhoto ? (
        <Image
          source={{ uri: photoUrl! }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
      ) : (
        <AureakText
          style={[av.initialsText, { fontSize: size * 0.32 }] as never}
        >
          {initials}
        </AureakText>
      )}
    </View>
  )
}

const av = StyleSheet.create({
  circle      : { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initialsText: { color: colors.text.primary, fontWeight: '700' as never, letterSpacing: 0.5 },
})

// ── PlayerCard ────────────────────────────────────────────────────────────────

export type PlayerCardProps = {
  joueur  : JoueurListItem
  tier    : PlayerTier
  onPress?: () => void
  size?   : 'normal' | 'compact'
}

const CARD_NORMAL  = { width: 160, height: 220 } as const
const CARD_COMPACT = { width: 140, height: 193 } as const
const AVATAR_NORMAL  = 80
const AVATAR_COMPACT = 70

export function PlayerCard({ joueur, tier, onPress, size = 'normal' }: PlayerCardProps) {
  // Fallback sur Prospect si tier inconnu (robustesse données manquantes)
  const cfg        = TIER_CONFIG[tier] ?? TIER_CONFIG['Prospect']
  const dimensions = size === 'compact' ? CARD_COMPACT : CARD_NORMAL
  const avatarSize = size === 'compact' ? AVATAR_COMPACT : AVATAR_NORMAL
  const isElite    = tier === 'Elite'

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width          : dimensions.width,
          height         : dimensions.height,
          backgroundColor: cfg.bg,
          borderColor    : cfg.border,
          opacity        : pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Fiche joueur ${joueur.displayName}`}
    >
      {/* Elite : overlay sombre pour évoquer le dégradé (LinearGradient hors scope) */}
      {isElite && cfg.overlay !== 'transparent' && (
        <View
          style={[styles.eliteOverlay, { backgroundColor: cfg.overlay }]}
          pointerEvents="none"
        />
      )}

      {/* Avatar centré en haut */}
      <View style={[styles.avatarSection, { marginTop: space.md }]}>
        <PhotoAvatar
          photoUrl   ={joueur.currentPhotoUrl}
          displayName={joueur.displayName}
          id         ={joueur.id}
          nom        ={joueur.nom}
          prenom     ={joueur.prenom}
          size       ={avatarSize}
        />
      </View>

      {/* Nom + club */}
      <View style={styles.nameSection}>
        <AureakText
          numberOfLines={1}
          style={{
            fontFamily  : fonts.display,
            fontWeight  : '700',
            fontSize    : 13,
            color       : cfg.textColor,
            textAlign   : 'center',
            letterSpacing: 0.2,
          } as never}
        >
          {joueur.displayName}
        </AureakText>

        {joueur.currentClub ? (
          <AureakText
            numberOfLines={1}
            style={{
              fontSize    : 10,
              color       : isElite ? colors.accent.goldLight : colors.text.muted,
              textAlign   : 'center',
              marginTop   : space.xs / 2,
              letterSpacing: 0.1,
            } as never}
          >
            {joueur.currentClub}
          </AureakText>
        ) : null}
      </View>

      {/* Badge statut en pied — pill colorée selon tier */}
      <View style={styles.badgeSection}>
        <View style={[styles.badge, { backgroundColor: cfg.badgeBg }]}>
          <AureakText
            style={{
              fontSize     : 10,
              fontWeight   : '600',
              color        : cfg.badgeText,
              letterSpacing: 0.3,
            } as never}
          >
            {cfg.badgeLabel}
          </AureakText>
        </View>
      </View>
    </Pressable>
  )
}

// ── Styles — espacements via tokens uniquement ─────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius     : radius.card,
    borderWidth      : 1.5,
    overflow         : 'hidden',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingBottom    : space.sm,
  },
  eliteOverlay: {
    position : 'absolute',
    top      : 0,
    left     : 0,
    right    : 0,
    height   : 80,
  },
  avatarSection: {
    alignItems: 'center',
  },
  nameSection: {
    flex             : 1,
    alignItems       : 'center',
    justifyContent   : 'center',
    paddingHorizontal: space.sm,
    marginTop        : space.sm,
  },
  badgeSection: {
    alignItems   : 'center',
    paddingBottom: space.xs,
  },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical  : 3,
    borderRadius     : radius.badge,
  },
})
