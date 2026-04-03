'use client'
// NotificationProvider — état notifs, polling 60s + Supabase Realtime push
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  supabase,
} from '@aureak/api-client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  /** Nombre de notifications non lues */
  count      : number
  /** Rafraîchit manuellement le compteur */
  refresh    : () => void
  /** Marque une notification comme lue et décrémente le compteur localement */
  markAsRead : (id: string) => Promise<void>
  /** Marque toutes les notifications comme lues */
  markAllAsRead: () => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const { count: n } = await countUnreadNotifications()
      setCount(n)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[NotificationProvider] refresh:', err)
      }
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await markNotificationRead(id)
    setCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead()
    setCount(0)
  }, [])

  useEffect(() => {
    // Chargement initial
    refresh()

    // Polling de fallback — toutes les 60s
    const interval = setInterval(refresh, 60_000)

    // Supabase Realtime — INSERT dans inapp_notifications → refresh immédiat
    // Remplace avantageusement le polling pour les utilisateurs connectés
    const channel = supabase
      .channel('aureak-inapp-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inapp_notifications' },
        () => { refresh() },
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return (
    <NotificationContext.Provider value={{ count, refresh, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider')
  return ctx
}
