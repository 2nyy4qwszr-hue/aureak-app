// Story 88.2 — Pipeline CRM Clubs Prospects
// Remplace la vue epic 85 (registre commercial_contacts) par le nouveau pipeline multi-contacts.
'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  listClubProspects, getProspectPipelineStats, listProfilesByRole,
  type ProspectPipelineStats, type ProfileListRow,
} from '@aureak/api-client'
import type { ClubProspectListRow, ClubProspectStatus } from '@aureak/types'
import { CLUB_PROSPECT_STATUS_LABELS, CLUB_PROSPECT_STATUSES } from '@aureak/types'
import { useAuthStore } from '@aureak/business-logic'
import { ProspectionStatCards } from '../../../../../components/admin/prospection/ProspectionStatCards'
import { ProspectTable } from '../../../../../components/admin/prospection/ProspectTable'
import { CreateProspectModal } from '../../../../../components/admin/prospection/CreateProspectModal'

export default function ProspectionClubsCRMPage() {
  const role = useAuthStore(s => s.role)
  const [rows, setRows]             = useState<ClubProspectListRow[]>([])
  const [stats, setStats]           = useState<ProspectPipelineStats>({ total: 0, inClosing: 0, convertedMonth: 0, contactsMonth: 0 })
  const [commercials, setCommercials] = useState<ProfileListRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)

  const [filterStatus, setFilterStatus]         = useState<ClubProspectStatus | null>(null)
  const [filterCommercial, setFilterCommercial] = useState<string | null>(null)

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

  const isAdmin = role === 'admin'

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content}>
      <View style={st.header}>
        <View style={st.headerText}>
          <AureakText variant="h1" style={st.title as never}>Pipeline Clubs</AureakText>
          <AureakText variant="body" style={st.sub as never}>
            Prospection CRM — cartographie organisationnelle et suivi pipeline
          </AureakText>
        </View>
        <Pressable style={st.addBtn} onPress={() => setModalOpen(true)}>
          <AureakText style={st.addBtnLabel as never}>+ Ajouter un prospect</AureakText>
        </Pressable>
      </View>

      <ProspectionStatCards stats={stats} loading={loading} />

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
        <ProspectTable rows={rows} />
      )}

      <CreateProspectModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => load()}
      />
    </ScrollView>
  )
}

const st = StyleSheet.create({
  scroll : { flex: 1, backgroundColor: colors.light.primary },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },

  header    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  headerText: { gap: 4, flex: 1, minWidth: 240 },
  title     : { color: colors.text.dark, fontWeight: '700', fontFamily: fonts.display },
  sub       : { color: colors.text.muted, fontSize: 13 },

  addBtn: {
    paddingHorizontal: space.lg,
    paddingVertical  : space.sm,
    borderRadius     : radius.button,
    backgroundColor  : colors.accent.gold,
    // @ts-ignore RN web
    boxShadow        : shadows.sm,
  },
  addBtnLabel: { color: colors.text.dark, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },

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
})
