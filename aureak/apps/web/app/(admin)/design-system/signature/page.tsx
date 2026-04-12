import React from 'react'
import { View, ScrollView, Text, StyleSheet } from 'react-native'
import {
  GoldHairline,
  CTAPrimary,
  CTASecondary,
  LocationPill,
  StatsInline,
  GrainOverlay,
} from '@aureak/ui'
import { colors, space } from '@aureak/theme'

// Story 83-5 — démo visuelle des composants signature
export default function SignatureDemoPage() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: colors.light.primary }}
    >
      <GrainOverlay />

      <Text style={styles.pageTitle}>DS — Composants signature</Text>
      <Text style={styles.pageLead}>
        Les 5 composants signature du site homepage, prêts à l'emploi dans @aureak/ui.
      </Text>

      {/* GoldHairline */}
      <Section title="GoldHairline">
        <GoldHairline />
        <Text style={styles.body}>Variante animée :</Text>
        <GoldHairline animated width={120} />
      </Section>

      {/* CTAs */}
      <Section title="CTAPrimary / CTASecondary">
        <View style={styles.row}>
          <CTAPrimary label="Découvrir l'académie" />
          <CTASecondary label="Demander une visite" />
        </View>
        <View style={styles.row}>
          <CTAPrimary label="Action mobile" size="mobile" />
          <CTASecondary label="Retour" size="mobile" />
        </View>
      </Section>

      {/* LocationPill */}
      <Section title="LocationPill">
        <View style={styles.row}>
          <LocationPill>Bruxelles · Belgique</LocationPill>
          <LocationPill>Anderlecht</LocationPill>
        </View>
      </Section>

      {/* StatsInline */}
      <Section title="StatsInline">
        <StatsInline
          staggered
          items={[
            { value: '96',  label: 'Joueurs actifs' },
            { value: '14',  label: 'Coachs certifiés' },
            { value: '850', label: 'Séances / an' },
            { value: '12',  label: 'Trophées' },
          ]}
        />
      </Section>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <GoldHairline width={48} marginBottom={16} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: space.xl,
    gap    : space.xxl,
  },
  pageTitle: {
    color       : colors.text.dark,
    fontFamily  : 'Montserrat-Black',
    fontWeight  : '900',
    fontSize    : 36,
    letterSpacing: -0.4,
  },
  pageLead: {
    color     : colors.text.muted,
    fontFamily: 'Poppins-Regular',
    fontSize  : 15,
    lineHeight: 27,
    maxWidth  : 560,
    marginBottom: space.md,
  },
  section: {
    gap: space.md,
  },
  sectionTitle: {
    color       : colors.text.dark,
    fontFamily  : 'Montserrat-Black',
    fontWeight  : '900',
    fontSize    : 22,
    letterSpacing: -0.2,
  },
  body: {
    color     : colors.text.muted,
    fontFamily: 'Poppins-Regular',
    fontSize  : 13,
  },
  row: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    alignItems   : 'center',
    gap          : 16,
  },
})
