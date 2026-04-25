// Story 88.2 — Pipeline CRM Clubs Prospects
// Remplace la vue epic 85 (registre commercial_contacts) par le nouveau pipeline multi-contacts.
// Story 97.11 — AdminPageHeader v2 ("Clubs") + ProspectionNavBar
'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  listClubProspects, getProspectPipelineStats, listProfilesByRole,
  type ProspectPipelineStats, type ProfileListRow,
} from '@aureak/api-client'
import type { ClubProspectListRow, ClubProspectStatus } from '@aureak/types'
import { CLUB_PROSPECT_STATUS_LABELS, CLUB_PROSPECT_STATUSES } from '@aureak/types'
import { useAuthStore } from '@aureak/business-logic'
import { ProspectionNavBar } from '../../../../components/admin/prospection/ProspectionNavBar'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
import { ProspectionStatCards } from '../../../../components/admin/prospection/ProspectionStatCards'
import { ProspectTable } from '../../../../components/admin/prospection/ProspectTable'
import { CreateProspectModal } from '../../../../components/admin/prospection/CreateProspectModal'
import { ConvertProspectModal } from '../../../../components/admin/prospection/ConvertProspectModal'
import { LostProspectModal } from '../../../../components/admin/prospection/LostProspectModal'

export default function ProspectionClubsCRMPage() {
  const { width } = useWindowDimensions()
  const isMobile = width <= 640
  const role = useAuthStore(s => s.role)
  const [rows, setRows]             = useState<ClubProspectListRow[]>([])
  const [stats, setStats]           = useState<ProspectPipelineStats>({ total: 0, inClosing: 0, convertedMonth: 0, contactsMonth: 0 })
  const [commercials, setCommercials] = useState<ProfileListRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)

  const [filterStatus, setFilterStatus]         = useState<ClubProspectStatus | null>(null)
  const [filterCommercial, setFilterCommercial] = useState<string | null>(null)
  // Story 88.6 — filtre closing (toggle)
  const [closingOnly, setClosingOnly] = useState(false)
  const [convertTarget, setConvertTarget] = useState<ClubProspectListRow | null>(null)
  const [lostTarget, setLostTarget]       = useState<ClubProspectListRow | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [rowsRes, statsRes, commRes] = await Promise.all([
        listClubProspects({
          status       : filterStatus ?? undefined,
          commercialId : filterCommercial ?? undefined,
        }),
        getProspectPipelineStats(),
        listProfilesByRole({ role: 'commercial', page: 1, pageSize: 100 }),
      ])
      setRows(rowsRes)
      setStats(statsRes)
      setCommercials(commRes.data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionClubsCRMPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterStatus, filterCommercial])

  // Story 88.6 — filtrage closing côté client (après load)
  const displayRows = closingOnly
    ? rows.filter(r => r.status === 'rdv_qualifie' || r.status === 'closing')
    : rows

  const closingCount = rows.filter(r => r.status === 'rdv_qualifie' || r.status === 'closing').length

  const isAdmin = role === 'admin'

  return (
    <View style={st.page}>
      <ProspectionNavBar />

      <ScrollView style={st.scroll} contentContainerStyle={[st.content, isMobile && { padding: 16 }]}>
      <ProspectionStatCards stats={stats} loading={loading} />

      {/* Story 88.6 — pill closing */}
      <View style={st.closingRow}>
        <Pressable
          onPress={() => setClosingOnly(v => !v)}
          style={[st.closingPill, closingOnly && st.closingPillActive] as never}
        >
          <AureakText style={(closingOnly ? st.closingPillActiveLabel : st.closingPillLabel) as never}>
            🔥 CLOSING
          </AureakText>
          <View style={[st.closingCount, closingOnly && st.closingCountActive] as never}>
            <AureakText style={(closingOnly ? st.closingCountActiveLabel : st.closingCountLabel) as never}>
              {closingCount}
            </AureakText>
          </View>
        </Pressable>
        {closingOnly && (
          <AureakText style={st.closingHint as never}>
            Vue filtrée : prospects en rdv_qualifie ou closing — actions rapides Converti/Perdu disponibles.
          </AureakText>
        )}
      </View>

      <View style={st.filtersBlock}>
        <AureakText style={st.filterLabel as never}>Statut</AureakText>
        <View style={st.filterRow}>
          <Pressable onPress={() => setFilterStatus(null)} style={[st.pill, !filterStatus && st.pillActive]}>
            <AureakText style={(!filterStatus ? st.pillActiveLabel : st.pillLabel) as never}>Tous</AureakText>
          </Pressable>
          {CLUB_PROSPECT_STATUSES.map(s => (
            <Pressable key={s} onPress={() => setFilterStatus(s)} style={[st.pill, filterStatus === s && st.pillActive]}>
              <AureakText style={(filterStatus === s ? st.pillActiveLabel : st.pillLabel) as never}>
                {CLUB_PROSPECT_STATUS_LABELS[s]}
              </AureakText>
            </Pressable>
          ))}
        </View>

        {isAdmin && commercials.length > 0 && (
          <>
            <AureakText style={st.filterLabel as never}>Commercial</AureakText>
            <View style={st.filterRow}>
              <Pressable onPress={() => setFilterCommercial(null)} style={[st.pill, !filterCommercial && st.pillActive]}>
                <AureakText style={(!filterCommercial ? st.pillActiveLabel : st.pillLabel) as never}>Tous</AureakText>
              </Pressable>
              {commercials.map(c => (
                <Pressable key={c.userId} onPress={() => setFilterCommercial(c.userId)}
                  style={[st.pill, filterCommercial === c.userId && st.pillActive]}>
                  <AureakText style={(filterCommercial === c.userId ? st.pillActiveLabel : st.pillLabel) as never}>
                    {c.displayName}
                  </AureakText>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      {loading ? (
        <AureakText style={st.loading as never}>Chargement…</AureakText>
      ) : (
        <ProspectTable
          rows={displayRows}
          onConvertClick={closingOnly ? setConvertTarget : undefined}
          onLostClick={closingOnly ? setLostTarget : undefined}
        />
      )}

      <CreateProspectModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => load()}
      />

      {/* Story 88.6 — modales actions rapides */}
      {convertTarget && (
        <ConvertProspectModal
          visible={!!convertTarget}
          clubProspectId={convertTarget.id}
          onClose={() => setConvertTarget(null)}
          onSuccess={() => { setConvertTarget(null); load() }}
        />
      )}
      {lostTarget && (
        <LostProspectModal
          visible={!!lostTarget}
          clubProspectId={lostTarget.id}
          clubName={lostTarget.clubName}
          onClose={() => setLostTarget(null)}
          onSuccess={() => { setLostTarget(null); load() }}
        />
      )}
      </ScrollView>

      <PrimaryAction
        label="Ajouter un prospect"
        onPress={() => setModalOpen(true)}
      />
    </View>
  )
}

const st = StyleSheet.create({
  page   : { flex: 1, backgroundColor: colors.light.primary },
  scroll : { flex: 1 },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },

  filtersBlock: { gap: space.xs },
  filterLabel : { color: colors.text.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: space.sm },
  filterRow   : { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  pill: {
    paddingHorizontal: space.md, paddingVertical: 6,
    borderRadius     : 999,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  pillActive      : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  pillLabel       : { color: colors.text.muted, fontSize: 12 },
  pillActiveLabel : { color: colors.light.surface, fontSize: 12, fontWeight: '700' },

  loading: { color: colors.text.muted, fontStyle: 'italic', fontSize: 13 },

  // Story 88.6 — pill closing
  closingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  closingPill: {
    flexDirection    : 'row',
    alignItems       : 'center',
    gap              : 8,
    paddingHorizontal: space.lg,
    paddingVertical  : 10,
    borderRadius     : 999,
    borderWidth      : 2,
    borderColor      : colors.accent.gold,
    backgroundColor  : colors.light.surface,
  },
  closingPillActive     : { backgroundColor: colors.accent.gold },
  closingPillLabel      : { color: colors.accent.gold, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  closingPillActiveLabel: { color: colors.text.dark, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  closingCount: {
    minWidth         : 24,
    paddingHorizontal: 6,
    paddingVertical  : 2,
    borderRadius     : 999,
    backgroundColor  : colors.accent.gold + '33',
    alignItems       : 'center',
  },
  closingCountActive     : { backgroundColor: colors.text.dark + '22' },
  closingCountLabel      : { color: colors.accent.gold, fontSize: 11, fontWeight: '800' },
  closingCountActiveLabel: { color: colors.text.dark, fontSize: 11, fontWeight: '800' },
  closingHint            : { color: colors.text.muted, fontSize: 12, flex: 1, minWidth: 200 },
})
