import React, { createContext, useContext, useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface BreadcrumbContextValue {
  /** Map segment → label humain résolu dynamiquement par les pages de détail */
  labels  : Record<string, string>
  /** Appelé depuis une page de détail après chargement de l'entité */
  setLabel: (segment: string, label: string) => void
}

// ── Context ──────────────────────────────────────────────────────────────────

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({})

  const setLabel = useCallback((segment: string, label: string) => {
    setLabels(prev => {
      // Éviter re-render si label identique
      if (prev[segment] === label) return prev
      return { ...prev, [segment]: label }
    })
  }, [])

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useBreadcrumbContext(): BreadcrumbContextValue {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) throw new Error('useBreadcrumbContext must be used inside BreadcrumbProvider')
  return ctx
}

export default BreadcrumbProvider
