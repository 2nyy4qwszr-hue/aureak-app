import { useEffect } from 'react'
import { Pressable } from 'react-native'
import { Slot, useRouter, usePathname } from 'expo-router'
import { XStack, YStack, Text, Separator } from 'tamagui'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const NAV_ITEMS = [
  { label: 'Accueil',     href: '/child/dashboard' },
  { label: 'Quiz',        href: '/child/quiz'       },
  { label: 'Progression', href: '/child/progress'   },
  { label: 'Badges',      href: '/child/badges'     },
  { label: 'Avatar',      href: '/child/avatar'     },
] as const

export default function ChildLayout() {
  const router   = useRouter()
  const pathname = usePathname()
  const { role, isLoading, signOut } = useAuthStore()

  useEffect(() => {
    if (!isLoading && role !== 'child') {
      router.replace('/(auth)/login' as never)
    }
  }, [role, isLoading, router])

  if (isLoading || role !== 'child') return null

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login' as never)
  }

  return (
    <XStack flex={1} style={{ height: '100vh' as never }}>
      {/* ── Sidebar ── */}
      <YStack
        width={200}
        backgroundColor={colors.background.surface}
        borderRightWidth={1}
        borderRightColor={colors.accent.zinc}
        paddingTop={32}
        paddingBottom={24}
        paddingHorizontal={12}
        style={{ flexShrink: 0 }}
      >
        <Text
          fontFamily="$heading"
          fontSize={20}
          fontWeight="700"
          color={colors.accent.gold}
          letterSpacing={3}
          paddingHorizontal={12}
          marginBottom={4}
        >
          AUREAK
        </Text>
        <Text
          fontFamily="$body"
          fontSize={11}
          color={colors.text.secondary}
          paddingHorizontal={12}
          marginBottom={32}
          letterSpacing={1}
          style={{ textTransform: 'uppercase' as never }}
        >
          Espace joueur
        </Text>

        <YStack gap={2} flex={1}>
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Pressable key={href} onPress={() => router.push(href as never)}>
                {({ pressed }) => (
                  <YStack
                    paddingVertical={9}
                    paddingHorizontal={12}
                    borderRadius={8}
                    backgroundColor={
                      isActive
                        ? colors.background.elevated
                        : pressed
                          ? colors.background.elevated
                          : 'transparent'
                    }
                  >
                    <Text
                      fontFamily="$body"
                      fontSize={14}
                      fontWeight={isActive ? '600' : '400'}
                      color={isActive ? colors.text.primary : colors.text.secondary}
                    >
                      {label}
                    </Text>
                  </YStack>
                )}
              </Pressable>
            )
          })}
        </YStack>

        <YStack>
          <Separator borderColor={colors.accent.zinc} marginBottom={12} />
          <Pressable onPress={handleSignOut}>
            <YStack paddingVertical={9} paddingHorizontal={12} borderRadius={8}>
              <Text fontFamily="$body" fontSize={14} color={colors.text.secondary}>
                Déconnexion
              </Text>
            </YStack>
          </Pressable>
        </YStack>
      </YStack>

      {/* ── Main content ── */}
      <YStack
        flex={1}
        backgroundColor={colors.background.primary}
        style={{ overflowY: 'auto' as never }}
      >
        <Slot />
      </YStack>
    </XStack>
  )
}
