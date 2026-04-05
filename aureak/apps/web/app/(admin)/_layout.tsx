import React from 'react'
import { useEffect, useState } from 'react'
import { Pressable, useWindowDimensions } from 'react-native'
import { Slot, useRouter, usePathname } from 'expo-router'
import { XStack, YStack, Text, Separator } from 'tamagui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, transitions, radius } from '@aureak/theme'
import { getActiveSession, getNavBadgeCounts } from '@aureak/api-client'
import type { ActiveSessionInfo, NavBadgeCounts } from '@aureak/api-client'
import { ActiveSessionBar } from '../../components/ActiveSessionBar'
import { NavBadge } from '../../components/NavBadge'
import {
  HomeIcon,
  CalendarIcon,
  CalendarDaysIcon,
  CheckSquareIcon,
  StarIcon,
  BookOpenIcon,
  TagIcon,
  LayersIcon,
  UsersIcon,
  UserCheckIcon,
  ShieldIcon,
  GridIcon,
  MapPinIcon,
  TargetIcon,
  BarChartIcon,
  PieChartIcon,
  UserIcon,
  KeyIcon,
  MessageSquareIcon,
  SearchIcon,
  AlertTriangleIcon,
  ChatIcon,
  LockIcon,
} from '@aureak/ui'
import type { NavIconProps } from '@aureak/ui'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { ToastProvider } from '../../components/ToastContext'
import { NotificationProvider } from '../../components/NotificationContext'
import { SearchProvider } from '../../components/SearchContext'
import { GlobalSearch } from '../../components/GlobalSearch'
import { NotificationBadge } from '../../components/NotificationBadge'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { CommandPalette } from '../../components/CommandPalette'
import { ShortcutsHelp } from '../../components/ShortcutsHelp'
import { KeyboardPrefixHint } from '../../components/KeyboardPrefixHint'
import { BreadcrumbProvider } from '../contexts/BreadcrumbContext'
import { Breadcrumb } from '../../components/Breadcrumb'

// ── Hints sidebar : href → chord affiché en mode expanded (Story 51.6) ────────
const ITEM_SHORTCUTS: Record<string, string> = {
  '/dashboard'  : 'G D',
  '/seances'    : 'G S',
  '/presences'  : 'G P',
  '/evaluations': 'G E',
  '/children'   : 'G J',
  '/clubs'      : 'G C',
  '/methodologie': 'G M',
  '/stages'     : 'G T',
}

function KeyboardHandler() {
  const { prefixActive, prefixKey, shortcutsHelpOpen, setShortcutsHelpOpen } = useKeyboardShortcuts()
  return (
    <>
      <ShortcutsHelp isOpen={shortcutsHelpOpen} onClose={() => setShortcutsHelpOpen(false)} />
      <KeyboardPrefixHint prefixActive={prefixActive} prefixKey={prefixKey} />
    </>
  )
}

type NavIconComponent = React.FC<NavIconProps>

type NavItem = { label: string; href: string; Icon: NavIconComponent }
type NavGroup = {
  label : string
  items : NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Opérations',
    items: [
      { label: 'Tableau de bord', href: '/dashboard',   Icon: HomeIcon },
      { label: 'Séances',         href: '/seances',     Icon: CalendarIcon },
      { label: 'Présences',       href: '/presences',   Icon: CheckSquareIcon },
      { label: 'Évaluations',     href: '/evaluations', Icon: StarIcon },
    ],
  },
  {
    label: 'Méthodologie',
    items: [
      { label: 'Entraînements', href: '/methodologie/seances',    Icon: BookOpenIcon },
      { label: 'Thèmes',        href: '/methodologie/themes',     Icon: TagIcon },
      { label: 'Situations',    href: '/methodologie/situations', Icon: LayersIcon },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Joueurs',       href: '/children',      Icon: UsersIcon },
      { label: 'Coachs',        href: '/coaches',       Icon: UserCheckIcon },
      { label: 'Clubs',         href: '/clubs',         Icon: ShieldIcon },
      { label: 'Groupes',       href: '/groups',        Icon: GridIcon },
      { label: 'Implantations', href: '/implantations', Icon: MapPinIcon },
    ],
  },
  {
    label: 'Événements',
    items: [
      { label: 'Stages', href: '/stages', Icon: TargetIcon },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Comparaison',      href: '/analytics',               Icon: BarChartIcon },
      { label: 'Par implantation', href: '/analytics/implantation',  Icon: PieChartIcon },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Utilisateurs',        href: '/users',                    Icon: UserIcon },
      { label: 'Accès temporaires',   href: '/access-grants',            Icon: KeyIcon },
      { label: 'Tickets support',     href: '/tickets',                  Icon: MessageSquareIcon },
      { label: 'Journal d\'audit',    href: '/audit',                    Icon: SearchIcon },
      { label: 'Calendrier scolaire', href: '/settings/school-calendar', Icon: CalendarDaysIcon },
      { label: 'Anomalies',           href: '/anomalies',                Icon: AlertTriangleIcon },
      { label: 'Messages coaches',    href: '/messages',                 Icon: ChatIcon },
      { label: 'Permissions grades',  href: '/grade-permissions',        Icon: LockIcon },
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

  // ── Story 51.2 — Topbar séance active — polling 60s ──────────────────────
  const [activeSessions, setActiveSessions] = useState<ActiveSessionInfo[]>([])

  useEffect(() => {
    let cancelled = false

    const fetchActive = async () => {
      try {
        const sessions = await getActiveSession()
        if (!cancelled) setActiveSessions(sessions)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AdminLayout] getActiveSession error:', err)
        // dégradation silencieuse — barre reste absente
      }
    }

    fetchActive()
    const intervalId = setInterval(fetchActive, 60_000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  // ── Story 51.4 — Nav badges sidebar — polling 5min ────────────────────────
  const [navBadges, setNavBadges] = useState<NavBadgeCounts | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchBadges = async () => {
      try {
        const counts = await getNavBadgeCounts()
        if (!cancelled) setNavBadges(counts)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AdminLayout] getNavBadgeCounts error:', err)
        // dégradation silencieuse — badges restent dans leur dernier état connu
      }
    }

    fetchBadges()
    const intervalId = setInterval(fetchBadges, 5 * 60_000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

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
    <BreadcrumbProvider>
    <ToastProvider>
    <NotificationProvider>
    <SearchProvider>
    <KeyboardHandler />
    {/* Story 51.3 — Command Palette ⌘K (overlay, hors du flux) */}
    <CommandPalette />
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
        data-sidebar="true"
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
                  color={colors.text.subtle}
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
                {group.items.map(({ label, href, Icon }) => {
                  // Exact match OR prefix match — avoid short paths like '/' matching everything
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
                                ? 'rgba(255,255,255,0.06)'
                                : 'transparent') as never
                          }
                          style={{
                            transition: `all ${transitions.fast}`,
                          } as never}
                        >
                          {sidebarCollapsed ? (
                            <YStack alignItems="center" justifyContent="center">
                              <YStack style={{ position: 'relative' } as never}>
                                <Icon
                                  color={isActive ? colors.accent.gold : colors.text.secondary}
                                  size={18}
                                  strokeWidth={1.5}
                                />
                                {href === '/presences' && navBadges && navBadges.presencesUnvalidated > 0 && (
                                  <NavBadge count={navBadges.presencesUnvalidated} color={colors.status.absent} />
                                )}
                                {href === '/seances' && navBadges?.sessionsUpcoming24h && (
                                  <NavBadge dot color={colors.accent.gold} />
                                )}
                              </YStack>
                            </YStack>
                          ) : (
                            <XStack alignItems="center">
                              <YStack
                                marginRight={8}
                                style={{ position: 'relative', opacity: isActive ? 1 : 0.6 } as never}
                              >
                                <Icon
                                  color={isActive ? colors.accent.gold : colors.text.secondary}
                                  size={16}
                                  strokeWidth={1.5}
                                />
                                {href === '/presences' && navBadges && navBadges.presencesUnvalidated > 0 && (
                                  <NavBadge count={navBadges.presencesUnvalidated} color={colors.status.absent} />
                                )}
                                {href === '/seances' && navBadges?.sessionsUpcoming24h && (
                                  <NavBadge dot color={colors.accent.gold} />
                                )}
                              </YStack>
                              <Text
                                fontFamily="$body"
                                fontSize={13}
                                fontWeight={isActive ? '700' : '400'}
                                color={isActive ? colors.accent.gold : colors.text.secondary}
                                style={isActive ? { letterSpacing: 0.1, flex: 1 } as never : { flex: 1 } as never}
                                numberOfLines={1}
                              >
                                {label}
                              </Text>
                              {/* Story 51.6 — hint raccourci (mode expanded uniquement) */}
                              {ITEM_SHORTCUTS[href] && (
                                <Text
                                  fontFamily="$body"
                                  fontSize={9}
                                  color={colors.text.subtle}
                                  style={{ marginLeft: 4, flexShrink: 0 } as never}
                                >
                                  {ITEM_SHORTCUTS[href]}
                                </Text>
                              )}
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
            data-topbar="true"
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

        {/* ── Story 51.2 — Topbar séance active (desktop uniquement) ── */}
        {!isMobile && <ActiveSessionBar sessions={activeSessions} />}

        {/* ── Story 51.5 — Breadcrumb animé cliquable (desktop uniquement) ── */}
        {!isMobile && <Breadcrumb />}

        <ErrorBoundary>
          <Slot />
        </ErrorBoundary>
      </YStack>
    </XStack>
    </SearchProvider>
    </NotificationProvider>
    </ToastProvider>
    </BreadcrumbProvider>
  )
}
