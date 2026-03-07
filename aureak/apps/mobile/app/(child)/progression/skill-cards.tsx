// Story 12.5 — Collection Skill Cards (enfant)
import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native'
import { getSkillCardCollection } from '@aureak/api-client'
import type { SkillCardCollectionEntry } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const RARITY_CONFIG: Record<string, { color: string; emoji: string; label: string }> = {
  legendary: { color: colors.accent.gold, emoji: '👑', label: 'Légendaire' },
  epic     : { color: colors.accent.gold, emoji: '💜', label: 'Épique' },
  rare     : { color: colors.accent.gold, emoji: '🔵', label: 'Rare' },
  common   : { color: colors.text.secondary, emoji: '⬜', label: 'Commun' },
}

export default function SkillCardsScreen() {
  const user   = useAuthStore(s => s.user)
  const [cards, setCards]   = useState<SkillCardCollectionEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getSkillCardCollection(user.id).then(data => {
      setCards(data)
      setLoading(false)
    })
  }, [user?.id])

  const collected   = cards.filter(c => c.collected).length
  const total       = cards.length

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent.gold} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skill Cards</Text>
      <Text style={styles.subtitle}>{collected}/{total} collectées</Text>

      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const cfg    = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common
          const locked = !item.collected
          return (
            <View style={[styles.card, locked && styles.cardLocked, { borderColor: cfg.color }]}>
              <Text style={styles.rarityEmoji}>{locked ? '❓' : cfg.emoji}</Text>
              <Text style={[styles.cardName, locked && styles.cardNameLocked]}>
                {locked ? '???' : item.name}
              </Text>
              <Text style={[styles.rarityLabel, { color: cfg.color }]}>{cfg.label}</Text>
              {item.collected && item.collected_at && (
                <Text style={styles.collectedDate}>
                  {new Date(item.collected_at).toLocaleDateString('fr-FR')}
                </Text>
              )}
              {locked && item.description && (
                <Text style={styles.hint}>{item.description}</Text>
              )}
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: colors.background.primary },
  center         : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary },
  title          : { fontSize: 24, fontWeight: '700', color: colors.text.primary, paddingHorizontal: 20, paddingTop: 20 },
  subtitle       : { fontSize: 14, color: colors.text.secondary, paddingHorizontal: 20, marginBottom: 8 },
  grid           : { padding: 8 },
  card           : { flex: 1, margin: 8, backgroundColor: colors.background.surface, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, borderWidth: 2 },
  cardLocked     : { opacity: 0.55 },
  rarityEmoji    : { fontSize: 30 },
  cardName       : { fontSize: 13, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  cardNameLocked : { color: colors.text.secondary },
  rarityLabel    : { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  collectedDate  : { fontSize: 10, color: colors.text.secondary, marginTop: 2 },
  hint           : { fontSize: 10, color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic', marginTop: 2 },
})
