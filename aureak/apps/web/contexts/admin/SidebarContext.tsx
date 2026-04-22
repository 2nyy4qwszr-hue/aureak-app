// Story 100.3 — SidebarContext
// Partage l'état ouvert/fermé de la sidebar admin entre AdminTopbar (burger mobile)
// et le drawer (Story 100.1). Remplace l'état local `mobileOpen` de `_layout.tsx`.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface SidebarContextValue {
  isOpen: boolean
  open   : () => void
  close  : () => void
  toggle : () => void
}

const SidebarCtx = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open   = useCallback(() => setIsOpen(true), [])
  const close  = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(v => !v), [])

  const value = useMemo<SidebarContextValue>(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])

  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarCtx)
  if (!ctx) {
    // Fallback silencieux : composant utilisé hors Provider (ex. test isolé)
    return {
      isOpen: false,
      open  : () => {},
      close : () => {},
      toggle: () => {},
    }
  }
  return ctx
}
