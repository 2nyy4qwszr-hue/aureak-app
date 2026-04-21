// Story 86-2 — Hook multi-rôle : rôles actifs de l'utilisateur connecté
// RÈGLE : accès DB uniquement via @aureak/api-client (listUserRoles).
// Fallback offline : si l'API échoue, retourne le rôle principal de useAuthStore.

import { useEffect, useState } from 'react'
import { listUserRoles } from '@aureak/api-client'
import { useAuthStore } from '@aureak/business-logic'
import type { UserRole } from '@aureak/types'

type UseAvailableRolesResult = {
  roles     : UserRole[]
  isLoading : boolean
  error     : Error | null
}

/**
 * Récupère les rôles actifs (non soft-deleted) de l'utilisateur courant via profile_roles.
 * Fallback : si pas encore résolu ou erreur réseau → rôle principal de useAuthStore.
 * Le composant RoleSwitcher ne s'affiche que si roles.length > 1.
 */
export function useAvailableRoles(): UseAvailableRolesResult {
  const { user, role: defaultRole } = useAuthStore()
  const [roles,     setRoles]     = useState<UserRole[]>(defaultRole ? [defaultRole] : [])
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<Error | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setRoles(defaultRole ? [defaultRole] : [])
      return
    }

    let cancelled = false
    setIsLoading(true)

    const fetch = async () => {
      try {
        const fetched = await listUserRoles(user.id)
        if (cancelled) return
        // Garantir que le rôle principal est inclus même si la table profile_roles
        // n'a pas encore été backfillée pour cet utilisateur (cas edge trigger/backfill).
        const merged = defaultRole && !fetched.includes(defaultRole)
          ? [defaultRole, ...fetched]
          : fetched
        setRoles(merged.length > 0 ? merged : (defaultRole ? [defaultRole] : []))
        setError(null)
      } catch (err) {
        if (cancelled) return
        if (process.env.NODE_ENV !== 'production') console.error('[useAvailableRoles] error:', err)
        setError(err as Error)
        // Dégradation silencieuse : fallback sur rôle principal
        setRoles(defaultRole ? [defaultRole] : [])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetch()

    return () => { cancelled = true }
  }, [user?.id, defaultRole])

  return { roles, isLoading, error }
}
