'use client'
// Story 87.2 — Orchestrateur onglet RÉSUMÉ
// Chaque module décide lui-même s'il se rend selon le rôle du profil,
// évitant un switch/case central qui devrait être maintenu à chaque nouveau rôle.

import { View, StyleSheet } from 'react-native'
import { space } from '@aureak/theme'
import type { UserRow } from '@aureak/api-client'
import type { ProfilePermissions } from '../../../app/(admin)/profiles/[userId]/index'
import { InformationsCompteCard }   from './modules/InformationsCompteCard'
import { PipelineCommercialModule } from './modules/PipelineCommercialModule'
import { AccesEtendusModule }       from './modules/AccesEtendusModule'
import { ContenusMarketingModule }  from './modules/ContenusMarketingModule'
import { GradeCoachModule }         from './modules/GradeCoachModule'
import { ActionsCycleVieCard }      from './modules/ActionsCycleVieCard'

type ResumeTabProps = {
  profile : UserRow
  perms   : ProfilePermissions
  onChange: () => Promise<void>
}

export function ResumeTab({ profile, perms, onChange }: ResumeTabProps) {
  return (
    <View style={s.wrapper}>
      <InformationsCompteCard profile={profile} canReadEmail={perms.canReadEmail} />
      <PipelineCommercialModule profile={profile} />
      <AccesEtendusModule       profile={profile} />
      <ContenusMarketingModule  profile={profile} />
      <GradeCoachModule         profile={profile} />
      <ActionsCycleVieCard
        profile={profile}
        canManageLifecycle={perms.canManageLifecycle}
        onChange={onChange}
      />
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: { gap: space.md },
})
