'use client'
// Story 101.2 — <FilterSheet /> — filtres bottom sheet mobile / toolbar inline desktop
//
// Composant générique consommé massivement par Epic 103 (pages listing admin).
// Desktop (≥640) : children rendus inline en toolbar horizontale — comportement historique.
// Mobile (<640)  : bouton trigger "🎚 Filtres" + bottom sheet slide-up 80% viewport.
//
// API minimaliste volontaire (AC #2) — pas de logique métier de filtrage,
// pas de persistance, pas d'intégration avec DataCard (orthogonal).
//
// z-index > drawer Epic 100.1 (40 overlay / 50 drawer) — FilterSheet : 60 overlay / 70 sheet.

import React from 'react'
import {
  View,
  Modal,
  Pressable,
  Animated,
  Easing,
  Platform,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  type TextStyle,
} from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoints — aligné sur DataCard / AdminTopbar (story 100.3 / 101.1)
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_MAX = 640

// z-index : drawer Epic 100.1 utilise 40/50. On passe AU-DESSUS.
const Z_OVERLAY = 60
const Z_SHEET   = 70

const OPEN_DURATION  = 250
const CLOSE_DURATION = 200

// Swipe-down threshold pour fermer via PanResponder (AC #5)
const SWIPE_CLOSE_DISTANCE = 50

// ─────────────────────────────────────────────────────────────────────────────
// API publique (AC #2)
// ─────────────────────────────────────────────────────────────────────────────

export type FilterSheetVariant = 'auto' | 'inline' | 'sheet'

export type FilterSheetProps = {
  /** Contenu des filtres — inputs, selects, toggles. Layout géré par le consommateur. */
  children   : React.ReactNode
  /** Nombre de filtres actifs — affiché dans le badge du bouton trigger mobile. */
  activeCount: number
  /** Handler optionnel pour bouton "Réinitialiser" affiché dans le header du sheet. */
  onReset?   : () => void
  /** 'auto' = breakpoint, 'inline' = toolbar desktop, 'sheet' = bottom sheet mobile. Default = 'auto'. */
  variant?   : FilterSheetVariant
  /** aria-label du bouton trigger (default : "Ouvrir les filtres"). */
  triggerLabel?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal — router par variant/breakpoint
// ─────────────────────────────────────────────────────────────────────────────

export function FilterSheet({
  children,
  activeCount,
  onReset,
  variant = 'auto',
  triggerLabel,
}: FilterSheetProps) {
  const { width } = useWindowDimensions()

  const resolved: 'inline' | 'sheet' =
    variant === 'auto'
      ? (width < MOBILE_MAX ? 'sheet' : 'inline')
      : variant

  if (resolved === 'inline') {
    return <InlineVariant>{children}</InlineVariant>
  }

  return (
    <SheetVariant
      activeCount={activeCount}
      onReset={onReset}
      triggerLabel={triggerLabel}
    >
      {children}
    </SheetVariant>
  )
}

export default FilterSheet

// ─────────────────────────────────────────────────────────────────────────────
// Variant INLINE (desktop/tablette ≥640) — toolbar horizontale (AC #3)
// ─────────────────────────────────────────────────────────────────────────────

function InlineVariant({ children }: { children: React.ReactNode }) {
  return <View style={s.inlineWrap as never}>{children}</View>
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant SHEET (mobile <640) — bouton trigger + bottom sheet (AC #4, #5)
// ─────────────────────────────────────────────────────────────────────────────

type SheetVariantProps = {
  children     : React.ReactNode
  activeCount  : number
  onReset?     : () => void
  triggerLabel?: string
}

function SheetVariant({ children, activeCount, onReset, triggerLabel }: SheetVariantProps) {
  const { height: screenHeight } = useWindowDimensions()
  const [isMounted, setIsMounted] = React.useState(false) // contrôle présence DOM
  const [isOpen,    setIsOpen]    = React.useState(false) // contrôle animation

  // Sheet ancré en `bottom: 0`, hauteur max = 80% viewport.
  // translateY : 0 = ouvert (sheet visible), sheetHeight = fermé (hors écran en bas).
  const sheetHeight = screenHeight * 0.8

  const translateY = React.useRef(new Animated.Value(sheetHeight)).current
  const overlayOpacity = React.useRef(new Animated.Value(0)).current

  // AC #4 — close via escape (web)
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const open = () => {
    setIsMounted(true)
    setIsOpen(true)
    Animated.parallel([
      Animated.timing(translateY, {
        toValue       : 0,
        duration      : OPEN_DURATION,
        easing        : Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(overlayOpacity, {
        toValue       : 1,
        duration      : OPEN_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start()
  }

  const close = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue       : sheetHeight,
        duration      : CLOSE_DURATION,
        easing        : Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(overlayOpacity, {
        toValue       : 0,
        duration      : CLOSE_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setIsOpen(false)
      setIsMounted(false)
    })
  }

  // AC #5 — PanResponder : swipe down > 50px → close
  const panResponder = React.useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder : (_, g) => g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy)
          // Atténuation overlay proportionnelle
          const progress = Math.min(1, g.dy / sheetHeight)
          overlayOpacity.setValue(1 - progress * 0.5)
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SWIPE_CLOSE_DISTANCE) {
          close()
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateY, {
              toValue       : 0,
              useNativeDriver: Platform.OS !== 'web',
              bounciness    : 4,
            }),
            Animated.spring(overlayOpacity, {
              toValue       : 1,
              useNativeDriver: Platform.OS !== 'web',
              bounciness    : 0,
            }),
          ]).start()
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheetHeight]
  )

  return (
    <>
      {/* Bouton trigger (AC #4, #7) */}
      <View style={s.triggerRow as never}>
        <Pressable
          onPress={open}
          accessibilityLabel={triggerLabel ?? 'Ouvrir les filtres'}
          accessibilityRole="button"
          style={({ pressed }) => [s.trigger, pressed && s.triggerPressed] as never}
        >
          <AureakText style={s.triggerEmoji as TextStyle}>🎚</AureakText>
          <AureakText style={s.triggerLabel as TextStyle}>Filtres</AureakText>
          {activeCount > 0 ? (
            <View style={s.triggerBadge as never}>
              <AureakText style={s.triggerBadgeText as TextStyle}>{activeCount}</AureakText>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* Sheet + overlay via Modal — échappe au containing block RN-web (transform parent) */}
      <Modal
        transparent
        visible={isMounted}
        onRequestClose={close}
        animationType="none"
      >
        {/* Overlay (AC #4 — tap ferme ; AC #5 — fade) */}
        <Animated.View
          pointerEvents={isOpen ? 'auto' : 'none'}
          style={[s.overlay, { opacity: overlayOpacity }] as never}
        >
          <Pressable
            style={s.overlayPress as never}
            accessibilityLabel="Fermer les filtres"
            onPress={close}
          />
        </Animated.View>

        {/* Sheet — slide-up depuis le bas */}
        <Animated.View
          style={[
            s.sheet,
            { transform: [{ translateY }] },
          ] as never}
          accessibilityViewIsModal
          {...panResponder.panHandlers}
        >
          {/* Handle visuel (Dev Notes — pattern iOS/Material) */}
          <View style={s.handle as never} />

          {/* Header : titre + Réinitialiser + Fermer */}
          <View style={s.header as never}>
            <AureakText style={s.headerTitle as TextStyle}>Filtres</AureakText>
            <View style={s.headerActions as never}>
              {onReset ? (
                <Pressable
                  onPress={onReset}
                  accessibilityRole="button"
                  accessibilityLabel="Réinitialiser les filtres"
                  style={({ pressed }) => [s.resetBtn, pressed && s.resetBtnPressed] as never}
                >
                  <AureakText style={s.resetLabel as TextStyle}>Réinitialiser</AureakText>
                </Pressable>
              ) : null}
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                style={({ pressed }) => [s.closeBtn, pressed && s.closeBtnPressed] as never}
              >
                <AureakText style={s.closeEmoji as TextStyle}>✕</AureakText>
              </Pressable>
            </View>
          </View>

          {/* Contenu scrollable (filtres consommateur) */}
          <View style={s.body as never}>{children}</View>
        </Animated.View>
      </Modal>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — tokens @aureak/theme uniquement (AC #9)
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Variant inline (desktop) ──
  inlineWrap: {
    flexDirection : 'row',
    flexWrap      : 'wrap',
    alignItems    : 'center',
    gap           : space.sm,
  },

  // ── Bouton trigger mobile (Story 110.7 — style segmented Jour/Semaine/Mois) ──
  triggerRow: {
    flexDirection  : 'row',
    alignItems     : 'center',
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    padding        : 3,
  },
  trigger: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : space.xs,
    paddingHorizontal: 14,
    paddingVertical  : 5,
    borderRadius     : radius.xs - 2,
    backgroundColor  : colors.light.surface,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
  },
  triggerPressed: {
    backgroundColor: colors.light.elevated,
  },
  triggerEmoji: {
    fontSize: 12,
  },
  triggerLabel: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.text.dark,
  },
  triggerBadge: {
    minWidth       : 18,
    height         : 18,
    paddingHorizontal: 5,
    borderRadius   : 9,
    backgroundColor: colors.accent.gold,
    alignItems     : 'center',
    justifyContent : 'center',
    marginLeft     : space.xs,
  },
  triggerBadgeText: {
    fontFamily: fonts.body,
    fontSize  : 10,
    fontWeight: '700',
    color     : colors.text.onGold,
  },

  // ── Overlay ──
  // position absolute dans le Modal (full-screen root)
  overlay: {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    right          : 0,
    bottom         : 0,
    backgroundColor: colors.overlay.dark,
    zIndex         : Z_OVERLAY,
  },
  overlayPress: {
    flex: 1,
  },

  // ── Sheet ──
  // Ancré en bas du Modal root, occupe 80% hauteur. translateY offset pour slide.
  sheet: {
    position       : 'absolute',
    left           : 0,
    right          : 0,
    bottom         : 0,
    // @ts-ignore height 80% viewport (RN-web → 80vh). Fallback RN: maxHeight.
    height         : '80%',
    maxHeight      : '80%',
    backgroundColor: colors.light.surface,
    borderTopLeftRadius : radius.card,
    borderTopRightRadius: radius.card,
    paddingTop     : space.sm,
    paddingHorizontal: space.md,
    paddingBottom  : space.lg,
    zIndex         : Z_SHEET,
    // @ts-ignore web shadow
    boxShadow      : '0 -8px 32px rgba(0,0,0,0.18)',
  },

  // ── Handle visuel (tirable) ──
  handle: {
    alignSelf      : 'center',
    width          : 40,
    height         : 4,
    borderRadius   : 2,
    backgroundColor: colors.border.light,
    marginBottom   : space.sm,
  },

  // ── Header sheet ──
  header: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    marginBottom  : space.md,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize  : 18,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
  },
  resetBtn: {
    paddingHorizontal: space.sm,
    paddingVertical  : 6,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    minHeight        : 44, // Epic 104.3 — Apple HIG touch target
    justifyContent   : 'center',
  },
  resetBtnPressed: {
    backgroundColor: colors.light.muted,
  },
  resetLabel: {
    fontFamily: fonts.body,
    fontSize  : 12,
    fontWeight: '600',
    color     : colors.text.subtle,
  },
  closeBtn: {
    width         : 36,
    height        : 36,
    borderRadius  : 18,
    alignItems    : 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  closeBtnPressed: {
    backgroundColor: colors.light.muted,
  },
  closeEmoji: {
    fontSize: 16,
    color   : colors.text.dark,
  },

  // ── Body (contenu filtres) ──
  body: {
    flex    : 1,
    gap     : space.md,
  },
})
