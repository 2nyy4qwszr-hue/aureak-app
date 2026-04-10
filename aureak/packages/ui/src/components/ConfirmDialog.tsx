import React from 'react'
import { View, StyleSheet, Pressable, Modal } from 'react-native'
import { AureakText } from './Text'
import { colors, space, radius } from '@aureak/theme'

type Props = {
  visible     : boolean
  title       : string
  message?    : string
  confirmLabel: string
  cancelLabel?: string
  onConfirm   : () => void
  onCancel    : () => void
  danger?     : boolean
}

export function ConfirmDialog({
  visible, title, message, confirmLabel, cancelLabel = 'Annuler',
  onConfirm, onCancel, danger = false,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.dialog} onStartShouldSetResponder={() => true}>
          <AureakText variant="h3" style={styles.title}>{title}</AureakText>
          {message && (
            <AureakText variant="body" style={styles.message}>{message}</AureakText>
          )}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <AureakText variant="caption" style={{ color: colors.text.muted }}>
                {cancelLabel}
              </AureakText>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, danger && styles.confirmBtnDanger]}
              onPress={onConfirm}
            >
              <AureakText variant="caption" style={{ color: '#fff', fontWeight: '700' as never }}>
                {confirmLabel}
              </AureakText>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay    : {
    flex           : 1,
    backgroundColor: colors.overlay.dark,
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.xl,
  },
  dialog     : {
    width          : '100%',
    maxWidth       : 420,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.xl,
    gap            : space.sm,
    shadowColor    : '#000',
    shadowOffset   : { width: 0, height: 2 },
    shadowOpacity  : 0.08,
    shadowRadius   : 8,
    elevation      : 4,
  },
  title      : { color: colors.text.dark },
  message    : { color: colors.text.muted },
  actions    : { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm, marginTop: space.xs },
  cancelBtn  : {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  confirmBtn : {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs + 2,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  confirmBtnDanger: { backgroundColor: colors.status.errorStrong },
})
