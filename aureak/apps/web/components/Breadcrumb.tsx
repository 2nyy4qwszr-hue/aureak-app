import React, { useRef, useEffect } from 'react'
import { Animated, Pressable, useWindowDimensions } from 'react-native'
import { XStack, Text } from 'tamagui'
import { usePathname, useRouter } from 'expo-router'
import { colors, transitions } from '@aureak/theme'
import { parseBreadcrumbs } from '../utils/breadcrumbs'
import { useBreadcrumbContext } from '../contexts/BreadcrumbContext'
// Story 100.4 — Helper chemin parent pour breadcrumb mobile compact
import { getParentPath } from '../lib/admin/breadcrumb-parent'

// ── Constantes ───────────────────────────────────────────────────────────────

/** Pages racines où le breadcrumb n'est pas affiché */
const HIDDEN_PATHS = new Set(['/dashboard', '/'])

// ── Composant ────────────────────────────────────────────────────────────────

export function Breadcrumb() {
  const pathname = usePathname()
  const router   = useRouter()
  const { width }  = useWindowDimensions()
  const { labels } = useBreadcrumbContext()

  // AC1 — Masqué sur le dashboard root
  if (HIDDEN_PATHS.has(pathname)) return null

  const items = parseBreadcrumbs(pathname, labels)

  // Si 1 seul segment → pas de breadcrumb utile (on est déjà au niveau racine du hub)
  if (items.length <= 1) return null

  // Story 100.4 — Variant mobile compact (< 640) : flèche retour + niveau courant
  if (width < 640) {
    const currentItem = items[items.length - 1]
    const parentItem  = items.length >= 2 ? items[items.length - 2] : null
    const parentPath  = parentItem?.href ?? getParentPath(pathname)
    const parentLabel = parentItem?.label ?? 'Retour'
    // Capitalise les labels lowercase (fallback parseBreadcrumbs via URL segment)
    const displayLabel = currentItem.label.charAt(0).toUpperCase() + currentItem.label.slice(1)

    // Navigation explicite vers le parent — plus prévisible que router.back()
    // (qui peut ne pas changer l'URL si la stack Expo est incohérente).
    const handleBack = () => {
      router.push(parentPath as never)
    }

    return (
      <BreadcrumbAnimated key={pathname}>
        <XStack
          alignItems="center"
          paddingHorizontal={12}
          paddingVertical={10}
          gap={8}
          style={{ flexShrink: 0 } as never}
        >
          <Pressable
            onPress={handleBack}
            accessibilityRole="link"
            accessibilityLabel={`Retour à ${parentLabel}`}
          >
            {({ pressed }) => (
              <XStack
                alignItems="center"
                gap={6}
                paddingHorizontal={8}
                paddingVertical={6}
                borderRadius={8}
                style={{
                  backgroundColor: pressed ? colors.light.muted : 'transparent',
                  transition     : `background-color ${transitions.fast}`,
                  cursor         : 'pointer',
                } as never}
              >
                <Text fontFamily="$body" fontSize={18} color={colors.text.dark} style={{ lineHeight: 18 } as never}>
                  ←
                </Text>
                <Text
                  fontFamily="$body"
                  fontSize={14}
                  fontWeight="600"
                  color={colors.text.dark}
                  numberOfLines={1}
                >
                  {displayLabel}
                </Text>
              </XStack>
            )}
          </Pressable>
        </XStack>
      </BreadcrumbAnimated>
    )
  }

  // Tablet (640-1024) : le topbar tablet (Story 100.3) affiche déjà le dernier crumb.
  // On évite le double-render.
  if (width < 1024) return null

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
