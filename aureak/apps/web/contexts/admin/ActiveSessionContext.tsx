// Story 61.2 — ActiveSessionContext
// Contexte séance active : détection de la séance en cours + compteur présents via Realtime
// RÈGLE : cleanup Realtime OBLIGATOIRE + clearInterval OBLIGATOIRE
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getActiveSessionForCoach, supabase } from '@aureak/api-client'
import type { ActiveSessionInfo } from '@aureak/api-client'

// ── Types ────────────────────────────────────────────────────────────────────

interface ActiveSessionContextValue {
  activeSession: ActiveSessionInfo | null
  presentCount : number
  totalCount   : number
  startedAt    : Date | null
  refresh      : () => void
}

// ── Context ──────────────────────────────────────────────────────────────────

const ActiveSessionCtx = createContext<ActiveSessionContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function ActiveSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(null)
  const [presentCount,  setPresentCount]  = useState(0)
  const [totalCount,    setTotalCount]    = useState(0)
  const [startedAt,     setStartedAt]     = useState<Date | null>(null)
  const cancelledRef = useRef(false)

  const fetchSession = useCallback(async () => {
    try {
      const session = await getActiveSessionForCoach()
      if (cancelledRef.current) return
      if (session) {
        setActiveSession(session)
        setPresentCount(session.presentCount)
        setTotalCount(session.totalCount)
        setStartedAt(new Date(session.scheduledAt))
      } else {
        setActiveSession(null)
        setPresentCount(0)
        setTotalCount(0)
        setStartedAt(null)
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ActiveSessionContext] fetchSession error:', err)
      }
    }
  }, [])

  // Fetch au montage
  useEffect(() => {
    cancelledRef.current = false
    fetchSession()
    return () => { cancelledRef.current = true }
  }, [fetchSession])

  // Abonnement Realtime sur attendances pour mise à jour presentCount (AC4)
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const subscribe = () => {
      if (!activeSession) return
      channel = supabase
        .channel(`hud-attendances-${activeSession.sessionId}`)
        .on(
          'postgres_changes',
          {
            event : '*',
            schema: 'public',
            table : 'session_attendees',
            filter: `session_id=eq.${activeSession.sessionId}`,
          },
          (_payload) => {
            // Recharge complète pour avoir le compte exact
            fetchSession()
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            if (process.env.NODE_ENV !== 'production') {
              console.error('[ActiveSessionContext] Realtime channel error')
            }
          }
        })
    }

    subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    }
  }, [activeSession?.sessionId, fetchSession]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ActiveSessionCtx.Provider value={{
      activeSession,
      presentCount,
      totalCount,
      startedAt,
      refresh: fetchSession,
    }}>
      {children}
    </ActiveSessionCtx.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useActiveSession(): ActiveSessionContextValue {
  const ctx = useContext(ActiveSessionCtx)
  if (!ctx) {
    throw new Error('[useActiveSession] Must be used inside <ActiveSessionProvider>')
  }
  return ctx
}
