// Story 63.3 — Hub Développement avec 3 DevSectionCard
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space, radius, shadows } from '@aureak/theme'

interface DevSection {
  href       : string
  icon       : string
  title      : string
  description: string
}

const SECTIONS: DevSection[] = [
  {
    href       : '/developpement/prospection',
    icon       : '🎯',
    title      : 'Prospection',
    description: 'Suivez vos contacts, rendez-vous et taux de conversion pour développer l\'académie.',
  },
  {
    href       : '/developpement/marketing',
    icon       : '📣',
    title      : 'Marketing',
    description: 'Campagnes, inscriptions et portée de vos actions de communication.',
  },
  {
    href       : '/developpement/partenariats',
    icon       : '🤝',
    title      : 'Partenariats',
    description: 'Clubs partenaires, conventions et valeur des collaborations actives.',
  },
]

interface DevSectionCardProps {
  section: DevSection
  onPress: () => void
}

function DevSectionCard({ section, onPress }: DevSectionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={styles.cardIcon}>{section.icon}</Text>
      <Text style={styles.cardTitle}>{section.title}</Text>
      <Text style={styles.cardDesc}>{section.description}</Text>
      <Text style={styles.cardLink}>Voir →</Text>
    </Pressable>
  )
}

export default function DeveloppementPage() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Développement</Text>
        <Text style={styles.sub}>Croissance et rayonnement de l'académie Aureak</Text>
      </View>

      <View style={styles.grid}>
        {SECTIONS.map(section => (
          <DevSectionCard
            key={section.href}
            section={section}
            onPress={() => router.push(section.href as never)}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
  header: {
    marginBottom: space.xl,
  },
  title: {
    fontSize    : 28,
    fontWeight  : '900',
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    fontSize: 15,
    color   : colors.text.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.xl,
    minWidth       : 240,
    flex           : 1,
    maxWidth       : 360,
    // @ts-ignore — web only boxShadow
    boxShadow      : shadows.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardIcon: {
    fontSize    : 36,
    marginBottom: space.sm,
  },
  cardTitle: {
    fontSize    : 18,
    fontWeight  : '700',
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  cardDesc: {
    fontSize    : 13,
    color       : colors.text.muted,
    lineHeight  : 20,
    marginBottom: space.md,
  },
  cardLink: {
    fontSize  : 13,
    fontWeight: '700',
    color     : colors.accent.gold,
  },
})
