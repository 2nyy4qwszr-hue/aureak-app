// Story 6.3 — Hook useSessionValidation (Realtime + fallback polling)
import { useEffect, useRef, useState } from 'react'
import { supabase, validateSession } from '@aureak/api-client'
import type { ValidationStatus } from '@aureak/types'

export function useSessionValidation(sessionId: string) {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('pending')
  const [wsConnected, setWsConnected]           = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Polling fallback
  const startPolling = () => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('sessions')
        .select('validation_status')
        .eq('id', sessionId)
        .single()
      if (data?.validation_status) {
        setValidationStatus(data.validation_status as ValidationStatus)
      }
    }, 9000)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel(`session-validation:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const newStatus = (payload.new as { validation_status?: string }).validation_status
          if (newStatus) setValidationStatus(newStatus as ValidationStatus)
        }
      )
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED'
        setWsConnected(connected)
        if (connected) stopPolling()
      })

    // Fallback polling si WS non connecté après 3s
    const wsTimeout = setTimeout(() => {
      if (!wsConnected) startPolling()
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(wsTimeout)
      stopPolling()
    }
  }, [sessionId]) // eslint-disable-line -- intentional: deps are stable refs

  const validate = async (): Promise<ValidationStatus> => {
    const { data, error } = await validateSession(sessionId)
    if (error) throw error
    const status = (data ?? 'pending') as ValidationStatus
    setValidationStatus(status)
    return status
  }

  return { validationStatus, validate, wsConnected }
}
