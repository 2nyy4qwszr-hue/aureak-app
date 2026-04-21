'use client'
// _ChildDetail.tsx — Panneau droit du layout master-detail (Story 52-12)
// Affiche la fiche joueur en mode inline via iframe (option simple)
// Ou un état vide si aucun joueur sélectionné.

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'

// ── EmptyDetailState ──────────────────────────────────────────────────────────

export function EmptyDetailState() {
  return (
    <View style={ed.container}>
      <AureakText style={ed.icon as never}>←</AureakText>
      <AureakText style={ed.text as never}>Sélectionnez un joueur dans la liste</AureakText>
    </View>
  )
}

const ed = StyleSheet.create({
  container: {
    flex          : 1,
    alignItems    : 'center',
    justifyContent: 'center',
    gap           : space.sm,
    padding       : space.xl,
  },
  icon: {
    fontSize : 32,
    color    : colors.text.subtle,
  },
  text: {
    fontSize : 14,
    color    : colors.text.subtle,
    textAlign: 'center' as never,
  },
})

// ── ChildDetailInline — iframe web ────────────────────────────────────────────

export function ChildDetailInline({ childId }: { childId: string }) {
  return (
    <View style={di.container}>
      {/* iframe — réutilise exactement la page existante sans refactoring (option simple, Story 52-12 T5) */}
      <iframe
        src={`/children/${childId}`}
        style={{
          width     : '100%',
          height    : '100%',
          border    : 'none',
          display   : 'block',
        } as React.CSSProperties}
        title="Fiche joueur"
      />
    </View>
  )
}

const di = StyleSheet.create({
  container: {
    flex: 1,
  },
})
