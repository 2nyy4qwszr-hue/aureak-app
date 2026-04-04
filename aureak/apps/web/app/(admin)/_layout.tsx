import { useEffect, useState } from 'react'
import { Pressable, useWindowDimensions } from 'react-native'
import { Slot, useRouter, usePathname } from 'expo-router'
import { XStack, YStack, Text, Separator } from 'tamagui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, transitions, radius } from '@aureak/theme'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { ToastProvider } from '../../components/ToastContext'
import { NotificationProvider } from '../../components/NotificationContext'
import { SearchProvider } from '../../components/SearchContext'
import { GlobalSearch } from '../../components/GlobalSearch'
import { NotificationBadge } from '../../components/NotificationBadge'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

function KeyboardHandler() {
  useKeyboardShortcuts()
  return null
}

type NavItem = { label: string; href: string; icon: string }
type NavGroup = {
  label : string
  items : NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Opérations',
    items: [
      { label: 'Tableau de bord', href: '/dashboard',   icon: '🏠' },
      { label: 'Séances',         href: '/seances',     icon: '📅' },
      { label: 'Présences',       href: '/presences',   icon: '✅' },
      { label: 'Évaluations',     href: '/evaluations', icon: '⭐' },
    ],
  },
  {
    label: 'Méthodologie',
    items: [
      { label: 'Entraînements', href: '/methodologie/seances',    icon: '📚' },
      { label: 'Thèmes',        href: '/methodologie/themes',     icon: '📚' },
      { label: 'Situations',    href: '/methodologie/situations', icon: '📚' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Joueurs',       href: '/children',      icon: '👥' },
      { label: 'Coachs',        href: '/coaches',       icon: '👨‍🏫' },
      { label: 'Clubs',         href: '/clubs',         icon: '🏅' },
      { label: 'Groupes',       href: '/groups',        icon: '🏆' },
      { label: 'Implantations', href: '/implantations', icon: '🏟️' },
    ],
  },
  {
    label: 'Événements',
    items: [
      { label: 'Stages', href: '/stages', icon: '🎯' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Comparaison',      href: '/analytics',               icon: '📊' },
      { label: 'Par implantation', href: '/analytics/implantation',  icon: '📊' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Utilisateurs',        href: '/users',                    icon: '👤' },
      { label: 'Accès temporaires',   href: '/access-grants',            icon: '🔐' },
      { label: 'Tickets support',     href: '/tickets',                  icon: '🎫' },
      { label: 'Journal d\'audit',    href: '/audit',                    icon: '🔍' },
      { label: 'Calendrier scolaire', href: '/settings/school-calendar', icon: '📅' },
      { label: 'Anomalies',           href: '/anomalies',                icon: '⚠️' },
      { label: 'Messages coaches',    href: '/messages',                 icon: '💬' },
      { label: 'Permissions grades',  href: '/grade-permissions',        icon: '🔐' },
    ],
  },
]

export default function AdminLayout() {
  const router   = useRouter()
  const pathname = usePathname()
  const { width } = useWindowDimensions()
  const { role, isLoading, signOut, user } = useAuthStore()
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true' } catch { return false }
  })
  const toggleSidebar = () => setSidebarCollapsed(v => {
    const next = !v
    try { localStorage.setItem('sidebar-collapsed', String(next)) } catch { /* noop */ }
    return next
  })
  const sidebarWidth = sidebarCollapsed ? 52 : 220

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
    <NotificationProvider>
    <SearchProvider>
    <KeyboardHandler />
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

      {/* ── Sidebar — Dark Premium ── */}
      <YStack
        width={sidebarWidth}
        backgroundColor={colors.background.primary}
        borderRightWidth={1}
        borderRightColor={colors.border.dark}
        style={{
          flexShrink     : 0,
          display        : 'flex',
          flexDirection  : 'column',
          height         : '100vh',
          boxShadow      : shadows.sm,
          ...(isMobile ? {
            position   : 'fixed',
            top        : 0,
            left       : mobileOpen ? 0 : -sidebarWidth,
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
          borderBottomColor={colors.border.dark}
          marginBottom={8}
        >
          <XStack alignItems="center" justifyContent="space-between">
            {!sidebarCollapsed && (
              <YStack>
                <Text fontFamily="$heading" fontSize={22} fontWeight="800" color={colors.accent.gold} letterSpacing={4}>
                  AUREAK
                </Text>
                <Text fontFamily="$body" fontSize={10} color={colors.text.secondary} letterSpacing={1.8} marginTop={2} style={{ textTransform: 'uppercase' as never }}>
                  Administration
                </Text>
              </YStack>
            )}
            <Pressable onPress={toggleSidebar} style={{ padding: 4, borderRadius: 4, marginLeft: sidebarCollapsed ? 'auto' : 0 } as never}>
              <Text fontSize={12} color={colors.text.secondary}>{sidebarCollapsed ? '›' : '‹'}</Text>
            </Pressable>
          </XStack>
        </YStack>

        {/* ── Global search ── */}
        {!sidebarCollapsed && <GlobalSearch />}

        {/* ── Notification badge ── */}
        {!sidebarCollapsed && <NotificationBadge />}

        {/* ── Nav groups — seule zone scrollable ── */}
        <YStack flex={1} paddingTop={8} style={{ overflowY: 'auto', minHeight: 0 } as never}>
          {NAV_GROUPS.map((group, gi) => (
            <YStack key={group.label} marginBottom={4}>
              {!sidebarCollapsed && (
                <Text
                  fontFamily="$body"
                  fontSize={9}
                  fontWeight="700"
                  color={colors.text.secondary}
                  letterSpacing={1.5}
                  paddingHorizontal={20}
                  paddingBottom={4}
                  paddingTop={gi === 0 ? 4 : 12}
                  style={{ textTransform: 'uppercase' as never }}
                >
                  {group.label}
                </Text>
              )}

              <YStack gap={1} paddingHorizontal={8}>
                {group.items.map(({ label, href, icon }) => {
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
                                ? 'rgba(255,255,255,0.08)'
                                : 'transparent') as never
                          }
                          style={{
                            transition: `all ${transitions.fast}`,
                          } as never}
                        >
                          {sidebarCollapsed ? (
                            <Text
                              fontSize={18}
                              style={{ opacity: isActive ? 1 : 0.55 } as never}
                            >
                              {icon}
                            </Text>
                          ) : (
                            <XStack alignItems="center">
                              <Text
                                fontSize={16}
                                style={{ marginRight: 8, opacity: isActive ? 1 : 0.55 } as never}
                              >
                                {icon}
                              </Text>
                              <Text
                                fontFamily="$body"
                                fontSize={13}
                                fontWeight={isActive ? '700' : '400'}
                                color={isActive ? colors.accent.gold : colors.text.secondary}
                                style={isActive ? { letterSpacing: 0.1 } as never : undefined}
                              >
                                {label}
                              </Text>
                            </XStack>
                          )}
                        </YStack>
                      )}
                    </Pressable>
                  )
                })}
              </YStack>

              {gi < NAV_GROUPS.length - 1 && (
                <Separator
                  borderColor={colors.border.dark}
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
          <Separator borderColor={colors.border.dark} opacity={0.4} marginBottom={10} />

          {/* Admin user pill */}
          {user && !sidebarCollapsed && (
            <XStack
              alignItems="center"
              gap={10}
              paddingHorizontal={8}
              paddingVertical={8}
              marginBottom={4}
              borderRadius={8}
              backgroundColor='rgba(255,255,255,0.08)'
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
                borderRadius={radius.xs}
                backgroundColor={pressed ? 'rgba(255,255,255,0.08)' : 'transparent'}
              >
                <Text fontFamily="$body" fontSize={13} color={colors.text.secondary}>
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
    </SearchProvider>
    </NotificationProvider>
    </ToastProvider>
  )
}
