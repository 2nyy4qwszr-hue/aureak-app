// Story 62.4 — HelpTooltip éducatif contextuel
// Web : popover positionné via getBoundingClientRect + cleanup event listeners
// React Native : modal simple accessible
'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Platform } from 'react-native'
import { colors, shadows, radius, space } from '@aureak/theme'

export interface HelpTooltipProps {
  content   : React.ReactNode
  title?    : string
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

// ─────────────────────────────────────────────────────────────────────────────
// Web implementation
// ─────────────────────────────────────────────────────────────────────────────

function HelpTooltipWeb({ content, title, placement = 'bottom-right' }: HelpTooltipProps) {
  const [isOpen, setIsOpen]                 = useState(false)
  const [resolvedPlacement, setResolved]    = useState(placement)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef    = useRef<HTMLButtonElement>(null)
  const popoverRef   = useRef<HTMLDivElement>(null)

  // Calcul position intelligente — ajustement si hors viewport
  const recalcPlacement = useCallback(() => {
    if (!buttonRef.current || !popoverRef.current) return
    const btnRect = buttonRef.current.getBoundingClientRect()
    const popW    = 280
    const popH    = popoverRef.current.offsetHeight || 120

    const spaceRight  = window.innerWidth  - btnRect.right
    const spaceBottom = window.innerHeight - btnRect.bottom

    const horizontal = spaceRight  >= popW  ? 'right' : 'left'
    const vertical   = spaceBottom >= popH  ? 'bottom' : 'top'
    setResolved(`${vertical}-${horizontal}` as typeof resolvedPlacement)
  }, [resolvedPlacement])

  // Fermeture clic outside — CLEANUP OBLIGATOIRE (AC3 / QA)
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler) // BLOCKER cleanup
  }, [isOpen])

  // Fermeture clavier Escape — CLEANUP OBLIGATOIRE (AC3 / QA)
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler) // BLOCKER cleanup
  }, [isOpen])

  // Recalculer placement après ouverture
  useEffect(() => {
    if (isOpen) {
      recalcPlacement()
    }
  }, [isOpen, recalcPlacement])

  // Calcul offset popover selon placement résolu
  const getPopoverStyle = (): React.CSSProperties => {
    const ARROW_OFFSET = 8
    const base: React.CSSProperties = {
      position    : 'absolute',
      zIndex      : 1000,
      maxWidth    : 280,
      minWidth    : 200,
      backgroundColor: colors.light.surface,
      border      : `1px solid ${colors.border.gold}`,
      borderRadius: radius.card,
      padding     : `${space.sm}px ${space.md}px`,
      boxShadow   : shadows.lg,
    }
    switch (resolvedPlacement) {
      case 'bottom-right': return { ...base, top: `calc(100% + ${ARROW_OFFSET}px)`, left: 0 }
      case 'bottom-left' : return { ...base, top: `calc(100% + ${ARROW_OFFSET}px)`, right: 0 }
      case 'top-right'   : return { ...base, bottom: `calc(100% + ${ARROW_OFFSET}px)`, left: 0 }
      case 'top-left'    : return { ...base, bottom: `calc(100% + ${ARROW_OFFSET}px)`, right: 0 }
    }
  }

  // Flèche CSS positionnée selon placement
  const getArrowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width   : 8,
      height  : 8,
      backgroundColor: colors.light.surface,
      border  : `1px solid ${colors.border.gold}`,
      transform: 'rotate(45deg)',
    }
    switch (resolvedPlacement) {
      case 'bottom-right': return { ...base, top: -5, left: 12, borderBottom: 'none', borderRight: 'none' }
      case 'bottom-left' : return { ...base, top: -5, right: 12, borderBottom: 'none', borderRight: 'none' }
      case 'top-right'   : return { ...base, bottom: -5, left: 12, borderTop: 'none', borderLeft: 'none' }
      case 'top-left'    : return { ...base, bottom: -5, right: 12, borderTop: 'none', borderLeft: 'none' }
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        aria-label="Aide contextuelle"
        style={{
          display        : 'inline-flex',
          alignItems     : 'center',
          justifyContent : 'center',
          width          : 18,
          height         : 18,
          borderRadius   : '50%',
          backgroundColor: isOpen ? colors.accent.goldLight : colors.light.hover,
          border         : 'none',
          cursor         : 'pointer',
          fontFamily     : 'Montserrat, sans-serif',
          fontWeight     : '600',
          fontSize       : 11,
          color          : isOpen ? colors.accent.gold : colors.text.muted,
          lineHeight     : '1',
          transition     : 'background-color 150ms ease, color 150ms ease',
          flexShrink     : 0,
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.accent.goldLight
          ;(e.currentTarget as HTMLButtonElement).style.color = colors.accent.gold
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.light.hover
            ;(e.currentTarget as HTMLButtonElement).style.color = colors.text.muted
          }
        }}
      >
        ?
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          aria-label={title ?? 'Aide'}
          style={getPopoverStyle()}
        >
          {/* Flèche */}
          <div style={getArrowStyle()} />

          {title && (
            <p style={{
              margin     : '0 0 6px',
              fontFamily : 'Montserrat, sans-serif',
              fontWeight : '700',
              fontSize   : 13,
              color      : colors.text.dark,
            }}>
              {title}
            </p>
          )}
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize  : 12,
            color     : colors.text.muted,
            lineHeight: '1.5',
          }}>
            {content}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="Fermer l'aide"
            style={{
              position       : 'absolute',
              top            : 6,
              right          : 8,
              background     : 'none',
              border         : 'none',
              cursor         : 'pointer',
              fontSize       : 14,
              color          : colors.text.muted,
              lineHeight     : '1',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// React Native fallback — bouton ? simple sans positionnement complexe
// ─────────────────────────────────────────────────────────────────────────────

function HelpTooltipNative({ content, title }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { View, Text, Pressable, Modal, TouchableWithoutFeedback } = require('react-native')

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityLabel="Aide contextuelle"
        style={{
          width          : 18,
          height         : 18,
          borderRadius   : 9,
          backgroundColor: colors.light.hover,
          alignItems     : 'center',
          justifyContent : 'center',
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text.muted }}>?</Text>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: space.xl }}>
            <TouchableWithoutFeedback>
              <View style={{
                backgroundColor: colors.light.surface,
                borderRadius   : radius.card,
                padding        : space.md,
                maxWidth       : 300,
                borderWidth    : 1,
                borderColor    : colors.border.gold,
              }}>
                {title && (
                  <Text style={{ fontWeight: '700', fontSize: 14, color: colors.text.dark, marginBottom: space.xs }}>{title}</Text>
                )}
                <Text style={{ fontSize: 13, color: colors.text.muted, lineHeight: 20 }}>{typeof content === 'string' ? content : 'Aide disponible.'}</Text>
                <Pressable
                  onPress={() => setIsOpen(false)}
                  style={{ marginTop: space.sm, alignSelf: 'flex-end' }}
                >
                  <Text style={{ color: colors.accent.gold, fontWeight: '700' }}>Fermer</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Export unifié
// ─────────────────────────────────────────────────────────────────────────────

export function HelpTooltip(props: HelpTooltipProps) {
  if (Platform.OS === 'web') return <HelpTooltipWeb {...props} />
  return <HelpTooltipNative {...props} />
}
