// Epic 85 — Story 85.3 — Liste clubs avec recherche et filtrage
import React, { useMemo, useState } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import type { ClubDirectoryEntry, CommercialContactWithCommercial } from '@aureak/types'
import { ClubCard } from './ClubCard'
import type { ClubCommercialStatus } from './ClubCard'

interface ClubListProps {
  clubs   : ClubDirectoryEntry[]
  contacts: CommercialContactWithCommercial[]
}

function getClubStatus(
  club: ClubDirectoryEntry,
  clubContacts: CommercialContactWithCommercial[],
): ClubCommercialStatus {
  if (club.clubRelationType === 'partenaire' || club.clubRelationType === 'associe') {
    return 'partenaire'
  }
  if (clubContacts.length === 0) return 'pas_contacte'
  const allPasDeSuite = clubContacts.every(c => c.status === 'pas_de_suite')
  if (allPasDeSuite) return 'pas_de_suite'
  return 'en_cours'
}

export function ClubList({ clubs, contacts }: ClubListProps) {
  const [search, setSearch] = useState('')

  // Index contacts par club
  const contactsByClub = useMemo(() => {
    const map = new Map<string, CommercialContactWithCommercial[]>()
    for (const c of contacts) {
      const arr = map.get(c.clubDirectoryId) ?? []
      arr.push(c)
      map.set(c.clubDirectoryId, arr)
    }
    return map
  }, [contacts])

  // Filtrage par recherche
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clubs
    return clubs.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      (c.ville?.toLowerCase().includes(q) ?? false)
    )
  }, [clubs, search])

  // Tri : en cours en premier, puis pas contacté, puis partenaires, puis pas de suite
  const sorted = useMemo(() => {
    const order: Record<ClubCommercialStatus, number> = {
      en_cours     : 0,
      pas_contacte : 1,
      partenaire   : 2,
      pas_de_suite : 3,
    }
    return [...filtered].sort((a, b) => {
      const sa = getClubStatus(a, contactsByClub.get(a.id) ?? [])
      const sb = getClubStatus(b, contactsByClub.get(b.id) ?? [])
      return order[sa] - order[sb]
    })
  }, [filtered, contactsByClub])

  return (
    <View>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un club..."
          placeholderTextColor={colors.text.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <AureakText variant="caption" style={styles.resultCount}>
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </AureakText>
        )}
      </View>

      {/* Grille de clubs */}
      <View style={styles.grid}>
        {sorted.map(club => {
          const clubContacts = contactsByClub.get(club.id) ?? []
          const status = getClubStatus(club, clubContacts)
          return (
            <ClubCard
              key={club.id}
              club={club}
              status={status}
              contactCount={clubContacts.length}
            />
          )
        })}
      </View>

      {sorted.length === 0 && (
        <AureakText variant="body" style={styles.empty}>
          Aucun club trouvé pour "{search}"
        </AureakText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.md,
    marginBottom : space.lg,
  },
  searchInput: {
    flex           : 1,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.xs,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    fontSize       : 15,
    color          : colors.text.dark,
    maxWidth       : 400,
  },
  resultCount: {
    color: colors.text.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  empty: {
    color     : colors.text.muted,
    textAlign : 'center',
    marginTop : space.xl,
  },
})
