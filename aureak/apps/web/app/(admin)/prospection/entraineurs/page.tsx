// Story 90.1 — Pipeline prospection entraîneurs (4 étapes + perdu).
// Remplace le placeholder créé par la story 88.1.
'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  listCoachProspects, listProfilesByRole,
  type ProfileListRow,
} from '@aureak/api-client'
import type { CoachProspectListRow, CoachProspectStatus } from '@aureak/types'
import { COACH_PROSPECT_STATUS_LABELS, COACH_PROSPECT_STATUSES } from '@aureak/types'
import { useAuthStore } from '@aureak/business-logic'
import { CoachProspectionStatCards, type CoachProspectionStats } from '../../../../components/admin/coach-prospection/CoachProspectionStatCards'
import { CoachProspectTable } from '../../../../components/admin/coach-prospection/CoachProspectTable'
import { CreateCoachProspectModal } from '../../../../components/admin/coach-prospection/CreateCoachProspectModal'

function startOfQuarter(d: Date): Date {
  const month = d.getMonth()
  const qStart = month - (month % 3)
  return new Date(d.getFullYear(), qStart, 1)
}

function computeStats(rows: CoachProspectListRow[]): CoachProspectionStats {
  const quarterStart = startOfQuarter(new Date()).getTime()
  let inFormation = 0, activeQuarter = 0, lost = 0
  for (const r of rows) {
    if (r.status === 'en_formation') inFormation++
    if (r.status === 'perdu')        lost++
    if (r.status === 'actif' && new Date(r.updatedAt).getTime() >= quarterStart) {
      activeQuarter++
    }
  }
  return { total: rows.length, inFormation, activeQuarter, lost }
}

export default function ProspectionEntraineursPage() {
  const role = useAuthStore(s => s.role)
  const [allRows, setAllRows]         = useState<CoachProspectListRow[]>([])
  const [commercials, setCommercials] = useState<ProfileListRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)

  const [filterStatus, setFilterStatus]         = useState<CoachProspectStatus | null>(null)
  const [filterCommercial, setFilterCommercial] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rowsRes, commRes] = await Promise.all([
        listCoachProspects(),
        listProfilesByRole({ role: 'commercial', page: 1, pageSize: 100 }),
      ])
      setAllRows(rowsRes)
      setCommercials(commRes.data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[ProspectionEntraineursPage] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const stats = useMemo(() => computeStats(allRows), [allRows])

  const displayRows = useMemo(() => {
    return allRows.filter(r => {
      if (filterStatus     && r.status !== filterStatus)                    return false
      if (filterCommercial && r.assignedCommercialId !== filterCommercial)  return false
      return true
    })
  }, [allRows, filterStatus, filterCommercial])

  const isAdmin = role === 'admin'

  return (
    <ScrollView style={st.scroll} contentContainerStyle={st.content}>
      <View style={st.header}>
        <View style={st.headerText}>
          <AureakText variant="h1" style={st.title as never}>Pipeline Entraîneurs</AureakText>
          <AureakText variant="body" style={st.sub as never}>
            Prospection coachs — 4 étapes (identifié → info → formation → actif)
          </AureakText>
        </View>
        <Pressable style={st.addBtn} onPress={() => setModalOpen(true)}>
          <AureakText style={st.addBtnLabel as never}>+ Ajouter un entraîneur</AureakText>
        </Pressable>
      </View>

      <CoachProspectionStatCards stats={stats} loading={loading} />

      <View style={st.filtersBlock}>
        <AureakText style={st.filterLabel as never}>Statut</AureakText>
        <View style={st.filterRow}>
          <Pressable onPress={() => setFilterStatus(null)} style={[st.pill, !filterStatus && st.pillActive]}>
            <AureakText style={(!filterStatus ? st.pillActiveLabel : st.pillLabel) as never}>Tous</AureakText>
          </Pressable>
          {COACH_PROSPECT_STATUSES.map(s => (
            <Pressable key={s} onPress={() => setFilterStatus(s)} style={[st.pill, filterStatus === s && st.pillActive]}>
              <AureakText style={(filterStatus === s ? st.pillActiveLabel : st.pillLabel) as never}>
                {COACH_PROSPECT_STATUS_LABELS[s]}
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
        <CoachProspectTable rows={displayRows} />
      )}

      <CreateCoachProspectModal
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
    paddingHorizontal: space.md,
    paddingVertical  : space.xs,
    borderRadius     : radius.badge,
    borderWidth      : 1,
    borderColor      : colors.border.divider,
    backgroundColor  : colors.light.surface,
  },
  pillActive      : { backgroundColor: colors.accent.gold, borderColor: colors.accent.gold },
  pillLabel       : { color: colors.text.muted, fontSize: 12 },
  pillActiveLabel : { color: colors.light.surface, fontSize: 12, fontWeight: '700' },

  loading: { color: colors.text.muted, fontStyle: 'italic', fontSize: 13 },
})
