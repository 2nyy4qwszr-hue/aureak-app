// Story 88.2 — Fiche détail prospect : infos club + contacts + statut
'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  getClubProspect,
  updateClubProspect,
  deleteProspectContact,
  listProspectActions,
} from '@aureak/api-client'
import type { ClubProspectWithContacts, ClubProspectStatus, ProspectAction } from '@aureak/types'
import {
  CLUB_PROSPECT_STATUS_LABELS,
  CLUB_PROSPECT_STATUSES,
  CLUB_CONTACT_ROLE_LABELS,
} from '@aureak/types'
import { ProspectStatusBadge } from '../../../../../components/admin/prospection/ProspectStatusBadge'
import { AddProspectContactModal } from '../../../../../components/admin/prospection/AddProspectContactModal'
import { ProspectTimeline } from '../../../../../components/admin/prospection/ProspectTimeline'
import { AddProspectActionModal } from '../../../../../components/admin/prospection/AddProspectActionModal'
import { ConvertProspectModal } from '../../../../../components/admin/prospection/ConvertProspectModal'

export default function ProspectDetailPage() {
  const { prospectId } = useLocalSearchParams<{ prospectId: string }>()
  const router                              = useRouter()
  const [prospect, setProspect]             = useState<ClubProspectWithContacts | null>(null)
  const [actions, setActions]               = useState<ProspectAction[]>([])
  const [loading, setLoading]               = useState(true)
  const [loadingActions, setLoadingActions] = useState(true)
  const [notFound, setNotFound]             = useState(false)
  const [savingStatus, setSavingStatus]     = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen]   = useState(false)
  const [convertModalOpen, setConvertModalOpen] = useState(false)

  const load = useCallback(async () => {
    if (!prospectId) return
    setLoading(true)
    try {
      const p = await getClubProspect(prospectId)
      if (!p) {
        setNotFound(true)
      } else {
        setProspect(p)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectDetailPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [prospectId])

  const loadActions = useCallback(async () => {
    if (!prospectId) return
    setLoadingActions(true)
    try {
      const list = await listProspectActions(prospectId)
      setActions(list)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectDetailPage] loadActions error:', err)
    } finally {
      setLoadingActions(false)
    }
  }, [prospectId])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadActions() }, [loadActions])

  async function handleStatusChange(nextStatus: ClubProspectStatus) {
    if (!prospect || nextStatus === prospect.status) return
    // Story 88.4 — conversion = flux dédié avec attribution
    if (nextStatus === 'converti') {
      setConvertModalOpen(true)
      return
    }
    setSavingStatus(true)
    try {
      await updateClubProspect({ id: prospect.id, status: nextStatus })
      await Promise.all([load(), loadActions()])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectDetailPage] status error:', err)
    } finally {
      setSavingStatus(false)
    }
  }

  async function handleDeleteContact(contactId: string) {
    try {
      await deleteProspectContact(contactId)
      await load()
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectDetailPage] deleteContact error:', err)
    }
  }

  if (loading) {
    return <View style={st.container}><AureakText style={st.loading as never}>Chargement…</AureakText></View>
  }
  if (notFound || !prospect) {
    return (
      <View style={st.container}>
        <AureakText style={st.loading as never}>Prospect introuvable.</AureakText>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <AureakText style={st.backBtnLabel as never}>← Retour</AureakText>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content}>
      <Pressable onPress={() => router.back()} style={st.backLink}>
        <AureakText style={st.backLinkLabel as never}>← Retour au pipeline</AureakText>
      </Pressable>

      <View style={st.headerCard}>
        <View style={st.headerInfo}>
          <AureakText style={st.clubTitle as never}>{prospect.clubName}</AureakText>
          <AureakText style={st.clubSub as never}>
            {prospect.city ?? '—'} · Commercial : {prospect.assignedDisplayName ?? '—'}
          </AureakText>

          {/* Story 96.1 — bloc Annuaire si prospect rattaché */}
          {prospect.directory ? (
            <View style={st.directoryCard}>
              <AureakText style={st.directoryLabel as never}>ANNUAIRE CLUB</AureakText>
              <AureakText style={st.directoryValue as never}>
                {[
                  prospect.directory.matricule ? `Matricule ${prospect.directory.matricule}` : null,
                  prospect.directory.ville,
                  prospect.directory.province,
                ].filter(Boolean).join(' · ') || '—'}
              </AureakText>
            </View>
          ) : (
            <View style={st.notLinkedWarn}>
              <AureakText style={st.notLinkedWarnLabel as never}>
                ⚠ Club hors annuaire — aucun lien vers club_directory.
              </AureakText>
            </View>
          )}

          <View style={{ marginTop: space.xs }}>
            <ProspectStatusBadge status={prospect.status} />
          </View>
        </View>
      </View>

      <View style={st.section}>
        <AureakText style={st.sectionTitle as never}>Statut pipeline</AureakText>
        <View style={st.chipRow}>
          {CLUB_PROSPECT_STATUSES.map(s => (
            <Pressable
              key={s}
              onPress={() => handleStatusChange(s)}
              disabled={savingStatus}
              style={[st.chip, prospect.status === s && st.chipActive, savingStatus && { opacity: 0.5 }] as never}
            >
              <AureakText style={(prospect.status === s ? st.chipActiveLabel : st.chipLabel) as never}>
                {CLUB_PROSPECT_STATUS_LABELS[s]}
              </AureakText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={st.section}>
        <View style={st.sectionHeader}>
          <AureakText style={st.sectionTitle as never}>Contacts ({prospect.contacts.length})</AureakText>
          <Pressable style={st.addSmallBtn} onPress={() => setContactModalOpen(true)}>
            <AureakText style={st.addSmallBtnLabel as never}>+ Ajouter un contact</AureakText>
          </Pressable>
        </View>

        {prospect.contacts.length === 0 ? (
          <View style={st.emptyState}>
            <AureakText style={st.emptyText as never}>Aucun contact identifié pour ce prospect.</AureakText>
          </View>
        ) : (
          <View style={st.contactList}>
            {prospect.contacts.map(c => (
              <View key={c.id} style={st.contactCard}>
                <View style={{ flex: 1 }}>
                  <View style={st.contactHeader}>
                    <AureakText style={st.contactName as never}>{c.firstName} {c.lastName}</AureakText>
                    {c.isDecisionnaire && (
                      <View style={st.decBadge}>
                        <AureakText style={st.decBadgeLabel as never}>DÉCISIONNAIRE</AureakText>
                      </View>
                    )}
                  </View>
                  <AureakText style={st.contactRole as never}>{CLUB_CONTACT_ROLE_LABELS[c.role]}</AureakText>
                  <View style={st.contactMeta}>
                    {c.email && <AureakText style={st.contactMetaText as never}>📧 {c.email}</AureakText>}
                    {c.phone && <AureakText style={st.contactMetaText as never}>📞 {c.phone}</AureakText>}
                  </View>
                  {c.notes && <AureakText style={st.contactNotes as never}>{c.notes}</AureakText>}
                </View>
                <Pressable onPress={() => handleDeleteContact(c.id)} style={st.delBtn}>
                  <AureakText style={st.delBtnLabel as never}>Supprimer</AureakText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={st.section}>
        <AureakText style={st.sectionTitle as never}>Infos prospect</AureakText>
        <View style={st.metaGrid}>
          <View style={st.metaRow}>
            <AureakText style={st.metaLabel as never}>SOURCE</AureakText>
            <AureakText style={st.metaValue as never}>{prospect.source ?? '—'}</AureakText>
          </View>
          <View style={st.metaRow}>
            <AureakText style={st.metaLabel as never}>CRÉÉ LE</AureakText>
            <AureakText style={st.metaValue as never}>
              {new Date(prospect.createdAt).toLocaleDateString('fr-BE', { day: '2-digit', month: 'long', year: 'numeric' })}
            </AureakText>
          </View>
          {prospect.notes && (
            <View style={[st.metaRow, { width: '100%' }] as never}>
              <AureakText style={st.metaLabel as never}>NOTES</AureakText>
              <AureakText style={st.metaValue as never}>{prospect.notes}</AureakText>
            </View>
          )}
        </View>
      </View>

      <View style={st.section}>
        <View style={st.sectionHeader}>
          <AureakText style={st.sectionTitle as never}>Historique des actions</AureakText>
          <Pressable style={st.addSmallBtn} onPress={() => setActionModalOpen(true)}>
            <AureakText style={st.addSmallBtnLabel as never}>+ Ajouter une action</AureakText>
          </Pressable>
        </View>
        <ProspectTimeline actions={actions} loading={loadingActions} />
      </View>

      <AddProspectContactModal
        visible={contactModalOpen}
        clubProspectId={prospect.id}
        onClose={() => setContactModalOpen(false)}
        onSuccess={() => load()}
      />
      <AddProspectActionModal
        visible={actionModalOpen}
        clubProspectId={prospect.id}
        onClose={() => setActionModalOpen(false)}
        onSuccess={() => loadActions()}
      />
      <ConvertProspectModal
        visible={convertModalOpen}
        clubProspectId={prospect.id}
        onClose={() => setConvertModalOpen(false)}
        onSuccess={() => {
          setConvertModalOpen(false)
          Promise.all([load(), loadActions()])
        }}
      />
    </ScrollView>
  )
}

const st = StyleSheet.create({
  scroll : { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
  container: { flex: 1, padding: space.xl, gap: space.md, backgroundColor: colors.light.primary },
  loading: { color: colors.text.muted, fontStyle: 'italic' },

  backLink: { alignSelf: 'flex-start' },
  backLinkLabel: { color: colors.accent.gold, fontSize: 13, fontWeight: '600' },
  backBtn: { alignSelf: 'flex-start', paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: radius.xs, borderWidth: 1, borderColor: colors.border.divider },
  backBtnLabel: { color: colors.text.dark },

  headerCard: {
    backgroundColor: colors.light.surface,
    borderRadius   : radius.cardLg,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.xl,
    // @ts-ignore
    boxShadow      : shadows.sm,
  },
  headerInfo: { gap: 6 },
  clubTitle : { fontSize: 26, fontFamily: fonts.display, fontWeight: '700', color: colors.text.dark },
  clubSub   : { color: colors.text.muted, fontSize: 13 },

  directoryCard: {
    marginTop        : space.sm,
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    backgroundColor  : colors.accent.gold + '15',
    borderLeftWidth  : 3,
    borderLeftColor  : colors.accent.gold,
    borderRadius     : radius.xs,
    gap              : 2,
  },
  directoryLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  directoryValue: { color: colors.text.dark, fontSize: 13, fontWeight: '600' },
  notLinkedWarn: {
    marginTop        : space.sm,
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    backgroundColor  : colors.status.amberText + '15',
    borderLeftWidth  : 3,
    borderLeftColor  : colors.status.amberText,
    borderRadius     : radius.xs,
  },
  notLinkedWarnLabel: { color: colors.text.dark, fontSize: 12 },

  section      : { gap: space.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  sectionTitle : { color: colors.text.dark, fontSize: 14, fontWeight: '700', fontFamily: fonts.display, letterSpacing: 0.3 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: {
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border.divider,
    backgroundColor: colors.light.surface,
  },
  chipActive     : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  chipLabel      : { color: colors.text.muted, fontSize: 12 },
  chipActiveLabel: { color: colors.light.surface, fontSize: 12, fontWeight: '700' },

  addSmallBtn: {
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius: radius.xs,
    backgroundColor: colors.accent.gold,
  },
  addSmallBtnLabel: { color: colors.text.dark, fontSize: 12, fontWeight: '700' },

  contactList: { gap: space.sm },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
    gap            : space.md,
    alignItems     : 'flex-start',
  },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  contactName  : { color: colors.text.dark, fontSize: 14, fontWeight: '700' },
  contactRole  : { color: colors.text.muted, fontSize: 12, marginTop: 2 },
  contactMeta  : { flexDirection: 'row', gap: space.md, marginTop: 4, flexWrap: 'wrap' },
  contactMetaText: { color: colors.text.subtle, fontSize: 12 },
  contactNotes : { color: colors.text.subtle, fontSize: 12, marginTop: 4, fontStyle: 'italic' },

  decBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: colors.accent.gold,
    borderRadius: radius.xs,
  },
  decBadgeLabel: { color: colors.text.dark, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  delBtn: { paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.xs, borderWidth: 1, borderColor: colors.status.absent },
  delBtnLabel: { color: colors.status.absent, fontSize: 11, fontWeight: '700' },

  metaGrid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.md,
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
    padding        : space.md,
  },
  metaRow  : { gap: 2, minWidth: 180 },
  metaLabel: { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  metaValue: { color: colors.text.dark, fontSize: 13 },

  emptyState: {
    padding        : space.lg,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : radius.card,
    borderWidth    : 1,
    borderColor    : colors.border.light,
  },
  emptyText: { color: colors.text.muted, fontSize: 13, fontStyle: 'italic' },
})
