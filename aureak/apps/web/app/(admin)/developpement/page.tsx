// Story 63.1 — Page hub Développement (stub)
import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, space, radius } from '@aureak/theme'

const CARDS = [
  {
    title      : 'Prospection',
    description: 'Identifier de nouveaux talents et futurs académiciens.',
    href       : '/developpement/prospection',
    icon       : '🔍',
  },
  {
    title      : 'Marketing',
    description: 'Gérer la communication et la visibilité de l\'académie.',
    href       : '/developpement/marketing',
    icon       : '📣',
  },
  {
    title      : 'Partenariats',
    description: 'Suivre et développer les relations avec les clubs partenaires.',
    href       : '/developpement/partenariats',
    icon       : '🤝',
  },
]

export default function DeveloppementPage() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Développement</Text>
      <Text style={styles.subtitle}>
        Cette section est en cours de développement. Les fonctionnalités arrivent bientôt.
      </Text>

      <View style={styles.grid}>
        {CARDS.map(card => (
          <Pressable
            key={card.href}
            onPress={() => router.push(card.href as never)}
          >
            {({ pressed }) => (
              <View style={[styles.card, pressed && styles.cardPressed]}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Bientôt disponible</Text>
                </View>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex             : 1,
    backgroundColor  : colors.light.primary,
    padding          : space[8],
  },
  title: {
    fontSize         : 28,
    fontWeight       : '800',
    color            : colors.text.primary,
    marginBottom     : space[2],
  },
  subtitle: {
    fontSize         : 15,
    color            : colors.text.muted,
    marginBottom     : space[8],
    lineHeight       : 22,
  },
  grid: {
    flexDirection    : 'row',
    flexWrap         : 'wrap',
    gap              : space[5],
  },
  card: {
    backgroundColor  : colors.light.surface,
    borderRadius     : radius.cardLg,
    padding          : space[6],
    width            : 260,
    shadowColor      : '#000',
    shadowOffset     : { width: 0, height: 1 },
    shadowOpacity    : 0.06,
    shadowRadius     : 4,
  },
  cardPressed: {
    opacity          : 0.85,
  },
  cardIcon: {
    fontSize         : 36,
    marginBottom     : space[3],
  },
  cardTitle: {
    fontSize         : 18,
    fontWeight       : '700',
    color            : colors.text.primary,
    marginBottom     : space[2],
  },
  cardDescription: {
    fontSize         : 13,
    color            : colors.text.muted,
    lineHeight       : 20,
    marginBottom     : space[4],
  },
  badge: {
    backgroundColor  : colors.light.muted,
    borderRadius     : radius.xs,
    paddingHorizontal: space[3],
    paddingVertical  : space[1],
    alignSelf        : 'flex-start',
  },
  badgeText: {
    fontSize         : 11,
    color            : colors.text.muted,
    fontWeight       : '600',
  },
})
