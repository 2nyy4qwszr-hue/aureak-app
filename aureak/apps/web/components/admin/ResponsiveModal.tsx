'use client'
// Story 102.4 — <ResponsiveModal /> — modal centrée desktop / full-screen sheet mobile
//
// Desktop (≥640) : modal centrée `width` px (default 600), overlay semi-opaque,
//                  bouton X en haut à droite, tap overlay ferme.
// Mobile   (<640) : full-screen sheet 100% hauteur, slide-up 250ms, header X à gauche
//                  + titre centré, body scrollable, actions sticky bottom (si fournies),
//                  swipe down > 100px ferme.
// Tablette (640-1024) : fallback desktop.
//
// Ferme toujours via Escape (web). z-index 1000 (au-dessus du drawer Epic 100 = 40/50
// et FilterSheet = 60/70, sous tooltips ≈ 2000).
//
// prefers-reduced-motion (web) : snap immédiat, pas d'animation.

import React from 'react'
import {
  View,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Pressable,
  PanResponder,
  Platform,
  StyleSheet,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'

// Breakpoint cohérent avec FilterSheet / DataCard / FormLayout
const MOBILE_MAX = 640

const OPEN_DURATION  = 250
const CLOSE_DURATION = 200

// Swipe down au-delà de ce delta (px) → close
const SWIPE_CLOSE_DISTANCE = 100

// z-index (voir en-tête)
const Z_OVERLAY = 1000
const Z_MODAL   = 1001

const DESKTOP_DEFAULT_WIDTH = 600
const DESKTOP_MAX_HEIGHT_VH = 0.8 // 80vh

export type ResponsiveModalProps = {
  visible  : boolean
  onClose  : () => void
  title    : string
  children : React.ReactNode
  /** Footer actions (boutons) — rendus en row à droite desktop / sticky bottom mobile. */
  actions? : React.ReactNode
  /** Largeur desktop (default 600). Ignoré en mobile (full-screen). */
  width?   : number
}

function prefersReducedMotion(): boolean {
  if (Platform.OS !== 'web') return false
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function ResponsiveModal({
  visible,
  onClose,
  title,
  children,
  actions,
  width = DESKTOP_DEFAULT_WIDTH,
}: ResponsiveModalProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const isMobile = screenWidth < MOBILE_MAX

  // translateY : 0 = visible, screenHeight = hors écran (bas)
  const translateY     = React.useRef(new Animated.Value(screenHeight)).current
  const overlayOpacity = React.useRef(new Animated.Value(0)).current
  const [isMounted, setIsMounted] = React.useState(false)

  // Animation open/close
  React.useEffect(() => {
    const reduced = prefersReducedMotion()

    if (visible) {
      setIsMounted(true)
      if (reduced) {
        translateY.setValue(0)
        overlayOpacity.setValue(1)
        return
      }
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
    } else if (isMounted) {
      if (reduced) {
        translateY.setValue(screenHeight)
        overlayOpacity.setValue(0)
        setIsMounted(false)
        return
      }
      Animated.parallel([
        Animated.timing(translateY, {
          toValue       : screenHeight,
          duration      : CLOSE_DURATION,
          easing        : Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(overlayOpacity, {
          toValue       : 0,
          duration      : CLOSE_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => setIsMounted(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, screenHeight])

  // Escape key (web) — AC #3, #4
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, onClose])

  // Prevent body scroll quand ouverte sur mobile web — AC #8
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !isMobile) return
    if (typeof document === 'undefined') return
    if (!visible) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [visible, isMobile])

  // Swipe down (mobile) — AC #4
  const panResponder = React.useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder : (_, g) => isMobile && g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy)
          const progress = Math.min(1, g.dy / screenHeight)
          overlayOpacity.setValue(1 - progress * 0.5)
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SWIPE_CLOSE_DISTANCE) {
          onClose()
        } else {
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
    [isMobile, screenHeight]
  )

  if (!isMounted) return null

  const modalShape: ViewStyle = isMobile
    ? s.modalMobile
    : {
        ...s.modalDesktop,
        width,
        maxHeight: screenHeight * DESKTOP_MAX_HEIGHT_VH,
      }

  return (
    <Modal transparent visible={isMounted} onRequestClose={onClose} animationType="none">
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[s.overlay, { opacity: overlayOpacity }]}
      >
        <Pressable
          style={s.overlayPress}
          onPress={onClose}
          accessibilityLabel="Fermer la fenêtre"
        />
      </Animated.View>

      <View pointerEvents="box-none" style={s.modalAnchor}>
        <Animated.View
          style={[modalShape, { transform: [{ translateY }] }]}
          accessibilityViewIsModal
          accessibilityRole={Platform.OS === 'web' ? undefined : 'none'}
          {...(isMobile ? panResponder.panHandlers : {})}
        >
          {isMobile && <View style={s.handle} />}

          <View style={s.header}>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Fermer"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [s.closeBtn, pressed && s.closeBtnPressed]}
            >
              <AureakText style={s.closeEmoji as TextStyle}>✕</AureakText>
            </Pressable>
            <AureakText
              variant="h3"
              style={s.headerTitle as TextStyle}
              numberOfLines={1}
            >
              {title}
            </AureakText>
            <View style={s.closeBtn} />
            {/* placeholder width-matching pour équilibrer le titre centré */}
          </View>

          <ScrollView
            style={s.body}
            contentContainerStyle={s.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {actions && (
            <View style={isMobile ? s.actionsMobile : s.actionsDesktop} accessibilityRole="toolbar">
              {actions}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

export default ResponsiveModal

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay.dark,
    zIndex         : Z_OVERLAY,
  } as ViewStyle,
  overlayPress: {
    ...StyleSheet.absoluteFillObject,
  },
  modalAnchor: {
    ...StyleSheet.absoluteFillObject,
    alignItems    : 'center',
    justifyContent: 'center',
    zIndex        : Z_MODAL,
  } as ViewStyle,
  // Desktop : modal centrée
  modalDesktop: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    overflow       : 'hidden',
    elevation      : 12,
    // Story 110.10 — boxShadow web (replace deprecated shadow* props)
    // @ts-ignore web-only
    boxShadow      : '0 8px 24px rgba(0,0,0,0.18)',
  } as ViewStyle,
  // Mobile : full-screen
  modalMobile: {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    right          : 0,
    bottom         : 0,
    backgroundColor: colors.light.surface,
  } as ViewStyle,
  handle: {
    alignSelf       : 'center',
    width           : 40,
    height          : 4,
    borderRadius    : 2,
    backgroundColor : colors.border.divider,
    marginTop       : space.sm,
    marginBottom    : space.xs,
  } as ViewStyle,
  header: {
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
    paddingHorizontal: space.md,
    paddingVertical  : space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  } as ViewStyle,
  headerTitle: {
    flex      : 1,
    textAlign : 'center',
    color     : colors.text.dark,
  } as TextStyle,
  closeBtn: {
    width          : 36,
    height         : 36,
    borderRadius   : 18,
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: 'transparent',
  } as ViewStyle,
  closeBtnPressed: {
    backgroundColor: colors.light.hover,
  } as ViewStyle,
  closeEmoji: {
    fontSize: 18,
    color   : colors.text.dark,
  } as TextStyle,
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: space.md,
  } as ViewStyle,
  actionsDesktop: {
    flexDirection    : 'row',
    justifyContent   : 'flex-end',
    gap              : space.sm,
    paddingHorizontal: space.md,
    paddingVertical  : space.md,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
  } as ViewStyle,
  actionsMobile: {
    flexDirection    : 'row',
    gap              : space.sm,
    paddingHorizontal: space.md,
    paddingTop       : space.sm,
    paddingBottom    : space.md,
    borderTopWidth   : 1,
    borderTopColor   : colors.border.divider,
    backgroundColor  : colors.light.surface,
  } as ViewStyle,
})
