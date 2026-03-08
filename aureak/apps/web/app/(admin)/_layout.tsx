import { useEffect, useState } from 'react'
import { Pressable, useWindowDimensions } from 'react-native'
import { Slot, useRouter, usePathname } from 'expo-router'
import { XStack, YStack, Text, Separator } from 'tamagui'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

type NavGroup = {
  label : string
  items : { label: string; href: string }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Opérations',
    items: [
      { label: 'Tableau de bord', href: '/dashboard'   },
      { label: 'Séances',          href: '/sessions'    },
      { label: 'Présences',       href: '/attendance'  },
      { label: 'Évaluations',     href: '/evaluations' },
    ],
  },
  {
    label: 'Méthodologie',
    items: [
      { label: 'Entraînements pédagogiques', href: '/methodologie/seances'    },
      { label: 'Thèmes',              href: '/methodologie/themes'     },
      { label: 'Situations',          href: '/methodologie/situations' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Joueurs',       href: '/children'      },
      { label: 'Coachs',        href: '/coaches'       },
      { label: 'Clubs',         href: '/clubs'         },
      { label: 'Groupes',       href: '/groups'        },
      { label: 'Implantations', href: '/implantations' },
    ],
  },
  {
    label: 'Événements',
    items: [
      { label: 'Stages', href: '/stages' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Comparaison',   href: '/analytics'     },
    ],
  },
]

export default function AdminLayout() {
  const router   = useRouter()
  const pathname = usePathname()
  const { width } = useWindowDimensions()
  const { role, isLoading, signOut, user } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isMobile = width < 768

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) setMobileOpen(false)
  }, [pathname, isMobile])

  useEffect(() => {
    if (!isLoading && role !== 'admin') {
      router.replace('/(auth)/login' as never)
    }
  }, [role, isLoading, router])

  if (isLoading || role !== 'admin') return null

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login' as never)
  }

  const adminInitial = (user?.email ?? 'A').charAt(0).toUpperCase()

  return (
    <XStack flex={1} style={{ height: '100vh' as never }}>

      {/* ── Mobile overlay ── */}
      {isMobile && mobileOpen && (
        <Pressable
          onPress={() => setMobileOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 40, backgroundColor: 'rgba(0,0,0,0.55)',
          } as never}
        />
      )}

      {/* ── Sidebar ── */}
      <YStack
        width={220}
        backgroundColor={colors.background.surface}
        borderRightWidth={1}
        borderRightColor={colors.accent.zinc}
        paddingBottom={16}
        style={{
          flexShrink     : 0,
          overflowY      : 'auto',
          ...(isMobile ? {
            position   : 'fixed',
            top        : 0,
            left       : mobileOpen ? 0 : -220,
            height     : '100vh',
            transition : 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
            zIndex     : 50,
            boxShadow  : mobileOpen ? '4px 0 32px rgba(0,0,0,0.5)' : 'none',
          } : {}),
        } as never}
      >
        {/* Gold top accent stripe */}
        <YStack
          height={2}
          backgroundColor={colors.accent.gold}
          style={{ flexShrink: 0 } as never}
        />

        {/* ── Brand ── */}
        <YStack
          paddingTop={24}
          paddingBottom={18}
          paddingHorizontal={20}
          borderBottomWidth={1}
          borderBottomColor={colors.accent.zinc}
          marginBottom={8}
        >
          <Text
            fontFamily="$heading"
            fontSize={22}
            fontWeight="800"
            color={colors.accent.gold}
            letterSpacing={4}
          >
            AUREAK
          </Text>
          <Text
            fontFamily="$body"
            fontSize={10}
            color={colors.text.secondary}
            letterSpacing={1.8}
            marginTop={2}
            style={{ textTransform: 'uppercase' as never }}
          >
            Administration
          </Text>
        </YStack>

        {/* ── Nav groups ── */}
        <YStack flex={1} paddingTop={8}>
          {NAV_GROUPS.map((group, gi) => (
            <YStack key={group.label} marginBottom={4}>
              <Text
                fontFamily="$body"
                fontSize={9}
                fontWeight="700"
                color={colors.text.secondary}
                letterSpacing={1.5}
                paddingHorizontal={20}
                paddingBottom={4}
                paddingTop={gi === 0 ? 4 : 12}
                style={{ textTransform: 'uppercase' as never, opacity: 0.55 }}
              >
                {group.label}
              </Text>

              <YStack gap={1} paddingHorizontal={8}>
                {group.items.map(({ label, href }) => {
                  const isActive = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <Pressable key={href} onPress={() => router.push(href as never)}>
                      {({ pressed }) => (
                        <YStack
                          paddingVertical={8}
                          paddingLeft={12}
                          paddingRight={12}
                          borderRadius={6}
                          borderLeftWidth={2}
                          borderLeftColor={isActive ? colors.accent.gold : 'transparent' as never}
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
                            fontSize={13}
                            fontWeight={isActive ? '600' : '400'}
                            color={isActive ? colors.accent.gold : colors.text.secondary}
                          >
                            {label}
                          </Text>
                        </YStack>
                      )}
                    </Pressable>
                  )
                })}
              </YStack>

              {gi < NAV_GROUPS.length - 1 && (
                <Separator
                  borderColor={colors.accent.zinc}
                  marginTop={10}
                  marginHorizontal={20}
                  opacity={0.4}
                />
              )}
            </YStack>
          ))}
        </YStack>

        {/* ── Admin info + sign out ── */}
        <YStack paddingHorizontal={12} paddingTop={8}>
          <Separator borderColor={colors.accent.zinc} opacity={0.4} marginBottom={10} />

          {/* Admin user pill */}
          {user && (
            <XStack
              alignItems="center"
              gap={10}
              paddingHorizontal={8}
              paddingVertical={8}
              marginBottom={4}
              borderRadius={8}
              backgroundColor={colors.background.elevated}
            >
              {/* Avatar initial */}
              <YStack
                width={30}
                height={30}
                borderRadius={15}
                backgroundColor={colors.accent.gold}
                alignItems="center"
                justifyContent="center"
                style={{ flexShrink: 0 } as never}
              >
                <Text
                  fontFamily="$heading"
                  fontSize={13}
                  fontWeight="800"
                  color={colors.text.dark}
                >
                  {adminInitial}
                </Text>
              </YStack>

              <YStack flex={1} style={{ overflow: 'hidden' } as never}>
                <Text
                  fontFamily="$body"
                  fontSize={11}
                  fontWeight="600"
                  color={colors.text.primary}
                  numberOfLines={1}
                  style={{
                    overflow    : 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace  : 'nowrap',
                  } as never}
                >
                  {user.email ?? 'Administrateur'}
                </Text>
                <Text
                  fontFamily="$body"
                  fontSize={9}
                  color={colors.text.secondary}
                  style={{ textTransform: 'uppercase' as never, letterSpacing: 1 }}
                >
                  Admin
                </Text>
              </YStack>
            </XStack>
          )}

          {/* Sign out */}
          <Pressable onPress={handleSignOut}>
            {({ pressed }) => (
              <YStack
                paddingVertical={7}
                paddingHorizontal={12}
                borderRadius={6}
                backgroundColor={pressed ? colors.background.elevated : 'transparent'}
              >
                <Text fontFamily="$body" fontSize={13} color={colors.text.secondary}>
                  Déconnexion
                </Text>
              </YStack>
            )}
          </Pressable>
        </YStack>
      </YStack>

      {/* ── Main content area ── */}
      <YStack
        flex={1}
        backgroundColor={colors.background.primary}
        style={{ overflowY: 'auto' } as never}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <XStack
            height={52}
            backgroundColor={colors.background.surface}
            borderBottomWidth={1}
            borderBottomColor={colors.accent.zinc}
            alignItems="center"
            paddingHorizontal={16}
            gap={12}
            style={{ flexShrink: 0 } as never}
          >
            <Pressable onPress={() => setMobileOpen(v => !v)}>
              {({ pressed }) => (
                <YStack
                  width={36}
                  height={36}
                  borderRadius={7}
                  backgroundColor={pressed ? colors.background.primary : colors.background.elevated}
                  borderWidth={1}
                  borderColor={colors.accent.zinc}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize={14} color={colors.accent.gold}>
                    {mobileOpen ? '✕' : '☰'}
                  </Text>
                </YStack>
              )}
            </Pressable>
            <Text
              fontFamily="$heading"
              fontSize={16}
              fontWeight="800"
              color={colors.accent.gold}
              letterSpacing={3}
            >
              AUREAK
            </Text>
          </XStack>
        )}

        <Slot />
      </YStack>
    </XStack>
  )
}
