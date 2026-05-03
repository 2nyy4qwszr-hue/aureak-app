'use client'
// Story 108.2 — Page Séances refondue : filtres alignés /presences (jour/semaine/mois
// + implantation + groupe) et tableau pagination (TableauSeances).
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { AureakText } from '@aureak/ui'
import { colors, fonts, radius, space } from '@aureak/theme'
import { listImplantations, listAllGroups } from '@aureak/api-client'
import type { Implantation } from '@aureak/types'

import { ActivitesHeader }        from '../../../../components/admin/activites/ActivitesHeader'
import { ActivitesCountsContext } from '../_layout'
import { TableauSeances }         from '../../../../components/admin/activites/TableauSeances'
import { PrimaryAction }          from '../../../../components/admin/PrimaryAction'
import { FilterSheet }            from '../../../../components/admin/FilterSheet'

type TimeView = 'day' | 'week' | 'month'

type GroupRef = { id: string; name: string; implantationId: string }

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function computeRange(view: TimeView): { from: string; to: string } {
  const now   = new Date()
  const start = new Date(now)
  const end   = new Date(now)

  if (view === 'day') {
    // start = end = today
  } else if (view === 'week') {
    const day = now.getDay()
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    end.setTime(start.getTime())
    end.setDate(start.getDate() + 6)
  } else {
    start.setDate(1)
    end.setMonth(end.getMonth() + 1, 0)
  }

  return { from: toDateStr(start), to: toDateStr(end) }
}

export default function SeancesPage() {
  const router        = useRouter()
  const activitesCnts = useContext(ActivitesCountsContext)

  const [timeView,       setTimeView]       = useState<TimeView>('week')
  const [implantationId, setImplantationId] = useState('')
  const [groupId,        setGroupId]        = useState('')

  const [implantations, setImplantations] = useState<Implantation[]>([])
  const [groups,        setGroups]        = useState<GroupRef[]>([])

  useEffect(() => {
    listImplantations().then(({ data }) => setImplantations(data ?? [])).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[seances/page] listImplantations error:', err)
    })
    listAllGroups().then(g => setGroups((g ?? []).map(gr => ({
      id            : gr.id,
      name          : gr.name,
      implantationId: gr.implantationId,
    })))).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('[seances/page] listAllGroups error:', err)
    })
  }, [])

  useEffect(() => { setGroupId('') }, [implantationId])

  const filteredGroups = useMemo(
    () => implantationId ? groups.filter(g => g.implantationId === implantationId) : groups,
    [implantationId, groups],
  )

  const { from, to } = useMemo(() => computeRange(timeView), [timeView])

  // Story 110.2 — count filtres actifs (implantation + groupe), période exclue
  const activeFilterCount = (implantationId ? 1 : 0) + (groupId ? 1 : 0)

  const resetFilters = () => {
    setImplantationId('')
    setGroupId('')
  }

  // Story 110.3 — URL "new séance" préfilled avec contexte filtré courant
  const buildNewSessionUrl = () => {
    const params = new URLSearchParams()
    if (from)           params.set('from', from)
    if (to)             params.set('to', to)
    if (implantationId) params.set('implantationId', implantationId)
    if (groupId)        params.set('groupId', groupId)
    const qs = params.toString()
    return qs ? `/activites/seances/new?${qs}` : '/activites/seances/new'
  }

  return (
    <View style={styles.container}>
      <ActivitesHeader counts={activitesCnts ?? undefined} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.controls}>
          <View style={styles.timeToggle}>
            {(['day', 'week', 'month'] as TimeView[]).map(v => {
              const active = timeView === v
              return (
                <Pressable
                  key={v}
                  onPress={() => setTimeView(v)}
                  style={[styles.timeToggleBtn, active && styles.timeToggleBtnActive]}
                >
                  <AureakText
                    style={[styles.timeToggleText, active && styles.timeToggleTextActive] as never}
                  >
                    {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : 'Mois'}
                  </AureakText>
                </Pressable>
              )
            })}
          </View>

          <FilterSheet activeCount={activeFilterCount} onReset={resetFilters} triggerLabel="Filtrer les séances">
            <View style={styles.selectField}>
              <AureakText style={styles.selectLabel}>Implantation</AureakText>
              <select
                value={implantationId}
                onChange={e => setImplantationId(e.target.value)}
                style={selectNativeStyle}
              >
                <option value=''>Toutes</option>
                {implantations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </View>

            <View style={styles.selectField}>
              <AureakText style={styles.selectLabel}>Groupe</AureakText>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value)}
                style={selectNativeStyle}
              >
                <option value=''>Tous</option>
                {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </View>
          </FilterSheet>
        </View>

        <TableauSeances
          from          ={from}
          to            ={to}
          implantationId={implantationId || undefined}
          groupId       ={groupId        || undefined}
          onAddSession  ={() => router.push(buildNewSessionUrl() as never)}
        />
      </ScrollView>

      <PrimaryAction
        label="Nouvelle séance"
        onPress={() => router.push(buildNewSessionUrl() as never)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.primary },
  scroll   : { flex: 1, backgroundColor: colors.light.primary },
  content  : { paddingTop: space.md, paddingBottom: 64, gap: space.md },

  controls: {
    flexDirection    : 'row',
    flexWrap         : 'wrap',
    gap              : space.md,
    paddingHorizontal: space.lg,
    alignItems       : 'center',
  },

  timeToggle: {
    flexDirection  : 'row',
    gap            : 4,
    backgroundColor: colors.light.muted,
    borderRadius   : radius.xs,
    padding        : 3,
  },
  timeToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical  : 5,
    borderRadius     : radius.xs - 2,
    borderWidth      : 1,
    borderColor      : 'transparent',
  },
  timeToggleBtnActive: {
    backgroundColor: colors.light.surface,
    borderColor    : colors.border.divider,
  },
  timeToggleText: {
    fontSize  : 12,
    color     : colors.text.muted,
    fontFamily: fonts.body,
  },
  timeToggleTextActive: {
    color     : colors.text.dark,
    fontWeight: '600',
  },

  selectField: {
    flexGrow : 1,
    flexBasis: 160,
    gap      : 4,
  },
  selectLabel: {
    fontSize     : 10,
    fontWeight   : '700',
    color        : colors.text.subtle,
    letterSpacing: 1,
    textTransform: 'uppercase' as never,
    fontFamily   : fonts.display,
  },
})
