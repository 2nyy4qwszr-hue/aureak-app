// Story 90.1 — Pipeline prospection entraîneurs (4 étapes + perdu).
// Remplace le placeholder créé par la story 88.1.
// Story 97.11 — AdminPageHeader v2 ("Entraîneurs") + ProspectionNavBar
'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native'
import { AureakText } from '@aureak/ui'
import { colors, fonts, space, radius, shadows } from '@aureak/theme'
import {
  listCoachProspects, listProfilesByRole,
  type ProfileListRow,
} from '@aureak/api-client'
import type { CoachProspectListRow, CoachProspectStatus } from '@aureak/types'
import { COACH_PROSPECT_STATUS_LABELS, COACH_PROSPECT_STATUSES } from '@aureak/types'
import { useAuthStore } from '@aureak/business-logic'
import { PrimaryAction } from '../../../../components/admin/PrimaryAction'
import { ProspectionNavBar } from '../../../../components/admin/prospection/ProspectionNavBar'
import { FilterSheet } from '../../../../components/admin/FilterSheet'
import { CoachProspectTable } from '../../../../components/admin/coach-prospection/CoachProspectTable'
import { CreateCoachProspectModal } from '../../../../components/admin/coach-prospection/CreateCoachProspectModal'

export default function ProspectionEntraineursPage() {
  const { width } = useWindowDimensions()
  const isMobile = width <= 640
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

  const displayRows = useMemo(() => {
    return allRows.filter(r => {
      if (filterStatus     && r.status !== filterStatus)                    return false
      if (filterCommercial && r.assignedCommercialId !== filterCommercial)  return false
      return true
    })
  }, [allRows, filterStatus, filterCommercial])

  const isAdmin = role === 'admin'

  return (
    <View style={st.page}>
      <ProspectionNavBar />

      <ScrollView style={st.scroll} contentContainerStyle={[st.content, isMobile && { padding: 16 }]}>

      {/* Story 110.x — pills statut/commercial → FilterSheet */}
      <View style={st.controls}>
        <FilterSheet
          activeCount={(filterStatus ? 1 : 0) + (filterCommercial ? 1 : 0)}
          onReset={() => { setFilterStatus(null); setFilterCommercial(null) }}
          triggerLabel="Filtrer les prospects entraîneurs"
        >
          <View style={st.selectField}>
            <AureakText style={st.selectLabel}>Statut</AureakText>
            <select
              value={filterStatus ?? ''}
              onChange={e => setFilterStatus(e.target.value ? (e.target.value as CoachProspectStatus) : null)}
              style={selectNativeStyle}
            >
              <option value="">Tous</option>
              {COACH_PROSPECT_STATUSES.map(s => (
                <option key={s} value={s}>{COACH_PROSPECT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </View>

          {isAdmin && commercials.length > 0 && (
            <View style={st.selectField}>
              <AureakText style={st.selectLabel}>Commercial</AureakText>
              <select
                value={filterCommercial ?? ''}
                onChange={e => setFilterCommercial(e.target.value || null)}
                style={selectNativeStyle}
              >
                <option value="">Tous</option>
                {commercials.map(c => (
                  <option key={c.userId} value={c.userId}>{c.displayName}</option>
                ))}
              </select>
            </View>
          )}
        </FilterSheet>
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

      <PrimaryAction
        label="Ajouter un entraîneur"
        onPress={() => setModalOpen(true)}
      />
    </View>
  )
}

const selectNativeStyle: React.CSSProperties = {
  width        : '100%',
  padding      : '7px 10px',
  fontSize     : 13,
  color        : colors.text.dark,
  background   : colors.light.muted,
  border       : `1px solid ${colors.border.divider}`,
  borderRadius : radius.xs,
  outline      : 'none',
  fontFamily   : fonts.body,
}

const st = StyleSheet.create({
  page   : { flex: 1, backgroundColor: colors.light.primary },
  scroll : { flex: 1 },
  content: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },

  // Story 110.x — controls row (FilterSheet trigger marginLeft auto)
  controls    : { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' },
  selectField : { flexGrow: 1, flexBasis: 160, gap: 4 },
  selectLabel : {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    fontFamily   : fonts.display,
  },

  loading: { color: colors.text.muted, fontStyle: 'italic', fontSize: 13 },
})
