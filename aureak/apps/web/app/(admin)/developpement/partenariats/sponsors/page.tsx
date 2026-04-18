'use client'
// Story 92-2 — Page Sponsors : liste, filtres, CRUD complet
import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, fonts } from '@aureak/theme'
import { listSponsors, deleteSponsor, getChildDirectoryEntry } from '@aureak/api-client'
import type { Sponsor, SponsorshipType, CapsuleStatus } from '@aureak/types'
import { SPONSORSHIP_TYPES, SPONSORSHIP_TYPE_LABELS, CAPSULE_STATUSES, CAPSULE_STATUS_LABELS } from '@aureak/types'
import { SponsorCard } from './components/SponsorCard'
import { SponsorForm } from './components/SponsorForm'

export default function SponsorsPage() {
  const router = useRouter()
  const [sponsors, setSponsors]     = useState<Sponsor[]>([])
  const [loading, setLoading]       = useState(false)
  const [typeFilter, setTypeFilter] = useState<SponsorshipType | ''>('')
  const [capsFilter, setCapsFilter] = useState<CapsuleStatus | ''>('')
  const [showForm, setShowForm]     = useState(false)
  const [editSponsor, setEditSponsor] = useState<Sponsor | null>(null)
  const [childNames, setChildNames] = useState<Record<string, string>>({})

  const fetchSponsors = useCallback(async () => {
    setLoading(true)
    try {
      const opts: { sponsorshipType?: SponsorshipType; capsuleStatus?: CapsuleStatus } = {}
      if (typeFilter) opts.sponsorshipType = typeFilter
      if (capsFilter) opts.capsuleStatus = capsFilter
      const data = await listSponsors(opts)
      setSponsors(data)

      // Resolve child names via api-client
      const childIds = [...new Set(data.filter(s => s.linkedChildId).map(s => s.linkedChildId as string))]
      if (childIds.length > 0) {
        const names: Record<string, string> = {}
        for (const cid of childIds) {
          try {
            const entry = await getChildDirectoryEntry(cid)
            if (entry) names[cid] = entry.displayName
          } catch {
            // child may have been deleted
          }
        }
        setChildNames(names)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SponsorsPage] list error:', err)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, capsFilter])

  useEffect(() => { fetchSponsors() }, [fetchSponsors])

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce sponsor ?')) return
    try {
      await deleteSponsor(id)
      fetchSponsors()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[SponsorsPage] delete error:', err)
    }
  }

  function handleEdit(s: Sponsor) {
    setEditSponsor(s)
    setShowForm(true)
  }

  function handleFormDone() {
    setShowForm(false)
    setEditSponsor(null)
    fetchSponsors()
  }

  return (
    <View style={styles.container}>
      {/* Back */}
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        onPress={() => router.back()}
      >
        <AureakText style={styles.backText}>← Partenariats</AureakText>
      </Pressable>

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AureakText variant="h1" style={styles.title}>Sponsors</AureakText>
          <AureakText variant="body" style={styles.sub}>
            Gestion des partenariats sponsoring, capsules vidéo et liens joueurs
          </AureakText>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { setEditSponsor(null); setShowForm(!showForm) }}
        >
          <AureakText style={styles.addBtnText}>
            {showForm ? 'Fermer' : '+ Nouveau sponsor'}
          </AureakText>
        </Pressable>
      </View>

      {/* Form */}
      {showForm && (
        <View style={styles.formSection}>
          <SponsorForm
            sponsor={editSponsor}
            onDone={handleFormDone}
            onCancel={() => { setShowForm(false); setEditSponsor(null) }}
          />
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterRow}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as SponsorshipType | '')}
          style={selectStyle}
        >
          <option value="">Tous les types</option>
          {SPONSORSHIP_TYPES.map(t => (
            <option key={t} value={t}>{SPONSORSHIP_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={capsFilter}
          onChange={e => setCapsFilter(e.target.value as CapsuleStatus | '')}
          style={selectStyle}
        >
          <option value="">Toutes les capsules</option>
          {CAPSULE_STATUSES.map(s => (
            <option key={s} value={s}>{CAPSULE_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </View>

      {/* List */}
      {loading ? (
        <AureakText style={styles.emptyText}>Chargement...</AureakText>
      ) : sponsors.length === 0 ? (
        <AureakText style={styles.emptyText}>Aucun sponsor trouvé</AureakText>
      ) : (
        <View style={styles.grid}>
          {sponsors.map(s => (
            <View key={s.id} style={styles.gridItem}>
              <SponsorCard
                sponsor={s}
                childName={s.linkedChildId ? childNames[s.linkedChildId] ?? null : null}
                onEdit={() => handleEdit(s)}
                onDelete={() => handleDelete(s.id)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const selectStyle: React.CSSProperties = {
  padding     : '6px 12px',
  borderRadius: 8,
  border      : `1px solid ${colors.border.light}`,
  fontFamily  : 'inherit',
  fontSize    : 13,
  outline     : 'none',
  background  : colors.light.surface,
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems   : 'flex-start',
    marginBottom : space.lg,
    gap          : space.md,
  },
  title: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  sub: {
    color: colors.text.muted,
  },
  addBtn: {
    backgroundColor  : colors.accent.gold,
    borderRadius     : radius.button,
    paddingVertical  : space.sm,
    paddingHorizontal: space.md,
  },
  addBtnText: {
    color     : colors.text.primary,
    fontWeight: '700',
    fontSize  : 13,
    fontFamily: fonts.display,
  },
  formSection: {
    marginBottom: space.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap          : space.sm,
    marginBottom : space.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
  },
  gridItem: {
    minWidth: 300,
    maxWidth: 400,
    flex    : 1,
  },
  emptyText: {
    color    : colors.text.muted,
    fontSize : 14,
    padding  : space.xl,
    textAlign: 'center',
  },
  backBtn: {
    flexDirection    : 'row',
    alignItems       : 'center',
    alignSelf        : 'flex-start',
    marginBottom     : space.md,
    paddingHorizontal: space.sm,
    paddingVertical  : space.xs,
    borderRadius     : radius.xs,
    backgroundColor  : colors.light.hover,
    borderWidth      : 1,
    borderColor      : colors.border.light,
  },
  backText: {
    color     : colors.text.muted,
    fontSize  : 13,
    fontWeight: '600',
  } as never,
})
