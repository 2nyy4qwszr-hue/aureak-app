import React, { useState } from 'react'
import { View, Image, Pressable, StyleSheet } from 'react-native'
import { AureakButton, AureakText } from '@aureak/ui'
import { colors, space, shadows, radius } from '@aureak/theme'
import type { Theme } from '@aureak/types'

type Props = {
  theme    : Theme
  groupName: string | null
  onPress  : () => void
  onManage : () => void
}

export default function ThemeCard({ theme, groupName, onPress, onManage }: Props) {
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

        {/* Badge Bloc flottant sur la bannière */}
        {groupName && (
          <View style={s.blocBadge}>
            <AureakText style={s.blocBadgeText}>Bloc : {groupName}</AureakText>
          </View>
        )}
      </View>

      {/* ── Infos ── */}
      <View style={s.body}>
        <AureakText variant="label" style={s.name} numberOfLines={2}>
          {theme.name}
        </AureakText>
        <AureakText variant="caption" style={s.meta}>
          {theme.themeKey} · v{theme.version}
        </AureakText>

        <View style={s.footer}>
          <AureakButton
            label="Gérer"
            onPress={onManage}
            variant="secondary"
          />
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

  // Badge Bloc
  blocBadge: {
    position       : 'absolute',
    top            : space.sm,
    left           : space.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius   : 8,
    paddingHorizontal: 8,
    paddingVertical  : 3,
  } as never,
  blocBadgeText: {
    fontSize  : 10,
    color     : '#FFFFFF',
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
  meta: {
    color   : colors.text.muted,
    fontSize: 11,
  } as never,
  footer: {
    marginTop : space.sm,
    alignItems: 'flex-end',
  },
})
