// Story 89.1 — Modal garde-fou doublon avant création prospect
// AC #10 : 2 actions — "Voir la fiche existante" / "Créer quand même"
'use client'

import React from 'react'
import { View, Pressable, StyleSheet, Modal } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { ChildDirectoryEntry } from '@aureak/types'

// ── Props ────────────────────────────────────────────────────────────────────

export type DuplicateWarningModalProps = {
  visible    : boolean
  duplicates : ChildDirectoryEntry[]
  onViewExisting : (entry: ChildDirectoryEntry) => void
  onForceCreate  : () => void
  onCancel       : () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function birthYear(iso: string | null): string {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-/)
  return m ? m[1] : '—'
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DuplicateWarningModal({
  visible, duplicates, onViewExisting, onForceCreate, onCancel,
}: DuplicateWarningModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={st.backdrop}>
        <View style={st.card}>
          <View style={st.header}>
            <AureakText style={st.title as never}>⚠ Doublon probable</AureakText>
            <AureakText style={st.sub as never}>
              Ce prospect existe peut-être déjà dans l'annuaire :
            </AureakText>
          </View>

          <View style={st.list}>
            {duplicates.slice(0, 5).map(d => (
              <Pressable
                key={d.id}
                style={({ hovered, pressed }) => [
                  st.item,
                  (hovered || pressed) && st.itemHover,
                ] as never}
                onPress={() => onViewExisting(d)}
              >
                <View style={{ flex: 1 }}>
                  <AureakText style={st.itemName as never}>{d.displayName}</AureakText>
                  <AureakText style={st.itemSub as never}>
                    Né(e) en {birthYear(d.birthDate)}
                    {d.currentClub ? ` · ${d.currentClub}` : ''}
                  </AureakText>
                </View>
                <AureakText style={st.itemArrow as never}>→</AureakText>
              </Pressable>
            ))}
          </View>

          <View style={st.actions}>
            <Pressable style={st.btnSecondary} onPress={onCancel}>
              <AureakText style={st.btnSecondaryText as never}>Annuler</AureakText>
            </Pressable>
            <Pressable style={st.btnPrimary} onPress={onForceCreate}>
              <AureakText style={st.btnPrimaryText as never}>Créer quand même</AureakText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  backdrop: {
    flex           : 1,
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.md,
    backgroundColor: colors.overlay.dark,
  },
  card: {
    width          : '100%',
    maxWidth       : 480,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    gap            : space.md,
    // @ts-ignore RN Web boxShadow
    boxShadow      : shadows.lg,
  },
  header: { gap: 4 },
  title : {
    color     : colors.text.dark,
    fontSize  : 16,
    fontWeight: '700',
  },
  sub   : {
    color   : colors.text.muted,
    fontSize: 13,
  },
  list: {
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    overflow         : 'hidden',
  },
  item: {
    flexDirection    : 'row',
    alignItems       : 'center',
    minHeight        : 48,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    gap              : space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  itemHover: { backgroundColor: colors.light.hover },
  itemName : { color: colors.text.dark, fontSize: 14, fontWeight: '600' },
  itemSub  : { color: colors.text.muted, fontSize: 12, marginTop: 2 },
  itemArrow: { color: colors.accent.gold, fontSize: 16, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap          : space.sm,
    justifyContent: 'flex-end',
    flexWrap     : 'wrap',
  },
  btnSecondary: {
    minHeight        : 44,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
    justifyContent   : 'center',
    alignItems       : 'center',
  },
  btnSecondaryText: {
    color     : colors.text.muted,
    fontSize  : 13,
    fontWeight: '600',
  },
  btnPrimary: {
    minHeight        : 44,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
    justifyContent   : 'center',
    alignItems       : 'center',
  },
  btnPrimaryText: {
    color     : colors.text.dark,
    fontSize  : 13,
    fontWeight: '700',
  },
})
