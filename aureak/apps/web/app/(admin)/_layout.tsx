import { useEffect, useState } from 'react'
import { Pressable, useWindowDimensions } from 'react-native'
import { Slot, useRouter, usePathname } from 'expo-router'
import { XStack, YStack, Text, Separator } from 'tamagui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, transitions, radius } from '@aureak/theme'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { ToastProvider } from '../../components/ToastContext'
import { GlobalSearch } from '../../components/GlobalSearch'
import { NotificationBadge } from '../../components/NotificationBadge'

type NavGroup = {
  label : string
  items : { label: string; href: string }[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Opérations',
    items: [
      { label: 'Tableau de bord',     href: '/dashboard'          },
      { label: 'Dashboard séances',  href: '/dashboard/seances'  },
      { label: 'Séances',            href: '/seances'            },
      { label: 'Présences (v2)',     href: '/presences'          },
      { label: 'Présences',          href: '/attendance'         },
      { label: 'Évaluations',        href: '/evaluations'        },
    ],
  },
  {
    label: 'Méthodologie',
    items: [
      { label: 'Entraînements', href: '/methodologie/seances'    },
      { label: 'Thèmes',        href: '/methodologie/themes'     },
      { label: 'Situations',    href: '/methodologie/situations' },
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
      { label: 'Comparaison',     href: '/analytics'                },
      { label: 'Par implantation', href: '/analytics/implantation'  },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Utilisateurs',        href: '/users'                           },
      { label: 'Accès temporaires',   href: '/access-grants'                   },
      { label: 'Tickets support',     href: '/tickets'                         },
      { label: 'Journal d\'audit',    href: '/audit'                           },
      { label: 'Calendrier scolaire', href: '/settings/school-calendar'        },
      { label: 'Anomalies',           href: '/anomalies'                       },
      { label: 'Messages coaches',    href: '/messages'                        },
      { label: 'Permissions grades',  href: '/grade-permissions'               },
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
    <ToastProvider>
    <XStack flex={1} style={{ height: '100vh' as never }}>

      {/* ── Mobile overlay ── */}
      {isMobile && mobileOpen && (
        <Pressable
          onPress={() => setMobileOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 40, backgroundColor: 'rgba(0,0,0,0.35)',
          } as never}
        />
      )}

      {/* ── Sidebar — Light Premium ── */}
      <YStack
        width={220}
        backgroundColor={colors.light.surface}
        borderRightWidth={1}
        borderRightColor={colors.border.divider}
        style={{
          flexShrink     : 0,
          display        : 'flex',
          flexDirection  : 'column',
          height         : '100vh',
          boxShadow      : shadows.sm,
          ...(isMobile ? {
            position   : 'fixed',
            top        : 0,
            left       : mobileOpen ? 0 : -220,
            transition : `left ${transitions.normal}`,
            zIndex     : 50,
            boxShadow  : mobileOpen ? shadows.lg : 'none',
          } : {}),
        } as never}
      >
        {/* Gold top accent stripe */}
        <YStack
          height={3}
          backgroundColor={colors.accent.gold}
          style={{ flexShrink: 0 } as never}
        />

        {/* ── Brand ── */}
        <YStack
          paddingTop={24}
          paddingBottom={18}
          paddingHorizontal={20}
          borderBottomWidth={1}
          borderBottomColor={colors.border.divider}
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
            color={colors.text.muted}
            letterSpacing={1.8}
            marginTop={2}
            style={{ textTransform: 'uppercase' as never }}
          >
            Administration
          </Text>
        </YStack>

        {/* ── Global search ── */}
        <GlobalSearch />

        {/* ── Notification badge ── */}
        <NotificationBadge />

        {/* ── Nav groups — seule zone scrollable ── */}
        <YStack flex={1} paddingTop={8} style={{ overflowY: 'auto', minHeight: 0 } as never}>
          {NAV_GROUPS.map((group, gi) => (
            <YStack key={group.label} marginBottom={4}>
              <Text
                fontFamily="$body"
                fontSize={9}
                fontWeight="700"
                color={colors.text.subtle}
                letterSpacing={1.5}
                paddingHorizontal={20}
                paddingBottom={4}
                paddingTop={gi === 0 ? 4 : 12}
                style={{ textTransform: 'uppercase' as never }}
              >
                {group.label}
              </Text>

              <YStack gap={1} paddingHorizontal={8}>
                {group.items.map(({ label, href }) => {
                  // Exact match OR prefix match — but avoid short paths like '/' matching everything
                  const isActive = pathname === href || (href.length > 1 && pathname.startsWith(href + '/'))
                  return (
                    <Pressable key={href} onPress={() => router.push(href as never)}>
                      {({ pressed }) => (
                        <YStack
                          paddingVertical={8}
                          paddingLeft={12}
                          paddingRight={12}
                          borderRadius={radius.xs}
                          borderLeftWidth={3}
                          borderLeftColor={isActive ? colors.accent.gold : 'transparent' as never}
                          backgroundColor={
                            (isActive
                              ? colors.accent.gold + '18'
                              : pressed
                                ? colors.light.hover
                                : 'transparent') as never
                          }
                          style={{
                            transition: `all ${transitions.fast}`,
                          } as never}
                        >
                          <Text
                            fontFamily="$body"
                            fontSize={13}
                            fontWeight={isActive ? '700' : '400'}
                            color={isActive ? colors.accent.gold : colors.text.muted}
                            style={isActive ? { letterSpacing: 0.1 } as never : undefined}
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
                  borderColor={colors.border.divider}
                  marginTop={10}
                  marginHorizontal={20}
                  opacity={0.6}
                />
              )}
            </YStack>
          ))}
        </YStack>

        {/* ── Admin info + sign out ── */}
        <YStack paddingHorizontal={12} paddingTop={8}>
          <Separator borderColor={colors.border.divider} opacity={0.6} marginBottom={10} />

          {/* Admin user pill */}
          {user && (
            <XStack
              alignItems="center"
              gap={10}
              paddingHorizontal={8}
              paddingVertical={8}
              marginBottom={4}
              borderRadius={8}
              backgroundColor={colors.light.muted}
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
                  color={colors.text.dark}
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
                  color={colors.text.subtle}
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
                borderRadius={radius.xs}
                backgroundColor={pressed ? colors.light.hover : 'transparent'}
              >
                <Text fontFamily="$body" fontSize={13} color={colors.text.muted}>
                  Déconnexion
                </Text>
              </YStack>
            )}
          </Pressable>
        </YStack>
      </YStack>

      {/* ── Main content area — LIGHT BEIGE background ── */}
      <YStack
        flex={1}
        backgroundColor={colors.light.primary}
        style={{ overflowY: 'auto' } as never}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <XStack
            height={52}
            backgroundColor={colors.light.surface}
            borderBottomWidth={1}
            borderBottomColor={colors.border.divider}
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
                  backgroundColor={pressed ? colors.light.hover : colors.light.muted}
                  borderWidth={1}
                  borderColor={colors.border.light}
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

        <ErrorBoundary>
          <Slot />
        </ErrorBoundary>
      </YStack>
    </XStack>
    </ToastProvider>
  )
}
