import React, { useState } from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { colors, space } from '@aureak/theme'
import {
  AureakText,
  Button,
  Card,
  Input,
  Badge,
  IndicatorToggle,
  StarToggle,
  HierarchyBreadcrumb,
} from '@aureak/ui'
import type { IndicatorValue } from '@aureak/ui'

// Page accessible en dev mode uniquement (__DEV__)
// Navigation : expo-router → /design-system

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: space.md,
    gap: space.xl,
  },
  section: {
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.accent.zinc,
  },
})

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('')
  const [indicator, setIndicator] = useState<IndicatorValue>('none')
  const [star, setStar] = useState(false)

  if (!__DEV__) return null

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* Typography */}
      <View style={styles.section}>
        <AureakText variant="h2">Typographie</AureakText>
        <View style={styles.divider} />
        <AureakText variant="display">Display — Rajdhani 36</AureakText>
        <AureakText variant="h1">Heading 1 — Rajdhani 28</AureakText>
        <AureakText variant="h2">Heading 2 — Rajdhani 22</AureakText>
        <AureakText variant="h3">Heading 3 — Rajdhani 18</AureakText>
        <AureakText variant="bodyLg">Body Large — Geist 16</AureakText>
        <AureakText variant="body">Body — Geist 15</AureakText>
        <AureakText variant="bodySm">Body Small — Geist 13</AureakText>
        <AureakText variant="caption">Caption — Geist 11</AureakText>
        <AureakText variant="label">Label — Geist 12 uppercase</AureakText>
        <AureakText variant="stat">42 stat — Geist Mono 24</AureakText>
      </View>

      {/* Buttons */}
      <View style={styles.section}>
        <AureakText variant="h2">Boutons</AureakText>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Button label="Primary" onPress={() => {}} variant="primary" />
          <Button label="Secondary" onPress={() => {}} variant="secondary" />
          <Button label="Ghost" onPress={() => {}} variant="ghost" />
        </View>
        <Button label="Désactivé" onPress={() => {}} disabled />
        <Button label="Full Width" onPress={() => {}} fullWidth />
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <AureakText variant="h2">Badges</AureakText>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Badge label="Gold" variant="gold" />
          <Badge label="Présent" variant="present" />
          <Badge label="Attention" variant="attention" />
          <Badge label="Zinc" variant="zinc" />
        </View>
      </View>

      {/* Card */}
      <View style={styles.section}>
        <AureakText variant="h2">Card</AureakText>
        <View style={styles.divider} />
        <Card>
          <AureakText variant="h3">Titre de la card</AureakText>
          <AureakText variant="body">Contenu de la card avec texte body.</AureakText>
        </Card>
      </View>

      {/* Input */}
      <View style={styles.section}>
        <AureakText variant="h2">Input</AureakText>
        <View style={styles.divider} />
        <Input
          label="Exemple de champ"
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Saisir du texte..."
        />
        <Input
          label="Avec erreur"
          value=""
          onChangeText={() => {}}
          error="Ce champ est requis"
        />
      </View>

      {/* IndicatorToggle */}
      <View style={styles.section}>
        <AureakText variant="h2">IndicatorToggle</AureakText>
        <AureakText variant="bodySm">Cycle : vide → positif 🟢 → attention 🟡 (jamais rouge)</AureakText>
        <View style={styles.divider} />
        <View style={styles.row}>
          <IndicatorToggle value={indicator} onChange={setIndicator} label="Enfant" />
          <IndicatorToggle value="none" onChange={() => {}} label="Vide" />
          <IndicatorToggle value="positive" onChange={() => {}} label="Positif" />
          <IndicatorToggle value="attention" onChange={() => {}} label="Attention" />
          <IndicatorToggle value="none" onChange={() => {}} label="Désactivé" disabled />
        </View>
        <AureakText variant="caption">État actuel : {indicator}</AureakText>
      </View>

      {/* StarToggle */}
      <View style={styles.section}>
        <AureakText variant="h2">StarToggle</AureakText>
        <AureakText variant="bodySm">Top séance — binaire vide/étoile or</AureakText>
        <View style={styles.divider} />
        <View style={styles.row}>
          <StarToggle value={star} onChange={setStar} />
          <AureakText variant="body">{star ? 'Top séance ⭐' : 'Non marqué'}</AureakText>
        </View>
      </View>

      {/* HierarchyBreadcrumb */}
      <View style={styles.section}>
        <AureakText variant="h2">HierarchyBreadcrumb</AureakText>
        <View style={styles.divider} />
        <HierarchyBreadcrumb
          items={[
            { label: 'Coordination', onPress: () => {} },
            { label: 'Technique de base', onPress: () => {} },
            { label: 'Dribble' },
          ]}
        />
        <HierarchyBreadcrumb
          items={[
            { label: 'Situations 1v1', onPress: () => {} },
            { label: 'Duel défensif' },
          ]}
        />
      </View>

      <View style={{ height: space.xl }} />
    </ScrollView>
  )
}
