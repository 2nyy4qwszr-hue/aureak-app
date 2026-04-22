'use client'
// Story 92.3 — Récap clubs partenaires (vue synthétique)
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius } from '@aureak/theme'
import {
  listPartnerships,
  listPartnerAccessStats,
  updatePartnership,
} from '@aureak/api-client'
import type { ClubPartnership } from '@aureak/api-client'
import { StatsStandardCard } from '../../../../components/admin/stats'
import { PartnershipCard } from '../../../../components/admin/partenariat/PartnershipCard'
import { PartnershipFormModal } from '../../../../components/admin/partenariat/PartnershipFormModal'

type Filter = 'all' | 'active' | 'inactive'

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all',      label: 'Tous'     },
  { value: 'active',   label: 'Actifs'   },
  { value: 'inactive', label: 'Inactifs' },
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function isActive(p: ClubPartnership, today: string): boolean {
  return p.active_from <= today && (p.active_until === null || p.active_until >= today)
}

export default function PartenariatClubsPage() {
  const [partnerships, setPartnerships] = useState<ClubPartnership[]>([])
  const [stats,        setStats]        = useState<Record<string, number>>({})
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState<Filter>('all')
  const [showModal,    setShowModal]    = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await listPartnerships()
      if (error && process.env.NODE_ENV !== 'production') console.error('[partenariat/clubs] list error:', error)
      const rows = data ?? []
      setPartnerships(rows)
      const statsMap: Record<string, number> = {}
      await Promise.all(
        rows.map(async p => {
          const { count, error: statErr } = await listPartnerAccessStats(p.id)
          if (statErr && process.env.NODE_ENV !== 'production') {
            console.error('[partenariat/clubs] stats error:', statErr)
          }
          statsMap[p.id] = count ?? 0
        }),
      )
      setStats(statsMap)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[partenariat/clubs] load exception:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const today    = todayIso()
  const in30days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  const activeCount    = partnerships.filter(p => isActive(p, today)).length
  const expiringCount  = partnerships.filter(p =>
    isActive(p, today) && p.active_until !== null && p.active_until <= in30days,
  ).length
  const totalAccess30d = Object.values(stats).reduce((a, b) => a + b, 0)
  const totalCount     = partnerships.length

  const filtered = partnerships.filter(p => {
    if (filter === 'active')   return  isActive(p, today)
    if (filter === 'inactive') return !isActive(p, today)
    return true
  })

  const handleRevoke = async (partnership: ClubPartnership) => {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Révoquer le partenariat avec ${partnership.partner_name} ?`)
      : true
    if (!confirmed) return
    const { error } = await updatePartnership(partnership.id, { active_until: today })
    if (error && process.env.NODE_ENV !== 'production') console.error('[partenariat/clubs] revoke error:', error)
    await load()
  }

  return (
    <ScrollView style={s.wrapper} contentContainerStyle={s.content}>
      <View style={s.headerRow}>
        <View style={s.headerText}>
          <AureakText variant="h1" style={s.title}>Clubs partenaires</AureakText>
          <AureakText style={s.subtitle}>
            Vue synthétique des clubs avec accès à la plateforme
          </AureakText>
        </View>
        <Pressable style={s.primaryBtn} onPress={() => setShowModal(true)}>
          <AureakText style={s.primaryBtnLabel}>+ Nouveau partenariat</AureakText>
        </Pressable>
      </View>

      <View style={s.statsRow}>
        <StatsStandardCard label="Partenariats actifs"  value={activeCount}    iconTone="gold"    />
        <StatsStandardCard label="Expirent dans 30j"    value={expiringCount}  iconTone="red"     />
        <StatsStandardCard label="Accès sur 30j"        value={totalAccess30d} iconTone="neutral" />
        <StatsStandardCard label="Total partenariats"   value={totalCount}     iconTone="neutral" />
      </View>

      <View style={s.filterRow}>
        {FILTER_OPTIONS.map(opt => {
          const selected = filter === opt.value
          return (
            <Pressable
              key={opt.value}
              onPress={() => setFilter(opt.value)}
              style={[s.filterChip, selected && s.filterChipActive]}
            >
              <AureakText style={selected ? s.filterChipLabelActive : s.filterChipLabel}>
                {opt.label}
              </AureakText>
            </Pressable>
          )
        })}
      </View>

      {loading ? (
        <View style={s.empty}>
          <AureakText style={s.emptyLabel}>Chargement…</AureakText>
        </View>
      ) : partnerships.length === 0 ? (
        <View style={s.empty}>
          <AureakText variant="h3" style={s.emptyTitle}>Aucun partenariat configuré</AureakText>
          <AureakText style={s.emptyLabel}>
            Les clubs partenaires accèdent à la méthodologie AUREAK selon leur niveau d'abonnement.
          </AureakText>
          <Pressable style={s.primaryBtn} onPress={() => setShowModal(true)}>
            <AureakText style={s.primaryBtnLabel}>Créer le premier partenariat</AureakText>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <AureakText style={s.emptyLabel}>Aucun partenariat ne correspond à ce filtre.</AureakText>
        </View>
      ) : (
        <View style={s.list}>
          {filtered.map(p => (
            <PartnershipCard
              key={p.id}
              partnership={p}
              accessCount30d={stats[p.id] ?? 0}
              onRevoke={handleRevoke}
            />
          ))}
        </View>
      )}

      <PartnershipFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={load}
      />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  wrapper: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    padding: space.lg,
    gap    : space.lg,
  },
  headerRow: {
    flexDirection : 'row',
    alignItems    : 'flex-end',
    justifyContent: 'space-between',
    gap           : space.md,
    flexWrap      : 'wrap',
  },
  headerText: {
    flex: 1,
    gap : 4,
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
  filterRow: {
    flexDirection: 'row',
    gap          : space.xs,
    flexWrap     : 'wrap',
  },
  filterChip: {
    paddingHorizontal: space.md,
    paddingVertical  : 6,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  filterChipActive: {
    borderColor    : colors.accent.gold,
    backgroundColor: colors.border.goldBg,
  },
  filterChipLabel: {
    color     : colors.text.muted,
    fontSize  : 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  filterChipLabelActive: {
    color     : colors.text.dark,
    fontSize  : 12,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  list: {
    gap: space.sm,
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
