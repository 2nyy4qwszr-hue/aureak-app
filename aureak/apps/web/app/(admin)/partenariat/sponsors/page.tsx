'use client'
// Story 92.2 — Liste des sponsors (parrainage académie)
// Story 97.13 — AdminPageHeader v2 ("Sponsors") + PartenariatNavBar
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import { listSponsors } from '@aureak/api-client'
import type { SponsorType, SponsorWithCounts } from '@aureak/types'
import { AdminPageHeader } from '../../../../components/admin/AdminPageHeader'
import { PartenariatNavBar } from '../../../../components/admin/partenariat/PartenariatNavBar'
import { StatsStandardCard } from '../../../../components/admin/stats'
import { SponsorFormModal } from '../../../../components/admin/partenariat/SponsorFormModal'

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

export default function PartenariatSponsorsPage() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width <= 640
  const [sponsors,  setSponsors]  = useState<SponsorWithCounts[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await listSponsors()
      if (error && process.env.NODE_ENV !== 'production') console.error('[partenariat/sponsors] list error:', error)
      setSponsors(data ?? [])
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[partenariat/sponsors] load exception:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const activeSponsors     = sponsors.filter(s => s.isActive)
  const activeSponsorCount = activeSponsors.length
  const totalLinksActive   = activeSponsors.reduce((sum, s) => sum + s.activeChildrenCount, 0)
  const totalAnnualCents   = activeSponsors.reduce(
    (sum, s) => sum + (s.annualAmountCents ?? 0),
    0,
  )

  return (
    <View style={st.page}>
      {/* Story 97.13 — AdminPageHeader v2 + PartenariatNavBar */}
      <AdminPageHeader
        title="Sponsors"
        actionButton={{
          label  : '+ Nouveau sponsor',
          onPress: () => setShowModal(true),
        }}
      />
      <PartenariatNavBar />

      <ScrollView style={st.wrapper} contentContainerStyle={[st.content, isMobile && { padding: space.md }]}>
      <View style={st.statsRow}>
        <StatsStandardCard label="Sponsors actifs"          value={activeSponsorCount} iconTone="gold"    />
        <StatsStandardCard label="Parrainages actifs"       value={totalLinksActive}   iconTone="neutral" />
        <StatsStandardCard label="Montant annuel actif"     value={formatEuros(totalAnnualCents)} iconTone="neutral" />
      </View>

      {loading ? (
        <View style={st.empty}>
          <AureakText style={st.emptyLabel}>Chargement…</AureakText>
        </View>
      ) : sponsors.length === 0 ? (
        <View style={st.empty}>
          <AureakText variant="h3" style={st.emptyTitle}>Aucun sponsor configuré</AureakText>
          <AureakText style={st.emptyLabel}>
            Crée un sponsor pour commencer à parrainer des enfants de l'académie.
          </AureakText>
          <Pressable style={st.primaryBtn} onPress={() => setShowModal(true)}>
            <AureakText style={st.primaryBtnLabel}>Créer le premier sponsor</AureakText>
          </Pressable>
        </View>
      ) : (
        <View style={st.list}>
          {sponsors.map(sp => (
            <Pressable
              key={sp.id}
              style={sp.isActive ? st.card : { ...st.card, ...st.cardInactive }}
              onPress={() => router.push(`/partenariat/sponsors/${sp.id}` as never)}
            >
              <View style={st.cardHeader}>
                <AureakText style={st.cardName}>{sp.name}</AureakText>
                <View style={sp.isActive ? { ...st.statusBadge, ...st.statusActive } : { ...st.statusBadge, ...st.statusInactive }}>
                  <AureakText style={sp.isActive ? { ...st.statusLabel, ...st.statusLabelActive } : { ...st.statusLabel, ...st.statusLabelInactive }}>
                    {sp.isActive ? 'Actif' : 'Inactif'}
                  </AureakText>
                </View>
              </View>
              <View style={st.cardMeta}>
                <View style={st.chip}>
                  <AureakText style={st.chipLabel}>{TYPE_LABELS[sp.sponsorType]}</AureakText>
                </View>
                <View style={st.chip}>
                  <AureakText style={st.chipLabel}>
                    {sp.activeChildrenCount} parrainage{sp.activeChildrenCount > 1 ? 's' : ''} actif{sp.activeChildrenCount > 1 ? 's' : ''}
                  </AureakText>
                </View>
                <View style={st.chip}>
                  <AureakText style={st.chipLabel}>{formatEuros(sp.annualAmountCents)} / an</AureakText>
                </View>
              </View>
              <AureakText style={st.seeLink}>Voir la fiche →</AureakText>
            </Pressable>
          ))}
        </View>
      )}

      <SponsorFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={load}
      />
      </ScrollView>
    </View>
  )
}

const st = StyleSheet.create({
  page: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  wrapper: {
    flex: 1,
  },
  content: {
    padding: space.lg,
    gap    : space.lg,
  },
  title: {
    color: colors.text.dark,
  },
  subtitle: {
    color     : colors.text.muted,
    fontSize  : 14,
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
  statsRow: {
    flexDirection: 'row',
    gap          : space.md,
    flexWrap     : 'wrap',
  },
  list: {
    gap: space.sm,
  },
  card: {
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    borderRadius   : radius.card,
    padding        : space.md,
    gap            : space.sm,
    boxShadow      : shadows.sm,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection : 'row',
    alignItems    : 'center',
    justifyContent: 'space-between',
    gap           : space.sm,
  },
  cardName: {
    flex      : 1,
    fontSize  : 16,
    fontWeight: '700',
    color     : colors.text.dark,
    fontFamily: fonts.heading,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap     : 'wrap',
    gap          : space.xs,
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
  seeLink: {
    color     : colors.accent.gold,
    fontSize  : 13,
    fontWeight: '700',
    fontFamily: fonts.body,
    alignSelf : 'flex-end',
  },
  empty: {
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : space.xxl,
    borderRadius   : radius.card,
    backgroundColor: colors.light.surface,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    gap            : space.sm,
  },
  emptyTitle: {
    color: colors.text.dark,
  },
  emptyLabel: {
    color     : colors.text.muted,
    fontSize  : 14,
    textAlign : 'center',
    fontFamily: fonts.body,
  },
})
