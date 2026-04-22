'use client'
// Story 99.1 — Hub /administration : 5 cartes (utilisateurs, paramètres, conformité, communication, exports)
import React from 'react'
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import {
  UsersIcon,
  LockIcon,
  ShieldIcon,
  MessageSquareIcon,
  LayersIcon,
} from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { AdminPageHeader } from '../../../components/admin/AdminPageHeader'
import { AdministrationHubCard } from '../../../components/admin/administration/AdministrationHubCard'

type GroupConfig = {
  Icon       : React.ComponentType<{ color: string; size?: number; strokeWidth?: number }>
  title      : string
  description: string
  href       : string
}

const GROUPS: GroupConfig[] = [
  {
    Icon       : UsersIcon,
    title      : 'Utilisateurs & accès',
    description: 'Comptes, grades, onboarding et liste d\'attente.',
    href       : '/users',
  },
  {
    Icon       : LockIcon,
    title      : 'Paramètres académie',
    description: 'Permissions globales et calendrier scolaire.',
    href       : '/administration/parametres/permissions',
  },
  {
    Icon       : ShieldIcon,
    title      : 'Conformité (RGPD & Audit)',
    description: 'RGPD, audit, anomalies et accès prospects.',
    href       : '/administration/conformite/rgpd',
  },
  {
    Icon       : MessageSquareIcon,
    title      : 'Communication',
    description: 'Tickets support et messages coaches.',
    href       : '/administration/communication/tickets',
  },
  {
    Icon       : LayersIcon,
    title      : 'Exports',
    description: 'Export CSV, Excel et rapports académie.',
    href       : '/administration/exports',
  },
]

const TABLET_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1024

export default function AdministrationHubPage() {
  const { width } = useWindowDimensions()
  const columns   = width >= DESKTOP_BREAKPOINT ? 3 : width >= TABLET_BREAKPOINT ? 2 : 1
  const gap       = space.md
  const cardFlex  = `1 1 calc((100% - ${gap * (columns - 1)}px) / ${columns})`

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <AdminPageHeader title="Administration" />

      <View style={[s.grid, { gap }] as never}>
        {GROUPS.map(group => (
          <View key={group.href} style={{ flex: 1, minWidth: 240, maxWidth: '100%' } as never}>
            <AdministrationHubCard
              Icon={group.Icon as never}
              title={group.title}
              description={group.description}
              href={group.href}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: colors.light.primary,
  },
  content: {
    paddingBottom: space.xl,
  },
  grid: {
    flexDirection    : 'row',
    flexWrap         : 'wrap',
    paddingHorizontal: 36,
    paddingTop       : space.lg,
  },
})
