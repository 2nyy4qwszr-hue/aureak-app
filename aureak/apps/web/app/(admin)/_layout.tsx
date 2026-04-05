import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, useWindowDimensions } from 'react-native'
import type { PressableProps, ViewStyle } from 'react-native'
import { Slot, useRouter, usePathname } from 'expo-router'
import { XStack, YStack, Text, Separator } from 'tamagui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, shadows, transitions, radius } from '@aureak/theme'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { getActiveSession, getNavBadgeCounts } from '@aureak/api-client'
import type { ActiveSessionInfo, NavBadgeCounts } from '@aureak/api-client'
import { ActiveSessionBar } from '../../components/ActiveSessionBar'
import { NavBadge } from '../../components/NavBadge'
import { NavTooltip } from '../../components/NavTooltip'
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
  SunIcon,
  MoonIcon,
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

// ── Story 51.7 — HoverablePressable : Pressable avec onMouseEnter/Leave (RN Web) ─
// Les props hover ne sont pas dans les types RN natifs — cast via interface étendue.
interface HoverablePressableProps extends PressableProps {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  style?        : ViewStyle | ((state: { pressed: boolean }) => ViewStyle)
}
const HoverablePressable = Pressable as React.ComponentType<HoverablePressableProps>

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

// ── AdminLayout wrappé dans ThemeProvider ────────────────────────────────────
// ThemeProvider doit être au-dessus de AdminLayoutInner pour que useTheme() fonctionne.
export default function AdminLayout() {
  return (
    <ThemeProvider>
      <AdminLayoutInner />
    </ThemeProvider>
  )
}

function AdminLayoutInner() {
  const router   = useRouter()
  const pathname = usePathname()
  const { width } = useWindowDimensions()
  const { role, isLoading, signOut, user } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const themeColors = useThemeColors()
  const [mobileOpen,   setMobileOpen]   = useState(false)

  // ── Story 51.7 — Sidebar collapse avec animation smooth ──────────────────
  // État initial chargé depuis localStorage sans déclencher d'animation (AC6)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true' } catch { return false }
  })

  // labelsVisible séparé de sidebarCollapsed pour contrôle d'opacity avec timing décalé (AC2/AC3)
  const [labelsVisible, setLabelsVisible] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebar-collapsed') !== 'true' } catch { return true }
  })

  // hoveredHref : tooltip visible uniquement en mode collapsed (AC4)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)

  // isInitialRender : guard pour ne pas déclencher l'animation Animated.Value au mount (AC6)
  const isInitialRender = useRef(true)

  // Animated.Value pour rotation du bouton toggle (0 = expanded ‹, 1 = collapsed ›) (AC7)
  const toggleRotation = useRef(
    new Animated.Value(
      (() => { try { return localStorage.getItem('sidebar-collapsed') === 'true' ? 1 : 0 } catch { return 0 } })()
    )
  ).current

  const sidebarWidth = sidebarCollapsed ? 52 : 220

  const isMobile = width < 768

  /**
   * toggleSidebar — Story 51.7
   * Séquence temporelle :
   * - Collapse : labels → opacity 0 immédiatement, largeur réduite après 80ms
   * - Expand   : largeur augmentée immédiatement, labels → opacity 1 après 180ms
   * Rotation bouton synchronisée 280ms ease dans les deux cas (AC7).
   */
  const toggleSidebar = () => {
    const next = !sidebarCollapsed

    // Animation rotation bouton toggle synchronisée avec l'animation largeur (AC7)
    Animated.timing(toggleRotation, {
      toValue        : next ? 1 : 0,
      duration       : 280,
      useNativeDriver: true,
    }).start()

    if (next) {
      // ── Collapse ──
      // 1. Masquer labels immédiatement (transition CSS opacity 0.1s)
      setLabelsVisible(false)
      // 2. Réduire la largeur après 80ms (labels déjà invisibles → pas de débordement)
      setTimeout(() => {
        setSidebarCollapsed(true)
        try { localStorage.setItem('sidebar-collapsed', 'true') } catch { /* noop */ }
      }, 80)
    } else {
      // ── Expand ──
      // 1. Élargir la sidebar immédiatement (transition CSS width 0.28s)
      setSidebarCollapsed(false)
      try { localStorage.setItem('sidebar-collapsed', 'false') } catch { /* noop */ }
      // 2. Afficher labels après 180ms (largeur quasi-finale → pas de clignotement)
      setTimeout(() => setLabelsVisible(true), 180)
    }
  }

  // Interpolation rotation : 0 → '0deg' (expanded ‹), 1 → '180deg' (collapsed ›)
  const rotateInterp = toggleRotation.interpolate({
    inputRange : [0, 1],
    outputRange: ['0deg', '180deg'],
  })

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

  // Marquer que le premier rendu est terminé — guard animation initiale (AC6)
  useEffect(() => {
    isInitialRender.current = false
  }, [])

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
          flexShrink    : 0,
          display       : 'flex',
          flexDirection : 'column',
          height        : '100vh',
          boxShadow     : shadows.sm,
          // Story 51.7 — animation smooth largeur (AC1, AC8)
          transition    : 'width 0.28s ease',
          overflow      : 'hidden',
          ...(isMobile ? {
            position  : 'fixed',
            top       : 0,
            left      : mobileOpen ? 0 : -sidebarWidth,
            transition: `left ${transitions.normal}`,
            zIndex    : 50,
            boxShadow : mobileOpen ? shadows.lg : 'none',
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
          style={{ flexShrink: 0 } as never}
        >
          <XStack alignItems="center" justifyContent="space-between">
            {/* Story 51.7 — AUREAK label avec opacity animée (AC2, AC3) */}
            <YStack
              style={{
                opacity   : labelsVisible ? 1 : 0,
                transition: 'opacity 0.1s ease',
                overflow  : 'hidden',
                flexShrink: 1,
              } as never}
            >
              <Text fontFamily="$heading" fontSize={22} fontWeight="800" color={colors.accent.gold} letterSpacing={4}>
                AUREAK
              </Text>
              <Text fontFamily="$body" fontSize={10} color={colors.text.secondary} letterSpacing={1.8} marginTop={2} style={{ textTransform: 'uppercase' as never }}>
                Administration
              </Text>
            </YStack>

            {/* Story 51.7 — bouton toggle avec rotation animée (AC7) */}
            <Pressable
              onPress={toggleSidebar}
              style={{
                padding     : 4,
                borderRadius: 4,
                marginLeft  : sidebarCollapsed ? 'auto' : 0,
                flexShrink  : 0,
              } as never}
            >
              <Animated.View style={{ transform: [{ rotate: rotateInterp }] }}>
                <Text fontSize={12} color={colors.text.secondary}>‹</Text>
              </Animated.View>
            </Pressable>
          </XStack>
        </YStack>

        {/* ── Global search — masqué en collapsed (opacity animée) ── */}
        <YStack
          style={{
            opacity   : labelsVisible ? 1 : 0,
            transition: 'opacity 0.1s ease',
            overflow  : 'hidden',
            maxHeight : labelsVisible ? 200 : 0,
          } as never}
        >
          <GlobalSearch />
        </YStack>

        {/* ── Notification badge — masqué en collapsed (opacity animée) ── */}
        <YStack
          style={{
            opacity   : labelsVisible ? 1 : 0,
            transition: 'opacity 0.1s ease',
            overflow  : 'hidden',
            maxHeight : labelsVisible ? 80 : 0,
          } as never}
        >
          <NotificationBadge />
        </YStack>

        {/* ── Nav groups — seule zone scrollable ── */}
        <YStack flex={1} paddingTop={8} style={{ overflowY: 'auto', minHeight: 0 } as never}>
          {NAV_GROUPS.map((group, gi) => (
            <YStack key={group.label} marginBottom={4}>
              {/* Story 51.7 — label groupe avec opacity animée (AC2, AC3) */}
              <YStack
                style={{
                  opacity   : labelsVisible ? 1 : 0,
                  transition: 'opacity 0.1s ease',
                  overflow  : 'hidden',
                  maxHeight : labelsVisible ? 40 : 0,
                } as never}
              >
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
              </YStack>

              <YStack gap={1} paddingHorizontal={8}>
                {group.items.map(({ label, href, Icon }) => {
                  // Exact match OR prefix match — avoid short paths like '/' matching everything
                  const isActive = pathname === href || (href.length > 1 && pathname.startsWith(href + '/'))
                  const isHovered = hoveredHref === href
                  return (
                    // Story 51.7 — NavTooltip wrappant chaque item (AC4, AC5)
                    <NavTooltip
                      key={href}
                      label={label}
                      visible={sidebarCollapsed && isHovered}
                    >
                      {/* Story 51.7 — HoverablePressable pour onMouseEnter/Leave (AC4) */}
                      <HoverablePressable
                        onPress={() => router.push(href as never)}
                        onMouseEnter={() => setHoveredHref(href)}
                        onMouseLeave={() => setHoveredHref(null)}
                      >
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
                                {/* Story 51.7 — label nav avec opacity animée (AC2, AC3) */}
                                <Text
                                  fontFamily="$body"
                                  fontSize={13}
                                  fontWeight={isActive ? '700' : '400'}
                                  color={isActive ? colors.accent.gold : colors.text.secondary}
                                  style={
                                    isActive
                                      ? { letterSpacing: 0.1, flex: 1, opacity: labelsVisible ? 1 : 0, transition: 'opacity 0.1s ease' } as never
                                      : { flex: 1, opacity: labelsVisible ? 1 : 0, transition: 'opacity 0.1s ease' } as never
                                  }
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
                                    style={{
                                      marginLeft: 4,
                                      flexShrink: 0,
                                      opacity   : labelsVisible ? 1 : 0,
                                      transition: 'opacity 0.1s ease',
                                    } as never}
                                  >
                                    {ITEM_SHORTCUTS[href]}
                                  </Text>
                                )}
                              </XStack>
                            )}
                          </YStack>
                        )}
                      </HoverablePressable>
                    </NavTooltip>
                  )
                })}
              </YStack>

              {gi < NAV_GROUPS.length - 1 && (
                <Separator
                  borderColor={colors.border.dark}
                  marginTop={10}
                  marginHorizontal={20}
                  style={{
                    opacity   : labelsVisible ? 0.4 : 0,
                    transition: 'opacity 0.1s ease',
                  } as never}
                />
              )}
            </YStack>
          ))}
        </YStack>

        {/* ── Admin info + sign out ── */}
        <YStack paddingHorizontal={12} paddingTop={8} style={{ flexShrink: 0 } as never}>
          <Separator borderColor={colors.border.dark} opacity={0.4} marginBottom={10} />

          {/* Admin user pill — masqué en collapsed avec opacity animée */}
          {user && (
            <YStack
              style={{
                opacity   : labelsVisible ? 1 : 0,
                transition: 'opacity 0.1s ease',
                overflow  : 'hidden',
                maxHeight : labelsVisible ? 80 : 0,
              } as never}
            >
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
            </YStack>
          )}

          {/* ── Story 51.8 — Toggle thème (soleil / lune) ── */}
          <Pressable onPress={toggleTheme}>
            {({ pressed }) => (
              <YStack
                paddingVertical={7}
                paddingHorizontal={12}
                borderRadius={radius.xs}
                marginBottom={2}
                backgroundColor={pressed ? 'rgba(255,255,255,0.08)' : 'transparent'}
                style={{ transition: `background-color ${transitions.fast}` } as never}
              >
                {sidebarCollapsed ? (
                  /* Collapsed : icône seule, centrée */
                  <YStack alignItems="center" justifyContent="center">
                    {theme === 'light'
                      ? <MoonIcon color={colors.text.secondary} size={16} strokeWidth={1.5} />
                      : <SunIcon  color={colors.text.secondary} size={16} strokeWidth={1.5} />
                    }
                  </YStack>
                ) : (
                  /* Expanded : icône + label */
                  <XStack alignItems="center" gap={8}>
                    {theme === 'light'
                      ? <MoonIcon color={colors.text.secondary} size={16} strokeWidth={1.5} />
                      : <SunIcon  color={colors.text.secondary} size={16} strokeWidth={1.5} />
                    }
                    <Text
                      fontFamily="$body"
                      fontSize={13}
                      color={colors.text.secondary}
                      style={{
                        opacity   : labelsVisible ? 1 : 0,
                        transition: 'opacity 0.1s ease',
                      } as never}
                    >
                      {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
                    </Text>
                  </XStack>
                )}
              </YStack>
            )}
          </Pressable>

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

      {/* ── Main content area — theme-aware background (Story 51.8) ── */}
      <YStack
        flex={1}
        style={{
          backgroundColor: themeColors.bg,
          overflowY      : 'auto',
          transition     : 'background-color 0.2s ease',
        } as never}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <XStack
            data-topbar="true"
            height={52}
            borderBottomWidth={1}
            alignItems="center"
            paddingHorizontal={16}
            gap={12}
            style={{
              backgroundColor: themeColors.surface,
              borderBottomColor: themeColors.divider,
              flexShrink  : 0,
              transition  : 'background-color 0.2s ease, border-color 0.2s ease',
            } as never}
          >
            <Pressable onPress={() => setMobileOpen(v => !v)}>
              {({ pressed }) => (
                <YStack
                  width={36}
                  height={36}
                  borderRadius={7}
                  borderWidth={1}
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    backgroundColor: pressed ? themeColors.hover : themeColors.muted,
                    borderColor    : themeColors.border,
                  } as never}
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
