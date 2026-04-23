'use client'
// Story 102.1 — <FormLayout /> — wrapper formulaire responsive
//
// Desktop (≥1024) : max-width 720px centré + actions inline en bas (row à droite).
// Mobile   (<640) : single-column full-width + actions sticky bottom (fond surface
//                   + borderTop) au-dessus du clavier (KeyboardAvoidingView).
// Tablette (640-1024) : fallback desktop (même layout centré).
//
// Le composant ne connaît pas React Hook Form : les enfants (Input, Select, etc.)
// sont libres. La logique try/finally dans onSubmit est de la responsabilité
// du consommateur — FormLayout se contente d'appeler onSubmit().
//
// Alignement conventions :
// - Breakpoints : MOBILE_MAX=640, DESKTOP_MIN=1024 (DataCard / FilterSheet / AdminPageHeader).
// - Pas de console (aucun flow async ici).

import React from 'react'
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native'
import { AureakButton } from '@aureak/ui'
import { colors, space, layout } from '@aureak/theme'

const MOBILE_MAX = 640

// Padding-bottom du scroll pour ne pas masquer le dernier field derrière les
// actions sticky (hauteur actions ≈ 56 + safe area ≈ 24).
const MOBILE_CONTENT_PADDING_BOTTOM = 96

// Hauteur minimum zone actions sticky — cohérent Button minHeight 44 + padding.
const STICKY_ACTIONS_HEIGHT = 72

export type FormLayoutVariant = 'auto' | 'single-col' | 'two-col'

export type FormLayoutProps = {
  children      : React.ReactNode
  onSubmit      : () => void
  onCancel?     : () => void
  submitLabel?  : string
  cancelLabel?  : string
  submitting?   : boolean
  submitDisabled?: boolean
  /** 'auto' = breakpoint (default). 'single-col' = mobile layout force. 'two-col' = desktop layout force. */
  layout?       : FormLayoutVariant
}

export function FormLayout({
  children,
  onSubmit,
  onCancel,
  submitLabel    = 'Enregistrer',
  cancelLabel    = 'Annuler',
  submitting     = false,
  submitDisabled = false,
  layout: layoutProp = 'auto',
}: FormLayoutProps) {
  const { width } = useWindowDimensions()

  const isMobile =
    layoutProp === 'single-col' ||
    (layoutProp === 'auto' && width < MOBILE_MAX)

  if (isMobile) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={styles.fill}
      >
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.mobileScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mobileColumn}>{children}</View>
        </ScrollView>
        <View style={styles.stickyActions} accessibilityRole="toolbar">
          {onCancel && (
            <View style={styles.actionButton}>
              <AureakButton
                label={cancelLabel}
                onPress={onCancel}
                variant="ghost"
                fullWidth
              />
            </View>
          )}
          <View style={styles.actionButton}>
            <AureakButton
              label={submitLabel}
              onPress={onSubmit}
              variant="primary"
              disabled={submitDisabled}
              loading={submitting}
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.desktopScrollContent}>
      <View style={styles.desktopContainer}>
        <View style={styles.desktopColumn}>{children}</View>
        <View style={styles.inlineActions} accessibilityRole="toolbar">
          {onCancel && (
            <AureakButton
              label={cancelLabel}
              onPress={onCancel}
              variant="ghost"
            />
          )}
          <AureakButton
            label={submitLabel}
            onPress={onSubmit}
            variant="primary"
            disabled={submitDisabled}
            loading={submitting}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const FORM_MAX_WIDTH = 720

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  mobileScrollContent: {
    paddingHorizontal: layout.contentPaddingX.mobile,
    paddingTop       : space.md,
    paddingBottom    : MOBILE_CONTENT_PADDING_BOTTOM,
  } as ViewStyle,
  mobileColumn: {
    gap: space.md,
  },
  stickyActions: {
    position       : 'absolute',
    left           : 0,
    right          : 0,
    bottom         : 0,
    minHeight      : STICKY_ACTIONS_HEIGHT,
    flexDirection  : 'row',
    gap            : space.sm,
    paddingHorizontal: layout.contentPaddingX.mobile,
    paddingVertical  : space.sm,
    paddingBottom    : space.md,
    backgroundColor: colors.light.surface,
    borderTopWidth : 1,
    borderTopColor : colors.border.divider,
  } as ViewStyle,
  actionButton: {
    flex: 1,
  },
  desktopScrollContent: {
    paddingVertical  : space.lg,
    paddingHorizontal: layout.contentPaddingX.desktop,
  } as ViewStyle,
  desktopContainer: {
    width    : '100%',
    maxWidth : FORM_MAX_WIDTH,
    alignSelf: 'center',
    gap      : space.lg,
  },
  desktopColumn: {
    gap: space.md,
  },
  inlineActions: {
    flexDirection : 'row',
    justifyContent: 'flex-end',
    gap           : space.sm,
    paddingTop    : space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.divider,
  } as ViewStyle,
})
