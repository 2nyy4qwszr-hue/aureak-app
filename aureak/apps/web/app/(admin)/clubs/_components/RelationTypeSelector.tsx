// RelationTypeSelector — partagé entre clubs/new.tsx et clubs/[clubId]/page.tsx

import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors } from '@aureak/theme'
import type { ClubRelationType } from '@aureak/types'
import { CLUB_RELATION_TYPES, CLUB_RELATION_TYPE_LABELS } from '@aureak/types'

export default function RelationTypeSelector({
  value,
  onChange,
}: {
  value   : ClubRelationType
  onChange: (v: ClubRelationType) => void
}) {
  return (
    <View style={{ gap: 6 }}>
      <AureakText variant="caption" style={{ color: colors.text.muted, fontSize: 11, fontWeight: '600' as never }}>
        Type de relation
      </AureakText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {CLUB_RELATION_TYPES.map(r => (
          <Pressable
            key={r}
            style={[chip.base, value === r && chip.active]}
            onPress={() => onChange(r)}
          >
            <AureakText
              variant="caption"
              style={{ color: value === r ? colors.accent.gold : colors.text.muted, fontSize: 11 }}
            >
              {CLUB_RELATION_TYPE_LABELS[r]}
            </AureakText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const chip = StyleSheet.create({
  base  : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border.light, backgroundColor: colors.light.muted },
  active: { borderColor: colors.accent.gold, backgroundColor: colors.light.surface },
})
