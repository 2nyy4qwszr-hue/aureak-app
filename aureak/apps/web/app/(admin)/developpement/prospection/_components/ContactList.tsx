// Epic 85 — Story 85.4 — Liste contacts commerciaux d'un club
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, space, radius, shadows } from '@aureak/theme'
import type { CommercialContactWithCommercial } from '@aureak/types'
import { COMMERCIAL_CONTACT_STATUS_LABELS } from '@aureak/types'

interface ContactListProps {
  contacts: CommercialContactWithCommercial[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  premier_contact: { bg: '#DBEAFE', text: '#2563EB' },
  en_cours       : { bg: '#FEF3C7', text: '#D97706' },
  en_attente     : { bg: '#FDE68A', text: '#92400E' },
  pas_de_suite   : { bg: '#FEE2E2', text: '#DC2626' },
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export function ContactList({ contacts }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <View style={styles.empty}>
        <AureakText variant="body" style={styles.emptyText}>
          Aucun contact logué pour ce club.
        </AureakText>
      </View>
    )
  }

  return (
    <View style={styles.list}>
      {contacts.map(contact => {
        const statusCfg = STATUS_COLORS[contact.status] ?? STATUS_COLORS.premier_contact
        return (
          <View key={contact.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.contactInfo}>
                <AureakText variant="h3" style={styles.contactName}>
                  {contact.contactName}
                </AureakText>
                {contact.contactRole && (
                  <AureakText variant="caption" style={styles.contactRole}>
                    {contact.contactRole}
                  </AureakText>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                <AureakText variant="caption" style={{ color: statusCfg.text, fontWeight: '600' } as never}>
                  {COMMERCIAL_CONTACT_STATUS_LABELS[contact.status] ?? contact.status}
                </AureakText>
              </View>
            </View>

            <View style={styles.meta}>
              <AureakText variant="caption" style={styles.metaText}>
                Par {contact.commercialDisplayName} — {formatDate(contact.contactedAt)}
              </AureakText>
            </View>

            {contact.note && (
              <AureakText variant="body" style={styles.note}>
                {contact.note}
              </AureakText>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: space.md,
  },
  card: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    // @ts-ignore — web only
    boxShadow      : shadows.sm,
  },
  cardHeader: {
    flexDirection : 'row',
    justifyContent: 'space-between',
    alignItems    : 'flex-start',
    gap           : space.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: colors.text.dark,
  },
  contactRole: {
    color    : colors.text.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: space.sm,
    paddingVertical  : 3,
    borderRadius     : radius.xs,
  },
  meta: {
    marginTop: space.sm,
  },
  metaText: {
    color: colors.text.muted,
  },
  note: {
    color      : colors.text.dark,
    marginTop  : space.sm,
    lineHeight : 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.border.light,
    paddingLeft    : space.sm,
  },
  empty: {
    padding  : space.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.muted,
  },
})
