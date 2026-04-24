'use client'
import { useEffect, useState } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export const BREAKPOINTS = {
  mobileMax : 639,
  tabletMax : 1023,
} as const

function getBreakpoint(width: number): Breakpoint {
  if (width <= BREAKPOINTS.mobileMax) return 'mobile'
  if (width <= BREAKPOINTS.tabletMax) return 'tablet'
  return 'desktop'
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window === 'undefined' ? 'desktop' : getBreakpoint(window.innerWidth)
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => setBp(getBreakpoint(window.innerWidth))
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return bp
}

export function useIsMobile(): boolean {
  return useBreakpoint() === 'mobile'
}
