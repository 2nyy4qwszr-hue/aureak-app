'use client'
// Story 87.3 — Onglet ACCÈS complet (remplace le placeholder 87.2).
// Orchestrateur : 3 sections indépendantes (rôles / permissions / historique).
// Garde admin : seul un admin peut voir le contenu ; sinon bloc "Accès refusé".

import { useEffect, useState } from 'react'
import { View, StyleSheet, type TextStyle } from 'react-native'
import { AureakText } from '@aureak/ui'
import { useAuthStore } from '@aureak/business-logic'
import { getEffectivePermissions } from '@aureak/api-client'
import type { UserRow } from '@aureak/api-client'
import type { UserRole } from '@aureak/types'
import { colors, space } from '@aureak/theme'
import { RolesSection }       from './acces/RolesSection'
import { PermissionsSection } from './acces/PermissionsSection'
import { HistoriqueSection }  from './acces/HistoriqueSection'

type AccesTabProps = {
  profile: UserRow
}

export function AccesTab({ profile }: AccesTabProps) {
  const { user, role: authRole } = useAuthStore()
  const [canManageAccess, setCanManageAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user?.id || !authRole) {
      setCanManageAccess(null)
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const perms = await getEffectivePermissions(user.id, authRole as UserRole)
        if (cancelled) return
        setCanManageAccess(perms.admin === true || perms.academie === true)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[AccesTab] permissions error:', err)
        if (!cancelled) setCanManageAccess(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [user?.id, authRole])

  if (canManageAccess === null) {
    return (
      <View style={s.centered}>
        <AureakText variant="body" style={s.muted as TextStyle}>Chargement…</AureakText>
      </View>
    )
  }

  if (canManageAccess === false) {
    return (
      <View style={s.denied}>
        <AureakText variant="h2" style={s.deniedTitle as TextStyle}>Accès refusé</AureakText>
        <AureakText variant="body" style={s.muted as TextStyle}>
          Cette section est réservée aux administrateurs.
        </AureakText>
      </View>
    )
  }

  const activeIsAdmin = authRole === 'admin'

  return (
    <View style={s.wrapper}>
      <RolesSection       profile={profile} canMutate={activeIsAdmin} />
      <PermissionsSection profile={profile} canMutate={activeIsAdmin} selfUserId={user?.id ?? null} />
      <HistoriqueSection  profile={profile} />
    </View>
  )
}

const s = StyleSheet.create({
  wrapper     : { gap: space.md },
  centered    : { padding: space.xl, alignItems: 'center' },
  denied      : {
    padding        : space.xl,
    alignItems     : 'center',
    backgroundColor: colors.light.surface,
    borderRadius   : 12,
    borderWidth    : 1,
    borderColor    : colors.border.divider,
    gap            : space.sm,
  },
  deniedTitle : { color: colors.text.dark },
  muted       : { color: colors.text.muted, textAlign: 'center' },
})
