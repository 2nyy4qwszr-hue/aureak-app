import { useEffect } from 'react'
import { Pressable } from 'react-native'
import { Slot, useRouter, usePathname } from 'expo-router'
import { XStack, YStack, Text, Separator } from 'tamagui'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const NAV_ITEMS = [
  { label: 'Dashboard',      href: '/parent/dashboard'      },
  { label: 'Notifications',  href: '/parent/notifications'  },
  { label: 'Mes demandes',   href: '/parent/tickets'        },
] as const

export default function ParentLayout() {
  const router   = useRouter()
  const pathname = usePathname()
  const { role, isLoading, signOut } = useAuthStore()

  useEffect(() => {
    if (!isLoading && role !== 'parent') {
      router.replace('/(auth)/login' as never)
    }
  }, [role, isLoading, router])

  if (isLoading || role !== 'parent') return null

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login' as never)
  }

  return (
    <XStack flex={1} style={{ height: '100vh' as never }}>
      {/* ── Sidebar ── */}
      <YStack
        width={200}
        backgroundColor={colors.light.surface}
        borderRightWidth={1}
        borderRightColor={colors.border.divider}
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
          color={colors.text.muted}
          paddingHorizontal={12}
          marginBottom={32}
          letterSpacing={1}
          style={{ textTransform: 'uppercase' as never }}
        >
          Espace parent
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
                        ? colors.accent.gold + '12'
                        : pressed
                          ? colors.light.hover
                          : 'transparent'
                    }
                  >
                    <Text
                      fontFamily="$body"
                      fontSize={14}
                      fontWeight={isActive ? '600' : '400'}
                      color={isActive ? colors.text.dark : colors.text.muted}
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
          <Separator borderColor={colors.border.divider} marginBottom={12} />
          <Pressable onPress={handleSignOut}>
            <YStack paddingVertical={9} paddingHorizontal={12} borderRadius={8}>
              <Text fontFamily="$body" fontSize={14} color={colors.text.muted}>
                Déconnexion
              </Text>
            </YStack>
          </Pressable>
        </YStack>
      </YStack>

      {/* ── Main content ── */}
      <YStack
        flex={1}
        backgroundColor={colors.light.primary}
        style={{ overflowY: 'auto' as never }}
      >
        <Slot />
      </YStack>
    </XStack>
  )
}
