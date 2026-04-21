import React, { useRef, useEffect } from 'react'
import { Animated, Pressable, useWindowDimensions } from 'react-native'
import { XStack, Text } from 'tamagui'
import { usePathname, useRouter } from 'expo-router'
import { colors, transitions } from '@aureak/theme'
import { parseBreadcrumbs } from '../utils/breadcrumbs'
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext'

// ── Constantes ───────────────────────────────────────────────────────────────

/** Pages racines où le breadcrumb n'est pas affiché */
const HIDDEN_PATHS = new Set(['/dashboard', '/'])

// ── Composant ────────────────────────────────────────────────────────────────

export function Breadcrumb() {
  const pathname = usePathname()
  const router   = useRouter()
  const { width }  = useWindowDimensions()
  const { labels } = useBreadcrumbContext()

  // AC6 — Masqué sur mobile (< 768px)
  const isMobile = width < 768
  if (isMobile) return null

  // AC1 — Masqué sur le dashboard root
  if (HIDDEN_PATHS.has(pathname)) return null

  const items = parseBreadcrumbs(pathname, labels)

  // AC3.3 — Si 1 seul segment ET c'est un segment connu de premier niveau → pas de breadcrumb utile
  // (on est déjà sur une liste de premier niveau, pas besoin de "Joueurs ›")
  if (items.length <= 1) return null

  return (
    <BreadcrumbAnimated key={pathname}>
      <XStack
        alignItems="center"
        paddingHorizontal={28}
        paddingVertical={10}
        gap={6}
        flexWrap="nowrap"
        style={{ flexShrink: 0 } as never}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.href}>
            {/* Séparateur — AC5 : pas après le dernier segment */}
            {index > 0 && (
              <Text
                fontFamily="$body"
                fontSize={13}
                color={colors.text.subtle}
                style={{ userSelect: 'none' } as never}
              >
                ›
              </Text>
            )}

            {item.isActive ? (
              // Segment actif — AC2 : non cliquable, texte dark fontWeight 600
              <Text
                fontFamily="$body"
                fontSize={13}
                fontWeight="600"
                color={colors.text.dark}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            ) : (
              // Segment cliquable — AC2 : navigue vers href
              <Pressable
                onPress={() => router.push(item.href as never)}
                accessibilityRole="link"
                accessibilityLabel={`Naviguer vers ${item.label}`}
              >
                {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
                  <Text
                    fontFamily="$body"
                    fontSize={13}
                    color={colors.text.muted}
                    style={{
                      textDecorationLine : (hovered || pressed) ? 'underline' : 'none',
                      transition         : `color ${transitions.fast}`,
                      cursor             : 'pointer',
                    } as never}
                  >
                    {item.label}
                  </Text>
                )}
              </Pressable>
            )}
          </React.Fragment>
        ))}
      </XStack>
    </BreadcrumbAnimated>
  )
}

// ── Wrapper animation — AC4 ──────────────────────────────────────────────────

/**
 * Enveloppe le contenu dans une animation fade + slide-left déclenchée
 * à chaque remontage (key={pathname} dans le parent).
 * Durée : 200ms — useNativeDriver: true pour performance.
 */
function BreadcrumbAnimated({ children }: { children: React.ReactNode }) {
  const opacity    = useRef(new Animated.Value(0)).current
  const translateX = useRef(new Animated.Value(-8)).current

  useEffect(() => {
    // Réinitialiser avant d'animer (nouveau pathname)
    opacity.setValue(0)
    translateX.setValue(-8)

    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start()
  }, [opacity, translateX])

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  )
}

export default Breadcrumb
