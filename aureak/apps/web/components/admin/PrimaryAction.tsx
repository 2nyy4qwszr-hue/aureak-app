'use client'
// Story 101.3 — <PrimaryAction /> — FAB mobile / no-op desktop (approche B)
//
// Approche B (Dev Notes) : le composant rend UNIQUEMENT le FAB côté mobile, et rien côté desktop.
// Le bouton desktop est piloté séparément par <AdminPageHeader actionButton={...} />.
// Pas de duplication : chaque composant se rend selon son breakpoint.
//
// variant='auto' (défaut) : détecte breakpoint (< 640 → fab, ≥ 640 → null)
// variant='fab'           : force rendu FAB (tests, cas spécifiques)
// variant='header'        : no-op ici (le dev appelle AdminPageHeader actionButton en parallèle)
//
// z-index : 30 — inférieur à FilterSheet (overlay 60 / sheet 70) et drawer Epic 100.1 (40/50),
// donc automatiquement couvert par toute modale/sheet ouverte. Prop isHidden permet en plus au
// consommateur de masquer explicitement le FAB selon son propre état UI.

import React from 'react'
import {
  View,
  Pressable,
  Animated,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { colors, space } from '@aureak/theme'

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoints — aligné sur DataCard (101.1) / FilterSheet (101.2) / AdminTopbar (100.3)
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_MAX = 640

// z-index fixe — sous FilterSheet (60/70) et drawer (40/50)
const Z_FAB = 30

// ─────────────────────────────────────────────────────────────────────────────
// Icône par défaut (inline — @aureak/ui n'exporte pas de PlusIcon)
// ─────────────────────────────────────────────────────────────────────────────

export type PrimaryActionIconProps = {
  size? : number
  color?: string
}

function DefaultPlusIcon({ size = 24, color = colors.text.onGold }: PrimaryActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// API publique (AC #2)
// ─────────────────────────────────────────────────────────────────────────────

export type PrimaryActionVariant = 'auto' | 'header' | 'fab'

export type PrimaryActionProps = {
  /** Label du bouton — accessibilityLabel et potentiellement texte header (si variant=header). */
  label   : string
  /** Icône optionnelle — défaut : DefaultPlusIcon. Reçoit { size, color }. */
  icon?   : React.ComponentType<PrimaryActionIconProps>
  /** Callback au tap. */
  onPress : () => void
  /** 'auto' (breakpoint) | 'header' (no-op) | 'fab' (force FAB). Défaut = 'auto'. */
  variant?: PrimaryActionVariant
  /** Si true, masque le FAB (modal/sheet ouvert côté consommateur). Défaut = false. */
  isHidden?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export function PrimaryAction({
  label,
  icon: Icon = DefaultPlusIcon,
  onPress,
  variant = 'auto',
  isHidden = false,
}: PrimaryActionProps) {
  const { width } = useWindowDimensions()

  // Approche B : variant='header' = no-op (bouton rendu via AdminPageHeader ailleurs)
  if (variant === 'header') return null

  const resolved: 'fab' | 'none' =
    variant === 'fab'
      ? 'fab'
      : (width < MOBILE_MAX ? 'fab' : 'none')

  if (resolved === 'none') return null
  if (isHidden) return null

  return <FabVariant label={label} Icon={Icon} onPress={onPress} />
}

export default PrimaryAction

// ─────────────────────────────────────────────────────────────────────────────
// Variant FAB (mobile) — AC #4, #7, #9
// ─────────────────────────────────────────────────────────────────────────────

type FabVariantProps = {
  label  : string
  Icon   : React.ComponentType<PrimaryActionIconProps>
  onPress: () => void
}

function FabVariant({ label, Icon, onPress }: FabVariantProps) {
  // AC #9 — scale 0.95 au press (feedback tactile)
  const scale = React.useRef(new Animated.Value(1)).current

  const animateIn = () => {
    Animated.spring(scale, {
      toValue       : 0.95,
      useNativeDriver: Platform.OS !== 'web',
      speed         : 40,
      bounciness    : 0,
    }).start()
  }

  const animateOut = () => {
    Animated.spring(scale, {
      toValue       : 1,
      useNativeDriver: Platform.OS !== 'web',
      speed         : 40,
      bounciness    : 6,
    }).start()
  }

  return (
    <View style={s.fabWrap as never} pointerEvents="box-none">
      <Animated.View style={[s.fabAnim, { transform: [{ scale }] }] as never}>
        <Pressable
          onPress={onPress}
          onPressIn={animateIn}
          onPressOut={animateOut}
          accessibilityLabel={label}
          accessibilityRole="button"
          hitSlop={8}
          style={s.fab as never}
        >
          <Icon size={24} color={colors.text.onGold} />
        </Pressable>
      </Animated.View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — tokens @aureak/theme uniquement (AC #8)
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Wrapper : position fixed bottom-right, hors flux document
  fabWrap: {
    position: 'absolute',
    bottom  : space.lg,      // 24
    right   : space.lg,      // 24
    zIndex  : Z_FAB,
    // @ts-ignore RN-web : position fixed → reste visible au scroll
    // On déclare en absolute pour RN natif, override fixed sur web.
    ...(Platform.OS === 'web' ? { position: 'fixed' as 'absolute' } : {}),
  },

  // Conteneur animable (scale)
  fabAnim: {
    // laisse Pressable gérer dimensions
  },

  fab: {
    width           : 56,
    height          : 56,
    borderRadius    : 28,
    backgroundColor : colors.accent.gold,
    alignItems      : 'center',
    justifyContent  : 'center',
    // Shadow cross-platform (Dev Notes — AC #4)
    ...Platform.select({
      ios: {
        shadowColor  : '#000',
        shadowOffset : { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius : 6,
      },
      android: {
        elevation: 6,
      },
      default: {
        // @ts-ignore web-only boxShadow
        boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
      },
    }),
  },
})
