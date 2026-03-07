// Story 12.5 — Carte de progression des thèmes (enfant)
import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView,
} from 'react-native'
import { getChildThemeProgression } from '@aureak/api-client'
import type { ThemeProgressEntry, MasteryStatus } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import { colors } from '@aureak/theme'

const STATUS_CONFIG: Record<MasteryStatus, { emoji: string; color: string; label: string }> = {
  not_started: { emoji: '🔒', color: colors.accent.zinc, label: 'Non commencé' },
  in_progress: { emoji: '⏳', color: colors.accent.gold, label: 'En cours' },
  acquired   : { emoji: '✅', color: colors.status.present, label: 'Acquis' },
  revalidated: { emoji: '🌟', color: colors.accent.gold, label: 'Confirmé' },
}

const RARITY_COLORS: Record<string, string> = {
  common   : colors.text.secondary,
  rare     : colors.accent.gold,
  epic     : colors.accent.gold,
  legendary: colors.accent.gold,
}

export default function ThemesProgressionScreen() {
  const user   = useAuthStore(s => s.user)
  const [themes, setThemes]   = useState<ThemeProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ThemeProgressEntry | null>(null)

  useEffect(() => {
    if (!user) return
    getChildThemeProgression(user.id).then(data => {
      setThemes(data)
      setLoading(false)
    })
  }, [user?.id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent.gold} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ma Progression</Text>

      <FlatList
        data={themes}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.masteryStatus]
          return (
            <TouchableOpacity
              style={[styles.themeCard, { borderColor: cfg.color }]}
              onPress={() => setSelected(item)}
            >
              <Text style={styles.themeEmoji}>{cfg.emoji}</Text>
              <Text style={styles.themeName}>{item.name}</Text>
              <Text style={[styles.themeStatus, { color: cfg.color }]}>{cfg.label}</Text>
              {item.reviewDue && (
                <Text style={styles.reviewDue}>Révision disponible !</Text>
              )}
              {item.skillCards.length > 0 && (
                <Text style={[styles.cardCount, { color: RARITY_COLORS[item.skillCards[0].rarity] }]}>
                  🃏 {item.skillCards.length} carte{item.skillCards.length > 1 ? 's' : ''}
                </Text>
              )}
            </TouchableOpacity>
          )
        }}
      />

      {/* Modal détail thème */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selected && (
              <ScrollView>
                <Text style={styles.modalTitle}>{selected.name}</Text>
                {selected.description && (
                  <Text style={styles.modalDesc}>{selected.description}</Text>
                )}

                <View style={styles.modalStatus}>
                  <Text style={[styles.modalStatusText, { color: STATUS_CONFIG[selected.masteryStatus].color }]}>
                    {STATUS_CONFIG[selected.masteryStatus].emoji} {STATUS_CONFIG[selected.masteryStatus].label}
                  </Text>
                  {selected.firstAcquiredAt && (
                    <Text style={styles.modalDate}>
                      Acquis le {new Date(selected.firstAcquiredAt).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>

                {selected.reviewDue && (
                  <View style={styles.reviewBanner}>
                    <Text style={styles.reviewText}>🔄 Révision disponible — lance un quiz !</Text>
                  </View>
                )}

                {/* Skill cards */}
                {selected.skillCards.length > 0 && (
                  <View style={styles.skillCardsSection}>
                    <Text style={styles.skillCardsTitle}>Skill Cards</Text>
                    {selected.skillCards.map(sc => (
                      <View key={sc.id} style={styles.skillCardRow}>
                        <Text style={[styles.skillCardRarity, { color: RARITY_COLORS[sc.rarity] }]}>
                          {sc.rarity.toUpperCase()}
                        </Text>
                        <Text style={styles.skillCardName}>{sc.name}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtnText}>Fermer</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: colors.background.primary },
  center         : { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary },
  title          : { fontSize: 24, fontWeight: '700', color: colors.text.primary, padding: 20, paddingBottom: 8 },
  grid           : { padding: 8 },
  themeCard      : { flex: 1, margin: 8, backgroundColor: colors.background.surface, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1.5 },
  themeEmoji     : { fontSize: 28 },
  themeName      : { fontSize: 13, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  themeStatus    : { fontSize: 11, fontWeight: '600' },
  reviewDue      : { fontSize: 10, color: colors.accent.gold, fontStyle: 'italic' },
  cardCount      : { fontSize: 11, fontWeight: '600' },
  modalOverlay   : { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard      : { backgroundColor: colors.background.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle     : { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  modalDesc      : { fontSize: 14, color: colors.text.secondary, marginBottom: 16 },
  modalStatus    : { marginBottom: 12 },
  modalStatusText: { fontSize: 16, fontWeight: '700' },
  modalDate      : { fontSize: 13, color: colors.text.secondary, marginTop: 4 },
  reviewBanner   : { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 8, padding: 12, marginBottom: 12 },
  reviewText     : { color: colors.accent.gold, fontWeight: '600', fontSize: 14 },
  skillCardsSection: { marginTop: 16 },
  skillCardsTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 8 },
  skillCardRow   : { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 },
  skillCardRarity: { fontSize: 11, fontWeight: '700' },
  skillCardName  : { fontSize: 14, color: colors.text.secondary },
  closeBtn       : { marginTop: 20, backgroundColor: colors.accent.zinc, borderRadius: 10, padding: 14, alignItems: 'center' },
  closeBtnText   : { color: colors.text.primary, fontWeight: '600', fontSize: 15 },
})
