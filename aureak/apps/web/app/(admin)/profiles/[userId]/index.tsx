'use client'
// Story 87.2 — Fiche personne universelle
// Remplace le stub 87.1 par une fiche role-aware à 3 onglets (Résumé / Activité / Accès).
// Source de vérité : getUserProfile(userId) → passé en props à tous les enfants.

import { useCallback, useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, type TextStyle } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuthStore } from '@aureak/business-logic'
import {
  getUserProfile, listUserRoles, getEffectivePermissions,
} from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import type { UserRole } from '@aureak/types'
import { AureakText } from '@aureak/ui'
import { colors, space } from '@aureak/theme'
import { ProfileHero }   from './_components/ProfileHero'
import { ProfileTabs }   from './_components/ProfileTabs'
import { ResumeTab }     from './_components/ResumeTab'
import { ActiviteTab }   from './_components/ActiviteTab'
import { AccesTab }      from './_components/AccesTab'

export type ProfilePermissions = {
  canReadFiche     : boolean
  canReadEmail     : boolean
  canManageLifecycle: boolean
}

type TabKey = 'resume' | 'activite' | 'acces'

const VALID_TABS: ReadonlyArray<TabKey> = ['resume', 'activite', 'acces']

function parseTab(raw: string | undefined): TabKey {
  if (!raw) return 'resume'
  return (VALID_TABS as readonly string[]).includes(raw) ? (raw as TabKey) : 'resume'
}

export default function UniversalProfilePage() {
  const { userId, tab } = useLocalSearchParams<{ userId: string; tab?: string }>()
  const router          = useRouter()
  const { user, role: authRole } = useAuthStore()

  const [profile,   setProfile]   = useState<UserRow | null>(null)
  const [extraRoles, setExtraRoles] = useState<UserRole[]>([])
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)
  const [perms,     setPerms]     = useState<ProfilePermissions | null>(null)

  const activeTab = parseTab(typeof tab === 'string' ? tab : undefined)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const profileRes = await getUserProfile(userId)
      if (profileRes.error || !profileRes.data) {
        setNotFound(true)
        setProfile(null)
        setExtraRoles([])
        return
      }
      setProfile(profileRes.data)
      setNotFound(false)

      try {
        const roles = await listUserRoles(userId)
        setExtraRoles(roles.filter(r => r !== profileRes.data!.userRole))
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[UniversalProfilePage] listUserRoles error:', err)
        setExtraRoles([])
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[UniversalProfilePage] load error:', err)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  // Permissions — gère accès fiche, lecture email, actions lifecycle
  useEffect(() => {
    if (!user?.id || !authRole) {
      setPerms(null)
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const eff = await getEffectivePermissions(user.id, authRole as UserRole)
        if (cancelled) return
        setPerms({
          canReadFiche     : eff.academie === true || eff.admin === true,
          canReadEmail     : eff.admin === true,
          canManageLifecycle: eff.admin === true,
        })
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[UniversalProfilePage] permissions error:', err)
        if (!cancelled) setPerms({ canReadFiche: false, canReadEmail: false, canManageLifecycle: false })
      }
    }
    run()
    return () => { cancelled = true }
  }, [user?.id, authRole])

  const handleTabChange = (next: TabKey) => {
    router.setParams({ tab: next })
  }

  if (loading || !perms) {
    return (
      <View style={s.centered}>
        <AureakText variant="body" style={s.muted as TextStyle}>Chargement…</AureakText>
      </View>
    )
  }

  if (!perms.canReadFiche) {
    return (
      <View style={s.centered}>
        <AureakText variant="h2" style={s.deniedTitle as TextStyle}>Accès refusé</AureakText>
        <AureakText variant="body" style={s.muted as TextStyle}>
          Contactez votre administrateur pour obtenir l'accès à cette fiche.
        </AureakText>
      </View>
    )
  }

  if (notFound || !profile) {
    return (
      <View style={s.centered}>
        <AureakText variant="h2" style={s.deniedTitle as TextStyle}>Profil introuvable</AureakText>
        <AureakText variant="body" style={s.muted as TextStyle}>userId : {userId ?? '—'}</AureakText>
      </View>
    )
  }

  return (
    <View style={s.page}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <ProfileHero profile={profile} extraRoles={extraRoles} canReadEmail={perms.canReadEmail} />
        <ProfileTabs activeTab={activeTab} onChange={handleTabChange} />
        {activeTab === 'resume'   ? <ResumeTab   profile={profile} perms={perms} onChange={load} /> : null}
        {activeTab === 'activite' ? <ActiviteTab profile={profile} /> : null}
        {activeTab === 'acces'    ? <AccesTab /> : null}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page         : { flex: 1, backgroundColor: colors.light.primary },
  scroll       : { flex: 1 },
  scrollContent: { padding: space.lg, paddingBottom: space.xl, gap: space.md },

  centered   : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.light.primary, gap: space.sm },
  deniedTitle: { color: colors.text.dark },
  muted      : { color: colors.text.muted, textAlign: 'center' },
})
