// Epic 85 — Story 85.3 + 85.5 — Page Prospection : liste clubs + KPIs + filtres admin
// Epic 89 — Story 89.6 : lien vers dashboard funnel gardiens
'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius } from '@aureak/theme'
import { listClubDirectory, listAllCommercialContacts } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { ClubDirectoryEntry, CommercialContactWithCommercial } from '@aureak/types'
import { ProspectionKPIs } from './_components/ProspectionKPIs'
import type { ProspectionStats } from './_components/ProspectionKPIs'
import { ClubList } from './_components/ClubList'
import { AdminFilters } from './_components/AdminFilters'
import type { ClubCommercialStatus } from './_components/ClubCard'

export default function ProspectionPage() {
  const { role } = useAuthStore()
  const router = useRouter()
  const [clubs, setClubs]       = useState<ClubDirectoryEntry[]>([])
  const [contacts, setContacts] = useState<CommercialContactWithCommercial[]>([])
  const [loading, setLoading]   = useState(true)

  // Story 85.5 — Filtres admin
  const [filterCommercial, setFilterCommercial] = useState<string | null>(null)
  const [filterStatus, setFilterStatus]         = useState<ClubCommercialStatus | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [clubsRes, contactsRes] = await Promise.all([
          listClubDirectory({ pageSize: 1000 }),
          listAllCommercialContacts(),
        ])
        setClubs(clubsRes.data)
        setContacts(contactsRes)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[ProspectionPage] load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filtrage contacts par commercial (admin only)
  const filteredContacts = useMemo(() => {
    if (!filterCommercial) return contacts
    return contacts.filter(c => c.commercialId === filterCommercial)
  }, [contacts, filterCommercial])

  // Calculer les stats KPI
  const stats: ProspectionStats = useMemo(() => {
    const contactedClubIds = new Set(filteredContacts.map(c => c.clubDirectoryId))
    const partenaires = clubs.filter(c =>
      c.clubRelationType === 'partenaire' || c.clubRelationType === 'associe'
    ).length

    const enCoursIds = new Set<string>()
    for (const c of filteredContacts) {
      if (c.status !== 'pas_de_suite') enCoursIds.add(c.clubDirectoryId)
    }

    const nonPartnerClubs = clubs.filter(c =>
      c.clubRelationType !== 'partenaire' && c.clubRelationType !== 'associe'
    )
    const neverContacted = nonPartnerClubs.filter(c => !contactedClubIds.has(c.id)).length

    // Story 85.5 — Compteur "bloqués" (en attente > 14 jours)
    const now = Date.now()
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000
    const blockedClubIds = new Set<string>()
    for (const c of filteredContacts) {
      if (c.status === 'en_attente') {
        const contactAge = now - new Date(c.contactedAt).getTime()
        if (contactAge > FOURTEEN_DAYS) blockedClubIds.add(c.clubDirectoryId)
      }
    }

    return {
      total        : clubs.length,
      contacted    : contactedClubIds.size,
      enCours      : enCoursIds.size,
      neverContacted,
      partenaires,
      blocked      : blockedClubIds.size,
    }
  }, [clubs, filteredContacts])

  // Filtrage clubs par statut (admin only)
  const displayClubs = useMemo(() => {
    if (!filterStatus) return clubs
    const contactsByClub = new Map<string, CommercialContactWithCommercial[]>()
    for (const c of filteredContacts) {
      const arr = contactsByClub.get(c.clubDirectoryId) ?? []
      arr.push(c)
      contactsByClub.set(c.clubDirectoryId, arr)
    }

    return clubs.filter(club => {
      const isPartner = club.clubRelationType === 'partenaire' || club.clubRelationType === 'associe'
      const clubContacts = contactsByClub.get(club.id) ?? []

      switch (filterStatus) {
        case 'partenaire':
          return isPartner
        case 'pas_contacte':
          return !isPartner && clubContacts.length === 0
        case 'en_cours':
          return !isPartner && clubContacts.length > 0 && clubContacts.some(c => c.status !== 'pas_de_suite')
        case 'pas_de_suite':
          return !isPartner && clubContacts.length > 0 && clubContacts.every(c => c.status === 'pas_de_suite')
        default:
          return true
      }
    })
  }, [clubs, filteredContacts, filterStatus])

  if (loading) {
    return (
      <View style={styles.container}>
        <AureakText variant="body" style={styles.loadingText}>Chargement des clubs...</AureakText>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AureakText variant="h1" style={styles.title}>Prospection</AureakText>
        <AureakText variant="body" style={styles.sub}>
          Registre des contacts clubs — vérifiez avant de contacter
        </AureakText>
      </View>

      {/* Story 89.6 — lien vers dashboard funnel gardiens */}
      <Pressable
        style={styles.funnelLink}
        onPress={() => router.push('/developpement/prospection/gardiens' as never)}
      >
        <AureakText variant="caption" style={styles.funnelLinkLabel}>
          🎯 Voir le funnel Gardiens (conversion + essais gratuits) →
        </AureakText>
      </Pressable>

      <ProspectionKPIs stats={stats} />

      {/* Story 85.5 — Filtres admin uniquement */}
      {role === 'admin' && (
        <AdminFilters
          contacts={contacts}
          selectedCommercial={filterCommercial}
          selectedStatus={filterStatus}
          onCommercialChange={setFilterCommercial}
          onStatusChange={setFilterStatus}
        />
      )}

      <ClubList clubs={displayClubs} contacts={filteredContacts} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
  header: {
    marginBottom: space.xl,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    color: colors.text.muted,
  },
  loadingText: {
    color    : colors.text.muted,
    textAlign: 'center',
    marginTop: space.xl,
  },
  funnelLink: {
    alignSelf        : 'flex-start',
    backgroundColor  : colors.accent.gold + '22',
    borderColor      : colors.accent.gold,
    borderWidth      : 1,
    borderRadius     : radius.xs,
    paddingHorizontal: space.md,
    paddingVertical  : 8,
    marginBottom     : space.md,
  },
  funnelLinkLabel: {
    color     : colors.text.dark,
    fontWeight: '600' as const,
  },
})
