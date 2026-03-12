import React, { useState } from 'react'
import { View, Image, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { Theme } from '@aureak/types'

type Props = {
  theme    : Theme
  groupName: string | null
  category?: string | null
  onPress  : () => void
  onManage : () => void
}

export default function ThemeCard({ theme, groupName, category, onPress, onManage }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[s.card, hovered && s.cardHover]}
    >
      {/* ── Bannière image ── */}
      <View style={s.banner}>
        {theme.imageUrl ? (
          <Image
            source={{ uri: theme.imageUrl }}
            style={s.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={s.bannerPlaceholder}>
            <AureakText style={s.placeholderIcon}>◈</AureakText>
          </View>
        )}

        {/* Badge Bloc flottant sur la bannière — coin supérieur gauche */}
        {groupName && (
          <View style={s.blocBadge}>
            <AureakText style={s.blocBadgeText}>Bloc : {groupName}</AureakText>
          </View>
        )}

        {/* Badge position [#XX] — coin supérieur droit */}
        {theme.positionIndex != null && (
          <View style={s.positionBadge}>
            <AureakText style={s.positionBadgeText}>
              #{String(theme.positionIndex).padStart(2, '0')}
            </AureakText>
          </View>
        )}
      </View>

      {/* ── Infos ── */}
      <View style={s.body}>
        <AureakText variant="label" style={s.name} numberOfLines={2}>
          {theme.name}
        </AureakText>

        {/* Badge Catégorie (distinct du badge Bloc) */}
        {category && (
          <View style={s.categoryBadge}>
            <AureakText style={s.categoryBadgeText}>{category}</AureakText>
          </View>
        )}

        <AureakText variant="caption" style={s.meta}>
          {theme.themeKey} · v{theme.version}
        </AureakText>

        <View style={s.footer}>
          <Pressable
            style={s.manageBtn}
            onPress={(e) => { e.stopPropagation?.(); onManage() }}
          >
            <AureakText style={s.manageBtnText}>Gérer</AureakText>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    overflow       : 'hidden',
    boxShadow      : shadows.sm,
  } as never,
  cardHover: {
    boxShadow  : shadows.md,
    borderColor: colors.accent.gold + '60',
  } as never,

  // Bannière
  banner: {
    width      : '100%',
    aspectRatio: 16 / 9,
    overflow   : 'hidden',
  },
  bannerImage: {
    width : '100%',
    height: '100%',
  } as never,
  bannerPlaceholder: {
    flex           : 1,
    backgroundColor: colors.accent.gold + '20',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    color   : colors.accent.gold,
    opacity : 0.5,
  } as never,

  // Badge Bloc (sur la bannière)
  blocBadge: {
    position       : 'absolute',
    top            : space.sm,
    left           : space.sm,
    backgroundColor: colors.accent.gold + '20',
    borderWidth    : 1,
    borderColor    : colors.accent.gold + '60',
    borderRadius   : 10,
    paddingHorizontal: 8,
    paddingVertical  : 3,
  } as never,
  blocBadgeText: {
    fontSize  : 10,
    color     : colors.accent.gold,
    fontWeight: '600',
  } as never,

  // Badge Position (sur la bannière, coin droit)
  positionBadge: {
    position         : 'absolute',
    top              : space.sm,
    right            : space.sm,
    backgroundColor  : 'rgba(255,255,255,0.85)',
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 10,
    paddingHorizontal: 7,
    paddingVertical  : 3,
  } as never,
  positionBadgeText: {
    fontSize  : 10,
    color     : colors.text.dark,
    fontWeight: '600',
  } as never,

  // Corps
  body: {
    padding: space.md,
    gap    : space.xs,
  },
  name: {
    color     : colors.text.dark,
    fontSize  : 14,
    fontWeight: '600',
  } as never,

  // Badge Catégorie (dans le body, discret)
  categoryBadge: {
    alignSelf        : 'flex-start',
    backgroundColor  : colors.light.muted,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    borderRadius     : 6,
    paddingHorizontal: 6,
    paddingVertical  : 2,
    marginTop        : 2,
  },
  categoryBadgeText: {
    fontSize  : 10,
    color     : colors.text.subtle,
    fontWeight: '500',
  } as never,

  meta: {
    color   : colors.text.muted,
    fontSize: 11,
  } as never,
  footer: {
    marginTop : space.sm,
    alignItems: 'flex-end',
  },
  manageBtn: {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : 6,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.muted,
  },
  manageBtnText: {
    fontSize  : 11,
    color     : colors.text.muted,
    fontWeight: '500',
  } as never,
})
