'use client'
// Story 93.7 — AdminTopbar : breadcrumbs + icon-btn (notif/settings) + actions CTA
// Source : /tmp/aureak-template/shell.jsx Topbar + admin.css lignes 258-350.
// Masquée sur mobile (<768px). Tokens @aureak/theme uniquement.
import React from 'react'
import { View, Pressable, StyleSheet, useWindowDimensions, type TextStyle } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space } from '@aureak/theme'
import { getBreadcrumbs, getTopbarActions, type TopbarAction } from './topbar-config'

const MOBILE_BREAKPOINT = 768

export type AdminTopbarProps = {
  /** Override breadcrumbs auto-détectés (rare) */
  breadcrumbs?  : string[]
  /** Override actions auto-détectées (rare) */
  actions?      : TopbarAction[]
  /** Affiche dot doré sur l'icône notification */
  showNotifDot? : boolean
}

export function AdminTopbar({
  breadcrumbs,
  actions,
  showNotifDot = true,
}: AdminTopbarProps = {}) {
  const router   = useRouter()
  const pathname = usePathname()
  const { width } = useWindowDimensions()

  // Story 93.7 AC12 — Topbar masquée sur mobile (la NavBar header de chaque page reprend le bouton)
  if (width < MOBILE_BREAKPOINT) return null

  const crumbs   = breadcrumbs ?? getBreadcrumbs(pathname)
  const topActions = actions ?? getTopbarActions(pathname, (href) => router.push(href as never))

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
        {/* Icon-btn notification */}
        <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.iconBtnPressed] as never}>
          <AureakText style={s.iconBtnEmoji as TextStyle}>🔔</AureakText>
          {showNotifDot && <View style={s.notifDot} />}
        </Pressable>

        {/* Icon-btn settings */}
        <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.iconBtnPressed] as never}>
          <AureakText style={s.iconBtnEmoji as TextStyle}>⚙️</AureakText>
        </Pressable>

        {topActions.length > 0 && (
          <>
            {/* Séparateur vertical */}
            <View style={s.separator} />

            {/* Boutons CTA (Exporter outline + Nouvelle séance gold) */}
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

export default AdminTopbar

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
    // sticky positioning géré par le parent ScrollView en RN — ici l'effet visuel est conservé
    // via le z-index implicite du flux render.
  },

  // Breadcrumbs
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
    letterSpacing: 0.24, // template-spec 0.02em sur 12px
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

  // Actions à droite
  actionsRow: {
    marginLeft   : 'auto',
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : 8,
  },

  // Icon-btn (notification, settings)
  iconBtn: {
    width        : 36,
    height       : 36,
    borderRadius : 10,
    alignItems   : 'center',
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

  // Séparateur vertical entre icon-btn et CTA
  separator: {
    width          : 1,
    height         : 24,
    backgroundColor: colors.border.divider,
    marginHorizontal: 6,
  },

  // Boutons CTA pill
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
    borderColor    : colors.text.faint, // zinc-300 template
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
    // @ts-ignore — boxShadow web-only (template gold CTA shadow)
    boxShadow      : '0 4px 16px rgba(193,172,92,0.30)',
  },
  btnGoldLabel: {
    color     : colors.text.onGold,
    fontFamily: fonts.body,
    fontSize  : 13,
    fontWeight: '600',
  },
})
