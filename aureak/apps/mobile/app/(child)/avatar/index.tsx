// Story 12.3 — Écran Avatar & Items débloquables (enfant)
import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { listAvatarItems, listUnlockedItems, getPlayerAvatar, equipAvatarItem } from '@aureak/api-client'
import type { AvatarItem, AvatarSlot, UnlockedItem, PlayerAvatar } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const SLOT_LABELS: Record<AvatarSlot, string> = {
  frame     : '🖼️ Cadre',
  background: '🌄 Fond',
  accessory : '✨ Accessoire',
  effect    : '💫 Effet',
  title     : '🏷️ Titre',
}

function getUnlockHint(condition: Record<string, unknown>): string {
  switch (condition.type) {
    case 'badge'         : return `Obtiens le badge "${condition.badge_code}"`
    case 'total_points'  : return `Atteins ${condition.min_points} points`
    case 'themes_acquired': return `Maîtrise ${condition.count} thèmes`
    default              : return 'Condition inconnue'
  }
}

export default function AvatarScreen() {
  const user = useAuthStore(s => s.user)
  const [items, setItems]         = useState<AvatarItem[]>([])
  const [unlocked, setUnlocked]   = useState<UnlockedItem[]>([])
  const [avatar, setAvatar]       = useState<PlayerAvatar | null>(null)
  const [loading, setLoading]     = useState(true)
  const [equipping, setEquipping] = useState<string | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const [itemsResult, unlockedResult, avatarResult] = await Promise.all([
      listAvatarItems(),
      listUnlockedItems(user.id),
      getPlayerAvatar(user.id),
    ])
    setItems(itemsResult.data)
    setUnlocked(unlockedResult.data)
    setAvatar(avatarResult.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  const unlockedIds = new Set(unlocked.map(u => u.item_id))

  const handleEquip = async (item: AvatarItem) => {
    if (!user || !unlockedIds.has(item.id)) return
    setEquipping(item.id)
    const { error } = await equipAvatarItem(user.id, item.category as AvatarSlot, item.id)
    if (error) {
      Alert.alert('Erreur', 'Impossible d\'équiper cet item.')
    } else {
      await load()
    }
    setEquipping(null)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent.gold} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Avatar</Text>

      {/* Slots équipés */}
      <View style={styles.slotsCard}>
        {(Object.keys(SLOT_LABELS) as AvatarSlot[]).map(slot => {
          const equippedId = avatar ? (avatar[`equipped_${slot}` as keyof PlayerAvatar] as string | null) : null
          const equippedItem = items.find(i => i.id === equippedId)
          return (
            <View key={slot} style={styles.slotRow}>
              <Text style={styles.slotLabel}>{SLOT_LABELS[slot]}</Text>
              <Text style={styles.slotValue}>{equippedItem?.name ?? '—'}</Text>
            </View>
          )
        })}
      </View>

      {/* Galerie items */}
      <Text style={styles.sectionTitle}>Galerie d&apos;items</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const isUnlocked = unlockedIds.has(item.id)
          const isEquipping = equipping === item.id
          return (
            <TouchableOpacity
              style={[styles.itemCard, !isUnlocked && styles.itemCardLocked]}
              onPress={() => isUnlocked && handleEquip(item)}
              disabled={!isUnlocked || isEquipping}
            >
              {isEquipping ? (
                <ActivityIndicator size="small" color={colors.accent.gold} />
              ) : (
                <>
                  <Text style={styles.itemEmoji}>{isUnlocked ? '✅' : '🔒'}</Text>
                  <Text style={[styles.itemName, !isUnlocked && styles.itemNameLocked]}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{SLOT_LABELS[item.category as AvatarSlot]}</Text>
                  {!isUnlocked && (
                    <Text style={styles.unlockHint}>
                      {getUnlockHint(item.unlock_condition)}
                    </Text>
                  )}
                </>
              )}
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container    : { flex: 1, backgroundColor: colors.background.primary },
  center       : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary },
  title        : { fontSize: 24, fontWeight: '700', color: colors.text.primary, padding: 20, paddingBottom: 8 },
  slotsCard    : { margin: 16, backgroundColor: colors.background.surface, borderRadius: 12, padding: 16 },
  slotRow      : { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  slotLabel    : { fontSize: 14, color: colors.text.secondary },
  slotValue    : { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  sectionTitle : { fontSize: 18, fontWeight: '600', color: colors.accent.gold, paddingHorizontal: 16, marginBottom: 8 },
  grid         : { padding: 8 },
  itemCard     : { flex: 1, margin: 8, backgroundColor: colors.background.surface, borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 },
  itemCardLocked: { opacity: 0.5 },
  itemEmoji    : { fontSize: 28 },
  itemName     : { fontSize: 13, fontWeight: '600', color: colors.text.primary, textAlign: 'center' },
  itemNameLocked: { color: colors.text.secondary },
  itemCategory : { fontSize: 11, color: colors.text.secondary },
  unlockHint   : { fontSize: 11, color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic' },
})
