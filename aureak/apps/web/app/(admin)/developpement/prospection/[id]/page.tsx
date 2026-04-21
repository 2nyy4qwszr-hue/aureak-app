// Epic 85 — Story 85.4 — Fiche club détaillée + contacts commerciaux
'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import { getClubDirectoryEntry, listCommercialContactsByClub } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { ClubDirectoryEntry, CommercialContactWithCommercial } from '@aureak/types'
import { ContactList } from '../../../../../components/admin/prospection/ContactList'
import { ContactForm } from '../../../../../components/admin/prospection/ContactForm'

export default function ClubDetailPage() {
  const { id }  = useLocalSearchParams<{ id: string }>()
  const router   = useRouter()
  const { role } = useAuthStore()

  const [club, setClub]         = useState<ClubDirectoryEntry | null>(null)
  const [contacts, setContacts] = useState<CommercialContactWithCommercial[]>([])
  const [loading, setLoading]   = useState(true)

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [clubRes, contactsData] = await Promise.all([
        getClubDirectoryEntry(id),
        listCommercialContactsByClub(id),
      ])
      setClub(clubRes.data)
      setContacts(contactsData)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ClubDetail] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <View style={styles.container}>
        <AureakText variant="body" style={styles.loadingText}>Chargement...</AureakText>
      </View>
    )
  }

  if (!club) {
    return (
      <View style={styles.container}>
        <AureakText variant="body" style={styles.loadingText}>Club introuvable.</AureakText>
      </View>
    )
  }

  const isPartner = club.clubRelationType === 'partenaire' || club.clubRelationType === 'associe'
  const canAddContact = role === 'commercial' && !isPartner

  return (
    <View style={styles.container}>
      {/* Bouton retour */}
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        onPress={() => router.back()}
      >
        <AureakText style={styles.backText}>← Prospection</AureakText>
      </Pressable>

      {/* En-tête club */}
      <View style={styles.clubHeader}>
        <View style={styles.clubInfo}>
          <AureakText variant="h1" style={styles.clubName}>{club.nom}</AureakText>
          <View style={styles.metaRow}>
            {club.ville && (
              <AureakText variant="body" style={styles.metaText}>{club.ville}</AureakText>
            )}
            {club.province && (
              <AureakText variant="caption" style={styles.metaText}> — {club.province}</AureakText>
            )}
          </View>
        </View>
        {isPartner && (
          <View style={styles.partnerBadge}>
            <AureakText variant="caption" style={styles.partnerText}>
              Club {club.clubRelationType}
            </AureakText>
          </View>
        )}
      </View>

      {/* Infos de contact du club (depuis club_directory) */}
      {(club.correspondant || club.emailPrincipal || club.telephonePrincipal) && (
        <View style={styles.clubContactCard}>
          <AureakText variant="h3" style={styles.sectionTitle}>Infos club</AureakText>
          {club.correspondant && (
            <AureakText variant="body" style={styles.contactDetail}>
              Correspondant : {club.correspondant}
            </AureakText>
          )}
          {club.emailPrincipal && (
            <AureakText variant="body" style={styles.contactDetail}>
              Email : {club.emailPrincipal}
            </AureakText>
          )}
          {club.telephonePrincipal && (
            <AureakText variant="body" style={styles.contactDetail}>
              Tél : {club.telephonePrincipal}
            </AureakText>
          )}
        </View>
      )}

      {/* Section contacts commerciaux */}
      <View style={styles.section}>
        <AureakText variant="h2" style={styles.sectionTitle}>
          Contacts commerciaux ({contacts.length})
        </AureakText>
        <ContactList contacts={contacts} />
      </View>

      {/* Formulaire ajout (commercial uniquement, pas partenaire) */}
      {canAddContact && (
        <View style={styles.section}>
          <ContactForm clubDirectoryId={club.id} onCreated={loadData} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
    padding        : space.xl,
    maxWidth       : 800,
  },
  loadingText: {
    color    : colors.text.muted,
    textAlign: 'center',
    marginTop: space.xl,
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
  clubHeader: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'flex-start',
    marginBottom  : space.xl,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems   : 'center',
  },
  metaText: {
    color: colors.text.muted,
  },
  partnerBadge: {
    backgroundColor  : colors.border.goldBg,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : radius.xs,
    borderWidth      : 1,
    borderColor      : colors.accent.gold,
  },
  partnerText: {
    color     : colors.accent.gold,
    fontWeight: '700',
  } as never,
  clubContactCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.lg,
    marginBottom   : space.xl,
    // @ts-ignore — web only
    boxShadow      : shadows.sm,
  },
  contactDetail: {
    color    : colors.text.dark,
    marginTop: space.xs,
  },
  section: {
    marginBottom: space.xl,
  },
  sectionTitle: {
    color       : colors.text.dark,
    marginBottom: space.md,
  },
})
