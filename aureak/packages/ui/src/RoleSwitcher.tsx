// Story 86-2 — RoleSwitcher : sélecteur "Changer de casquette"
// Composant React Native Web — utilise uniquement les tokens @aureak/theme.
// Affiche le rôle actif + dropdown des rôles disponibles.
// Si availableRoles.length <= 1, le composant retourne null (dégrade gracieusement).
// Le changement de rôle est client-only (localStorage + reload) — géré via le callback onChange.

import React, { useState } from 'react'
import { View, Pressable, Text } from 'react-native'
import { colors, space, radius, shadows, transitions } from '@aureak/theme'
import type { UserRole } from '@aureak/types'

export interface RoleSwitcherProps {
  availableRoles : UserRole[]
  activeRole     : UserRole
  onChange       : (role: UserRole) => void
}

// Labels human-readable — ordre aligné avec l'enum user_role (migrations 00002, 00055, 00147, 00148)
const ROLE_LABELS: Record<UserRole, string> = {
  admin     : 'Administrateur',
  coach     : 'Coach',
  parent    : 'Parent',
  child     : 'Joueur',
  club      : 'Club partenaire',
  commercial: 'Commercial',
  manager   : 'Manager',
  marketeur : 'Marketeur',
}

export function RoleSwitcher({ availableRoles, activeRole, onChange }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false)

  // Dégradation gracieuse : un seul rôle → pas de switcher
  if (!availableRoles || availableRoles.length <= 1) return null

  const handleSelect = (role: UserRole) => {
    setOpen(false)
    if (role !== activeRole) onChange(role)
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Bouton principal : casquette + rôle actif */}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Changer de casquette"
        style={({ pressed }) => ({
          backgroundColor  : pressed ? colors.overlay.whiteHover : colors.overlay.whiteSubtle,
          paddingVertical  : space.sm,
          paddingHorizontal: space.md,
          borderRadius     : radius.xs,
          borderWidth      : 1,
          borderColor      : colors.border.dark,
          ...({ boxShadow: shadows.sm, transition: `background-color ${transitions.fast}` } as object),
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <Text
              style={{
                color        : colors.text.subtle,
                letterSpacing: 1,
                fontSize     : 9,
                fontWeight   : '600',
                marginRight  : space.xs,
                ...({ textTransform: 'uppercase' } as object),
              }}
            >
              Casquette
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color     : colors.accent.gold,
                fontSize  : 12,
                fontWeight: '600',
                flexShrink: 1,
              }}
            >
              {ROLE_LABELS[activeRole]}
            </Text>
          </View>
          <Text
            style={{
              color     : colors.text.secondary,
              marginLeft: space.xs,
              fontSize  : 10,
              transform : [{ rotate: open ? '180deg' : '0deg' }],
            }}
          >
            ▾
          </Text>
        </View>
      </Pressable>

      {/* Dropdown — liste des rôles disponibles */}
      {open && (
        <>
          {/* Overlay pour fermer au clic extérieur */}
          <Pressable
            onPress={() => setOpen(false)}
            style={({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 } as never)}
          />
          <View
            style={{
              position       : 'absolute',
              top            : '100%',
              left           : 0,
              right          : 0,
              marginTop      : space.xs,
              backgroundColor: colors.background.surface,
              borderRadius   : radius.xs,
              borderWidth    : 1,
              borderColor    : colors.border.dark,
              zIndex         : 100,
              overflow       : 'hidden',
              ...({ boxShadow: shadows.md } as object),
            }}
          >
            {availableRoles.map((role) => {
              const isActive = role === activeRole
              return (
                <Pressable
                  key={role}
                  onPress={() => handleSelect(role)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => ({
                    paddingVertical  : space.sm,
                    paddingHorizontal: space.md,
                    backgroundColor  : isActive
                      ? `${colors.accent.gold}18`
                      : pressed
                        ? colors.overlay.whiteSubtle
                        : 'transparent',
                    ...({ transition: `background-color ${transitions.fast}` } as object),
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{
                        color       : isActive ? colors.accent.gold : 'transparent',
                        fontSize    : 12,
                        width       : 14,
                        marginRight : space.xs,
                      }}
                    >
                      ✓
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color     : isActive ? colors.accent.gold : colors.text.primary,
                        fontSize  : 12,
                        fontWeight: isActive ? '600' : '400',
                        flexShrink: 1,
                      }}
                    >
                      {ROLE_LABELS[role]}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </>
      )}
    </View>
  )
}
