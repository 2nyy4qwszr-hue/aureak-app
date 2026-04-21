// Story 86-4 — Hook permissions effectives (combinaison rôle actif + overrides user)
// RÈGLE : accès DB uniquement via @aureak/api-client.getEffectivePermissions.
// Fallback offline : si l'API échoue, on retourne `null` → sidebar affiche skeleton
// brièvement, puis décide en fonction de fallback interne (voir _layout.tsx).

import { useEffect, useState } from 'react'
import { getEffectivePermissions } from '@aureak/api-client'
import type { EffectivePermissions, UserRole } from '@aureak/types'

type UseEffectivePermissionsResult = {
  permissions : EffectivePermissions | null
  isLoading   : boolean
  error       : Error | null
}

/**
 * useEffectivePermissions — charge la carte {sectionKey → granted} pour
 * (profileId, activeRole). Refetch si l'un des deux change (ex: switch de rôle).
 *
 * Composé par la sidebar dans `_layout.tsx` :
 *   buildNavGroups(activeRole, permissions)
 */
export function useEffectivePermissions(
  profileId : string | null | undefined,
  activeRole: UserRole | null | undefined,
): UseEffectivePermissionsResult {
  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null)
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState<Error | null>(null)

  useEffect(() => {
    if (!profileId || !activeRole) {
      setPermissions(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const fetch = async () => {
      try {
        const result = await getEffectivePermissions(profileId, activeRole)
        if (cancelled) return
        setPermissions(result)
        setError(null)
      } catch (err) {
        if (cancelled) return
        if (process.env.NODE_ENV !== 'production') console.error('[useEffectivePermissions] error:', err)
        setError(err as Error)
        // Dégradation silencieuse : on laisse permissions à null, la sidebar décide.
        setPermissions(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetch()

    return () => { cancelled = true }
  }, [profileId, activeRole])

  return { permissions, isLoading, error }
}
