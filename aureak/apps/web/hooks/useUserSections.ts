// Story 86.4 — Hook useUserSections
// Retourne les sections autorisées pour l'utilisateur connecté.
// Réactif au switch de rôle (Zustand). Cache les permissions pour éviter les re-fetch inutiles.

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@aureak/business-logic'
import { getUserPermissions } from '@aureak/api-client'
import type { AppSection } from '@aureak/types'
import { APP_SECTIONS } from '@aureak/types'

type UseUserSectionsResult = {
  /** Sections autorisées (set pour lookup O(1)) */
  allowedSections: Set<AppSection>
  /** Vérifie si une section est autorisée */
  hasSection: (section: AppSection) => boolean
  /** True pendant le chargement initial */
  isLoading: boolean
}

/**
 * useUserSections — retourne les sections autorisées pour l'utilisateur connecté.
 * Se recharge automatiquement quand le rôle actif change (switch rôle Zustand).
 * Admin voit toutes les 9 sections par défaut (fallback si pas de données DB).
 */
export function useUserSections(): UseUserSectionsResult {
  const { user, role } = useAuthStore()
  const [allowedSections, setAllowedSections] = useState<Set<AppSection>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Ref pour éviter les race conditions lors de switchs rapides
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (!user || !role) {
      setAllowedSections(new Set())
      setIsLoading(false)
      return
    }

    const currentFetchId = ++fetchIdRef.current

    const fetchPermissions = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await getUserPermissions(user.id, role)

        // Ignorer si un fetch plus récent a été lancé
        if (currentFetchId !== fetchIdRef.current) return

        if (error || data.length === 0) {
          // Fallback admin : toutes les sections
          if (role === 'admin') {
            setAllowedSections(new Set(APP_SECTIONS))
          } else {
            // Fallback minimal : dashboard uniquement
            setAllowedSections(new Set(['dashboard'] as AppSection[]))
          }
          return
        }

        const enabled = new Set<AppSection>(
          data.filter(p => p.enabled).map(p => p.sectionKey),
        )

        // Dashboard toujours inclus (AC implicite — tout rôle voit le dashboard)
        enabled.add('dashboard')

        setAllowedSections(enabled)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('[useUserSections] fetch error:', err)
        // Fallback : admin → tout, autres → dashboard seul
        if (role === 'admin') {
          setAllowedSections(new Set(APP_SECTIONS))
        } else {
          setAllowedSections(new Set(['dashboard'] as AppSection[]))
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchPermissions()
  }, [user, role]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasSection = useCallback(
    (section: AppSection) => allowedSections.has(section),
    [allowedSections],
  )

  return { allowedSections, hasSection, isLoading }
}
