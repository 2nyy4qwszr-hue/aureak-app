// Story 60.8 — Hook useLiveSessionCounts — Supabase Realtime
// RÈGLE : accès Supabase UNIQUEMENT via ce package
// RÈGLE : cleanup obligatoire — supabase.removeChannel + clearInterval dans return du useEffect
// RÈGLE : console guards obligatoires

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LiveSessionCounts {
  sessionCount: number
  presentCount: number
  totalCount  : number
  isLive      : boolean
}

// ── Requête séances en cours ───────────────────────────────────────────────────

async function fetchLiveCounts(): Promise<Omit<LiveSessionCounts, 'isLive'>> {
  try {
    const now  = new Date().toISOString()
    const today = now.slice(0, 10)

    // Séances en cours : scheduled_at aujourd'hui, statut non cancelled, non closed
    // On considère en cours = scheduled du jour dont le statut n'est pas fermé/annulé
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id')
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)
      .not('status', 'in', '("cancelled","closed")')

    if (sessErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[liveSessionCounts] sessions error:', sessErr)
      return { sessionCount: 0, presentCount: 0, totalCount: 0 }
    }

    const sessionCount = (sessions ?? []).length
    if (sessionCount === 0) return { sessionCount: 0, presentCount: 0, totalCount: 0 }

    const sessionIds = (sessions ?? []).map(s => s.id)

    const { data: attendances, error: attErr } = await supabase
      .from('attendance_records')
      .select('status')
      .in('session_id', sessionIds)

    if (attErr) {
      if (process.env.NODE_ENV !== 'production') console.error('[liveSessionCounts] attendances error:', attErr)
      return { sessionCount, presentCount: 0, totalCount: 0 }
    }

    const attRows   = (attendances ?? []) as { status: string }[]
    const totalCount  = attRows.length
    const presentCount = attRows.filter(a => a.status === 'present').length

    return { sessionCount, presentCount, totalCount }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('[liveSessionCounts] fetchLiveCounts exception:', err)
    return { sessionCount: 0, presentCount: 0, totalCount: 0 }
  }
}

// ── Hook principal ─────────────────────────────────────────────────────────────

export function useLiveSessionCounts(): LiveSessionCounts {
  const [counts, setCounts] = useState<Omit<LiveSessionCounts, 'isLive'>>({
    sessionCount: 0,
    presentCount: 0,
    totalCount  : 0,
  })
  const [isLive, setIsLive] = useState(false)

  const refreshCounts = useCallback(async () => {
    const fresh = await fetchLiveCounts()
    setCounts(fresh)
  }, [])

  useEffect(() => {
    let pollingInterval: ReturnType<typeof setInterval> | null = null
    let realtimeTimeout: ReturnType<typeof setTimeout> | null = null

    // 1. Fetch initial
    refreshCounts()

    // 2. Abonnement Supabase Realtime
    const channel = supabase
      .channel('live-attendance-counts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records' },
        () => {
          refreshCounts()
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true)
          // Annuler le timeout de fallback si le channel s'est abonné
          if (realtimeTimeout) {
            clearTimeout(realtimeTimeout)
            realtimeTimeout = null
          }
          // Arrêter le polling si déjà démarré
          if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsLive(false)
          startPolling()
        }
      })

    // Fallback polling : si pas de SUBSCRIBED dans 5s, démarrer le polling
    realtimeTimeout = setTimeout(() => {
      if (!isLive) {
        startPolling()
      }
    }, 5000)

    function startPolling() {
      if (pollingInterval) return
      if (process.env.NODE_ENV !== 'production') console.info('[liveSessionCounts] Realtime indisponible — fallback polling 30s')
      pollingInterval = setInterval(() => {
        refreshCounts()
      }, 30_000)
    }

    // ── Cleanup OBLIGATOIRE — BLOCKER si oublié ──────────────────────────────
    return () => {
      supabase.removeChannel(channel)
      if (pollingInterval) clearInterval(pollingInterval)
      if (realtimeTimeout)  clearTimeout(realtimeTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ...counts, isLive }
}
