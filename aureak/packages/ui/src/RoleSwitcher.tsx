// Story 86.2 — RoleSwitcher : composant de switch de rôle dans la sidebar
// Visible uniquement quand l'utilisateur a plus d'un rôle (AC2)
// Le switch change le rôle actif sans recharger la page (AC3)

import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import type { UserRole } from '@aureak/types'
import type { UserRoleAssignment } from '@aureak/types'
import { colors, radius } from '@aureak/theme'

// ── Labels lisibles pour chaque rôle ────────────────────────────────────────
const ROLE_LABELS: Record<UserRole, string> = {
  admin      : 'Admin',
  coach      : 'Coach',
  parent     : 'Parent',
  child      : 'Joueur',
  club       : 'Club',
  commercial : 'Commercial',
  manager    : 'Manager',
  marketeur  : 'Marketeur',
}

// ── Emoji rapide par rôle (sidebar collapsed) ──────────────────────────────
const ROLE_ICONS: Record<UserRole, string> = {
  admin      : '🛡',
  coach      : '⚽',
  parent     : '👤',
  child      : '🧤',
  club       : '🏟',
  commercial : '📊',
  manager    : '📋',
  marketeur  : '📢',
}

export type RoleSwitcherProps = {
  currentRole    : UserRole
  availableRoles : UserRoleAssignment[]
  onSwitch       : (role: UserRole) => void
  collapsed?     : boolean
}

export function RoleSwitcher({ currentRole, availableRoles, onSwitch, collapsed = false }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false)

  // AC2 : masqué si un seul rôle ou aucun
  if (availableRoles.length <= 1) return null

  const currentLabel = ROLE_LABELS[currentRole] ?? currentRole
  const currentIcon  = ROLE_ICONS[currentRole]  ?? '👤'

  return (
    <View style={s.container}>
      {/* Trigger button */}
      <Pressable
        onPress={() => setOpen(v => !v)}
        style={({ pressed }: { pressed: boolean }) => [
          s.trigger,
          collapsed && s.triggerCollapsed,
          pressed && s.triggerPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Rôle actif : ${currentLabel}. Cliquer pour changer.`}
      >
        {collapsed ? (
          <View style={s.iconOnly}>
            <View style={s.roleIcon}>
              <RNText style={s.roleIconText}>{currentIcon}</RNText>
            </View>
            <View style={s.switchIndicator}>
              <RNText style={s.switchIndicatorText}>{open ? '▲' : '▼'}</RNText>
            </View>
          </View>
        ) : (
          <View style={s.triggerContent}>
            <View style={s.rolePill}>
              <RNText style={s.rolePillIcon}>{currentIcon}</RNText>
              <RNText style={s.rolePillLabel}>{currentLabel}</RNText>
            </View>
            <RNText style={s.chevron}>{open ? '▲' : '▼'}</RNText>
          </View>
        )}
      </Pressable>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Overlay pour fermer au clic extérieur */}
          <Pressable
            onPress={() => setOpen(false)}
            style={s.overlay}
          />
          <View style={[s.dropdown, collapsed && s.dropdownCollapsed]}>
            <RNText style={s.dropdownTitle}>Changer de rôle</RNText>
            {availableRoles.map((ra) => {
              const isActive = ra.role === currentRole
              return (
                <Pressable
                  key={ra.id}
                  onPress={() => {
                    if (!isActive) onSwitch(ra.role)
                    setOpen(false)
                  }}
                  style={({ pressed }: { pressed: boolean }) => [
                    s.dropdownItem,
                    isActive && s.dropdownItemActive,
                    pressed && s.dropdownItemPressed,
                  ]}
                >
                  <RNText style={s.dropdownItemIcon}>{ROLE_ICONS[ra.role] ?? '👤'}</RNText>
                  <RNText style={[s.dropdownItemLabel, isActive && s.dropdownItemLabelActive]}>
                    {ROLE_LABELS[ra.role] ?? ra.role}
                  </RNText>
                  {isActive && <RNText style={s.checkmark}>✓</RNText>}
                </Pressable>
              )
            })}
          </View>
        </>
      )}
    </View>
  )
}

// ── React Native Text (plain, pas Tamagui) ─────────────────────────────────
// On utilise le RN Text de base car @aureak/ui Text est Tamagui
import { Text as RNText } from 'react-native'

const s = StyleSheet.create({
  container: {
    position: 'relative' as const,
    marginBottom: 4,
  },
  trigger: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border.dark,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  triggerCollapsed: {
    paddingHorizontal: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  triggerPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  triggerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  rolePill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  rolePillIcon: {
    fontSize: 14,
  },
  rolePillLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.accent.gold,
    letterSpacing: 0.3,
  },
  chevron: {
    fontSize: 8,
    color: colors.text.secondary,
  },
  iconOnly: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
  },
  roleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.accent.gold}22`,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  roleIconText: {
    fontSize: 14,
  },
  switchIndicator: {
    marginTop: 1,
  },
  switchIndicatorText: {
    fontSize: 6,
    color: colors.text.subtle,
  },
  overlay: {
    position: 'fixed' as never,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 98,
  },
  dropdown: {
    position: 'absolute' as const,
    bottom: '100%' as never,
    left: 0,
    right: 0,
    marginBottom: 4,
    backgroundColor: colors.background.elevated,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border.gold,
    padding: 6,
    zIndex: 100,
    minWidth: 180,
    // Web shadow
    ...(typeof window !== 'undefined' ? { boxShadow: '0 -4px 16px rgba(0,0,0,0.3)' } : {}),
  },
  dropdownCollapsed: {
    left: 52,
    bottom: 0,
    right: 'auto' as never,
    minWidth: 180,
  },
  dropdownTitle: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.text.subtle,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as never,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 2,
  },
  dropdownItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: radius.xs,
    gap: 8,
  },
  dropdownItemActive: {
    backgroundColor: `${colors.accent.gold}18`,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent.gold,
  },
  dropdownItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dropdownItemIcon: {
    fontSize: 14,
  },
  dropdownItemLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  dropdownItemLabelActive: {
    color: colors.accent.gold,
    fontWeight: '700' as const,
  },
  checkmark: {
    fontSize: 12,
    color: colors.accent.gold,
    fontWeight: '700' as const,
  },
})
