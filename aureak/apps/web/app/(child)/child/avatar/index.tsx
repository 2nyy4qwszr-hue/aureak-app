'use client'
// Avatar & cartes — équipement et collection d'items débloqués
import { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { getPlayerAvatar, listAvatarItems, listUnlockedItems, equipAvatarItem } from '@aureak/api-client'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { colors, space } from '@aureak/theme'
import type { PlayerAvatar, AvatarItem, UnlockedItem, AvatarSlot } from '@aureak/api-client'

const SLOT_LABEL: Record<AvatarSlot, string> = {
  frame     : 'Cadre',
  background: 'Fond',
  accessory : 'Accessoire',
  effect    : 'Effet',
  title     : 'Titre',
}

const ALL_SLOTS: AvatarSlot[] = ['frame', 'background', 'accessory', 'effect', 'title']

export default function ChildAvatarPage() {
  const user = useAuthStore(s => s.user)

  const [avatar,    setAvatar]    = useState<PlayerAvatar | null>(null)
  const [items,     setItems]     = useState<AvatarItem[]>([])
  const [unlocked,  setUnlocked]  = useState<UnlockedItem[]>([])
  const [activeSlot,setActiveSlot]= useState<AvatarSlot>('frame')
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      getPlayerAvatar(user.id),
      listAvatarItems(),
      listUnlockedItems(user.id),
    ]).then(([av, allItems, unlockedItems]) => {
      setAvatar(av)
      setItems(allItems)
      setUnlocked(unlockedItems)
      setLoading(false)
    })
  }, [user?.id])

  const handleEquip = async (item: AvatarItem) => {
    if (!user?.id || saving) return
    setSaving(true)
    await equipAvatarItem(user.id, item.category, item.id)
    const updated = await getPlayerAvatar(user.id)
    setAvatar(updated)
    setSaving(false)
  }

  const unlockedIds = new Set(unlocked.map(u => u.item_id))

  const equippedIdForSlot = (slot: AvatarSlot): string | null => {
    if (!avatar) return null
    const map: Record<AvatarSlot, string | null> = {
      frame     : avatar.equipped_frame      ?? null,
      background: avatar.equipped_background ?? null,
      accessory : avatar.equipped_accessory  ?? null,
      effect    : avatar.equipped_effect     ?? null,
      title     : avatar.equipped_title      ?? null,
    }
    return map[slot]
  }

  const slotItems = items.filter(i => i.category === activeSlot)
  const unlockedSlotItems = slotItems.filter(i => unlockedIds.has(i.id))
  const lockedSlotItems   = slotItems.filter(i => !unlockedIds.has(i.id))

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AureakText variant="h2">Mon avatar</AureakText>
      <AureakText variant="body" style={{ color: colors.text.secondary }}>
        Personnalise ton profil avec les items que tu as débloqués.
      </AureakText>

      {loading ? (
        <AureakText variant="body" style={{ color: colors.text.secondary }}>Chargement...</AureakText>
      ) : (
        <>
          {/* Equipped summary */}
          <View style={styles.equippedCard}>
            <AureakText variant="h3" style={{ marginBottom: space.sm }}>Équipement actuel</AureakText>
            {ALL_SLOTS.map(slot => {
              const equippedId = equippedIdForSlot(slot)
              const equippedItem = equippedId ? items.find(i => i.id === equippedId) : null
              return (
                <View key={slot} style={styles.equippedRow}>
                  <AureakText variant="caption" style={{ color: colors.text.secondary, width: 90 }}>
                    {SLOT_LABEL[slot]}
                  </AureakText>
                  <AureakText variant="caption" style={{ color: equippedItem ? colors.text.primary : colors.text.secondary }}>
                    {equippedItem?.name ?? '—'}
                  </AureakText>
                </View>
              )
            })}
          </View>

          {/* Slot tabs */}
          <View style={styles.slotTabs}>
            {ALL_SLOTS.map(slot => (
              <Pressable key={slot} onPress={() => setActiveSlot(slot)}>
                <View style={[styles.slotTab, activeSlot === slot && styles.slotTabActive]}>
                  <AureakText
                    variant="caption"
                    style={{
                      color     : activeSlot === slot ? colors.accent.gold : colors.text.secondary,
                      fontWeight: '600',
                    }}
                  >
                    {SLOT_LABEL[slot]}
                  </AureakText>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Unlocked items for slot */}
          {unlockedSlotItems.length === 0 && lockedSlotItems.length === 0 ? (
            <AureakText variant="body" style={{ color: colors.text.secondary }}>
              Aucun item disponible dans cette catégorie.
            </AureakText>
          ) : (
            <>
              {unlockedSlotItems.length > 0 && (
                <>
                  <AureakText variant="caption" style={{ color: colors.text.secondary }}>
                    Débloqués ({unlockedSlotItems.length})
                  </AureakText>
                  <View style={styles.itemsGrid}>
                    {unlockedSlotItems.map(item => {
                      const isEquipped = equippedIdForSlot(activeSlot) === item.id
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => handleEquip(item)}
                          disabled={saving || isEquipped}
                        >
                          <View style={[styles.itemCard, isEquipped && styles.itemCardEquipped]}>
                            {item.asset_url ? (
                              <AureakText variant="caption" style={{ fontSize: 28 }}>🎨</AureakText>
                            ) : (
                              <AureakText variant="caption" style={{ fontSize: 28 }}>⬜</AureakText>
                            )}
                            <AureakText
                              variant="caption"
                              style={{
                                textAlign : 'center',
                                fontSize  : 11,
                                color     : isEquipped ? colors.accent.gold : colors.text.primary,
                                fontWeight: isEquipped ? '700' : '400',
                              }}
                            >
                              {item.name}
                            </AureakText>
                            {isEquipped && (
                              <AureakText variant="caption" style={{ color: colors.accent.gold, fontSize: 9 }}>
                                Équipé
                              </AureakText>
                            )}
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                </>
              )}

              {lockedSlotItems.length > 0 && (
                <>
                  <AureakText variant="caption" style={{ color: colors.text.secondary, marginTop: space.sm }}>
                    Verrouillés ({lockedSlotItems.length})
                  </AureakText>
                  <View style={styles.itemsGrid}>
                    {lockedSlotItems.map(item => (
                      <View key={item.id} style={[styles.itemCard, styles.itemCardLocked]}>
                        <AureakText variant="caption" style={{ fontSize: 28, opacity: 0.3 }}>🔒</AureakText>
                        <AureakText
                          variant="caption"
                          style={{ textAlign: 'center', fontSize: 11, color: colors.text.secondary }}
                        >
                          {item.name}
                        </AureakText>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {saving && (
            <AureakText variant="caption" style={{ color: colors.text.secondary, textAlign: 'center' }}>
              Sauvegarde en cours…
            </AureakText>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: colors.background.primary },
  content        : { padding: space.xl, gap: space.md },
  equippedCard   : {
    backgroundColor: colors.background.surface,
    borderRadius   : 10,
    padding        : space.md,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    gap            : 6,
  },
  equippedRow    : { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  slotTabs       : {
    flexDirection  : 'row',
    gap            : space.xs,
    flexWrap       : 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.zinc,
    paddingBottom  : space.sm,
  },
  slotTab        : { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  slotTabActive  : { backgroundColor: colors.background.elevated },
  itemsGrid      : { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  itemCard       : {
    width          : 80,
    backgroundColor: colors.background.surface,
    borderRadius   : 8,
    borderWidth    : 1,
    borderColor    : colors.accent.zinc,
    padding        : 8,
    alignItems     : 'center',
    gap            : 4,
  },
  itemCardEquipped: {
    borderColor    : colors.accent.gold,
    borderWidth    : 2,
    backgroundColor: colors.background.elevated,
  },
  itemCardLocked : { opacity: 0.4 },
})
