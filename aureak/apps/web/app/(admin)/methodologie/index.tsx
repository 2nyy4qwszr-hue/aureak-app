'use client'
// Méthodologie — hub pédagogique
// Accès aux séances pédagogiques, thèmes et situations
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  listMethodologySessions,
  listMethodologyThemes,
  listMethodologySituations,
} from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { colors, space, shadows, radius, transitions } from '@aureak/theme'

const SECTIONS = [
  {
    key        : 'seances',
    label      : 'Séances pédagogiques',
    description: 'Bibliothèque de contenus réutilisables (PDF, fiches, plans de séance)',
    href       : '/methodologie/seances',
    color      : colors.accent.gold,
    icon       : '📋',
  },
  {
    key        : 'themes',
    label      : 'Thèmes',
    description: 'Blocs de savoir : prise de balle, relance, plongeon, centres…',
    href       : '/methodologie/themes',
    color      : '#4FC3F7',
    icon       : '🎯',
  },
  {
    key        : 'situations',
    label      : 'Situations',
    description: 'Situations de jeu concrètes : 1c1, centre 2e poteau, relance pression…',
    href       : '/methodologie/situations',
    color      : '#66BB6A',
    icon       : '⚡',
  },
] as const

export default function MethodologiePage() {
  const router = useRouter()
  const [counts, setCounts] = useState({ seances: 0, themes: 0, situations: 0 })

  useEffect(() => {
    Promise.all([
      listMethodologySessions({ activeOnly: false }),
      listMethodologyThemes({ activeOnly: false }),
      listMethodologySituations({ activeOnly: false }),
    ]).then(([sessions, themes, situations]) => {
      setCounts({ seances: sessions.length, themes: themes.length, situations: situations.length })
    })
  }, [])

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Header ── */}
      <View style={s.header}>
        <AureakText variant="h2" color={colors.accent.gold}>Méthodologie</AureakText>
        <AureakText variant="caption" style={{ color: colors.text.muted, marginTop: 4, maxWidth: 500 }}>
          Contenu pédagogique réutilisable — séances, thèmes et situations. Distinct des sessions terrain opérationnelles.
        </AureakText>
      </View>

      {/* ── Distinction claire ── */}
      <View style={s.infoBox}>
        <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, lineHeight: 18 }}>
          <AureakText variant="caption" style={{ color: colors.accent.gold, fontWeight: '700' }}>Sessions terrain</AureakText>
          {'  →  séances datées, liées à un groupe, présences, évaluations\n'}
          <AureakText variant="caption" style={{ color: '#4FC3F7', fontWeight: '700' }}>Méthodologie</AureakText>
          {'  →  contenu pédagogique réutilisable, PDF, fiches de connaissance coach'}
        </AureakText>
      </View>

      {/* ── Cards ── */}
      <View style={s.grid}>
        {SECTIONS.map(section => (
          <Pressable
            key={section.key}
            style={({ pressed }) => [s.card, { borderTopColor: section.color, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push(section.href as never)}
          >
            <View style={s.cardHead}>
              <View style={[s.iconBox, { backgroundColor: section.color + '18', borderColor: section.color + '40' }]}>
                <AureakText variant="body" style={{ fontSize: 20 }}>{section.icon}</AureakText>
              </View>
              <View style={[s.countBadge, { backgroundColor: section.color + '20', borderColor: section.color + '50' }]}>
                <AureakText variant="caption" style={{ color: section.color, fontWeight: '800', fontSize: 12 }}>
                  {counts[section.key]}
                </AureakText>
              </View>
            </View>

            <AureakText variant="h3" style={{ fontSize: 16, marginTop: space.sm, marginBottom: 6 }}>
              {section.label}
            </AureakText>
            <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 12, lineHeight: 18 }}>
              {section.description}
            </AureakText>

            <View style={[s.cardCta, { borderTopColor: section.color + '30' }]}>
              <AureakText variant="caption" style={{ color: section.color, fontWeight: '700', fontSize: 11 }}>
                Voir →
              </AureakText>
            </View>
          </Pressable>
        ))}
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  content  : { padding: space.lg, gap: space.lg, maxWidth: 900, alignSelf: 'center', width: '100%' },
  header   : { gap: 4 },
  infoBox  : {
    backgroundColor: colors.light.muted,
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.gold + '60',
  },
  grid    : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card    : {
    flex           : 1,
    minWidth       : 260,
    backgroundColor: colors.light.surface,
    borderRadius   : 10,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    borderTopWidth : 3,
    padding        : space.md,
    gap            : 2,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox : {
    width       : 44,
    height      : 44,
    borderRadius: 10,
    borderWidth : 1,
    alignItems  : 'center',
    justifyContent: 'center',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical  : 3,
    borderRadius     : 12,
    borderWidth      : 1,
  },
  cardCta: {
    marginTop  : space.md,
    paddingTop : space.sm,
    borderTopWidth: 1,
  },
})
