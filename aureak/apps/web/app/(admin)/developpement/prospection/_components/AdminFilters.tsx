// Epic 85 — Story 85.5 — Filtres admin : par commercial + par statut
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import type { CommercialContactWithCommercial } from '@aureak/types'
import { COMMERCIAL_CONTACT_STATUS_LABELS } from '@aureak/types'
import type { ClubCommercialStatus } from './ClubCard'

interface AdminFiltersProps {
  contacts          : CommercialContactWithCommercial[]
  selectedCommercial: string | null
  selectedStatus    : ClubCommercialStatus | null
  onCommercialChange: (id: string | null) => void
  onStatusChange    : (status: ClubCommercialStatus | null) => void
}

const STATUS_OPTIONS: { value: ClubCommercialStatus | null; label: string }[] = [
  { value: null,           label: 'Tous' },
  { value: 'en_cours',     label: 'En cours' },
  { value: 'pas_contacte', label: 'Pas contacté' },
  { value: 'pas_de_suite', label: 'Pas de suite' },
  { value: 'partenaire',   label: 'Partenaire' },
]

export function AdminFilters({
  contacts,
  selectedCommercial,
  selectedStatus,
  onCommercialChange,
  onStatusChange,
}: AdminFiltersProps) {
  // Extraire les commerciaux uniques
  const commercials = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const c of contacts) {
      if (!map.has(c.commercialId)) {
        map.set(c.commercialId, c.commercialDisplayName)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [contacts])

  return (
    <View style={styles.row}>
      {/* Filtre commercial */}
      <View style={styles.filterGroup}>
        <AureakText variant="caption" style={styles.label}>Commercial</AureakText>
        <View style={styles.pills}>
          <FilterPill
            label="Tous"
            active={selectedCommercial === null}
            onPress={() => onCommercialChange(null)}
          />
          {commercials.map(c => (
            <FilterPill
              key={c.id}
              label={c.name}
              active={selectedCommercial === c.id}
              onPress={() => onCommercialChange(c.id)}
            />
          ))}
        </View>
      </View>

      {/* Filtre statut */}
      <View style={styles.filterGroup}>
        <AureakText variant="caption" style={styles.label}>Statut</AureakText>
        <View style={styles.pills}>
          {STATUS_OPTIONS.map(opt => (
            <FilterPill
              key={opt.label}
              label={opt.label}
              active={selectedStatus === opt.value}
              onPress={() => onStatusChange(opt.value)}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

interface FilterPillProps {
  label : string
  active: boolean
  onPress: () => void
}

function FilterPill({ label, active, onPress }: FilterPillProps) {
  const { Pressable } = require('react-native')
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <AureakText
        variant="caption"
        style={{ color: active ? colors.light.surface : colors.text.muted, fontWeight: '600' } as never}
      >
        {label}
      </AureakText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.lg,
    marginBottom : space.lg,
  },
  filterGroup: {
    gap: space.xs,
  },
  label: {
    color     : colors.text.muted,
    fontWeight: '600',
  } as never,
  pills: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
  },
  pill: {
    paddingHorizontal: space.sm,
    paddingVertical  : 5,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.border.light,
    backgroundColor  : colors.light.surface,
  },
  pillActive: {
    backgroundColor: colors.accent.gold,
    borderColor    : colors.accent.gold,
  },
})
