'use client'
// Story 51.6 — Overlay aide raccourcis clavier
// Touche ? → modal listant tous les chords groupés par catégorie
// Style dark card, radius 16, shadows.gold — identique CommandPalette

import React, { useEffect } from 'react'
import { Pressable, View, ScrollView } from 'react-native'
import { Text } from 'tamagui'
import { colors, shadows, radius } from '@aureak/theme'
import { CHORD_MAP } from '../hooks/useKeyboardShortcuts'

// ── Labels humains ────────────────────────────────────────────────────────────

const NAVIGATE_LABELS: Record<string, string> = {
  '/children'           : 'Joueurs',
  '/activites/seances'  : 'Séances',
  '/clubs'              : 'Clubs',
  '/presences'          : 'Présences',
  '/evaluations'        : 'Évaluations',
  '/methodologie'       : 'Méthodologie',
  '/evenements/stages'  : 'Stages',
  '/dashboard'          : 'Tableau de bord',
}

const CREATE_LABELS: Record<string, string> = {
  '/activites/seances/new' : 'Nouvelle Séance',
  '/children/new'          : 'Nouveau Joueur',
  '/clubs/new'             : 'Nouveau Club',
}

// ── KbdBadge ─────────────────────────────────────────────────────────────────

function KbdBadge({ children }: { children: string }) {
  return (
    <View
      style={{
        backgroundColor  : colors.background.elevated,
        borderWidth      : 1,
        borderColor      : colors.border.dark,
        borderRadius     : radius.xs,
        paddingHorizontal: 6,
        paddingVertical  : 2,
        minWidth         : 28,
        alignItems       : 'center',
      }}
    >
      <Text
        fontFamily="$body"
        fontSize={11}
        color={colors.text.secondary}
      >
        {children}
      </Text>
    </View>
  )
}

// ── ShortcutRow ───────────────────────────────────────────────────────────────

function ShortcutRow({ chord, label }: { chord: string; label: string }) {
  const parts = chord.split(' ')
  return (
    <View
      style={{
        flexDirection : 'row',
        alignItems    : 'center',
        paddingVertical: 6,
        gap           : 8,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 4, width: 60 }}>
        {parts.map((k, i) => (
          <KbdBadge key={i}>{k}</KbdBadge>
        ))}
      </View>
      <Text
        fontFamily="$body"
        fontSize={13}
        color={colors.text.secondary}
        style={{ flex: 1 } as never}
      >
        {label}
      </Text>
    </View>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={10}
      fontWeight="700"
      color={colors.text.subtle}
      style={{
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom : 6,
        marginTop    : 14,
      } as never}
    >
      {title}
    </Text>
  )
}

// ── Composant principal ShortcutsHelp ─────────────────────────────────────────

interface ShortcutsHelpProps {
  isOpen  : boolean
  onClose : () => void
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  // Fermeture Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Construire les lignes naviguer depuis CHORD_MAP['G']
  const navigateRows = Object.entries(CHORD_MAP['G'] ?? {}).map(([second, route]) => ({
    chord: `G ${second}`,
    label: NAVIGATE_LABELS[route] ?? route,
  }))

  // Construire les lignes créer depuis CHORD_MAP['N']
  const createRows = Object.entries(CHORD_MAP['N'] ?? {}).map(([second, route]) => ({
    chord: `N ${second}`,
    label: CREATE_LABELS[route] ?? route,
  }))

  return (
    // Backdrop — clic outside ferme (AC5)
    <Pressable
      onPress={onClose}
      style={{
        position       : 'fixed' as never,
        top            : 0,
        left           : 0,
        right          : 0,
        bottom         : 0,
        zIndex         : 110,
        backgroundColor: colors.overlay.modal,
        alignItems     : 'center',
        justifyContent : 'flex-start',
        paddingTop     : 80,
      } as never}
    >
      {/* Card — stoppe la propagation du clic */}
      <Pressable
        onPress={e => e.stopPropagation()}
        style={{
          width          : '100%',
          maxWidth       : 480,
          backgroundColor: colors.background.elevated,
          borderRadius   : 16,
          boxShadow      : shadows.gold,
          overflow       : 'hidden',
          marginHorizontal: 16,
        } as never}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical  : 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.dark,
            flexDirection    : 'row',
            alignItems       : 'center',
            justifyContent   : 'space-between',
          }}
        >
          <View>
            <Text
              fontFamily="$heading"
              fontSize={16}
              fontWeight="700"
              color={colors.accent.gold}
            >
              Raccourcis clavier
            </Text>
            <Text
              fontFamily="$body"
              fontSize={11}
              color={colors.text.subtle}
              style={{ marginTop: 2 } as never}
            >
              Disponibles en dehors des champs de saisie
            </Text>
          </View>
          <Pressable onPress={onClose}>
            <KbdBadge>esc</KbdBadge>
          </Pressable>
        </View>

        {/* Contenu scrollable */}
        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        >
          {/* Naviguer */}
          <SectionHeader title="Naviguer (G)" />
          {navigateRows.map(r => (
            <ShortcutRow key={r.chord} chord={r.chord} label={r.label} />
          ))}

          {/* Créer */}
          <SectionHeader title="Créer (N)" />
          {createRows.map(r => (
            <ShortcutRow key={r.chord} chord={r.chord} label={r.label} />
          ))}

          {/* Général */}
          <SectionHeader title="Général" />
          <ShortcutRow chord="?" label="Afficher cette aide" />
          <ShortcutRow chord="⌘ K" label="Ouvrir la command palette" />
          <ShortcutRow chord="esc" label="Fermer / Annuler" />
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical  : 10,
            borderTopWidth   : 1,
            borderTopColor   : colors.border.dark,
            backgroundColor  : colors.background.primary,
            alignItems       : 'center',
          }}
        >
          <Text fontFamily="$body" fontSize={10} color={colors.text.subtle}>
            Après G ou N — vous avez 1 seconde pour appuyer la 2ᵉ touche
          </Text>
        </View>
      </Pressable>
    </Pressable>
  )
}
