// Story 88.2 + 88.3 — Fiche détail prospect : en-tête + contacts + timeline actions
'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { View, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  getClubProspect,
  updateClubProspectStatus,
  listProspectActions,
} from '@aureak/api-client'
import {
  PROSPECT_STATUSES,
  PROSPECT_STATUS_LABELS,
  CLUB_CONTACT_ROLE_LABELS,
} from '@aureak/types'
import type { ClubProspectWithContacts, ProspectStatus, ProspectContact, ProspectAction } from '@aureak/types'
import { AddContactModal } from '../_components/AddContactModal'
import { ProspectTimeline } from '../_components/ProspectTimeline'
import { AddActionModal } from '../_components/AddActionModal'

export default function ProspectDetailPage() {
  const { prospectId } = useLocalSearchParams<{ prospectId: string }>()
  const router = useRouter()
  const [prospect, setProspect]       = useState<ClubProspectWithContacts | null>(null)
  const [actions, setActions]         = useState<ProspectAction[]>([])
  const [loading, setLoading]         = useState(true)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddAction, setShowAddAction]   = useState(false)
  const [statusOpen, setStatusOpen]   = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = useCallback(async () => {
    if (!prospectId) return
    setLoading(true)
    try {
      const [data, actionsData] = await Promise.all([
        getClubProspect(prospectId),
        listProspectActions(prospectId),
      ])
      setProspect(data)
      setActions(actionsData)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectDetailPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [prospectId])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(newStatus: ProspectStatus) {
    if (!prospect) return
    setUpdatingStatus(true)
    try {
      await updateClubProspectStatus(prospect.id, newStatus)
      setProspect(prev => prev ? { ...prev, status: newStatus } : prev)
      setStatusOpen(false)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectDetailPage] status update error:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AureakText variant="body" style={styles.loadingText}>Chargement...</AureakText>
      </View>
    )
  }

  if (!prospect) {
    return (
      <View style={styles.container}>
        <AureakText variant="body" style={styles.loadingText}>Prospect introuvable</AureakText>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <AureakText style={styles.backBtnText}>{'<'} Retour au pipeline</AureakText>
      </Pressable>

      {/* En-tête */}
      <View style={styles.headerCard as object}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <AureakText variant="h1" style={styles.clubName}>{prospect.clubName}</AureakText>
            <AureakText variant="body" style={styles.city}>{prospect.city}</AureakText>
          </View>

          {/* Status dropdown */}
          <View style={styles.statusContainer}>
            <Pressable style={styles.statusBtn} onPress={() => setStatusOpen(!statusOpen)}>
              <AureakText style={styles.statusBtnText}>
                {PROSPECT_STATUS_LABELS[prospect.status]} {statusOpen ? '▲' : '▼'}
              </AureakText>
            </Pressable>
            {statusOpen && (
              <View style={styles.statusDropdown as object}>
                {PROSPECT_STATUSES.map(s => (
                  <Pressable
                    key={s}
                    style={[styles.statusOption, prospect.status === s && styles.statusOptionActive] as never}
                    onPress={() => handleStatusChange(s)}
                    disabled={updatingStatus}
                  >
                    <AureakText style={[styles.statusOptionText, prospect.status === s && styles.statusOptionTextActive] as never}>
                      {PROSPECT_STATUS_LABELS[s]}
                    </AureakText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Meta */}
        {prospect.source && (
          <AureakText style={styles.meta}>Source : {prospect.source}</AureakText>
        )}
        {prospect.notes && (
          <AureakText style={styles.meta}>Notes : {prospect.notes}</AureakText>
        )}
      </View>

      {/* Section Contacts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AureakText variant="h2" style={styles.sectionTitle}>
            Contacts ({prospect.contacts.length})
          </AureakText>
          <Pressable style={styles.addContactBtn} onPress={() => setShowAddContact(true)}>
            <AureakText style={styles.addContactBtnText}>+ Ajouter un contact</AureakText>
          </Pressable>
        </View>

        {prospect.contacts.length === 0 ? (
          <AureakText style={styles.emptyText}>
            Aucun contact. Ajoutez le premier pour cartographier l'organisation du club.
          </AureakText>
        ) : (
          prospect.contacts.map(c => (
            <ContactCard key={c.id} contact={c} />
          ))
        )}
      </View>

      {/* Section Historique des actions (Story 88.3) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AureakText variant="h2" style={styles.sectionTitle}>
            Historique des actions ({actions.length})
          </AureakText>
          <Pressable style={styles.addContactBtn} onPress={() => setShowAddAction(true)}>
            <AureakText style={styles.addContactBtnText}>+ Ajouter une action</AureakText>
          </Pressable>
        </View>
        <ProspectTimeline actions={actions} />
      </View>

      {/* Modale ajout action */}
      <AddActionModal
        visible={showAddAction}
        clubProspectId={prospect.id}
        onClose={() => setShowAddAction(false)}
        onCreated={() => {
          setShowAddAction(false)
          load()
        }}
      />

      {/* Modale ajout contact */}
      <AddContactModal
        visible={showAddContact}
        clubProspectId={prospect.id}
        onClose={() => setShowAddContact(false)}
        onCreated={() => {
          setShowAddContact(false)
          load()
        }}
      />
    </ScrollView>
  )
}

function ContactCard({ contact }: { contact: ProspectContact }) {
  return (
    <View style={styles.contactCard as object}>
      <View style={styles.contactHeader}>
        <AureakText style={styles.contactName}>
          {contact.firstName} {contact.lastName}
        </AureakText>
        {contact.isDecisionnaire && (
          <View style={styles.decisBadge}>
            <AureakText style={styles.decisBadgeText}>Decisionnaire</AureakText>
          </View>
        )}
      </View>
      <View style={styles.contactMeta}>
        <View style={styles.roleBadge}>
          <AureakText style={styles.roleBadgeText}>
            {CLUB_CONTACT_ROLE_LABELS[contact.role]}
          </AureakText>
        </View>
        {contact.email && (
          <AureakText style={styles.contactInfo}>{contact.email}</AureakText>
        )}
        {contact.phone && (
          <AureakText style={styles.contactInfo}>{contact.phone}</AureakText>
        )}
      </View>
      {contact.notes && (
        <AureakText style={styles.contactNotes}>{contact.notes}</AureakText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.xl,
  },
  loadingText: {
    color    : colors.text.muted,
    textAlign: 'center',
    marginTop: space.xl,
  },
  backBtn: {
    marginBottom: space.lg,
  },
  backBtnText: {
    fontSize  : 14,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.accent.gold,
  },

  // Header card
  headerCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.lg,
    marginBottom   : space.xl,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    boxShadow      : shadows.sm,
  },
  headerTop: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'flex-start',
    marginBottom  : space.md,
  },
  headerInfo: {
    flex: 1,
  },
  clubName: {
    color       : colors.text.dark,
    marginBottom: space.xs,
  },
  city: {
    color: colors.text.muted,
  },
  meta: {
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.muted,
    marginTop : space.xs,
  },

  // Status dropdown
  statusContainer: {
    position: 'relative',
    zIndex  : 10,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical  : 8,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  statusBtnText: {
    fontSize  : 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.primary,
  },
  statusDropdown: {
    position       : 'absolute',
    top            : 40,
    right          : 0,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    boxShadow      : shadows.lg,
    minWidth       : 200,
    zIndex         : 20,
  },
  statusOption: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
  },
  statusOptionActive: {
    backgroundColor: colors.light.hover,
  },
  statusOptionText: {
    fontSize  : 13,
    fontFamily: fonts.body,
    color     : colors.text.dark,
  },
  statusOptionTextActive: {
    fontWeight: '700',
    color     : colors.accent.gold,
  },

  // Sections
  section: {
    marginBottom: space.xl,
  },
  sectionHeader: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'center',
    marginBottom  : space.md,
  },
  sectionTitle: {
    color: colors.text.dark,
  },
  addContactBtn: {
    paddingHorizontal: 14,
    paddingVertical  : 6,
    borderRadius     : radius.xs,
    backgroundColor  : colors.accent.gold,
  },
  addContactBtnText: {
    fontSize  : 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.primary,
  },
  emptyText: {
    color    : colors.text.muted,
    fontSize : 13,
    fontFamily: fonts.body,
    fontStyle : 'italic',
  },

  // Contact card
  contactCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    padding        : space.md,
    marginBottom   : space.sm,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    boxShadow      : shadows.sm,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    marginBottom : space.xs,
  },
  contactName: {
    fontSize  : 15,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.text.dark,
  },
  decisBadge: {
    paddingHorizontal: 8,
    paddingVertical  : 2,
    borderRadius     : 10,
    backgroundColor  : colors.status.successBg,
  },
  decisBadgeText: {
    fontSize  : 10,
    fontFamily: fonts.body,
    fontWeight: '700',
    color     : colors.status.successText,
    textTransform: 'uppercase',
  },
  contactMeta: {
    flexDirection: 'row',
    alignItems   : 'center',
    gap          : space.sm,
    flexWrap     : 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical  : 2,
    borderRadius     : 10,
    backgroundColor  : colors.status.infoBg,
  },
  roleBadgeText: {
    fontSize  : 11,
    fontFamily: fonts.body,
    fontWeight: '600',
    color     : colors.status.infoText,
  },
  contactInfo: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
  },
  contactNotes: {
    fontSize  : 12,
    fontFamily: fonts.body,
    color     : colors.text.muted,
    fontStyle : 'italic',
    marginTop : space.xs,
  },

})
