'use client'
// Story 93.7 — AdminTopbar : breadcrumbs + icon-btn (notif/settings) + actions CTA (desktop)
// Story 100.3 — Variants mobile (< 640) et tablette (640-1024). Breakpoints alignés sur
// la grille responsive admin mobile-first.
import React, { useState } from 'react'
import { Modal, Pressable, StyleSheet, useWindowDimensions, View, type TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { useAuthStore } from '@aureak/business-logic'
import { getBreadcrumbs, getTopbarActions, type TopbarAction } from '../../lib/admin/topbar-config'
import { useSidebar } from '../../contexts/admin/SidebarContext'
import { GlobalSearch } from '../GlobalSearch'

const MOBILE_MAX     = 640
const TABLET_MAX     = 1024

export type AdminTopbarProps = {
  /** Override breadcrumbs auto-détectés (rare) */
  breadcrumbs?  : string[]
  /** Override actions auto-détectées (rare) */
  actions?      : TopbarAction[]
  /** Affiche dot doré sur l'icône notification */
  showNotifDot? : boolean
}

const HUB_PREFIXES = ['/activites', '/methodologie', '/academie'] as const

function isHubPath(pathname: string) {
  return HUB_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export function AdminTopbar({
  breadcrumbs,
  actions,
  showNotifDot = true,
}: AdminTopbarProps = {}) {
  const router   = useRouter()
  const pathname = usePathname()
  const { width } = useWindowDimensions()

  // Variants — décidés par breakpoint
  if (width < MOBILE_MAX)  return <MobileTopbar />
  if (width < TABLET_MAX)  return <TabletTopbar />

  // Desktop : comportement historique — uniquement sur hubs alignés template (93.7)
  if (!isHubPath(pathname)) return null

  return <DesktopTopbar breadcrumbs={breadcrumbs} actions={actions} showNotifDot={showNotifDot} router={router} pathname={pathname} />
}

export default AdminTopbar

// ─────────────────────────────────────────────────────────────────────────────
// Mobile variant (< 640px) — burger + logo + search + avatar
// ─────────────────────────────────────────────────────────────────────────────

function MobileTopbar() {
  const sidebar = useSidebar()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)

  return (
    <>
      <View style={sMobile.container}>
        {/* Burger — ouvre le drawer */}
        <Pressable
          accessibilityLabel="Ouvrir le menu"
          onPress={sidebar.open}
          style={({ pressed }) => [sMobile.iconBtn, pressed && sMobile.iconBtnPressed] as never}
        >
          <AureakText style={sMobile.burger as TextStyle}>☰</AureakText>
        </Pressable>

        {/* Logo AUREAK centré */}
        <View style={sMobile.brand}>
          <AureakText style={sMobile.brandText as TextStyle}>AUREAK</AureakText>
        </View>

        {/* Search icon */}
        <Pressable
          accessibilityLabel="Rechercher"
          onPress={() => setSearchOpen(true)}
          style={({ pressed }) => [sMobile.iconBtn, pressed && sMobile.iconBtnPressed] as never}
        >
          <AureakText style={sMobile.iconEmoji as TextStyle}>🔍</AureakText>
        </Pressable>

        {/* Avatar profil → menu */}
        <ProfileAvatar onPress={() => setMenuOpen(true)} />
      </View>

      {/* Search overlay plein écran */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Profile menu dropdown (anchor top-right) */}
      <ProfileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} anchor="mobile" />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tablet variant (640-1023px) — logo + breadcrumb compact + notif + avatar
// ─────────────────────────────────────────────────────────────────────────────

function TabletTopbar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)

  // Breadcrumb compact = dernier segment seulement
  const crumbs = getBreadcrumbs(pathname)
  const currentLabel = crumbs[crumbs.length - 1] ?? ''

  return (
    <>
      <View style={sTablet.container}>
        <AureakText style={sTablet.brandText as TextStyle}>AUREAK</AureakText>
        {currentLabel ? (
          <AureakText style={sTablet.crumbCurrent as TextStyle}>{currentLabel}</AureakText>
        ) : null}

        <View style={sTablet.actions}>
          {/* Search */}
          <Pressable
            accessibilityLabel="Rechercher"
            onPress={() => setSearchOpen(true)}
            style={({ pressed }) => [sTablet.iconBtn, pressed && sTablet.iconBtnPressed] as never}
          >
            <AureakText style={sTablet.iconEmoji as TextStyle}>🔍</AureakText>
          </Pressable>

          {/* Notification */}
          <Pressable
            accessibilityLabel="Notifications"
            style={({ pressed }) => [sTablet.iconBtn, pressed && sTablet.iconBtnPressed] as never}
          >
            <AureakText style={sTablet.iconEmoji as TextStyle}>🔔</AureakText>
            <View style={sTablet.notifDot} />
          </Pressable>

          <ProfileAvatar onPress={() => setMenuOpen(true)} />
        </View>
      </View>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <ProfileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} anchor="tablet" />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop variant (≥ 1024px) — comportement actuel (backward compat)
// ─────────────────────────────────────────────────────────────────────────────

type DesktopTopbarProps = {
  breadcrumbs?  : string[]
  actions?      : TopbarAction[]
  showNotifDot  : boolean
  router        : ReturnType<typeof useRouter>
  pathname      : string
}

function DesktopTopbar({ breadcrumbs, actions, showNotifDot, router, pathname }: DesktopTopbarProps) {
  const crumbs     = breadcrumbs ?? getBreadcrumbs(pathname)
  const topActions = actions     ?? getTopbarActions(pathname, (href) => router.push(href as never))

  return (
    <View style={s.container}>
      {/* Breadcrumbs */}
      <View style={s.breadcrumbs}>
        {crumbs.map((segment, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <View key={i} style={s.crumbRow}>
              <AureakText
                style={(isLast ? s.crumbCurrent : s.crumbStep) as TextStyle}
              >
                {segment}
              </AureakText>
              {!isLast && (
                <AureakText style={s.crumbSep as TextStyle}>/</AureakText>
              )}
            </View>
          )
        })}
      </View>

      {/* Actions à droite (icon-btn + boutons CTA) */}
      <View style={s.actionsRow}>
        <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.iconBtnPressed] as never}>
          <AureakText style={s.iconBtnEmoji as TextStyle}>🔔</AureakText>
          {showNotifDot && <View style={s.notifDot} />}
        </Pressable>

        <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.iconBtnPressed] as never}>
          <AureakText style={s.iconBtnEmoji as TextStyle}>⚙️</AureakText>
        </Pressable>

        {topActions.length > 0 && (
          <>
            <View style={s.separator} />
            {topActions.map((action, i) => {
              const isGold = action.variant === 'gold'
              return (
                <Pressable
                  key={i}
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    s.btn,
                    isGold ? s.btnGold : s.btnOutline,
                    pressed && s.btnPressed,
                  ] as never}
                >
                  <AureakText
                    style={(isGold ? s.btnGoldLabel : s.btnOutlineLabel) as TextStyle}
                  >
                    {action.label}
                  </AureakText>
                </Pressable>
              )
            })}
          </>
        )}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile avatar + menu
// ─────────────────────────────────────────────────────────────────────────────

function ProfileAvatar({ onPress }: { onPress: () => void }) {
  const { user } = useAuthStore()
  const initial = (user?.email ?? 'A').charAt(0).toUpperCase()
  return (
    <Pressable
      accessibilityLabel="Mon profil"
      onPress={onPress}
      style={({ pressed }) => [sAvatar.avatar, pressed && sAvatar.avatarPressed] as never}
    >
      <AureakText style={sAvatar.initial as TextStyle}>{initial}</AureakText>
    </Pressable>
  )
}

type ProfileMenuProps = {
  isOpen: boolean
  onClose: () => void
  anchor: 'mobile' | 'tablet'
}

function ProfileMenu({ isOpen, onClose, anchor }: ProfileMenuProps) {
  const router = useRouter()
  const { signOut } = useAuthStore()
  const [signingOut, setSigningOut] = useState(false)

  if (!isOpen) return null

  const handleProfile = () => {
    router.push('/administration/utilisateurs/profile' as never)
    onClose()
  }
  const handleAdministration = () => {
    router.push('/administration' as never)
    onClose()
  }
  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/(auth)/login' as never)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[AdminTopbar] signOut error:', err)
    } finally {
      setSigningOut(false)
      onClose()
    }
  }

  // Position du menu : ancré à droite sous la topbar
  const topOffset = anchor === 'mobile' ? 56 : 64

  return (
    <Modal transparent visible={isOpen} onRequestClose={onClose} animationType="fade">
      {/* Backdrop transparent pour fermer au clic extérieur */}
      <Pressable style={sMenu.backdrop} onPress={onClose} />
      <View style={[sMenu.menu, { top: topOffset }] as never}>
        <Pressable
          accessibilityLabel="Mon profil"
          onPress={handleProfile}
          style={({ pressed }) => [sMenu.item, pressed && sMenu.itemPressed] as never}
        >
          <AureakText style={sMenu.itemLabel as TextStyle}>Mon profil</AureakText>
        </Pressable>
        <Pressable
          accessibilityLabel="Administration"
          onPress={handleAdministration}
          style={({ pressed }) => [sMenu.item, pressed && sMenu.itemPressed] as never}
        >
          <AureakText style={sMenu.itemLabel as TextStyle}>Administration</AureakText>
        </Pressable>
        <View style={sMenu.separator} />
        <Pressable
          accessibilityLabel="Déconnexion"
          disabled={signingOut}
          onPress={handleSignOut}
          style={({ pressed }) => [sMenu.item, pressed && sMenu.itemPressed] as never}
        >
          <AureakText style={sMenu.itemLabelDanger as TextStyle}>
            {signingOut ? 'Déconnexion…' : 'Déconnexion'}
          </AureakText>
        </Pressable>
      </View>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Search overlay plein écran
// ─────────────────────────────────────────────────────────────────────────────

function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  return (
    <Modal transparent visible={isOpen} onRequestClose={onClose} animationType="fade">
      <View style={sSearch.overlay}>
        <View style={sSearch.header}>
          <Pressable
            accessibilityLabel="Fermer la recherche"
            onPress={onClose}
            style={({ pressed }) => [sSearch.closeBtn, pressed && sSearch.closeBtnPressed] as never}
          >
            <AureakText style={sSearch.closeEmoji as TextStyle}>✕</AureakText>
          </Pressable>
        </View>
        <View style={sSearch.body}>
          <GlobalSearch />
        </View>
      </View>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 16,
    paddingHorizontal: 36,
    paddingVertical  : 16,
    backgroundColor  : colors.overlay.lightTopbar,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 8,
  },
  crumbRow: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 8,
  },
  crumbStep: {
    fontFamily   : fonts.body,
    fontSize     : 12,
    fontWeight   : '500',
    letterSpacing: 0.24,
    color        : colors.text.muted,
  },
  crumbCurrent: {
    fontFamily   : fonts.body,
    fontSize     : 12,
    fontWeight   : '600',
    letterSpacing: 0.24,
    color        : colors.text.dark,
  },
  crumbSep: {
    fontFamily: fonts.body,
    fontSize  : 12,
    color     : colors.text.faint,
  },
  actionsRow: {
    marginLeft   : 'auto',
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 8,
  },
  iconBtn: {
    width         : 36,
    height        : 36,
    borderRadius  : 10,
    alignItems    : 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth   : 1,
    borderColor   : 'transparent',
    position      : 'relative',
  },
  iconBtnPressed: {
    backgroundColor: colors.light.muted,
  },
  iconBtnEmoji: {
    fontSize: 16,
    color   : colors.text.subtle,
  },
  notifDot: {
    position       : 'absolute',
    top            : 8,
    right          : 9,
    width          : 7,
    height         : 7,
    borderRadius   : 999,
    backgroundColor: colors.accent.gold,
    borderWidth    : 2,
    borderColor    : colors.light.surface,
  },
  separator: {
    width           : 1,
    height          : 24,
    backgroundColor : colors.border.divider,
    marginHorizontal: 6,
  },
  btn: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 8,
    paddingHorizontal: 18,
    paddingVertical  : 10,
    borderRadius     : 999,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnOutline: {
    borderWidth    : 1,
    borderColor    : colors.text.faint,
    backgroundColor: colors.light.surface,
  },
  btnOutlineLabel: {
    color     : colors.text.dark,
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
  },
  btnGold: {
    backgroundColor: colors.accent.gold,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — boxShadow web-only
    boxShadow      : '0 4px 16px rgba(193,172,92,0.30)',
  },
  btnGoldLabel: {
    color     : colors.text.onGold,
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
  },
})

const sMobile = StyleSheet.create({
  container: {
    flexDirection    : 'row',
    alignItems       : 'center',
    height           : 56,
    paddingHorizontal: 12,
    gap              : 8,
    backgroundColor  : colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  iconBtn: {
    width         : 40,
    height        : 40,
    borderRadius  : 8,
    alignItems    : 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBtnPressed: {
    backgroundColor: colors.light.muted,
  },
  burger: {
    fontSize: 22,
    color   : colors.text.dark,
    lineHeight: 22,
  },
  iconEmoji: {
    fontSize: 18,
    color   : colors.text.subtle,
  },
  brand: {
    flex         : 1,
    alignItems   : 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily   : fonts.heading,
    fontSize     : 16,
    fontWeight   : '800',
    letterSpacing: 3,
    color        : colors.accent.gold,
  },
})

const sTablet = StyleSheet.create({
  container: {
    flexDirection    : 'row',
    alignItems       : 'center',
    height           : 64,
    paddingHorizontal: 20,
    gap              : 16,
    backgroundColor  : colors.overlay.lightTopbar,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  brandText: {
    fontFamily   : fonts.heading,
    fontSize     : 16,
    fontWeight   : '800',
    letterSpacing: 3,
    color        : colors.accent.gold,
    marginRight  : 4,
  },
  crumbCurrent: {
    fontFamily   : fonts.body,
    fontSize     : 13,
    fontWeight   : '600',
    color        : colors.text.dark,
  },
  actions: {
    marginLeft   : 'auto',
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 8,
  },
  iconBtn: {
    width         : 40,
    height        : 40,
    borderRadius  : 8,
    alignItems    : 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position      : 'relative',
  },
  iconBtnPressed: {
    backgroundColor: colors.light.muted,
  },
  iconEmoji: {
    fontSize: 18,
    color   : colors.text.subtle,
  },
  notifDot: {
    position       : 'absolute',
    top            : 10,
    right          : 10,
    width          : 7,
    height         : 7,
    borderRadius   : 999,
    backgroundColor: colors.accent.gold,
    borderWidth    : 2,
    borderColor    : colors.light.surface,
  },
})

const sAvatar = StyleSheet.create({
  avatar: {
    width         : 36,
    height        : 36,
    borderRadius  : 18,
    backgroundColor: colors.accent.gold,
    alignItems    : 'center',
    justifyContent: 'center',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — ring web-only
    boxShadow     : '0 0 0 2px rgba(193,172,92,0.25)',
  },
  avatarPressed: {
    opacity: 0.85,
  },
  initial: {
    fontFamily: fonts.heading,
    fontSize  : 14,
    fontWeight: '800',
    color     : colors.text.onGold,
  },
})

const sMenu = StyleSheet.create({
  backdrop: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — position fixed web-only
    position: 'fixed',
    top     : 0,
    left    : 0,
    right   : 0,
    bottom  : 0,
  },
  menu: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — position fixed web-only
    position        : 'fixed',
    right           : 12,
    minWidth        : 200,
    backgroundColor : colors.light.surface,
    borderRadius    : 10,
    borderWidth     : 1,
    borderColor     : colors.border.divider,
    paddingVertical : 6,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — boxShadow web-only
    boxShadow       : '0 10px 32px rgba(0,0,0,0.16)',
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical  : 10,
  },
  itemPressed: {
    backgroundColor: colors.light.muted,
  },
  itemLabel: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '500',
    color     : colors.text.dark,
  },
  itemLabelDanger: {
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '500',
    color     : colors.accent.red,
  },
  separator: {
    height          : 1,
    backgroundColor : colors.border.divider,
    marginVertical  : 4,
    marginHorizontal: 8,
  },
})

const sSearch = StyleSheet.create({
  overlay: {
    flex           : 1,
    backgroundColor: colors.overlay.modal,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — backdrop web-only
    backdropFilter : 'blur(4px)',
  },
  header: {
    flexDirection    : 'row',
    justifyContent   : 'flex-end',
    paddingHorizontal: 16,
    paddingTop       : 16,
    paddingBottom    : 8,
  },
  closeBtn: {
    width         : 40,
    height        : 40,
    borderRadius  : 20,
    alignItems    : 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.surface,
  },
  closeBtnPressed: {
    backgroundColor: colors.light.muted,
  },
  closeEmoji: {
    fontSize: 18,
    color   : colors.text.dark,
  },
  body: {
    marginHorizontal: space.md,
    padding         : space.md,
    borderRadius    : 12,
    backgroundColor : colors.background.elevated,
  },
})
