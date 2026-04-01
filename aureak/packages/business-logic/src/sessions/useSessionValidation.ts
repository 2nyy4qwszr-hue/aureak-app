// Story 6.3 — Hook useSessionValidation (Realtime + fallback polling)
import { useEffect, useRef, useState } from 'react'
import { getSessionValidationStatus, subscribeToSessionValidation, validateSession } from '@aureak/api-client'
import type { ValidationStatus } from '@aureak/types'

export function useSessionValidation(sessionId: string) {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('pending')
  const [wsConnected, setWsConnected]           = useState(false)
  const wsConnectedRef = useRef(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Polling fallback
  const startPolling = () => {
    if (pollingRef.current) return
    pollingRef.current = setInterval(async () => {
      const { data } = await getSessionValidationStatus(sessionId)
      if (data) setValidationStatus(data as ValidationStatus)
    }, 9000)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToSessionValidation(
      sessionId,
      (newStatus) => setValidationStatus(newStatus as ValidationStatus),
      (connected) => {
        setWsConnected(connected)
        wsConnectedRef.current = connected
        if (connected) stopPolling()
      }
    )

    // Fallback polling si WS non connecté après 3s
    // Utilise wsConnectedRef (pas wsConnected) pour éviter la stale closure
    const wsTimeout = setTimeout(() => {
      if (!wsConnectedRef.current) startPolling()
    }, 3000)

    return () => {
      unsubscribe()
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
