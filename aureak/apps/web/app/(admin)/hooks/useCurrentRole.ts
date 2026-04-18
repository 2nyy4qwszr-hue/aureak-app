// Story 86-2 — Hook multi-rôle : rôle actif (client-only, localStorage)
// Le rôle actif ne déclenche AUCUN appel serveur — c'est une préférence UI.
// profiles.user_role reste la source de vérité RLS côté DB.

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@aureak/business-logic'
import type { UserRole } from '@aureak/types'

const STORAGE_KEY = 'aureak_active_role'

type UseCurrentRoleResult = {
  activeRole     : UserRole | null
  setCurrentRole : (role: UserRole) => void
}

/**
 * Retourne le rôle actif persisté dans localStorage['aureak_active_role'].
 * Fallback sur profiles.user_role (useAuthStore.role) si aucune valeur stockée.
 * setCurrentRole écrit dans localStorage puis reload la page (pour forcer
 * l'adaptation de la sidebar + permissions côté client — effective en story 86-4).
 */
export function useCurrentRole(): UseCurrentRoleResult {
  const { role: defaultRole } = useAuthStore()
  const [activeRole, setActiveRole] = useState<UserRole | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as UserRole | null
      setActiveRole(stored ?? defaultRole ?? null)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[useCurrentRole] localStorage read error:', err)
      setActiveRole(defaultRole ?? null)
    }
  }, [defaultRole])

  const setCurrentRole = useCallback((role: UserRole) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, role)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('[useCurrentRole] localStorage write error:', err)
      return
    }
    window.location.reload()
  }, [])

  return { activeRole, setCurrentRole }
}
