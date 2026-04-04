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

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    gap: space.xl,
  },
  section: { gap: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.border.light },
})

export default function DesignSystemWebPage() {
  const [inputValue, setInputValue] = useState('')
  const [indicator, setIndicator] = useState<IndicatorValue>('none')
  const [star, setStar] = useState(false)

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <AureakText variant="display">Design System AUREAK</AureakText>
      <AureakText variant="bodySm" color={colors.text.muted}>
        Dark Manga Premium — tokens, composants de base
      </AureakText>

      <View style={styles.section}>
        <AureakText variant="h2">Typographie</AureakText>
        <View style={styles.divider} />
        <AureakText variant="h1">H1 — Montserrat 28</AureakText>
        <AureakText variant="h2">H2 — Montserrat 22</AureakText>
        <AureakText variant="body">Body — Geist 15</AureakText>
        <AureakText variant="stat">42.5 — Geist Mono</AureakText>
      </View>

      <View style={styles.section}>
        <AureakText variant="h2">Boutons</AureakText>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Button label="Primary" onPress={() => {}} variant="primary" />
          <Button label="Secondary" onPress={() => {}} variant="secondary" />
          <Button label="Ghost" onPress={() => {}} variant="ghost" />
        </View>
      </View>

      <View style={styles.section}>
        <AureakText variant="h2">Badges</AureakText>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Badge label="Gold" variant="gold" />
          <Badge label="Présent" variant="present" />
          <Badge label="Attention" variant="attention" />
        </View>
      </View>

      <View style={styles.section}>
        <AureakText variant="h2">Card + Input</AureakText>
        <View style={styles.divider} />
        <Card>
          <Input
            label="Champ de saisie"
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Texte..."
          />
        </Card>
      </View>

      <View style={styles.section}>
        <AureakText variant="h2">Composants interactifs</AureakText>
        <View style={styles.divider} />
        <View style={styles.row}>
          <IndicatorToggle value={indicator} onChange={setIndicator} label="Évaluation" />
          <StarToggle value={star} onChange={setStar} />
        </View>
      </View>

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
      </View>

      <View style={{ height: space.xl }} />
    </ScrollView>
  )
}
