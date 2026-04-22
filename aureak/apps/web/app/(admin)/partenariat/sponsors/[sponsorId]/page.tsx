'use client'
// Story 92.2 — Fiche sponsor : infos + enfants parrainés actifs/historique
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  getSponsor,
  listSponsorChildren,
  unlinkChildFromSponsor,
} from '@aureak/api-client'
import type {
  Sponsor,
  SponsorChildLinkWithChild,
  SponsorType,
} from '@aureak/types'
import { SponsorFormModal } from '../../../../../components/admin/partenariat/SponsorFormModal'
import { LinkChildModal }   from '../../../../../components/admin/partenariat/LinkChildModal'

const TYPE_LABELS: Record<SponsorType, string> = {
  entreprise : 'Entreprise',
  individuel : 'Individuel',
  association: 'Association',
  club       : 'Club',
}

function formatEuros(cents: number | null): string {
  if (cents === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(cents / 100)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR')
}

function isSponsorActive(sp: Sponsor): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return sp.activeFrom <= today && (sp.activeUntil === null || sp.activeUntil >= today)
}

export default function SponsorDetailPage() {
  const params   = useLocalSearchParams<{ sponsorId: string }>()
  const router   = useRouter()
  const sponsorId = typeof params.sponsorId === 'string' ? params.sponsorId : ''

  const [sponsor,      setSponsor]      = useState<Sponsor | null>(null)
  const [activeLinks,  setActiveLinks]  = useState<SponsorChildLinkWithChild[]>([])
  const [endedLinks,   setEndedLinks]   = useState<SponsorChildLinkWithChild[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showEdit,     setShowEdit]     = useState(false)
  const [showLink,     setShowLink]     = useState(false)
  const [showHistory,  setShowHistory]  = useState(false)

  const load = async () => {
    if (!sponsorId) return
    setLoading(true)
    try {
      const [sponsorRes, activeRes, allRes] = await Promise.all([
        getSponsor(sponsorId),
        listSponsorChildren(sponsorId, { includeEnded: false }),
        listSponsorChildren(sponsorId, { includeEnded: true  }),
      ])
      if (sponsorRes.error && process.env.NODE_ENV !== 'production') {
        console.error('[partenariat/sponsors/[id]] sponsor error:', sponsorRes.error)
      }
      setSponsor(sponsorRes.data)
      setActiveLinks(activeRes.data)
      setEndedLinks((allRes.data ?? []).filter(l => l.endedAt !== null))
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[partenariat/sponsors/[id]] load exception:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sponsorId])

  const handleRevoke = async (link: SponsorChildLinkWithChild) => {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Révoquer le parrainage de ${link.child.displayName} ?`)
      : true
    if (!confirmed) return
    const { error } = await unlinkChildFromSponsor(link.id)
    if (error && process.env.NODE_ENV !== 'production') console.error('[partenariat/sponsors/[id]] revoke error:', error)
    await load()
  }

  if (loading && !sponsor) {
    return (
      <ScrollView style={st.wrapper} contentContainerStyle={st.content}>
        <AureakText style={st.muted}>Chargement…</AureakText>
      </ScrollView>
    )
  }
  if (!sponsor) {
    return (
      <ScrollView style={st.wrapper} contentContainerStyle={st.content}>
        <AureakText variant="h2" style={st.title}>Sponsor introuvable</AureakText>
        <Pressable onPress={() => router.push('/partenariat/sponsors' as never)}>
          <AureakText style={st.backLink}>← Retour à la liste</AureakText>
        </Pressable>
      </ScrollView>
    )
  }

  const active = isSponsorActive(sponsor)

  return (
    <ScrollView style={st.wrapper} contentContainerStyle={st.content}>
      <Pressable onPress={() => router.push('/partenariat/sponsors' as never)}>
        <AureakText style={st.backLink}>← Retour à la liste</AureakText>
      </Pressable>

      <View style={st.headerCard}>
        <View style={st.headerTop}>
          <View style={{ flex: 1, gap: space.xs }}>
            <AureakText variant="h1" style={st.title}>{sponsor.name}</AureakText>
            <View style={st.metaRow}>
              <View style={st.chip}>
                <AureakText style={st.chipLabel}>{TYPE_LABELS[sponsor.sponsorType]}</AureakText>
              </View>
              <View style={active ? { ...st.statusBadge, ...st.statusActive } : { ...st.statusBadge, ...st.statusInactive }}>
                <AureakText style={active ? { ...st.statusLabel, ...st.statusLabelActive } : { ...st.statusLabel, ...st.statusLabelInactive }}>
                  {active ? 'Actif' : 'Inactif'}
                </AureakText>
              </View>
            </View>
          </View>
          <View style={st.headerActions}>
            <Pressable style={st.secondaryBtn} onPress={() => setShowEdit(true)}>
              <AureakText style={st.secondaryBtnLabel}>Modifier</AureakText>
            </Pressable>
            <Pressable style={st.primaryBtn} onPress={() => setShowLink(true)}>
              <AureakText style={st.primaryBtnLabel}>+ Ajouter un enfant</AureakText>
            </Pressable>
          </View>
        </View>

        <View style={st.infoGrid}>
          <View style={st.infoCell}>
            <AureakText style={st.infoLabel}>Montant annuel</AureakText>
            <AureakText style={st.infoValue}>{formatEuros(sponsor.annualAmountCents)}</AureakText>
          </View>
          <View style={st.infoCell}>
            <AureakText style={st.infoLabel}>Depuis</AureakText>
            <AureakText style={st.infoValue}>{formatDate(sponsor.activeFrom)}</AureakText>
          </View>
          <View style={st.infoCell}>
            <AureakText style={st.infoLabel}>Jusqu'au</AureakText>
            <AureakText style={st.infoValue}>
              {sponsor.activeUntil ? formatDate(sponsor.activeUntil) : 'Sans limite'}
            </AureakText>
          </View>
          <View style={st.infoCell}>
            <AureakText style={st.infoLabel}>Email</AureakText>
            <AureakText style={st.infoValue}>{sponsor.contactEmail ?? '—'}</AureakText>
          </View>
          <View style={st.infoCell}>
            <AureakText style={st.infoLabel}>Téléphone</AureakText>
            <AureakText style={st.infoValue}>{sponsor.contactPhone ?? '—'}</AureakText>
          </View>
        </View>

        {sponsor.notes ? (
          <View style={st.notesBox}>
            <AureakText style={st.infoLabel}>Notes</AureakText>
            <AureakText style={st.notesText}>{sponsor.notes}</AureakText>
          </View>
        ) : null}
      </View>

      <View style={st.section}>
        <View style={st.sectionHeader}>
          <AureakText variant="h3" style={st.sectionTitle}>
            Enfants parrainés ({activeLinks.length})
          </AureakText>
        </View>
        {activeLinks.length === 0 ? (
          <View style={st.emptyInline}>
            <AureakText style={st.muted}>Aucun enfant parrainé pour l'instant.</AureakText>
            <Pressable style={st.primaryBtn} onPress={() => setShowLink(true)}>
              <AureakText style={st.primaryBtnLabel}>Ajouter un enfant</AureakText>
            </Pressable>
          </View>
        ) : (
          <View style={st.linkList}>
            {activeLinks.map(link => (
              <View key={link.id} style={st.linkCard}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AureakText style={st.linkName}>{link.child.displayName}</AureakText>
                  <AureakText style={st.linkMeta}>
                    Depuis {formatDate(link.startedAt)}
                    {link.allocatedAmountCents !== null ? ` · ${formatEuros(link.allocatedAmountCents)}` : ''}
                    {link.child.birthDate ? ` · né(e) le ${formatDate(link.child.birthDate)}` : ''}
                  </AureakText>
                </View>
                <Pressable style={st.revokeBtn} onPress={() => handleRevoke(link)}>
                  <AureakText style={st.revokeLabel}>Révoquer</AureakText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={st.section}>
        <Pressable
          style={st.sectionHeader}
          onPress={() => setShowHistory(v => !v)}
        >
          <AureakText variant="h3" style={st.sectionTitle}>
            Historique ({endedLinks.length})
          </AureakText>
          <AureakText style={st.toggleLink}>
            {showHistory ? 'Masquer' : 'Afficher'}
          </AureakText>
        </Pressable>
        {showHistory && (
          endedLinks.length === 0 ? (
            <AureakText style={st.muted}>Aucun parrainage archivé.</AureakText>
          ) : (
            <View style={st.linkList}>
              {endedLinks.map(link => (
                <View key={link.id} style={{ ...st.linkCard, ...st.linkCardEnded }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AureakText style={st.linkName}>{link.child.displayName}</AureakText>
                    <AureakText style={st.linkMeta}>
                      Du {formatDate(link.startedAt)} au {formatDate(link.endedAt)}
                      {link.allocatedAmountCents !== null ? ` · ${formatEuros(link.allocatedAmountCents)}` : ''}
                    </AureakText>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </View>

      <SponsorFormModal
        visible={showEdit}
        sponsor={sponsor}
        onClose={() => setShowEdit(false)}
        onSuccess={load}
      />
      <LinkChildModal
        visible={showLink}
        sponsorId={sponsor.id}
        onClose={() => setShowLink(false)}
        onSuccess={load}
      />
    </ScrollView>
  )
}

const st = StyleSheet.create({
  wrapper: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.lg,
    gap    : space.lg,
  },
  backLink: {
    color     : colors.accent.gold,
    fontSize  : 13,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  headerCard: {
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderRadius   : radius.card,
    padding        : space.lg,
    gap            : space.md,
    boxShadow      : shadows.sm,
  },
  headerTop: {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    justifyContent: 'space-between',
    gap           : space.md,
    flexWrap      : 'wrap',
  },
  headerActions: {
    flexDirection: 'row',
    gap          : space.sm,
    flexWrap     : 'wrap',
  },
  title: {
    color: colors.text.dark,
  },
  metaRow: {
    flexDirection: 'row',
    gap          : space.xs,
    flexWrap     : 'wrap',
    alignItems   : 'center',
  },
  chip: {
    paddingHorizontal: space.sm,
    paddingVertical  : 4,
    borderRadius     : radius.badge,
    backgroundColor  : colors.border.light,
  },
  chipLabel: {
    color     : colors.text.muted,
    fontSize  : 12,
    fontFamily: fonts.body,
  },
  statusBadge: {
    paddingHorizontal: space.sm,
    paddingVertical  : 2,
    borderRadius     : radius.badge,
  },
  statusActive: {
    backgroundColor: colors.status.successBg,
  },
  statusInactive: {
    backgroundColor: colors.border.light,
  },
  statusLabel: {
    fontSize  : 11,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  statusLabelActive: {
    color: colors.status.successText,
  },
  statusLabelInactive: {
    color: colors.text.muted,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.lg,
  },
  infoCell: {
    gap       : 2,
    minWidth  : 120,
  },
  infoLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color        : colors.text.muted,
    fontFamily   : fonts.body,
  },
  infoValue: {
    fontSize  : 14,
    fontWeight: '600',
    color     : colors.text.dark,
    fontFamily: fonts.body,
  },
  notesBox: {
    gap            : space.xs,
    padding        : space.md,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
  },
  notesText: {
    fontSize  : 13,
    color     : colors.text.dark,
    fontFamily: fonts.body,
  },
  primaryBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
  },
  primaryBtnLabel: {
    color     : colors.text.onGold,
    fontWeight: '700',
    fontSize  : 14,
    fontFamily: fonts.body,
  },
  secondaryBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  secondaryBtnLabel: {
    color     : colors.text.dark,
    fontWeight: '700',
    fontSize  : 14,
    fontFamily: fonts.body,
  },
  section: {
    gap: space.sm,
  },
  sectionHeader: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text.dark,
  },
  toggleLink: {
    color     : colors.accent.gold,
    fontSize  : 13,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  linkList: {
    gap: space.sm,
  },
  linkCard: {
    flexDirection : 'row',
    alignItems    : 'center',
    gap           : space.md,
    padding       : space.md,
    borderRadius  : radius.card,
    backgroundColor: colors.light.surface,
    borderWidth   : 1,
    borderColor   : colors.border.divider,
    boxShadow     : shadows.sm,
  },
  linkCardEnded: {
    opacity: 0.7,
  },
  linkName: {
    fontSize  : 15,
    fontWeight: '700',
    color     : colors.text.dark,
    fontFamily: fonts.body,
  },
  linkMeta: {
    fontSize  : 12,
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  revokeBtn: {
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : radius.button,
    borderWidth      : 1,
    borderColor      : colors.status.errorBorder,
    backgroundColor  : colors.status.errorBg,
  },
  revokeLabel: {
    fontSize  : 13,
    fontWeight: '700',
    color     : colors.status.errorText,
    fontFamily: fonts.body,
  },
  emptyInline: {
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.xl,
    borderRadius   : radius.card,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    gap            : space.sm,
  },
  muted: {
    color     : colors.text.muted,
    fontSize  : 14,
    fontFamily: fonts.body,
  },
})
